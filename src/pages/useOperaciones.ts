import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'
import type { ParcelStatus } from '@/types/farm'
import { toast } from '@/hooks/use-toast'

export function useParcelProduction(parcelId: string | null, crop: string | null) {
  return useQuery({
    queryKey: ['parcel_production', parcelId, crop],
    queryFn: async () => {
      if (!parcelId || !crop) return null
      const [parcelRes, cultivoRes] = await Promise.all([
        supabase.from('parcels').select('area_hectares').eq('parcel_id', parcelId).single(),
        supabase.from('cultivos_catalogo').select('*').eq('nombre_interno', crop).single()
      ])
      const area = parcelRes.data?.area_hectares ?? 0
      const cultivo = cultivoRes.data
      if (!cultivo) return null
      return {
        parcel_id: parcelId, crop, area_hectares: area,
        estimated_production_kg: Math.round(area * (cultivo.rendimiento_kg_ha ?? 18000)),
        estimated_plastic_kg: Math.round(area * (cultivo.kg_plastico_por_ha ?? 1200)),
        estimated_drip_meters: Math.round(area * (cultivo.m_cinta_riego_por_ha ?? 8000)),
        marco_lineas_cm: cultivo.marco_std_entre_lineas_cm,
        marco_plantas_cm: cultivo.marco_std_entre_plantas_cm, ciclo_dias: cultivo.ciclo_dias,
      }
    },
    enabled: !!parcelId && !!crop,
    staleTime: 30000
  })
}

export function useParcelTickets(parcelId: string | null) {
  return useQuery({
    queryKey: ['parcel_tickets', parcelId],
    queryFn: async () => {
      if (!parcelId) return []
      const { data, error } = await supabase.from('tickets_pesaje').select(`*, harvests!inner(parcel_id, crop, date), camiones(matricula, empresa_transporte)`).eq('harvests.parcel_id', parcelId).order('created_at', { ascending: false })
      if (error) throw error; return data ?? []
    },
    enabled: !!parcelId, staleTime: 30000
  })
}

export function useParcelResiduos(parcelId: string | null) {
  return useQuery({
    queryKey: ['parcel_residuos', parcelId],
    queryFn: async () => {
      if (!parcelId) return []
      const { data, error } = await supabase.from('residuos_operacion').select('*').eq('parcel_id', parcelId).order('created_at', { ascending: false })
      if (error) throw error; return data ?? []
    },
    enabled: !!parcelId, staleTime: 30000
  })
}

export function useParcelCertification(parcelId: string | null) {
  return useQuery({
    queryKey: ['parcel_certificacion', parcelId],
    queryFn: async () => {
      if (!parcelId) return null
      const { data, error } = await supabase.from('certificaciones_parcela').select('*').eq('parcel_id', parcelId).order('fecha_inicio', { ascending: false }).limit(1).single()
      if (error && error.code !== 'PGRST116') throw error; return data ?? null
    },
    enabled: !!parcelId, staleTime: 60000
  })
}

export function useParcelRecords(parcelId: string | null) {
  const workRecords = useQuery({ queryKey: ['work_records', parcelId], queryFn: async () => { if (!parcelId) return []; const { data, error } = await supabase.from('work_records').select(`*, cuadrillas(nombre, empresa)`).eq('parcel_id', parcelId).order('date', { ascending: false }); if (error) throw error; return data ?? [] }, enabled: !!parcelId, staleTime: 30000 })
  const plantings = useQuery({ queryKey: ['plantings', parcelId], queryFn: async () => { if (!parcelId) return []; const { data, error } = await supabase.from('plantings').select('*').eq('parcel_id', parcelId).order('date', { ascending: false }); if (error) throw error; return data ?? [] }, enabled: !!parcelId, staleTime: 30000 })
  const harvests = useQuery({ queryKey: ['harvests', parcelId], queryFn: async () => { if (!parcelId) return []; const { data, error } = await supabase.from('harvests').select('*').eq('parcel_id', parcelId).order('date', { ascending: false }); if (error) throw error; return data ?? [] }, enabled: !!parcelId, staleTime: 30000 })
  return { workRecords, plantings, harvests }
}

