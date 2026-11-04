import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/requireAdmin.js';
import { adminDb, adminStorage } from '../_lib/firebaseAdmin.js';

const iso = (v: any) => (v?.toDate ? v.toDate().toISOString() : v || null);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const uid = (req.query.uid as string) || '';
  if (!uid) return res.status(400).json({ error: 'Falta uid' });

  try {
    const db = adminDb();
    const [userSnap, docsSnap, examsSnap, enrollSnap, certSnap] = await Promise.all([
      db.doc(`users/${uid}`).get(),
      db.collection(`users/${uid}/documents`).get(),
      db.collection(`users/${uid}/exams`).get(),
      db.collection(`users/${uid}/enrollments`).get(),
      db.doc(`certifications/${uid}`).get(),
    ]);

    if (!userSnap.exists) return res.status(404).json({ error: 'Alumno no encontrado' });
    const u = userSnap.data() as any;

    // URLs firmadas de documentos (1h)
    const documents = await Promise.all(
      docsSnap.docs.map(async (d) => {
        const doc = d.data() as any;
        let url: string | null = null;
        if (doc.storagePath) {
          try {
            const [signed] = await adminStorage().bucket().file(doc.storagePath).getSignedUrl({ action: 'read', expires: Date.now() + 3600_000 });
            url = signed;
          } catch { /* noop */ }
        }
        return { id: d.id, type: doc.type, fileName: doc.fileName, status: doc.status, verification: doc.verification || null, url };
      }),
    );

    const exams = examsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any), scheduledAt: iso((d.data() as any).scheduledAt) }));
    const enrollments = enrollSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any), createdAt: iso((d.data() as any).createdAt) }));

    return res.status(200).json({
      student: {
        uid,
        name: u.name, email: u.email, curp: u.curp, phone: u.phone,
        licenciatura: u.licenciatura, currentStage: u.currentStage ?? 0,
        stageStatus: u.stageStatus || {}, professionalProfile: u.professionalProfile || null,
        payment: u.payment || { totalAbonado: 0 }, ghl: u.ghl || null,
      },
      documents,
      exams,
      enrollments,
      certification: certSnap.exists ? certSnap.data() : null,
    });
  } catch (error) {
    console.error('admin/student error', error);
    return res.status(500).json({ error: 'No se pudo cargar el alumno' });
  }
}
