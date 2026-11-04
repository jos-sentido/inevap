// Atribución de marketing: captura UTMs / click-ids al aterrizar desde un anuncio
// y los conserva (primer contacto) para adjuntarlos al registro del alumno.
const KEY = 'inevap_attribution';

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPath?: string;
  landingAt?: string;
}

/** Lee la URL actual; si trae parámetros de campaña y aún no hay atribución guardada, la guarda. */
export function captureAttribution(): void {
  try {
    const p = new URLSearchParams(window.location.search);
    const data: Attribution = {
      utmSource: p.get('utm_source') || undefined,
      utmMedium: p.get('utm_medium') || undefined,
      utmCampaign: p.get('utm_campaign') || undefined,
      utmContent: p.get('utm_content') || undefined,
      utmTerm: p.get('utm_term') || undefined,
      gclid: p.get('gclid') || undefined,
      fbclid: p.get('fbclid') || undefined,
    };
    const hasSignal = Object.values(data).some(Boolean);
    const existing = localStorage.getItem(KEY);
    // Primer contacto: solo guarda si hay señal y no había atribución previa.
    if (hasSignal && !existing) {
      data.referrer = document.referrer || undefined;
      data.landingPath = window.location.pathname || undefined;
      data.landingAt = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(data));
    }
  } catch { /* localStorage no disponible: ignorar */ }
}

/** Devuelve la atribución guardada (sin undefined) o null. */
export function getAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    const clean: Attribution = {};
    for (const [k, v] of Object.entries(parsed)) if (v) (clean as any)[k] = v;
    return Object.keys(clean).length ? clean : null;
  } catch {
    return null;
  }
}
