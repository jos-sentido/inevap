import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/requireAdmin.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const snap = await adminDb().collection('users').orderBy('createdAt', 'desc').get();
    const students = snap.docs.map((d) => {
      const u = d.data() as any;
      return {
        uid: d.id,
        name: u.name || '',
        email: u.email || '',
        licenciatura: u.licenciatura || '',
        currentStage: u.currentStage ?? 0,
        role: u.role || 'ALUMNO',
        totalAbonado: u.payment?.totalAbonado ?? 0,
        createdAt: u.createdAt?.toDate ? u.createdAt.toDate().toISOString() : null,
      };
    });
    return res.status(200).json({ students });
  } catch (error) {
    console.error('admin/students error', error);
    return res.status(500).json({ error: 'No se pudo cargar la lista de alumnos' });
  }
}
