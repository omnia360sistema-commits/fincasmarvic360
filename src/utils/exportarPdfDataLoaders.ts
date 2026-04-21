import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { LOGISTICA_MANTENIMIENTO_SELECT } from '@/utils/logisticaMantenimiento'

export async function cargarDatosPartes(desde: string, hasta: string) {
  const { data: partes } = await supabase
    .from('partes_diarios')
    .select('id, fecha, responsable, notas_generales')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha')
  if (!partes?.length) return []

  const ids = partes.map(p => p.id)
  const [estRes, trabRes, persRes, resRes] = await Promise.all([
    supabase.from('parte_estado_finca').select('*').in('parte_id', ids).order('created_at'),
    supabase.from('parte_trabajo').select('*').in('parte_id', ids).order('hora_inicio'),
    supabase.from('parte_personal').select('*').in('parte_id', ids).order('fecha_hora'),
    supabase.from('parte_residuos_vegetales').select('*').in('parte_id', ids).order('hora_salida_nave'),
  ])

  return partes.map(p => ({
    parte: p,
    estados: (estRes.data ?? []).filter(e => e.parte_id === p.id),
    trabajos: (trabRes.data ?? []).filter(t => t.parte_id === p.id),
    personales: (persRes.data ?? []).filter(x => x.parte_id === p.id),
    residuos: (resRes.data ?? []).filter(r => r.parte_id === p.id),
  }))
}

export async function cargarTrabajos(desde: string, hasta: string) {
  const [regRes, incRes] = await Promise.all([
    supabase.from('trabajos_registro').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha').limit(500),
    supabase.from('trabajos_incidencias').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha').limit(200),
  ])
  return { registros: regRes.data ?? [], incidencias: incRes.data ?? [] }
}

export function horasTrabajadasDesdeParte(horaInicio: string | null, horaFin: string | null): number | undefined {
  if (!horaInicio || !horaFin) return undefined
  const t0 = new Date(horaInicio).getTime()
  const t1 = new Date(horaFin).getTime()
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) return undefined
  return Math.round(((t1 - t0) / (1000 * 60 * 60)) * 100) / 100
}

export async function cargarMaquinaria(desde: string, hasta: string) {
  const [usoRes, mantRes] = await Promise.all([
    supabase
      .from('trabajos_registro')
      .select('*, maquinaria_tractores(matricula, marca)')
      .not('tractor_id', 'is', null)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha')
      .limit(300),
    supabase
      .from('maquinaria_mantenimiento')
      .select('*, maquinaria_tractores(matricula)')
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha')
      .limit(200),
  ])

  type TrabajoRegistroUsoPdf = Tables<'trabajos_registro'> & {
    maquinaria_tractores?: { matricula: string | null; marca: string | null } | null
  }
  const usos = (usoRes.data ?? []).map((u: TrabajoRegistroUsoPdf) => ({
    ...u,
    tractorista: u.nombres_operarios,
    horas_trabajadas: horasTrabajadasDesdeParte(u.hora_inicio, u.hora_fin),
    gasolina_litros: 0,
  })) as Array<{
    maquinaria_tractores?: { matricula: string }
    fecha: string
    tipo_trabajo?: string
    tractorista?: string
    horas_trabajadas?: number
    gasolina_litros?: number
  }>
  const mantenimientos = (mantRes.data ?? []) as Array<{
    maquinaria_tractores?: { matricula: string }
    fecha: string
    tipo: string
    coste_euros?: number
    proveedor?: string
  }>
  return { usos, mantenimientos }
}

export async function cargarLogistica(desde: string, hasta: string) {
  const [viajesRes, mantRes] = await Promise.all([
    supabase
      .from('logistica_viajes')
      .select('*')
      .gte('hora_salida', desde)
      .lte('hora_salida', hasta + 'T23:59:59')
      .order('hora_salida')
      .limit(300),
    supabase
      .from('logistica_mantenimiento')
      .select(LOGISTICA_MANTENIMIENTO_SELECT)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha')
      .limit(100),
  ])
  return { viajes: viajesRes.data ?? [], mantenimientos: mantRes.data ?? [] }
}

export async function cargarPersonal(desde: string, hasta: string) {
  const [persRes, extRes] = await Promise.all([
    supabase.from('personal').select('*').gte('created_at', desde).lte('created_at', hasta + 'T23:59:59').order('created_at'),
    supabase
      .from('personal_externo')
      .select('*')
      .gte('created_at', desde)
      .lte('created_at', hasta + 'T23:59:59')
      .order('created_at'),
  ])
  return { personal: persRes.data ?? [], externos: extRes.data ?? [] }
}

export async function cargarCampo(desde: string, hasta: string) {
  const [estRes, planRes, harvRes] = await Promise.all([
    supabase.from('registros_estado_parcela').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
    supabase.from('plantings').select('*').gte('date', desde).lte('date', hasta).order('date'),
    supabase.from('harvests').select('*').gte('date', desde).lte('date', hasta).order('date'),
  ])
  return { estados: estRes.data ?? [], plantaciones: planRes.data ?? [], cosechas: harvRes.data ?? [] }
}
