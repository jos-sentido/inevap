import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth.js';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { ghlConfigured, upsertContact, moveToStage } from '../_lib/ghl.js';
import { logActivity } from '../_lib/crm.js';

// Etapa 0: guarda el perfilamiento (precalificación) y avanza a Admisión.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { professionalProfile, preQual, licenciatura, phone, city } = (req.body || {}) as {
    professionalProfile?: { yearsExp?: string; currentRole?: string; industry?: string };
    preQual?: Record<string, string>;
    licenciatura?: string;
    phone?: string;
    city?: string;
  };

  try {
    const db = adminDb();
    const userRef = db.doc(`users/${user.uid}`);
    const snap = await userRef.get();
    const data = (snap.data() || {}) as any;
    const nextStage = Math.max(data.currentStage ?? 0, 1);

    const updates: Record<string, unknown> = {
      currentStage: nextStage,
      'stageStatus.0': 'COMPLETED',
      'stageStatus.1': 'IN_PROGRESS',
      updatedAt: new Date(),
    };
    if (professionalProfile) updates.professionalProfile = professionalProfile;
    if (preQual) updates.preQual = preQual;
    if (licenciatura) updates.licenciatura = licenciatura;
    if (phone) updates.phone = phone;
    if (city) updates.city = city;
    await userRef.set(updates, { merge: true });
    await logActivity(user.uid, 'prequalified', 'Completó el perfilamiento y avanzó a Admisión');

    // Best-effort: actualiza el contacto en GHL con el perfil nuevo
    if (ghlConfigured()) {
      try {
        const contactId = data.ghl?.contactId || (await upsertContact({
          email: data.email || user.email || '',
          name: data.name,
          phone: phone || data.phone,
          licenciatura: licenciatura || data.licenciatura,
        }));
        if (contactId) {
          const oppId = await moveToStage({ contactId, stageIndex: nextStage, opportunityId: data.ghl?.opportunityId, name: data.name || data.email || 'Prospecto INEVAP' });
          const ghlData: Record<string, string> = { contactId };
          const opp = oppId || data.ghl?.opportunityId;
          if (opp) ghlData.opportunityId = opp;
          await userRef.set({ ghl: ghlData }, { merge: true });
        }
      } catch (e) { console.error('GHL prequalify (no bloqueante)', e); }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('profile/prequalify error', error);
    return res.status(500).json({ error: 'No se pudo guardar tu información.' });
  }
}
