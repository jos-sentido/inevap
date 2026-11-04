import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/requireAdmin.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const db = adminDb();

  if (req.method === 'POST') {
    const { examType, dateTime, capacity, modality } = (req.body || {}) as {
      examType?: string; dateTime?: string; capacity?: number; modality?: string;
    };
    if (!examType || !dateTime) return res.status(400).json({ error: 'Faltan datos de la fecha' });
    try {
      const ref = await db.collection('examSlots').add({
        examType,
        dateTime: new Date(dateTime),
        capacity: capacity || 10,
        booked: 0,
        modality: modality || '',
      });
      return res.status(200).json({ ok: true, id: ref.id });
    } catch (error) {
      console.error('admin/slots create error', error);
      return res.status(500).json({ error: 'No se pudo crear la fecha' });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = (req.body || {}) as { id?: string };
    if (!id) return res.status(400).json({ error: 'Falta id' });
    try {
      await db.collection('examSlots').doc(id).delete();
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('admin/slots delete error', error);
      return res.status(500).json({ error: 'No se pudo eliminar la fecha' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
