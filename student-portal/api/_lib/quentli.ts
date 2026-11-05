// Cliente mínimo de la API de Quentli (server-side).
// Docs: https://docs.quentli.com/api · base https://api.quentli.com
// Auth: Authorization: Bearer sk_... · writes envueltos en { input: {...} }.
const BASE = (process.env.QUENTLI_API_BASE || 'https://api.quentli.com').replace(/\/$/, '');

export function quentliConfigured(): boolean {
  return !!process.env.QUENTLI_API_KEY;
}

async function qFetch(
  path: string,
  init?: { method?: string; body?: any; idempotencyKey?: string },
): Promise<any> {
  const key = process.env.QUENTLI_API_KEY;
  if (!key) throw new Error('QUENTLI_API_KEY no configurada');
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method || 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init?.idempotencyKey ? { 'X-Idempotency-Key': init.idempotencyKey } : {}),
    },
    body: init?.body ? JSON.stringify({ input: init.body }) : undefined,
  });
  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || text.slice(0, 300);
    throw new Error(`Quentli ${res.status}: ${msg}`);
  }
  return json;
}

export interface QuentliConcept {
  id: string;
  displayName: string;
  amount: number; // unidades menores (centavos)
  currency: string;
  recurrent: boolean;
  collectionInterval?: string; // MONTH, WEEK, ...
  chargeEach?: number;
  sku?: string;
  description?: string;
  plazos?: number; // derivado (meta.plazos | SKU | nombre)
}

// Número de mensualidades: se define en Quentli (meta.plazos, o al final del SKU "TIT-10",
// o en el nombre "... 10 mensualidades"). Si no se encuentra → suscripción indefinida.
function derivePlazos(c: any): number | undefined {
  const metaP = Number(c?.meta?.plazos);
  if (Number.isFinite(metaP) && metaP > 0) return metaP;
  const sku = String(c?.sku || '');
  const mSku = sku.match(/(\d{1,3})\s*$/);
  if (mSku) { const n = Number(mSku[1]); if (n > 0 && n <= 999) return n; }
  const name = String(c?.displayName || c?.name || '');
  const mName = name.match(/(\d{1,3})\s*(plazos|mensualidades|meses|pagos)/i);
  if (mName) { const n = Number(mName[1]); if (n > 0) return n; }
  return undefined;
}

export async function listConcepts(): Promise<QuentliConcept[]> {
  const json = await qFetch('/v1/payment-concepts?take=100');
  const arr: any[] = Array.isArray(json)
    ? json
    : (json.paymentConcepts || json.data || json.items || json.concepts || []);
  return arr.map((c) => ({
    id: c.id,
    displayName: c.displayName || c.name || 'Concepto',
    amount: Number(c.amount) || 0,
    currency: c.currency || 'MXN',
    recurrent: !!(c.recurrentDetail || c.recurrent || c.isRecurrent),
    collectionInterval: c.recurrentDetail?.collectionInterval,
    chargeEach: c.recurrentDetail?.chargeEach,
    sku: c.sku,
    description: c.description,
    plazos: derivePlazos(c),
  }));
}

// Sesión de inscripción (hosted): el alumno registra su tarjeta en portal.quentli.com.
// La tarjeta NUNCA toca nuestros servidores (PCI). Devuelve { url, session }.
export async function createSetupSession(input: {
  customer: { name: string; email?: string; phoneNumber?: string; externalId?: string; meta?: any };
  displayMode?: string;
  returnUrl?: string;
  cancelUrl?: string;
}): Promise<{ url: string; session?: any }> {
  return qFetch('/v1/setup-sessions', {
    method: 'POST',
    body: { displayMode: 'CUSTOMER_PORTAL', ...input },
  });
}

export async function createSubscription(input: any, idempotencyKey?: string): Promise<any> {
  const json = await qFetch('/v1/subscriptions', { method: 'POST', body: input, idempotencyKey });
  return json.subscription || json;
}
