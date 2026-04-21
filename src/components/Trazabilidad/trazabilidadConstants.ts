export const ESTADOS_PALOT = {
  en_campo: 'bg-green-500/20 text-green-400 border-green-500/30',
  en_transporte: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  en_almacen: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  expedido: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
} as const

export const TIPOS_MOVIMIENTO = [
  { value: 'carga_campo', label: 'Carga en Campo' },
  { value: 'descarga_almacen', label: 'Descarga en Almacén' },
  { value: 'entrada_camara', label: 'Entrada a Cámara' },
  { value: 'salida_expedicion', label: 'Salida / Expedición' },
] as const
