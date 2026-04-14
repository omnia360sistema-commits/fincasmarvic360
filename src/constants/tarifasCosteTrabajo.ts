/**
 * Tarifas fijas (fase actual). Siguiente paso: snapshot al cerrar trabajo.
 * Opcional: VITE_TARIFA_TRACTOR_EUR_H, VITE_TARIFA_OPERARIO_EUR_H
 */
function numEnv(key: string, fallback: number): number {
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const TARIFA_EUR_HORA_TRACTOR = numEnv('VITE_TARIFA_TRACTOR_EUR_H', 45);
export const TARIFA_EUR_HORA_OPERARIO = numEnv('VITE_TARIFA_OPERARIO_EUR_H', 18);
