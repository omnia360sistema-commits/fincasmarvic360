import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export function usePresenciaTiempoReal() {
  return useQuery({
    queryKey: ['presencia_tiempo_real'],
    queryFn: async () => {
      const { data, error } = await supabase.from('presencia_tiempo_real').select(`id, cuadrilla_id, parcel_id, work_record_id, hora_entrada, hora_salida, activo, created_at, cuadrillas(nombre, qr_code)`).eq('activo', true).order('hora_entrada', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 5000,
    refetchInterval: 5000
  })
}

export function useRegistrarEntradaQR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { cuadrilla_id: string; parcel_id?: string | null }) => {
      const { data, error } = await supabase.from('presencia_tiempo_real').insert([{ cuadrilla_id: payload.cuadrilla_id, parcel_id: payload.parcel_id ?? null, hora_entrada: new Date().toISOString(), activo: true }]).select().single()
      if (error) throw error; return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presencia_tiempo_real'] }),
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}

export function useRegistrarSalidaQR() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (presenciaId: string) => {
      const { data: presencia, error: getError } = await supabase.from('presencia_tiempo_real').select('*').eq('id', presenciaId).single()
      if (getError) throw getError
      if (!presencia) throw new Error('Presencia no encontrada')

      const entrada = new Date(presencia.hora_entrada)
      const salida = new Date()
      const horasCalculadas = (salida.getTime() - entrada.getTime()) / (1000 * 60 * 60)

      const { data, error } = await supabase.from('presencia_tiempo_real').update({
        hora_salida: salida.toISOString(), activo: false
      }).eq('id', presenciaId).select().single()
      
      if (error) throw error

      if (presencia.work_record_id) {
        await supabase.from('work_records').update({
          qr_scan_entrada: presencia.hora_entrada,
          qr_scan_salida: salida.toISOString(),
          horas_calculadas: Math.round(horasCalculadas * 100) / 100
        }).eq('id', presencia.work_record_id)
      }
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presencia_tiempo_real'] })
      qc.invalidateQueries({ queryKey: ['work_records'] })
    },
    onError: (err: Error) => { console.error(err); toast({ title: 'Error', description: err.message, variant: 'destructive' }) }
  })
}