import {
  List, ClipboardList, FlaskConical, GitBranch, Bell, History, Layers,
} from 'lucide-react'

export const MENU_ITEMS = [
  { id: 'sectores', label: 'SECTORES', icon: List },
  { id: 'suelo', label: 'CAPA SUELO', icon: Layers },
  { id: 'registrar', label: 'REGISTRAR', icon: ClipboardList },
  { id: 'analisis', label: 'ANÁLISIS', icon: FlaskConical },
  { id: 'trazabilidad', label: 'TRAZABILIDAD', icon: GitBranch },
  { id: 'alertas', label: 'ALERTAS', icon: Bell },
  { id: 'historico', label: 'HISTÓRICO', icon: History },
] as const

export type MenuId = (typeof MENU_ITEMS)[number]['id']
export type RegisterAction = 'work' | 'estado_unificado' | 'photo' | null
export type InformeFincaTipo = 'sector' | 'tipo' | 'estado'
export type InformeTipoDato =
  | 'trabajos'
  | 'plantaciones'
  | 'cosechas'
  | 'tickets'
  | 'residuos'
  | 'certificaciones'

export function getSueloColor(param: string, val: number | null | undefined): string {
  if (val === null || val === undefined) return '#64748b'
  if (param === 'pH') return (val < 5.5 || val > 8.0) ? '#ef4444' : (val < 6.0 || val > 7.5) ? '#eab308' : '#22c55e'
  if (param === 'EC') return val > 4.0 ? '#ef4444' : val >= 2.0 ? '#eab308' : '#22c55e'
  if (param === 'N') return val < 20 ? '#ef4444' : (val < 40 || val > 80) ? '#eab308' : '#22c55e'
  if (param === 'P') return val < 10 ? '#ef4444' : (val < 20 || val > 40) ? '#eab308' : '#22c55e'
  if (param === 'K') return val < 100 ? '#ef4444' : (val < 150 || val > 250) ? '#eab308' : '#22c55e'
  if (param === 'MO') return val < 1.0 ? '#ef4444' : val < 2.0 ? '#eab308' : '#22c55e'
  return '#64748b'
}

export function getLabelSize(zoom: number): string {
  if (zoom >= 17) return '11px'
  if (zoom >= 15) return '9px'
  if (zoom >= 14) return '8px'
  return '7px'
}
