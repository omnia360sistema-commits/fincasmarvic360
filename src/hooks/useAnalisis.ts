import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import type { Tables, TablesInsert } from '@/integrations/supabase/types'

export function useParcelAnalisisSuelo(parcelId: string | null) {
  return useQuery({
    queryKey: ['analisis_suelo', parcelId],
    queryFn: async () => {
      if (!parcelId) return []
      const { data, error } = await supabase.from('analisis_suelo').select('*').eq('parcel_id', parcelId).order('fecha', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!parcelId,
    staleTime: 60000
  })
}

export function useFarmAnalisisSuelo(parcelIds: string[]) {
  return useQuery({
    queryKey: ['farm_analisis_suelo', parcelIds],
    queryFn: async () => {
      if (parcelIds.length === 0) return {}
      const { data, error } = await supabase.from('analisis_suelo').select('*').in('parcel_id', parcelIds).order('fecha', { ascending: false })
      if (error) throw error
      const latest: Record<string, Tables<'analisis_suelo'>> = {}
      for (const row of data || []) { if (!latest[row.parcel_id]) latest[row.parcel_id] = row }
      return latest
    },
    enabled: parcelIds.length > 0,
    staleTime: 60000
  })
}

export function useAlertasAgronomicas() {
  return useQuery({
    queryKey: ['alertas_agronomicas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('analisis_suelo').select('id, parcel_id, ph, conductividad_ec, fecha').order('fecha', { ascending: false }).limit(200)
      if (error) throw error
      const latest: Record<string, Partial<Tables<'analisis_suelo'>>> = {}
      for (const row of data || []) { if (!latest[row.parcel_id]) latest[row.parcel_id] = row }
      const alerts = []
      for (const row of Object.values(latest)) {
        if (row.ph !== null && (row.ph < 5.5 || row.ph > 8.0)) alerts.push({ id: `ph-${row.id}`, parcel_id: row.parcel_id, tipo: 'pH Crítico', valor: row.ph, fecha: row.fecha })
        if (row.conductividad_ec !== null && row.conductividad_ec > 4.0) alerts.push({ id: `ec-${row.id}`, parcel_id: row.parcel_id, tipo: 'EC Crítica', valor: row.conductividad_ec, fecha: row.fecha })
      }
      return alerts
    },
    staleTime: 60000
  })
}

export function useParcelLecturasSensor(parcelId: string | null) {
  return useQuery({
    queryKey: ['lecturas_sensor', parcelId],
    queryFn: async () => {
      if (!parcelId) return []
      const { data, error } = await supabase.from('lecturas_sensor_planta').select('*').eq('parcel_id', parcelId).order('fecha', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!parcelId,
    staleTime: 60000
  })
}

export function useFincaAnalisisAgua(finca: string | null) {
  return useQuery({
    queryKey: ['analisis_agua', finca],
    queryFn: async () => {
      if (!finca) return []
      const { data, error } = await supabase.from('analisis_agua').select('*').eq('finca', finca).order('fecha', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!finca,
    staleTime: 60000
  })
}

export function useInsertAnalisisSuelo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'analisis_suelo'>) => {
      const { data, error } = await supabase.from('analisis_suelo').insert(record).select().single()
      if (error) throw error; return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['analisis_suelo', vars.parcel_id] }),
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}

export function useInsertLecturaSensor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'lecturas_sensor_planta'>) => {
      const { data, error } = await supabase.from('lecturas_sensor_planta').insert(record).select().single()
      if (error) throw error; return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['lecturas_sensor', vars.parcel_id] }),
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}

export function useInsertAnalisisAgua() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'analisis_agua'>) => {
      const { data, error } = await supabase.from('analisis_agua').insert(record).select().single()
      if (error) throw error; return data
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['analisis_agua', vars.finca] }),
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}