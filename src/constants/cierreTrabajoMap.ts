export type AccionCierre = 'cosecha' | 'plantacion' | 'preparacion' | 'acolchado' | 'ninguna';

export type EstadoParcelaDestino = 'cosechada' | 'plantada' | 'preparacion' | 'acolchado';

/**
 * Jerarquia de estados de parcela de menos a mas avanzado.
 * Un cierre de trabajo solo actualiza si el nuevo estado
 * es igual o superior al actual. Nunca retrocede.
 */
const ESTADO_ORDEN: Record<string, number> = {
  vacia: 0,
  preparacion: 1,
  acolchado: 2,
  plantada: 3,
  en_produccion: 4,
  cosechada: 5,
  baja: -1,
};

export function puedeAvanzarEstado(estadoActual: string | null, estadoNuevo: EstadoParcelaDestino): boolean {
  if (!estadoActual) return true;
  const actual = ESTADO_ORDEN[estadoActual] ?? 0;
  const nuevo = ESTADO_ORDEN[estadoNuevo] ?? 0;
  if (actual < 0) return false; // 'baja' no se toca
  return nuevo >= actual;
}

interface ConfigAccion {
  accion: AccionCierre;
  estadoParcela: EstadoParcelaDestino | null;
}

const MAPA: Record<string, ConfigAccion> = {
  'cosecha':              { accion: 'cosecha',     estadoParcela: 'cosechada' },
  'recolección':          { accion: 'cosecha',     estadoParcela: 'cosechada' },
  'recoleccion':          { accion: 'cosecha',     estadoParcela: 'cosechada' },
  'plantación':           { accion: 'plantacion',  estadoParcela: 'plantada' },
  'plantacion':           { accion: 'plantacion',  estadoParcela: 'plantada' },
  'transplante':          { accion: 'plantacion',  estadoParcela: 'plantada' },
  'siembra':              { accion: 'plantacion',  estadoParcela: 'plantada' },
  'preparación suelo':    { accion: 'preparacion', estadoParcela: 'preparacion' },
  'preparacion suelo':    { accion: 'preparacion', estadoParcela: 'preparacion' },
  'preparación terreno':  { accion: 'preparacion', estadoParcela: 'preparacion' },
  'preparacion terreno':  { accion: 'preparacion', estadoParcela: 'preparacion' },
  'acolchado':            { accion: 'acolchado',   estadoParcela: 'acolchado' },
  'encamado plástico':    { accion: 'acolchado',   estadoParcela: 'acolchado' },
  'encamado plastico':    { accion: 'acolchado',   estadoParcela: 'acolchado' },
  'colocación plástico':  { accion: 'acolchado',   estadoParcela: 'acolchado' },
  'colocacion plástico':  { accion: 'acolchado',   estadoParcela: 'acolchado' },
  'colocacion plastico':  { accion: 'acolchado',   estadoParcela: 'acolchado' },
};

export function getAccionCierre(tipoTrabajo: string): ConfigAccion {
  const key = tipoTrabajo.trim().toLowerCase();
  return MAPA[key] ?? { accion: 'ninguna', estadoParcela: null };
}
