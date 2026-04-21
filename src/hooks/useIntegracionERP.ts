import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Json, Tables } from '@/integrations/supabase/types'
import { toast } from '@/hooks/use-toast'
import { useCreatedBy } from '@/hooks/useCreatedBy'
import { matchHarvestsToPlantings } from '@/utils/harvestPlantingMatch'

export type ErpContenidoMeta = {
  formato?: string
  registros_exportados?: number
  notas?: string
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export function parseErpContenido(contenido: Json | null): ErpContenidoMeta {
  if (!isPlainObject(contenido)) {
    return {}
  }
  const formato = typeof contenido.formato === 'string' ? contenido.formato : undefined
  const registros_exportados =
    typeof contenido.registros_exportados === 'number' &&
    Number.isFinite(contenido.registros_exportados)
      ? contenido.registros_exportados
      : undefined
  const notas = typeof contenido.notas === 'string' ? contenido.notas : undefined
  return { formato, registros_exportados, notas }
}

export type ErpHistorialFila = Tables<'erp_exportaciones'> & ErpContenidoMeta

export function horasTrabajadasDesdeTexto(
  horaInicio: string | null,
  horaFin: string | null,
): number | undefined {
  if (!horaInicio || !horaFin) return undefined
  const t0 = new Date(horaInicio).getTime()
  const t1 = new Date(horaFin).getTime()
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) return undefined
  return Math.round(((t1 - t0) / (1000 * 60 * 60)) * 100) / 100
}

export function useErpExportacionesHistorial() {
  return useQuery({
    queryKey: ['erp_exportaciones'],
    queryFn: async (): Promise<ErpHistorialFila[]> => {
      const { data, error } = await supabase
        .from('erp_exportaciones')
        .select('*')
        .order('generado_at', { ascending: false })
        .limit(50)
      if (error) throw error
      const rows = data ?? []
      return rows.map((row) => {
        const meta = parseErpContenido(row.contenido)
        return { ...row, ...meta }
      })
    },
  })
}

export function useDeleteErpExportacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('erp_exportaciones').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['erp_exportaciones'] })
      toast({ title: 'Exportación eliminada del historial' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })
}

export function useInsertErpExportacion() {
  const qc = useQueryClient()
  const createdBy = useCreatedBy()
  return useMutation({
    mutationFn: async (vars: { tipo: string; formato: string; registros: number; notas: string }) => {
      const contenido: Json = {
        formato: vars.formato,
        registros_exportados: vars.registros,
        notas: vars.notas,
      }
      const { error } = await supabase.from('erp_exportaciones').insert({
        tipo: vars.tipo,
        fecha: new Date().toISOString().split('T')[0],
        contenido,
        created_by: createdBy,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['erp_exportaciones'] })
    },
    onError: (e: Error) =>
      toast({
        title: 'No se pudo registrar la exportación',
        description: e.message,
        variant: 'destructive',
      }),
  })
}

export async function fetchProduccionErpRows(fechaInicio: string, fechaFin: string) {
  const { data: rawHarvests, error } = await supabase
    .from('harvests')
    .select('*, tickets_pesaje(numero_albaran, destino, peso_neto_kg)')
    .gte('date', fechaInicio)
    .lte('date', fechaFin)
  if (error) throw error

  const parcelIds = [...new Set((rawHarvests || []).map((h) => h.parcel_id).filter(Boolean))]
  const { data: plantingsData } = await supabase
    .from('plantings')
    .select('parcel_id, crop, variedad, date')
    .in('parcel_id', parcelIds.length > 0 ? parcelIds : ['__none__'])

  const harvests = matchHarvestsToPlantings(rawHarvests || [], plantingsData || [])

  return harvests.map((h) => {
    const tickets = Array.isArray(h.tickets_pesaje) ? h.tickets_pesaje : [h.tickets_pesaje].filter(Boolean)
    const ticket =
      tickets.length > 0
        ? (tickets[0] as { numero_albaran?: string; destino?: string; peso_neto_kg?: number })
        : null

    return {
      parcela: h.parcel_id,
      cultivo: h.crop,
      variedad: h.variedad || '',
      fecha_cosecha: h.date,
      kg_neto: ticket?.peso_neto_kg || h.production_kg || 0,
      destino: ticket?.destino || '',
      albaran: ticket?.numero_albaran || '',
    }
  })
}

export async function fetchCostesErpExportPayload(fechaInicio: string, fechaFin: string) {
  const { data: trabajos } = await supabase
    .from('work_records')
    .select('id, date, parcel_id, work_type, hours_worked, workers_count')
    .gte('date', fechaInicio)
    .lte('date', fechaFin)

  const { data: maqRaw } = await supabase
    .from('trabajos_registro')
    .select('id, fecha, tractor_id, hora_inicio, hora_fin')
    .not('tractor_id', 'is', null)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
  const maquinaria = (maqRaw ?? []).map((m) => ({
    fecha: m.fecha,
    horas_trabajadas: horasTrabajadasDesdeTexto(m.hora_inicio, m.hora_fin) ?? 0,
    gasolina_litros: 0,
  }))

  const { data: insumos } = await supabase
    .from('inventario_entradas')
    .select('id, fecha, cantidad, unidad, importe_total, proveedor_id')
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)

  const exportData = {
    mano_de_obra: (trabajos || []).map((t) => ({
      fecha: t.date,
      operacion: t.work_type,
      horas_totales: (Number(t.hours_worked) || 0) * (t.workers_count ?? 1),
      parcela: t.parcel_id,
    })),
    maquinaria: (maquinaria || []).map((m) => ({
      fecha: m.fecha,
      horas_motor: m.horas_trabajadas,
      litros_gasoil: m.gasolina_litros,
    })),
    insumos: (insumos || []).map((i) => ({
      fecha: i.fecha,
      cantidad: i.cantidad,
      unidad: i.unidad,
      coste_total: i.importe_total,
    })),
  }

  const totalRegistros =
    exportData.mano_de_obra.length + exportData.maquinaria.length + exportData.insumos.length
  return { exportData, totalRegistros }
}

export async function fetchAnalisisErpRows(fechaInicio: string, fechaFin: string) {
  const { data } = await supabase
    .from('analisis_suelo')
    .select('*')
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
  return (data || []).map((a) => ({
    fecha: a.fecha,
    parcela: a.parcel_id,
    ph: a.ph,
    ec: a.conductividad_ec,
    nitrogeno: a.nitrogeno_ppm,
    fosforo: a.fosforo_ppm,
    potasio: a.potasio_ppm,
    mo: a.materia_organica,
  }))
}
