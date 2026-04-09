import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'
import { logLiaEvento } from '@/utils/liaLogger'
import { useAuth } from '@/context/AuthContext'
import { useCreatedBy } from './useCreatedBy'
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
      const { data: { user } } = await supabase.auth.getUser();
      const currentUser = user?.email || 'sistema';
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
        .insert({ fecha: hoy, responsable: currentUser })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['partes_diarios', data.fecha] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
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
  const createdBy = useCreatedBy()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'parte_estado_finca'>) => {
      const { data, error } = await supabase
        .from('parte_estado_finca')
        .insert({ ...record, created_by: createdBy })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, record) => {
      logLiaEvento('campo', 'estado_parcela', {
        finca: record.finca,
        parcel_id: record.parcel_id,
        estado: record.estado,
        num_operarios: record.num_operarios,
      });
      qc.invalidateQueries({ queryKey: ['parte_estado_finca', data.parte_id] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
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
  const createdBy = useCreatedBy()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'parte_trabajo'>) => {
      const { data, error } = await supabase
        .from('parte_trabajo')
        .insert({ ...record, created_by: createdBy })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parte_trabajo', data.parte_id] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
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
  const createdBy = useCreatedBy()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'parte_personal'>) => {
      const { data, error } = await supabase
        .from('parte_personal')
        .insert({ ...record, created_by: createdBy })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['parte_personal', data.parte_id] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
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
  const createdBy = useCreatedBy()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'parte_residuos_vegetales'>) => {
      const { data, error } = await supabase
        .from('parte_residuos_vegetales')
        .insert({ ...record, created_by: createdBy })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data, record) => {
      logLiaEvento('parte_diario', 'residuos_vegetales', {
        personal_id: record.personal_id,
        ganadero_id: record.ganadero_id,
        hora_salida_nave: record.hora_salida_nave,
      });
      qc.invalidateQueries({ queryKey: ['parte_residuos_vegetales', data.parte_id] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
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
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
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
      const { error } = await supabase.from(tabla as 'parte_trabajo').delete().eq('id', id)
      if (error) throw error
      return { tabla, parteId }
    },
    onSuccess: ({ tabla, parteId }) => {
      qc.invalidateQueries({ queryKey: [tabla, parteId] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
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
    staleTime: 60000,
  })
}

export function useAddGanadero() {
  const createdBy = useCreatedBy()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { data, error } = await supabase
        .from('ganaderos')
        .insert({ nombre, created_by: createdBy })
        .select()
        .single()
      if (error) throw error
      return data as Ganadero
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ganaderos'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
    },
  })
}

/*
================================================
14. CIERRES DE JORNADA
================================================
*/

export function useCierresJornada() {
  return useQuery({
    queryKey: ['cierres_jornada'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cierres_jornada')
        .select('*')
        .order('fecha', { ascending: false })
      if (error) throw error
      return (data ?? []) as import('@/integrations/supabase/types').Tables<'cierres_jornada'>[]
    },
    staleTime: 30000,
  })
}

export function useAddCierreJornada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: import('@/integrations/supabase/types').TablesInsert<'cierres_jornada'>) => {
      const { data, error } = await supabase
        .from('cierres_jornada')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cierres_jornada'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
    },
  })
}

/*
================================================
15. CERRAR JORNADA — lógica completa de arrastre
================================================
*/

export function useCerrarJornada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ fecha, parteId }: { fecha: string; parteId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUser = user?.email || 'sistema';
      const { data, error } = await supabase.rpc('cerrar_jornada_atomica', {
        p_fecha: fecha,
        p_usuario: currentUser,
      });
      if (error) throw error;
      
      const res = data as unknown as Record<string, number>;
      return {
        ejecutados: res.ejecutados,
        pendientes: res.pendientes,
        arrastrados: res.arrastrados,
        incidenciasArrastradas: res.incidenciasNuevasTrabajo
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cierres_jornada'] })
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] })
      qc.invalidateQueries({ queryKey: ['trabajos_incidencias'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
    },
  })
}

/*
================================================
16. UPDATE ESTADO TRABAJO — estado_planificacion + prioridad
================================================
*/

export function useUpdateEstadoTrabajo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      estado_planificacion,
      prioridad,
    }: {
      id: string
      estado_planificacion: string
      prioridad?: string
    }) => {
      const patch: { estado_planificacion: string; prioridad?: string } = { estado_planificacion }
      if (prioridad) patch.prioridad = prioridad
      const { data, error } = await supabase
        .from('trabajos_registro')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
    },
  })
}