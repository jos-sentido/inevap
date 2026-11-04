// Integración con GoHighLevel (LeadConnector API v2).
// Best-effort: si GHL falla, NO debe romper el flujo del alumno.
const BASE = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

function headers() {
  const token = process.env.GHL_API_TOKEN;
  if (!token) throw new Error('GHL_API_TOKEN no configurada');
  return {
    Authorization: `Bearer ${token}`,
    Version: VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export function ghlConfigured(): boolean {
  return !!(process.env.GHL_API_TOKEN && process.env.GHL_LOCATION_ID);
}

export interface UpsertContactInput {
  email: string;
  name?: string;
  phone?: string;
  curp?: string;
  licenciatura?: string;
}

/** Crea o actualiza un contacto. Devuelve el contactId de GHL. */
export async function upsertContact(input: UpsertContactInput): Promise<string | null> {
  const locationId = process.env.GHL_LOCATION_ID!;
  const [firstName, ...rest] = (input.name || '').trim().split(' ');
  const body: Record<string, unknown> = {
    locationId,
    email: input.email,
    firstName: firstName || input.email,
    lastName: rest.join(' ') || undefined,
    name: input.name || undefined,
    phone: input.phone || undefined,
    tags: ['portal-inevap', input.licenciatura].filter(Boolean),
  };
  const res = await fetch(`${BASE}/contacts/upsert`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('GHL upsertContact', res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { contact?: { id?: string }; id?: string };
  return data.contact?.id || data.id || null;
}

/** Crea o mueve una oportunidad al stage indicado. Devuelve el opportunityId. */
export async function moveToStage(params: {
  contactId: string;
  stageId: string;
  opportunityId?: string;
  name: string;
  monetaryValue?: number;
}): Promise<string | null> {
  const locationId = process.env.GHL_LOCATION_ID!;
  const pipelineId = process.env.GHL_PIPELINE_ID;
  if (!pipelineId) {
    console.error('GHL_PIPELINE_ID no configurada');
    return null;
  }

  if (params.opportunityId) {
    const res = await fetch(`${BASE}/opportunities/${params.opportunityId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ pipelineId, pipelineStageId: params.stageId }),
    });
    if (!res.ok) {
      console.error('GHL update opportunity', res.status, await res.text());
      return params.opportunityId;
    }
    return params.opportunityId;
  }

  const res = await fetch(`${BASE}/opportunities/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      locationId,
      pipelineId,
      pipelineStageId: params.stageId,
      contactId: params.contactId,
      name: params.name,
      status: 'open',
      monetaryValue: params.monetaryValue,
    }),
  });
  if (!res.ok) {
    console.error('GHL create opportunity', res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { opportunity?: { id?: string }; id?: string };
  return data.opportunity?.id || data.id || null;
}

/** Mapa etapa INEVAP (0-5) -> stageId de GHL, desde GHL_STAGE_MAP (JSON). */
export function stageIdFor(stageIndex: number): string | null {
  try {
    const map = JSON.parse(process.env.GHL_STAGE_MAP || '{}') as Record<string, string>;
    return map[String(stageIndex)] || null;
  } catch {
    return null;
  }
}
