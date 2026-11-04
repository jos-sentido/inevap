import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth.js';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { ghlConfigured, upsertContact, moveToStage, stageIdFor } from '../_lib/ghl.js';

// Best-effort: sincroniza el alumno con GHL (contacto + etapa de pipeline).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  if (!ghlConfigured()) {
    return res.status(200).json({ ok: false, skipped: 'GHL no configurado' });
  }

  const { moveStage } = (req.body || {}) as { moveStage?: number };

  try {
    const db = adminDb();
    const userRef = db.doc(`users/${user.uid}`);
    const snap = await userRef.get();
    const data = (snap.data() || {}) as any;

    const contactId =
      data.ghl?.contactId ||
      (await upsertContact({
        email: data.email || user.email || '',
        name: data.name,
        phone: data.phone,
        curp: data.curp,
        licenciatura: data.licenciatura,
      }));

    if (!contactId) return res.status(200).json({ ok: false, error: 'No se obtuvo contactId' });

    const updates: Record<string, unknown> = { 'ghl.contactId': contactId };

    const stageIndex = moveStage ?? data.currentStage ?? 0;
    const stageId = stageIdFor(stageIndex);
    if (stageId) {
      const oppId = await moveToStage({
        contactId,
        stageId,
        opportunityId: data.ghl?.opportunityId,
        name: data.name || data.email || 'Alumno INEVAP',
      });
      if (oppId) updates['ghl.opportunityId'] = oppId;
    }

    await userRef.set({ ghl: { contactId, opportunityId: updates['ghl.opportunityId'] || data.ghl?.opportunityId } }, { merge: true });
    return res.status(200).json({ ok: true, contactId });
  } catch (error) {
    console.error('ghl/sync error', error);
    return res.status(200).json({ ok: false, error: 'Error sincronizando con GHL' });
  }
}
