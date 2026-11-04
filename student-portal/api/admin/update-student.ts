import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/requireAdmin.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

interface CertStep { title: string; description?: string; status: string; date?: string }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { uid, currentStage, totalAbonado, certification } = (req.body || {}) as {
    uid?: string;
    currentStage?: number;
    totalAbonado?: number;
    certification?: { status: string; folio?: string; steps: CertStep[] };
  };
  if (!uid) return res.status(400).json({ error: 'Falta uid' });

  try {
    const db = adminDb();
    const userUpdates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof currentStage === 'number') {
      userUpdates.currentStage = currentStage;
      userUpdates[`stageStatus.${currentStage}`] = 'IN_PROGRESS';
    }
    if (typeof totalAbonado === 'number') {
      userUpdates['payment.totalAbonado'] = totalAbonado;
      userUpdates['payment.updatedAt'] = new Date();
    }
    await db.doc(`users/${uid}`).set(userUpdates, { merge: true });

    if (certification) {
      await db.doc(`certifications/${uid}`).set(
        { ...certification, updatedAt: new Date(), updatedBy: admin.uid },
        { merge: true },
      );
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('admin/update-student error', error);
    return res.status(500).json({ error: 'No se pudo actualizar el alumno' });
  }
}
