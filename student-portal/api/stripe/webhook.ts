import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { getStripe } from '../_lib/stripe';
import { adminDb } from '../_lib/firebaseAdmin';
import { ghlConfigured, upsertContact, moveToStage, stageIdFor } from '../_lib/ghl';

// Necesario: el webhook de Stripe requiere el body crudo para validar la firma.
export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!secret || !sig) return res.status(400).json({ error: 'Falta configuración de webhook' });

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('Firma de webhook inválida', err);
    return res.status(400).json({ error: 'Firma inválida' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { uid, enrollmentId } = session.metadata || {};
      if (uid && enrollmentId) {
        const db = adminDb();
        await db.doc(`users/${uid}/enrollments/${enrollmentId}`).set(
          {
            status: 'paid',
            stripe: { paymentIntentId: session.payment_intent as string },
            paidAt: new Date(),
          },
          { merge: true },
        );
        // Avanza a la etapa de Estudio (2) tras el pago
        await db.doc(`users/${uid}`).set(
          {
            currentStage: 2,
            stageStatus: { '1': 'COMPLETED', '2': 'IN_PROGRESS' },
            updatedAt: new Date(),
          },
          { merge: true },
        );

        // Best-effort: mueve la etapa en GHL
        if (ghlConfigured()) {
          try {
            const userSnap = await db.doc(`users/${uid}`).get();
            const u = (userSnap.data() || {}) as any;
            const contactId = u.ghl?.contactId || (await upsertContact({ email: u.email, name: u.name, licenciatura: u.licenciatura }));
            const stageId = stageIdFor(2);
            if (contactId && stageId) {
              const oppId = await moveToStage({ contactId, stageId, opportunityId: u.ghl?.opportunityId, name: u.name || u.email || 'Alumno INEVAP' });
              await db.doc(`users/${uid}`).set({ ghl: { contactId, opportunityId: oppId || u.ghl?.opportunityId } }, { merge: true });
            }
          } catch (e) {
            console.error('GHL move en webhook falló (no bloqueante)', e);
          }
        }
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('webhook handler error', error);
    return res.status(500).json({ error: 'Error procesando el evento' });
  }
}
