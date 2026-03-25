import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'

/*
================================================
UBICACIONES
================================================
*/

export function useUbicaciones() {
  return useQuery({
    queryKey: ['inventario_ubicaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventario_ubicaciones')
        .select('*')
        .eq('activa', true)
        .order('orden')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60000
  })
}

/*
================================================
CATEGORÍAS
================================================
*/

export function useCategorias() {
  return useQuery({
    queryKey: ['inventario_categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventario_categorias')
        .select('*')
        .order('orden')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60000
  })
}

/*
================================================
REGISTROS — todos los de una ubicación + categoría
================================================
*/

export function useRegistros(ubicacionId: string | null, categoriaId: string | null) {
  return useQuery({
    queryKey: ['inventario_registros', ubicacionId, categoriaId],
    queryFn: async () => {
      if (!ubicacionId || !categoriaId) return []
      const { data, error } = await supabase
        .from('inventario_registros')
        .select('*')
        .eq('ubicacion_id', ubicacionId)
        .eq('categoria_id', categoriaId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!ubicacionId && !!categoriaId,
    staleTime: 30000
  })
}

/*
================================================
ÚLTIMO REGISTRO — estado actual de una ubicación + categoría
================================================
*/

export function useUltimoRegistro(ubicacionId: string | null, categoriaId: string | null) {
  return useQuery({
    queryKey: ['inventario_ultimo_registro', ubicacionId, categoriaId],
    queryFn: async () => {
      if (!ubicacionId || !categoriaId) return null
      const { data, error } = await supabase
        .from('inventario_registros')
        .select('*')
        .eq('ubicacion_id', ubicacionId)
        .eq('categoria_id', categoriaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data ?? null
    },
    enabled: !!ubicacionId && !!categoriaId,
    staleTime: 30000
  })
}

/*
================================================
RESUMEN POR UBICACIÓN — último registro de cada categoría
================================================
*/

export function useResumenUbicacion(ubicacionId: string | null) {
  return useQuery({
    queryKey: ['inventario_resumen_ubicacion', ubicacionId],
    queryFn: async () => {
      if (!ubicacionId) return []
      const { data, error } = await supabase
        .from('inventario_registros')
        .select('*, inventario_categorias(nombre, slug, icono, orden)')
        .eq('ubicacion_id', ubicacionId)
        .order('created_at', { ascending: false })
      if (error) throw error

      // Conservar solo el registro más reciente por categoría
      const porCategoria = new Map<string, typeof data[number]>()
      for (const row of data ?? []) {
        if (!porCategoria.has(row.categoria_id)) {
          porCategoria.set(row.categoria_id, row)
        }
      }
      return Array.from(porCategoria.values())
    },
    enabled: !!ubicacionId,
    staleTime: 30000
  })
}

/*
================================================
AÑADIR REGISTRO
================================================
*/

export function useAddRegistro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'inventario_registros'>) => {
      const { data, error } = await supabase
        .from('inventario_registros')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['inventario_registros',      vars.ubicacion_id, vars.categoria_id] })
      qc.invalidateQueries({ queryKey: ['inventario_ultimo_registro', vars.ubicacion_id, vars.categoria_id] })
      qc.invalidateQueries({ queryKey: ['inventario_resumen_ubicacion', vars.ubicacion_id] })
    }
  })
}

/*
================================================
INFORMES — insertar snapshot manual
================================================
*/

export function useAddInforme() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: TablesInsert<'inventario_informes'>) => {
      const { data, error } = await supabase
        .from('inventario_informes')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario_informes'] })
    }
  })
}

/*
================================================
TOTAL REGISTROS — conteo global
================================================
*/

export function useTotalRegistros() {
  return useQuery({
    queryKey: ['inventario_total_registros'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('inventario_registros')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return count ?? 0
    },
    staleTime: 30000
  })
}

/*
================================================
CONTEOS POR UBICACIÓN — Map<ubicacion_id, count>
================================================
*/

export function useConteosUbicaciones() {
  return useQuery({
    queryKey: ['inventario_conteos_ubicaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventario_registros')
        .select('ubicacion_id')
      if (error) throw error
      const map = new Map<string, number>()
      for (const r of data ?? []) {
        map.set(r.ubicacion_id, (map.get(r.ubicacion_id) ?? 0) + 1)
      }
      return map
    },
    staleTime: 30000
  })
}

/*
================================================
INFORMES — listar por rango de fechas y ubicación
================================================
*/

export function useInformes(ubicacionId?: string | null, desde?: string, hasta?: string) {
  return useQuery({
    queryKey: ['inventario_informes', ubicacionId, desde, hasta],
    queryFn: async () => {
      let query = supabase
        .from('inventario_informes')
        .select('*')
        .order('generado_at', { ascending: false })

      if (ubicacionId) query = query.eq('ubicacion_id', ubicacionId)
      if (desde)       query = query.gte('fecha_inicio', desde)
      if (hasta)       query = query.lte('fecha_fin', hasta)

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: true,
    staleTime: 60000
  })
}
