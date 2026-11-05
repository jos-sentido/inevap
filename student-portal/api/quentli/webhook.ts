import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { logActivity } from '../_lib/crm.js';

// El webhook requiere el body CRUDO para verificar la firma HMAC de Quentli.
export const config = { api: { bodyParser: false } };

async function readRaw(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

// Monto a pesos: Quentli maneja unidades menores (centavos).
const toMXN = (cents: number) => Math.round((Number(cents) || 0)) / 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const raw = await readRaw(req);
  const secret = process.env.QUENTLI_WEBHOOK_SECRET;

  // Verificación de firma (si hay secreto configurado)
  if (secret) {
    const ts = req.headers['x-quentli-timestamp'] as string | undefined;
    const sig = req.headers['x-quentli-signature'] as string | undefined;
    if (!ts || !sig) return res.status(401).json({ error: 'Faltan headers de firma' });
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return res.status(401).json({ error: 'Timestamp fuera de rango' });
    const expected = crypto.createHmac('sha256', secret).update(`${ts}.`).update(raw).digest('hex');
    const a = Buffer.from(sig); const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'Firma inválida' });
  }

  let body: any;
  try { body = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).json({ error: 'JSON inválido' }); }

  const eventType = body.eventType || body.type;
  const eventId = body.eventId || (req.headers['x-quentli-event-id'] as string) || `q_${Date.now()}`;
  const data = body.data || {};

  try {
    // Eventos que representan dinero recibido (abono a mensualidades)
    let amountCents: number | undefined;
    let payId: string | undefined;
    let sign = 1;

    if (eventType === 'PAYMENT_COMPLETED') {
      amountCents = data.payment?.amount; payId = data.payment?.id;
    } else if (eventType === 'INVOICE_PAID_OTHER') {
      amountCents = data.payment?.amount ?? data.amount; payId = data.payment?.id || data.invoiceId;
    } else if (eventType === 'PAYMENT_REFUNDED') {
      amountCents = data.payment?.amount ?? data.amount; payId = (data.payment?.id || eventId) + '_refund'; sign = -1;
    } else {
      // Otros eventos (invoice.created, customer.*, etc.): acusar recibo sin procesar
      return res.status(200).json({ ok: true, ignored: eventType });
    }

    const email = (data.customer?.email || '').trim();
    if (!email || amountCents == null) {
      console.log('Quentli webhook sin email/monto:', eventType, JSON.stringify(data).slice(0, 1500));
      return res.status(200).json({ ok: false, note: 'sin email o monto' });
    }

    const db = adminDb();
    let snap = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snap.empty) snap = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
    if (snap.empty) return res.status(200).json({ ok: false, note: `Usuario no encontrado: ${email}` });

    const uid = snap.docs[0].id;
    const amountMXN = sign * toMXN(amountCents);
    const docId = payId || eventId;

    // Idempotente por id de pago
    await db.doc(`users/${uid}/payments/${docId}`).set(
      { amountMXN, eventType, quentliEventId: eventId, at: new Date(), source: 'quentli' }, { merge: true },
    );

    const pays = await db.collection(`users/${uid}/payments`).get();
    const total = pays.docs.reduce((a, d) => a + (Number((d.data() as any).amountMXN) || 0), 0);
    await db.doc(`users/${uid}`).set({ payment: { totalAbonado: total, lastPaymentAt: new Date(), source: 'quentli' } }, { merge: true });
    await logActivity(uid, 'payment', `${eventType === 'PAYMENT_REFUNDED' ? 'Reembolso' : 'Pago'} (Quentli): $${amountMXN.toLocaleString('es-MX')} — total $${total.toLocaleString('es-MX')}`);

    return res.status(200).json({ ok: true, uid, totalAbonado: total });
  } catch (error) {
    console.error('Quentli webhook error', error);
    return res.status(500).json({ error: 'Error procesando el webhook' });
  }
}
