import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from '../_lib/stripe';
import { verifyAuth } from '../_lib/auth';
import { adminDb } from '../_lib/firebaseAdmin';
import { PLANS, DEFAULT_PLAN } from '../_lib/plans';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { planId } = (req.body || {}) as { planId?: string };
  const plan = PLANS[planId || DEFAULT_PLAN];
  if (!plan) return res.status(400).json({ error: 'Plan no válido' });

  const origin = (req.headers.origin as string) || process.env.APP_URL || 'https://inevap-sentido.vercel.app';

  try {
    const db = adminDb();
    // Crea el enrollment pendiente
    const enrollmentRef = db.collection('users').doc(user.uid).collection('enrollments').doc();
    await enrollmentRef.set({
      planId: plan.id,
      amountMXN: plan.amountMXN,
      msiMonths: plan.msiMonths,
      status: 'pending',
      createdAt: new Date(),
    });

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      currency: 'mxn',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'mxn',
            unit_amount: plan.amountMXN * 100,
            product_data: { name: plan.name },
          },
        },
      ],
      payment_method_options: {
        card: { installments: { enabled: true } },
      },
      metadata: { uid: user.uid, enrollmentId: enrollmentRef.id, planId: plan.id },
      success_url: `${origin}/?inscripcion=success`,
      cancel_url: `${origin}/?inscripcion=cancel`,
    });

    await enrollmentRef.set({ stripe: { sessionId: session.id } }, { merge: true });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('create-session error', error);
    return res.status(500).json({ error: 'No se pudo iniciar el pago.' });
  }
}
