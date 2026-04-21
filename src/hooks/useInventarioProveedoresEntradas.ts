import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logLiaEvento } from '@/utils/liaLogger';
import { toast } from '@/hooks/use-toast';
import { useCreatedBy } from './useCreatedBy';

/*
================================================
PROVEEDORES
================================================
*/

export function useProveedores(tipo?: string | null) {
  return useQuery({
    queryKey: ['proveedores', tipo ?? null],
    queryFn: async () => {
      let q = supabase
        .from('proveedores')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      if (tipo) q = q.eq('tipo', tipo)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as import('@/integrations/supabase/types').Tables<'proveedores'>[]
    },
    staleTime: 60000,
  })
}

export function useAddProveedor() {
  const createdBy = useCreatedBy()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: import('@/integrations/supabase/types').TablesInsert<'proveedores'>) => {
      // Generar código interno PR + correlativo 3 dígitos
      const { data: existing } = await supabase
        .from('proveedores')
        .select('codigo_interno')
        .like('codigo_interno', 'PR%')
        .order('codigo_interno', { ascending: false })
        .limit(1)
      const last = existing?.[0]?.codigo_interno ?? 'PR000'
      const num = parseInt(last.replace('PR', ''), 10)
      const codigo_interno = 'PR' + String(num + 1).padStart(3, '0')
      const { data, error } = await supabase
        .from('proveedores')
        .insert({ ...record, codigo_interno, created_by: createdBy })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  })
}

export function useUpdateProveedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<import('@/integrations/supabase/types').Tables<'proveedores'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('proveedores')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  })
}

export function useDeleteProveedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proveedores').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  })
}

/*
================================================
PRECIOS DE PROVEEDOR
================================================
*/

export function usePreciosProveedor(proveedorId: string | null) {
  return useQuery({
    queryKey: ['proveedores_precios', proveedorId],
    queryFn: async () => {
      if (!proveedorId) return []
      const { data, error } = await supabase
        .from('proveedores_precios')
        .select('*')
        .eq('proveedor_id', proveedorId)
        .eq('activo', true)
        .order('producto')
      if (error) throw error
      return (data ?? []) as import('@/integrations/supabase/types').Tables<'proveedores_precios'>[]
    },
    enabled: !!proveedorId,
    staleTime: 60000,
  })
}

export function useAddPrecioProveedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: import('@/integrations/supabase/types').TablesInsert<'proveedores_precios'>) => {
      const { data, error } = await supabase
        .from('proveedores_precios')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['proveedores_precios', vars.proveedor_id] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  })
}

export function useUpdatePrecioProveedor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, proveedor_id, ...patch }: Partial<import('@/integrations/supabase/types').Tables<'proveedores_precios'>> & { id: string; proveedor_id: string }) => {
      const { data, error } = await supabase
        .from('proveedores_precios')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return { data, proveedor_id }
    },
    onSuccess: ({ proveedor_id }) => {
      qc.invalidateQueries({ queryKey: ['proveedores_precios', proveedor_id] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  })
}

/*
================================================
ENTRADAS DE STOCK
================================================
*/

type EntradaConRel = import('@/integrations/supabase/types').Tables<'inventario_entradas'> & {
  proveedor_nombre?: string | null
  producto_nombre?: string | null
}

export function useEntradas(ubicacionId?: string | null, desde?: string, hasta?: string) {
  return useQuery({
    queryKey: ['inventario_entradas', ubicacionId ?? null, desde ?? null, hasta ?? null],
    queryFn: async () => {
      let q = supabase
        .from('inventario_entradas')
        .select(`
          *,
          proveedores(nombre),
          inventario_productos_catalogo(nombre)
        `)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (ubicacionId) q = q.eq('ubicacion_id', ubicacionId)
      if (desde)       q = q.gte('fecha', desde)
      if (hasta)       q = q.lte('fecha', hasta)
      const { data, error } = await q
      if (error) throw error
      return ((data ?? []) as (import('@/integrations/supabase/types').Tables<'inventario_entradas'> & {
        proveedores: { nombre: string } | null
        inventario_productos_catalogo: { nombre: string } | null
      })[]).map(r => ({
        ...r,
        proveedor_nombre: r.proveedores?.nombre ?? null,
        producto_nombre: r.inventario_productos_catalogo?.nombre ?? null,
      })) as EntradaConRel[]
    },
    staleTime: 30000,
  })
}

export function useAddEntrada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (record: import('@/integrations/supabase/types').TablesInsert<'inventario_entradas'>) => {
      const { data, error } = await supabase
        .from('inventario_entradas')
        .insert(record)
        .select()
        .single()
      if (error) throw error
      // Crear registro en inventario_registros automáticamente
      if (data) {
        await supabase.from('inventario_registros').insert({
          ubicacion_id: record.ubicacion_id,
          categoria_id: record.categoria_id,
          producto_id: record.producto_id ?? null,
          cantidad: record.cantidad,
          unidad: record.unidad,
          precio_unitario: record.precio_unitario ?? null,
          created_by: record.receptor ?? record.created_by ?? null,
        })
      }
      return data
    },
    onSuccess: (_, vars) => {
      logLiaEvento('inventario', 'entrada_stock', {
        ubicacion_id: vars.ubicacion_id,
        cantidad: vars.cantidad,
        unidad: vars.unidad,
        proveedor_id: vars.proveedor_id,
      });
      qc.invalidateQueries({ queryKey: ['inventario_entradas'] })
      qc.invalidateQueries({ queryKey: ['inventario_registros',       vars.ubicacion_id, vars.categoria_id] })
      qc.invalidateQueries({ queryKey: ['inventario_ultimo_registro',  vars.ubicacion_id, vars.categoria_id] })
      qc.invalidateQueries({ queryKey: ['inventario_resumen_ubicacion', vars.ubicacion_id] })
      qc.invalidateQueries({ queryKey: ['inventario_total_registros'] })
      qc.invalidateQueries({ queryKey: ['inventario_conteos_ubicaciones'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  })
}

export function useDeleteEntrada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventario_entradas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario_entradas'] })
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  })
}