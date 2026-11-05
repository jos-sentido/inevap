import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth.js';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { quentliConfigured, listConcepts, createSetupSession } from '../_lib/quentli.js';
import { logActivity } from '../_lib/crm.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.action || '');

  try {
    // ====== Catálogo de planes = conceptos recurrentes de Quentli ======
    if (action === 'concepts') {
      const user = await verifyAuth(req);
      if (!user) return res.status(401).json({ error: 'No autorizado' });
      if (!quentliConfigured()) return res.status(200).json({ concepts: [] });
      const concepts = await listConcepts();
      // Solo planes de pago: recurrentes con monto.
      const planes = concepts.filter((c) => c.recurrent && c.amount > 0);
      return res.status(200).json({ concepts: planes });
    }

    // ====== Inicia inscripción: crea sesión de tarjeta (hosted) y enrollment pendiente ======
    if (action === 'enroll') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const user = await verifyAuth(req);
      if (!user) return res.status(401).json({ error: 'No autorizado' });
      if (!quentliConfigured()) return res.status(503).json({ error: 'Pagos no configurados' });

      const { conceptId } = (req.body || {}) as { conceptId?: string };
      if (!conceptId) return res.status(400).json({ error: 'Falta conceptId' });

      const db = adminDb();
      const uref = db.doc(`users/${user.uid}`);
      const u = (await uref.get()).data() as any || {};
      const email = (u.email || user.email || '').trim();
      if (!email) return res.status(400).json({ error: 'Tu cuenta no tiene correo registrado.' });

      const concepts = await listConcepts();
      const concept = concepts.find((c) => c.id === conceptId);
      if (!concept) return res.status(404).json({ error: 'Plan no encontrado' });

      // Enrollment pendiente (se completa cuando llega el webhook de tarjeta registrada).
      const enrollRef = db.collection(`users/${user.uid}/enrollments`).doc();
      await enrollRef.set({
        status: 'pending_card',
        conceptId: concept.id,
        conceptName: concept.displayName,
        amount: concept.amount,
        currency: concept.currency,
        plazos: concept.plazos ?? null,
        createdAt: new Date(),
        source: 'quentli',
      });

      const origin = `https://${req.headers.host}`;
      const digits = String(u.phone || '').replace(/\D/g, '');
      const session = await createSetupSession({
        customer: {
          name: u.name || email,
          email,
          phoneNumber: digits ? `+52${digits.slice(-10)}` : undefined,
          externalId: user.uid,
          meta: { uid: user.uid, enrollmentId: enrollRef.id, conceptId: concept.id, plazos: concept.plazos ?? null },
        },
        returnUrl: `${origin}/?inscripcion=success`,
        cancelUrl: `${origin}/?inscripcion=cancel`,
      });

      await enrollRef.set({ setupUrl: session.url }, { merge: true });
      await logActivity(user.uid, 'enroll_started', `Inició inscripción: ${concept.displayName}`);
      return res.status(200).json({ url: session.url });
    }

    return res.status(404).json({ error: 'Acción no encontrada' });
  } catch (e: any) {
    console.error('quentli action error', action, e);
    return res.status(500).json({ error: e?.message || 'Error procesando la solicitud' });
  }
}
