import type {
  Tractor as TractorType,
  Apero,
  UsoMaquinaria,
} from '@/hooks/useMaquinaria'
import type { Personal } from '@/hooks/usePersonal'

export type TabType = 'tractores' | 'aperos' | 'uso' | 'gps'

export const ESTADOS_OPERATIVO = ['disponible', 'en_uso', 'mantenimiento', 'baja'] as const
export const ESTADOS_APERO = ['disponible', 'asignado', 'en_reparacion', 'baja'] as const

export const ESTADO_OP_BADGE: Record<string, string> = {
  disponible: 'border-green-500  text-green-400',
  en_uso: 'border-slate-500   text-slate-300',
  mantenimiento: 'border-amber-500  text-amber-400',
  baja: 'border-red-500    text-red-400',
  asignado: 'border-slate-500   text-slate-300',
  en_reparacion: 'border-amber-500  text-amber-400',
}

export const ESTADO_OP_LABEL: Record<string, string> = {
  disponible: 'Disponible',
  en_uso: 'En uso',
  mantenimiento: 'Mantenimiento',
  baja: 'Baja',
  asignado: 'Asignado',
  en_reparacion: 'En reparación',
}

export const TIPOS_APERO_BASE = [
  'Arado', 'Cultivador', 'Fresadora', 'Subsolador', 'Rodillo',
  'Sembradora', 'Abonadora', 'Pulverizador', 'Segadora',
  'Remolque', 'Pala cargadora', 'Retroexcavadora',
]

export const MARCAS_TRACTOR_BASE = ['John Deere', 'Fendt', 'New Holland', 'Case IH', 'Kubota', 'Massey Ferguson']

export function fmtFechaCorta(f: string | null): string {
  if (!f) return '—'
  try {
    return new Date(f).toLocaleDateString('es-ES')
  } catch {
    return '—'
  }
}

export function matriculaTractor(list: TractorType[], id: string | null): string {
  if (!id) return '—'
  return list.find(t => t.id === id)?.matricula ?? '—'
}

export function tipoApero(list: Apero[], id: string | null): string {
  if (!id) return '—'
  return list.find(a => a.id === id)?.tipo ?? '—'
}

export function estadoTractorTexto(t: TractorType): string {
  if (!t.activo) return 'Inactivo'
  const hoy = new Date()
  const proxItv = t.fecha_proxima_itv ? new Date(t.fecha_proxima_itv) : null
  if (proxItv && proxItv < hoy) return 'Activo · ITV vencida'
  if (proxItv) {
    const d = Math.ceil((proxItv.getTime() - hoy.getTime()) / 86400000)
    if (d >= 0 && d < 30) return `Activo · ITV en ${d}d`
  }
  return 'Activo'
}

export function nombreOperarioUso(u: UsoMaquinaria, personal: Personal[]): string {
  if (u.personal_id) return personal.find(p => p.id === u.personal_id)?.nombre ?? '—'
  return u.tractorista?.trim() ? u.tractorista : '—'
}
