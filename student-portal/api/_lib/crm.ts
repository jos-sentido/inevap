import { adminDb } from './firebaseAdmin.js';

/** Registra un evento en el historial de la oportunidad (users/{uid}/activity). */
export async function logActivity(uid: string, type: string, label: string, by?: string): Promise<void> {
  try {
    await adminDb().collection(`users/${uid}/activity`).add({
      type, label, at: new Date(), ...(by ? { by } : {}),
    });
  } catch (e) {
    console.error('logActivity error', e);
  }
}

interface Rule { uid: string; name: string; percentage: number }

/** Asignación round-robin ponderada por porcentaje. Devuelve el vendedor asignado o null. */
export async function assignRoundRobin(): Promise<{ uid: string; name: string } | null> {
  const db = adminDb();
  const ref = db.doc('config/assignmentRules');
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = (snap.data() || {}) as { rules?: Rule[]; counters?: Record<string, number> };
      const rules = (data.rules || []).filter((r) => r.uid && (r.percentage ?? 0) > 0);
      if (rules.length === 0) return null;
      const counters = data.counters || {};
      // Elige el vendedor más "subatendido" respecto a su porcentaje objetivo.
      let best: Rule | null = null;
      let bestRatio = Infinity;
      for (const r of rules) {
        const ratio = (counters[r.uid] || 0) / (r.percentage / 100);
        if (ratio < bestRatio) { bestRatio = ratio; best = r; }
      }
      if (!best) return null;
      counters[best.uid] = (counters[best.uid] || 0) + 1;
      tx.set(ref, { counters }, { merge: true });
      return { uid: best.uid, name: best.name };
    });
  } catch (e) {
    console.error('assignRoundRobin error', e);
    return null;
  }
}
