import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'

/*
================================================
1. PARTE POR FECHA — consulta el registro cabecera
================================================
*/

export function usePartePorFecha(fecha: string) {
  return useQuery({
    queryKey: ['partes_diarios', fecha],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partes_diarios')
        .select('*')
        .eq('fecha', fecha)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
    staleTime: 15000,
  })
}

/*
================================================
2. ENSURE PARTE HOY — crea o devuelve el parte del día
================================================
*/

export function useEnsureParteHoy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (hoy: string) => {
      // Intentar obtener el existente primero
      const { data: existing } = await supabase
        .from('partes_diarios')
        .select('*')
        .eq('fecha', hoy)
        .maybeSingle()
      if (existing) return existing
      // Crear nuevo
      const { data, error } = await supabase
        .from('partes_diarios')
        .insert({ fecha: hoy, responsable: 'JuanPe' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['partes_diarios', data.fecha] })
    },
  })
}

/*
================================================
3. ESTADOS FINCA — Bloque A
================================================
*/

export function useEstadosFinca(parteId: string | null) {
  return useQuery({
    queryKey: ['parte_estado_finca', parteId],
    queryFn: async () => {
      if (!parteId) return []
      const { data, error } = await supabase
        .from('parte_estado_finca')
        .select('*')
        .eq('parte_id', parteId)
        .order('created_at')
      if (error) throw error
      return data ?? []
    },
    enabled: !!parteId,
    staleTime: 15000,
  })
}

/*
================================================
4. ADD ESTADO FINCA — Bloque A
================================================
*/

export function useAddEstadoFinca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'parte_estado_finca'>) => {
      const { data, error } = await supabase
        .from('parte_estado_finca')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parte_estado_finca', data.parte_id] })
    },
  })
}

/*
================================================
5. TRABAJOS — Bloque B
================================================
*/

export function useTrabajos(parteId: string | null) {
  return useQuery({
    queryKey: ['parte_trabajo', parteId],
    queryFn: async () => {
      if (!parteId) return []
      const { data, error } = await supabase
        .from('parte_trabajo')
        .select('*')
        .eq('parte_id', parteId)
        .order('created_at')
      if (error) throw error
      return data ?? []
    },
    enabled: !!parteId,
    staleTime: 15000,
  })
}

/*
================================================
6. ADD TRABAJO — Bloque B
================================================
*/

export function useAddTrabajo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'parte_trabajo'>) => {
      const { data, error } = await supabase
        .from('parte_trabajo')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parte_trabajo', data.parte_id] })
    },
  })
}

/*
================================================
7. PERSONALES — Bloque C
================================================
*/

export function usePersonales(parteId: string | null) {
  return useQuery({
    queryKey: ['parte_personal', parteId],
    queryFn: async () => {
      if (!parteId) return []
      const { data, error } = await supabase
        .from('parte_personal')
        .select('*')
        .eq('parte_id', parteId)
        .order('fecha_hora')
      if (error) throw error
      return data ?? []
    },
    enabled: !!parteId,
    staleTime: 15000,
  })
}

/*
================================================
8. ADD PERSONAL — Bloque C
================================================
*/

export function useAddPersonal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'parte_personal'>) => {
      const { data, error } = await supabase
        .from('parte_personal')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parte_personal', data.parte_id] })
    },
  })
}

/*
================================================
9. RESIDUOS VEGETALES — Bloque D
================================================
*/

export function useResiduos(parteId: string | null) {
  return useQuery({
    queryKey: ['parte_residuos_vegetales', parteId],
    queryFn: async () => {
      if (!parteId) return []
      const { data, error } = await supabase
        .from('parte_residuos_vegetales')
        .select('*')
        .eq('parte_id', parteId)
        .order('created_at')
      if (error) throw error
      return data ?? []
    },
    enabled: !!parteId,
    staleTime: 15000,
  })
}

/*
================================================
10. ADD RESIDUOS — Bloque D
================================================
*/

export function useAddResiduos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'parte_residuos_vegetales'>) => {
      const { data, error } = await supabase
        .from('parte_residuos_vegetales')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parte_residuos_vegetales', data.parte_id] })
    },
  })
}

/*
================================================
11. UPDATE PARTE DIARIO — notas generales
================================================
*/

export function useUpdateParteDiario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      fecha,
      notas_generales,
    }: {
      id: string
      fecha: string
      notas_generales: string
    }) => {
      const { data, error } = await supabase
        .from('partes_diarios')
        .update({ notas_generales })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { data, fecha }
    },
    onSuccess: ({ fecha }) => {
      qc.invalidateQueries({ queryKey: ['partes_diarios', fecha] })
    },
  })
}

/*
================================================
12. DELETE ENTRADA — elimina cualquier fila por tabla + id
================================================
*/

export function useDeleteEntradaParte() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      tabla,
      id,
      parteId,
    }: {
      tabla: string
      id: string
      parteId: string
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from(tabla).delete().eq('id', id)
      if (error) throw error
      return { tabla, parteId }
    },
    onSuccess: ({ tabla, parteId }) => {
      qc.invalidateQueries({ queryKey: [tabla, parteId] })
    },
  })
}

/*
================================================
13. GANADEROS — tabla de ganaderos destino residuos vegetales
================================================
*/

export interface Ganadero {
  id:         string
  nombre:     string
  telefono:   string | null
  direccion:  string | null
  activo:     boolean
  notas:      string | null
  created_at: string
}

export function useGanaderos() {
  return useQuery<Ganadero[]>({
    queryKey: ['ganaderos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ganaderos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true })
      if (error) throw error
      return (data ?? []) as Ganadero[]
    },
  })
}

export function useAddGanadero() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { data, error } = await supabase
        .from('ganaderos')
        .insert({ nombre })
        .select()
        .single()
      if (error) throw error
      return data as Ganadero
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ganaderos'] })
    },
  })
}
