/**
 * Ids válidos de motivo de compra. Mantener sincronizado con PURCHASE_REASONS
 * en `src/constants.tsx` (ahí viven las etiquetas que ve el usuario).
 */
export const PURCHASE_REASON_IDS = [
  'ascenso', 'cambio_empresa', 'maestria', 'carrera_pausa', 'cedula',
  'familia', 'jubilacion', 'meta_personal', 'otro',
] as const;

export const isPurchaseReason = (v: unknown): v is string =>
  typeof v === 'string' && (PURCHASE_REASON_IDS as readonly string[]).includes(v);
