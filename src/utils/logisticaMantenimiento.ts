/** Select unificado para `logistica_mantenimiento` (embeds opcionales). */
export const LOGISTICA_MANTENIMIENTO_SELECT = `
  *,
  camiones(matricula),
  vehiculos_empresa(matricula)
`;

/**
 * Etiqueta de vehículo para filas de `logistica_mantenimiento` con embeds opcionales.
 * No usa `vehiculo_tipo`: solo `camiones`, `vehiculos_empresa` y FKs.
 */
export type LogisticaMantenimientoVehiculoRow = {
  camion_id?: string | null;
  vehiculo_empresa_id?: string | null;
  camiones?: { matricula?: string | null } | null;
  vehiculos_empresa?: { matricula?: string | null } | null;
};

export type VehiculoLabelFallback = {
  camiones: ReadonlyArray<{ id: string; matricula: string }>;
  vehiculos: ReadonlyArray<{ id: string; matricula: string }>;
};

export function getVehiculoLabel(
  row: LogisticaMantenimientoVehiculoRow,
  fallback?: VehiculoLabelFallback,
): string {
  const fromJoin = row.camiones?.matricula ?? row.vehiculos_empresa?.matricula;
  if (fromJoin != null && fromJoin !== '') return fromJoin;
  if (!fallback) return '—';
  const id = row.camion_id ?? row.vehiculo_empresa_id;
  if (!id) return '—';
  return (
    fallback.camiones.find(c => c.id === id)?.matricula ??
    fallback.vehiculos.find(v => v.id === id)?.matricula ??
    '—'
  );
}
