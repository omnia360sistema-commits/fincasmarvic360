import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { addDaysISO } from '@/utils/parteDiarioHelpers'

/** Fila de `trabajos_incidencias` (tipado laxo si la tabla no está en generated types). */
export async function fetchIncidenciasTrabajosDelDia(fechaDia: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('trabajos_incidencias')
    .select('*')
    .eq('fecha', fechaDia)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function fetchPlanningManana(fechaActual: string): Promise<{
  manana: string
  tareas: Tables<'parte_trabajo'>[]
}> {
  const manana = addDaysISO(fechaActual, 1)
  const { data: parteM, error: e1 } = await supabase
    .from('partes_diarios')
    .select('id')
    .eq('fecha', manana)
    .maybeSingle()
  if (e1) throw e1
  if (!parteM?.id) return { manana, tareas: [] }
  const { data: tareas, error: e2 } = await supabase
    .from('parte_trabajo')
    .select('*')
    .eq('parte_id', parteM.id)
    .order('created_at')
  if (e2) throw e2
  return { manana, tareas: tareas ?? [] }
}
