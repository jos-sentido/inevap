import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/requireAdmin.js';
import { adminAuth, adminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { name, email, licenciatura, phone, curp } = (req.body || {}) as {
    name?: string; email?: string; licenciatura?: string; phone?: string; curp?: string;
  };
  if (!name || !email) return res.status(400).json({ error: 'Nombre y correo son obligatorios' });

  try {
    // Contraseña temporal aleatoria; el alumno la define con el link de restablecimiento.
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const userRecord = await adminAuth().createUser({ email: email.trim(), password: tempPassword, displayName: name });

    await adminDb().doc(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      name,
      email: email.trim(),
      curp: curp || '',
      phone: phone || '',
      role: 'ALUMNO',
      licenciatura: licenciatura || '',
      currentStage: 0,
      stageStatus: { '0': 'IN_PROGRESS' },
      createdBy: admin.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const resetLink = await adminAuth().generatePasswordResetLink(email.trim());
    return res.status(200).json({ ok: true, uid: userRecord.uid, resetLink });
  } catch (error: any) {
    console.error('admin/create-student error', error);
    const msg = error?.code === 'auth/email-already-exists' ? 'Ya existe un alumno con ese correo.' : 'No se pudo crear el alumno.';
    return res.status(400).json({ error: msg });
  }
}