export function useFarmParcelStatuses(parcelIds: string[]) {
  return useQuery({
    queryKey: ['farm_parcel_statuses', parcelIds],
    queryFn: async () => {
      if (parcelIds.length === 0) return {}
      const [plantingsRes, harvestsRes, workRes] = await Promise.all([
        supabase.from('plantings').select('parcel_id, date').in('parcel_id', parcelIds).order('date', { ascending: false }),
        supabase.from('harvests').select('parcel_id, date').in('parcel_id', parcelIds).order('date', { ascending: false }),
        supabase.from('work_records').select('parcel_id, date').in('parcel_id', parcelIds).order('date', { ascending: false })
      ])
      const latestPlanting: Record<string, string> = {}; const latestHarvest: Record<string, string> = {}; const latestWork: Record<string, string> = {}
      for (const r of plantingsRes.data || []) { if (!latestPlanting[r.parcel_id]) latestPlanting[r.parcel_id] = r.date }
      for (const r of harvestsRes.data || []) { if (!latestHarvest[r.parcel_id]) latestHarvest[r.parcel_id] = r.date }
      for (const r of workRes.data || []) { if (!latestWork[r.parcel_id]) latestWork[r.parcel_id] = r.date }
      const statuses: Record<string, ParcelStatus> = {}
      for (const id of parcelIds) {
        const p = latestPlanting[id]; const h = latestHarvest[id]; const w = latestWork[id]
        if (!p && !h && !w) statuses[id] = 'vacia'
        else if (h && (!p || h >= p)) statuses[id] = 'cosechada'
        else if (p && (!h || p > h)) statuses[id] = 'plantada'
        else if (w && !p && !h) statuses[id] = 'preparacion'
        else statuses[id] = 'activa'
      }
      return statuses
    },
    enabled: parcelIds.length > 0, staleTime: 30000
  })
}

export function useInsertWorkRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'work_records'>) => {
      const { data, error } = await supabase.from('work_records').insert(record).select().single()
      if (error) throw error; return data
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['work_records', vars.parcel_id] }); qc.invalidateQueries({ queryKey: ['farm_parcel_statuses'] }) },
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}

export function useInsertWorkRecordQR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: { cuadrilla_id: string; hora_entrada: string }) => {
      const { data, error } = await supabase.from('work_records').insert(record as any).select().single()
      if (error) throw error; return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farm_parcel_statuses'] }),
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}

export function useInsertPlanting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'plantings'>) => {
      const { data, error } = await supabase.from('plantings').insert(record).select().single()
      if (error) throw error; return data
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['plantings', vars.parcel_id] }); qc.invalidateQueries({ queryKey: ['farm_parcel_statuses'] }); qc.invalidateQueries({ queryKey: ['parcel_production'] }) },
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}

export const useAddPlanting = useInsertPlanting;

export function useInsertHarvest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'harvests'>) => {
      const { data, error } = await supabase.from('harvests').insert(record).select().single()
      if (error) throw error; return data
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['harvests', vars.parcel_id] }); qc.invalidateQueries({ queryKey: ['farm_parcel_statuses'] }) },
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}

export const useAddHarvest = useInsertHarvest;

export function useInsertResiduo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'residuos_operacion'>) => {
      const { data, error } = await supabase.from('residuos_operacion').insert(record).select().single()
      if (error) throw error; return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['parcel_residuos', vars.parcel_id] }),
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}

export function useInsertTicketPesaje() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'tickets_pesaje'>) => {
      const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const aleatorio = Math.floor(1000 + Math.random() * 9000)
      const numero_albaran = `MRV-${fecha}-${aleatorio}`
      const { data, error } = await supabase.from('tickets_pesaje').insert({ ...record, numero_albaran }).select().single()
      if (error) throw error; return data
    },
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['parcel_tickets'] }); qc.invalidateQueries({ queryKey: ['harvests', data.harvest_id] }) },
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}