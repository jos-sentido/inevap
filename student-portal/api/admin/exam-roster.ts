import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/requireAdmin.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const db = adminDb();
    const [slotsSnap, examsSnap] = await Promise.all([
      db.collection('examSlots').orderBy('dateTime').get(),
      db.collectionGroup('exams').get(),
    ]);

    // Agrupa alumnos agendados por slotId
    const bySlot: Record<string, { uid: string; name: string; status: string }[]> = {};
    const uidSet = new Set<string>();
    examsSnap.docs.forEach((d) => {
      const e = d.data() as any;
      const uid = d.ref.parent.parent?.id || '';
      uidSet.add(uid);
      (bySlot[e.slotId] ||= []).push({ uid, name: '', status: e.status });
    });

    // Resuelve nombres
    const names: Record<string, string> = {};
    await Promise.all(
      [...uidSet].map(async (uid) => {
        const u = await db.doc(`users/${uid}`).get();
        names[uid] = (u.data() as any)?.name || (u.data() as any)?.email || uid;
      }),
    );

    const slots = slotsSnap.docs.map((d) => {
      const s = d.data() as any;
      const roster = (bySlot[d.id] || []).map((r) => ({ ...r, name: names[r.uid] || r.uid }));
      return {
        id: d.id,
        examType: s.examType,
        dateTime: s.dateTime?.toDate ? s.dateTime.toDate().toISOString() : s.dateTime,
        capacity: s.capacity,
        booked: s.booked ?? 0,
        modality: s.modality || '',
        roster,
      };
    });

    return res.status(200).json({ slots });
  } catch (error) {
    console.error('admin/exam-roster error', error);
    return res.status(500).json({ error: 'No se pudo cargar el calendario de exámenes' });
  }
}
