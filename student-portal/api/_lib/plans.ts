// Planes de inscripción (definidos en el servidor; el cliente nunca fija el monto).
// Ajusta montos/MSI según la política comercial de INEVAP.
export interface Plan {
  id: string;
  name: string;
  amountMXN: number; // en pesos
  msiMonths: number;
}

export const PLANS: Record<string, Plan> = {
  completo: {
    id: 'completo',
    name: 'Titulación completa — Acuerdo 286',
    amountMXN: 25000,
    msiMonths: 12,
  },
};

export const DEFAULT_PLAN = 'completo';
