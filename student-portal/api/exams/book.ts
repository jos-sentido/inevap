import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { verifyAuth } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { slotId } = (req.body || {}) as { slotId?: string };
  if (!slotId) return res.status(400).json({ error: 'Falta slotId' });

  const db = adminDb();
  const slotRef = db.collection('examSlots').doc(slotId);
  const examsCol = db.collection('users').doc(user.uid).collection('exams');

  try {
    const result = await db.runTransaction(async (tx) => {
      const slotSnap = await tx.get(slotRef);
      if (!slotSnap.exists) throw new Error('SLOT_NOT_FOUND');
      const slot = slotSnap.data() as { examType: string; dateTime: FirebaseFirestore.Timestamp; capacity: number; booked: number };

      if ((slot.booked ?? 0) >= slot.capacity) throw new Error('SLOT_FULL');

      // Un examen por tipo por alumno
      const existing = await tx.get(examsCol.where('examType', '==', slot.examType).limit(1));
      if (!existing.empty) throw new Error('ALREADY_BOOKED');

      tx.update(slotRef, { booked: (slot.booked ?? 0) + 1 });
      const examRef = examsCol.doc();
      tx.set(examRef, {
        examType: slot.examType,
        slotId,
        scheduledAt: slot.dateTime,
        status: 'booked',
        createdAt: new Date(),
      });
      return { examId: examRef.id, examType: slot.examType };
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (e: any) {
    const code = e?.message || 'ERROR';
    const messages: Record<string, string> = {
      SLOT_NOT_FOUND: 'La fecha ya no está disponible.',
      SLOT_FULL: 'Esa fecha se llenó. Elige otra.',
      ALREADY_BOOKED: 'Ya tienes una fecha reservada para este tipo de examen.',
    };
    const status = code in messages ? 409 : 500;
    if (status === 500) console.error('exams/book error', e);
    return res.status(status).json({ error: messages[code] || 'No se pudo reservar.' });
  }
}
