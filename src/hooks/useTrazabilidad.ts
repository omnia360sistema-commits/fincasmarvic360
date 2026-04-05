import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'
import { toast } from '@/hooks/use-toast'

// ── PALOTS ─────────────────────────────────────────────────────────────

export function usePalots(harvestId?: string | null, estado?: string | null) {
  return useQuery({
    queryKey: ['palots', harvestId, estado],
    queryFn: async () => {
      let query = supabase
        .from('palots')
        .select('*, parcels(code, parcel_number), harvests(date), camaras_almacen(nombre)')
      
      if (harvestId) query = query.eq('harvest_id', harvestId)
      if (estado && estado !== 'todos') query = query.eq('estado', estado)
      
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    }
  })
}

export function useAddPalot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: Omit<TablesInsert<'palots'>, 'qr_code' | 'id'>) => {
      // Omitimos qr_code para que se genere automáticamente con el default en BD (gen_random_uuid())
      const { data, error } = await supabase.from('palots').insert(record).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['palots'] })
      toast({ title: 'Palot registrado', description: 'El palot se ha creado correctamente en el sistema.' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })
}

export function useLocalPalot(qrCode: string) {
  return useQuery({
    queryKey: ['palot_qr', qrCode],
    queryFn: async () => {
      if (!qrCode) return null
      const { data, error } = await supabase
        .from('palots')
        .select('*, parcels(code, parcel_number), harvests(date), camaras_almacen(nombre)')
        .eq('qr_code', qrCode)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 is not found
      return data ?? null
    },
    enabled: !!qrCode
  })
}

// ── MOVIMIENTOS ────────────────────────────────────────────────────────

export function useMovimientosPalot(palotId: string | null) {
  return useQuery({
    queryKey: ['movimientos_palot', palotId],
    queryFn: async () => {
      if (!palotId) return []
      const { data, error } = await supabase
        .from('movimientos_palot')
        .select('*, camiones(matricula)')
        .eq('palot_id', palotId)
        .order('timestamp', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!palotId
  })
}

export function useAddMovimientoPalot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'movimientos_palot'>) => {
      const { data, error } = await supabase.from('movimientos_palot').insert(record).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['movimientos_palot', vars.palot_id] })
      qc.invalidateQueries({ queryKey: ['palots'] })
      qc.invalidateQueries({ queryKey: ['palot_qr'] })
      toast({ title: 'Movimiento registrado', description: 'Se ha trazado el movimiento correctamente.' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  })
}

// ── CÁMARAS DE ALMACÉN ─────────────────────────────────────────────────

export function useCamarasAlmacen() {
  return useQuery({
    queryKey: ['camaras_almacen'],
    queryFn: async () => {
      const { data, error } = await supabase.from('camaras_almacen').select('*').eq('activa', true).order('nombre')
      if (error) throw error
      return data ?? []
    }
  })
}