// Integración con GoHighLevel (LeadConnector API v2).
// Best-effort: si GHL falla, NO debe romper el flujo del alumno.
// Resuelve pipeline y stages por NOMBRE para no depender de IDs opacos.
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
  const res = await fetch(`${BASE}/contacts/upsert`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) {
    console.error('GHL upsertContact', res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { contact?: { id?: string }; id?: string };
  return data.contact?.id || data.id || null;
}

interface Pipeline { id: string; name: string; stages: { id: string; name: string }[] }
let pipelineCache: Pipeline | null = null;

// Normaliza nombres ignorando emojis, espacios y símbolos (conserva letras/números).
const norm = (s: string) => (s || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '');

/** Obtiene el pipeline objetivo (por GHL_PIPELINE_ID o GHL_PIPELINE_NAME). */
async function getPipeline(): Promise<Pipeline | null> {
  if (pipelineCache) return pipelineCache;
  const locationId = process.env.GHL_LOCATION_ID!;
  const res = await fetch(`${BASE}/opportunities/pipelines?locationId=${locationId}`, { headers: headers() });
  if (!res.ok) {
    console.error('GHL getPipeline', res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { pipelines?: Pipeline[] };
  const pipelines = data.pipelines || [];
  const byId = process.env.GHL_PIPELINE_ID;
  const byName = norm(process.env.GHL_PIPELINE_NAME || '');
  const found =
    (byId && pipelines.find((p) => p.id === byId)) ||
    (byName && pipelines.find((p) => norm(p.name) === byName)) ||
    (byName && pipelines.find((p) => norm(p.name).includes(byName) || byName.includes(norm(p.name)))) ||
    pipelines[0] ||
    null;
  pipelineCache = found || null;
  return pipelineCache;
}

/** Resuelve {pipelineId, stageId} a partir del nombre de un stage (normalizado). */
export async function resolveStageByName(stageName: string): Promise<{ pipelineId: string; stageId: string } | null> {
  const pipeline = await getPipeline();
  if (!pipeline) return null;
  const target = norm(stageName);
  const stage =
    pipeline.stages.find((s) => norm(s.name) === target) ||
    pipeline.stages.find((s) => norm(s.name).includes(target) || target.includes(norm(s.name)));
  if (!stage) {
    console.error(`GHL: stage "${stageName}" no encontrado en pipeline "${pipeline.name}"`);
    return null;
  }
  return { pipelineId: pipeline.id, stageId: stage.id };
}

/** Resuelve usando GHL_STAGE_MAP (índice de etapa del portal -> nombre de stage). */
export async function resolveStage(stageIndex: number): Promise<{ pipelineId: string; stageId: string } | null> {
  let map: Record<string, string> = {};
  try { map = JSON.parse(process.env.GHL_STAGE_MAP || '{}'); } catch { return null; }
  const stageName = map[String(stageIndex)];
  if (!stageName) return null;
  return resolveStageByName(stageName);
}

async function writeOpportunity(resolved: { pipelineId: string; stageId: string }, params: { contactId: string; opportunityId?: string; name: string; status?: string; monetaryValue?: number }): Promise<string | null> {
  const { pipelineId, stageId } = resolved;
  if (params.opportunityId) {
    const res = await fetch(`${BASE}/opportunities/${params.opportunityId}`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({ pipelineId, pipelineStageId: stageId, ...(params.status ? { status: params.status } : {}) }),
    });
    if (!res.ok) console.error('GHL update opportunity', res.status, await res.text());
    return params.opportunityId;
  }
  const res = await fetch(`${BASE}/opportunities/`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ locationId: process.env.GHL_LOCATION_ID, pipelineId, pipelineStageId: stageId, contactId: params.contactId, name: params.name, status: params.status || 'open', monetaryValue: params.monetaryValue }),
  });
  if (!res.ok) { console.error('GHL create opportunity', res.status, await res.text()); return null; }
  const data = (await res.json()) as { opportunity?: { id?: string }; id?: string };
  return data.opportunity?.id || data.id || null;
}

/** Crea o mueve una oportunidad a la etapa indicada del portal. */
export async function moveToStage(params: { contactId: string; stageIndex: number; opportunityId?: string; name: string; monetaryValue?: number }): Promise<string | null> {
  const resolved = await resolveStage(params.stageIndex);
  if (!resolved) return params.opportunityId || null;
  return writeOpportunity(resolved, params);
}

/** Mueve/crea una oportunidad a un stage por NOMBRE (ej. "Descartado"). */
export async function moveToStageNamed(params: { contactId: string; stageName: string; opportunityId?: string; name: string; status?: string }): Promise<string | null> {
  const resolved = await resolveStageByName(params.stageName);
  if (!resolved) return params.opportunityId || null;
  return writeOpportunity(resolved, params);
}
