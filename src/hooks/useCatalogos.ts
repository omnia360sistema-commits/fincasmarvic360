import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'
import { toast } from '@/hooks/use-toast'

export function useCropCatalog() {
  return useQuery({
    queryKey: ['cultivos_catalogo'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cultivos_catalogo').select('*').order('nombre_display')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60000
  })
}

export function useCamiones() {
  return useQuery({
    queryKey: ['camiones'],
    queryFn: async () => {
      const { data, error } = await supabase.from('camiones').select('*').eq('activo', true).order('matricula')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60000
  })
}

export function useCuadrillas() {
  return useQuery({
    queryKey: ['cuadrillas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cuadrillas').select('*').eq('activa', true).order('nombre')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60000
  })
}

export interface ParcelaOption {
  parcel_id: string
  parcel_number: string
}

export function useParcelas(finca?: string) {
  return useQuery<ParcelaOption[]>({
    queryKey: ['parcelas_por_finca', finca ?? ''],
    enabled: !!finca,
    queryFn: async () => {
      const { data, error } = await supabase.from('parcels').select('parcel_id, parcel_number').eq('farm', finca!).order('parcel_number', { ascending: true })
      if (error) throw error
      return (data ?? []) as ParcelaOption[]
    },
    staleTime: 60000,
  })
}

export function useInsertCamion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'camiones'>) => {
      const { data, error } = await supabase.from('camiones').insert(record).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camiones'] }),
    onError: (error: Error) => { console.error(error); toast({ title: 'Error', description: error.message, variant: 'destructive' }) }
  })
}

export function useInsertCuadrilla() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'cuadrillas'>) => {
      const { data, error } = await supabase.from('cuadrillas').insert(record).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuadrillas'] }),
    onError: (error: Error) => { console.error(error); toast({ title: 'Error', description: error.message, variant: 'destructive' }) }
  })
}