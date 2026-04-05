import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { toast } from '@/hooks/use-toast'

// ZONAS DE RIEGO
export function useZonasRiego(parcelId?: string | null) {
  return useQuery({
    queryKey: ['sistema_riego_zonas', parcelId],
    queryFn: async () => {
      let query = supabase.from('sistema_riego_zonas').select('*').eq('activo', true)
      if (parcelId) query = query.eq('parcel_id', parcelId)
      
      const { data, error } = await query.order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: parcelId !== undefined
  })
}

export function useAddZonaRiego() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'sistema_riego_zonas'>) => {
      const { data, error } = await supabase.from('sistema_riego_zonas').insert(record).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sistema_riego_zonas', vars.parcel_id] })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })
}

// REGISTROS DE RIEGO
export function useRegistrosRiego(parcelId?: string | null, desde?: string, hasta?: string) {
  return useQuery({
    queryKey: ['registros_riego', parcelId, desde, hasta],
    queryFn: async () => {
      let query = supabase.from('registros_riego').select('*, sistema_riego_zonas(nombre_zona)')
      if (parcelId) query = query.eq('parcel_id', parcelId)
      if (desde) query = query.gte('fecha_inicio', desde)
      if (hasta) query = query.lte('fecha_inicio', hasta)
      
      const { data, error } = await query.order('fecha_inicio', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: parcelId !== undefined
  })
}

export function useAddRegistroRiego() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'registros_riego'>) => {
      const { data, error } = await supabase.from('registros_riego').insert(record).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['registros_riego'] })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })
}

export function useUpdateRegistroRiego() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...record }: TablesUpdate<'registros_riego'> & { id: string }) => {
      const { data, error } = await supabase.from('registros_riego').update(record).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registros_riego'] })
  })
}

export function useDeleteRegistroRiego() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('registros_riego').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registros_riego'] })
  })
}

// CONSUMO AGRUPADO
export function useConsumoPorParcela(parcelId: string | null, desde?: string, hasta?: string) {
  return useQuery({
    queryKey: ['consumo_riego_semana', parcelId, desde, hasta],
    queryFn: async () => {
      if (!parcelId) return []
      let query = supabase.from('registros_riego').select('fecha_inicio, litros_aplicados').eq('parcel_id', parcelId)
      if (desde) query = query.gte('fecha_inicio', desde)
      if (hasta) query = query.lte('fecha_inicio', hasta)
      
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!parcelId
  })
}