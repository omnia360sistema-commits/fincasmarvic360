import type { Tables } from '@/integrations/supabase/types'

export const HOY = new Date().toISOString().split('T')[0]

export function formatFechaEjecutiva(fecha: string): string {
  try {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return fecha
  }
}

export function addDaysISO(fecha: string, days: number): string {
  const d = new Date(fecha + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/** Bloque C: INCIDENCIA si el texto contiene la palabra "incidencia". */
export function esIncidenciaPartePersonal(texto: string): boolean {
  return /\bincidencia\b/i.test(texto)
}

export function estadoPartePersonalRow(texto: string): 'COMPLETADO' | 'INCIDENCIA' {
  return esIncidenciaPartePersonal(texto) ? 'INCIDENCIA' : 'COMPLETADO'
}

export function prioridadPlanningDesdeNotas(notas: string | null): 'ALTA' | 'MEDIA' {
  if (/\b(urgente|prioridad\s*alta|crític|critico)\b/i.test(notas ?? '')) return 'ALTA'
  return 'MEDIA'
}

export type EntradaPDF =
  | { ts: string; tipo: 'A'; data: Tables<'parte_estado_finca'> }
  | { ts: string; tipo: 'B'; data: Tables<'parte_trabajo'> }
  | { ts: string; tipo: 'C'; data: Tables<'parte_personal'> }
  | { ts: string; tipo: 'D'; data: Tables<'parte_residuos_vegetales'> }

export function buildEntradasOrdenadas(
  estadosFinca: Tables<'parte_estado_finca'>[],
  trabajos: Tables<'parte_trabajo'>[],
  personales: Tables<'parte_personal'>[],
  residuos: Tables<'parte_residuos_vegetales'>[],
): EntradaPDF[] {
  return [
    ...estadosFinca.map(e => ({ ts: e.created_at, tipo: 'A' as const, data: e })),
    ...trabajos.map(e => ({ ts: e.hora_inicio ?? e.created_at, tipo: 'B' as const, data: e })),
    ...personales.map(e => ({ ts: e.fecha_hora, tipo: 'C' as const, data: e })),
    ...residuos.map(e => ({ ts: e.hora_salida_nave ?? e.created_at, tipo: 'D' as const, data: e })),
  ].sort((a, b) => a.ts.localeCompare(b.ts))
}

export function computeInicioJornada(entradas: EntradaPDF[]): string {
  const times: number[] = []
  for (const e of entradas) {
    if (e.tipo === 'A') times.push(new Date(e.data.created_at).getTime())
    if (e.tipo === 'B' && e.data.hora_inicio) times.push(new Date(e.data.hora_inicio).getTime())
    if (e.tipo === 'C') times.push(new Date(e.data.fecha_hora).getTime())
    if (e.tipo === 'D' && e.data.hora_salida_nave) times.push(new Date(e.data.hora_salida_nave).getTime())
  }
  if (times.length === 0) return '—'
  const min = new Date(Math.min(...times))
  return `${min.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} h`
}

export function collectZonasTrabajo(entradas: EntradaPDF[]): string {
  const set = new Set<string>()
  for (const e of entradas) {
    if (e.tipo === 'A' && e.data.finca) set.add(e.data.finca)
    if (e.tipo === 'B' && e.data.finca) set.add(e.data.finca)
  }
  return [...set].filter(Boolean).join(' / ') || '—'
}

export function collectNombresPersonal(entradas: EntradaPDF[]): string {
  const names = new Set<string>()
  for (const e of entradas) {
    if (e.tipo === 'A' && e.data.nombres_operarios) {
      e.data.nombres_operarios.split(/[,;]/).map(s => s.trim()).filter(Boolean).forEach(n => names.add(n))
    }
    if (e.tipo === 'B' && e.data.nombres_operarios) {
      e.data.nombres_operarios.split(/[,;]/).map(s => s.trim()).filter(Boolean).forEach(n => names.add(n))
    }
    if (e.tipo === 'C' && e.data.con_quien) {
      e.data.con_quien.split(/[,;]/).map(s => s.trim()).filter(Boolean).forEach(n => names.add(n))
    }
  }
  return [...names].join(', ') || '—'
}
