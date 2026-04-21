import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '../integrations/supabase/types';
import { LOGISTICA_MANTENIMIENTO_SELECT } from '@/utils/logisticaMantenimiento';
import { logLiaEvento } from '@/utils/liaLogger';
import { useCreatedBy } from './useCreatedBy';
import { toast } from '@/hooks/use-toast';
import type {
  Camion,
  Combustible,
  LogisticaInventarioSync,
  MantenimientoCamion,
  MantenimientoCamionInsert,
  TipoTrabajoLogistica,
  VehiculoEmpresa,
  Viaje,
} from './useLogisticaTypes';

export function useCamiones() {
  return useQuery<Camion[]>({
    queryKey: ['camiones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camiones')
        .select('*')
        .order('matricula');
      if (error) throw error;
      return (data ?? []) as Camion[];
    },
    staleTime: 60000,
  });
}

// ── useAddCamion ──────────────────────────────────────────────

export function useAddCamion() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Camion, 'id' | 'codigo_interno'> & { ubicacion_id?: string | null }) => {
      const { ubicacion_id, ...camionPayload } = payload;

      // Calcular siguiente código interno CM001, CM002…
      const { data: existentes } = await supabase
        .from('camiones')
        .select('codigo_interno')
        .not('codigo_interno', 'is', null);
      
      const nums = (existentes ?? [])
        .map(c => {
          const match = (c.codigo_interno ?? '').match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(n => !isNaN(n));
      const siguiente = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      const codigo_interno = 'CM' + String(siguiente).padStart(3, '0');

      const { data, error } = await supabase
        .from('camiones')
        .insert([{ ...camionPayload, codigo_interno, created_by: createdBy }])
        .select()
        .single();
      if (error) throw error;

      // Sync inventario si se especificó ubicación
      if (ubicacion_id && data) {
        await supabase.from('logistica_inventario_sync').insert({
          tipo:        'camion',
          vehiculo_id: (data as { id: string }).id,
          ubicacion_id,
          activo:      true,
        });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['camiones'] });
      qc.invalidateQueries({ queryKey: ['logistica_inventario_sync'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdateCamion ───────────────────────────────────────────

export function useUpdateCamion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Camion> & { id: string }) => {
      const { error } = await supabase
        .from('camiones')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camiones'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useDeleteCamion ───────────────────────────────────────────

export function useDeleteCamion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('camiones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['camiones'] });
      qc.invalidateQueries({ queryKey: ['logistica_inventario_sync'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useVehiculosEmpresa ───────────────────────────────────────

export function useVehiculosEmpresa() {
  return useQuery<VehiculoEmpresa[]>({
    queryKey: ['vehiculos_empresa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehiculos_empresa')
        .select('*')
        .order('matricula');
      if (error) throw error;
      return (data ?? []) as VehiculoEmpresa[];
    },
    staleTime: 60000,
  });
}

// ── useAddVehiculoEmpresa ─────────────────────────────────────

export function useAddVehiculoEmpresa() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<VehiculoEmpresa, 'id' | 'created_at' | 'codigo_interno'> & { ubicacion_id?: string | null }) => {
      const { ubicacion_id, ...vehiculoPayload } = payload;

      const { data: existentes } = await supabase
        .from('vehiculos_empresa')
        .select('codigo_interno')
        .not('codigo_interno', 'is', null);
      
      const nums = (existentes ?? [])
        .map(v => {
          const match = (v.codigo_interno ?? '').match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(n => !isNaN(n));
      const siguiente = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      const codigo_interno = 'VH' + String(siguiente).padStart(3, '0');

      const { data, error } = await supabase
        .from('vehiculos_empresa')
        .insert([{ ...vehiculoPayload, codigo_interno, created_by: createdBy }])
        .select()
        .single();
      if (error) throw error;

      if (ubicacion_id && data) {
        await supabase.from('logistica_inventario_sync').insert({
          tipo:        'vehiculo',
          vehiculo_id: (data as { id: string }).id,
          ubicacion_id,
          activo:      true,
        });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehiculos_empresa'] });
      qc.invalidateQueries({ queryKey: ['logistica_inventario_sync'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdateVehiculoEmpresa ──────────────────────────────────

export function useUpdateVehiculoEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<VehiculoEmpresa> & { id: string }) => {
      const { error } = await supabase
        .from('vehiculos_empresa')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehiculos_empresa'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useDeleteVehiculoEmpresa ──────────────────────────────────

export function useDeleteVehiculoEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vehiculos_empresa').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehiculos_empresa'] });
      qc.invalidateQueries({ queryKey: ['logistica_inventario_sync'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useViajes ─────────────────────────────────────────────────

export function useViajes(personalId?: string) {
  return useQuery<Viaje[]>({
    queryKey: ['logistica_viajes', personalId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('logistica_viajes')
        .select('*')
        .order('hora_salida', { ascending: false });
      if (personalId) q = q.eq('personal_id', personalId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Viaje[];
    },
    staleTime: 30000,
  });
}

// ── useAddViaje ───────────────────────────────────────────────

export function useAddViaje() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Viaje, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('logistica_viajes')
        .insert([{ ...payload, created_by: createdBy }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, payload) => {
      try {
        logLiaEvento('logistica', 'viaje_registrado', {
          finca: payload.finca ?? null,
          destino: payload.destino ?? null,
          km_recorridos: payload.km_recorridos ?? null,
          gasto_gasolina_litros: payload.gasto_gasolina_litros ?? null,
        });
      } catch (e) {
        // silent
      }
      qc.invalidateQueries({ queryKey: ['logistica_viajes'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdateViaje ────────────────────────────────────────────

export function useUpdateViaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Viaje> & { id: string }) => {
      const { error } = await supabase
        .from('logistica_viajes')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_viajes'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useDeleteViaje ────────────────────────────────────────────

export function useDeleteViaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('logistica_viajes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_viajes'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useMantenimientoCamion ────────────────────────────────────

export function useMantenimientoCamion(camionId?: string) {
  return useQuery<MantenimientoCamion[]>({
    queryKey: ['logistica_mantenimiento', camionId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('logistica_mantenimiento')
        .select(LOGISTICA_MANTENIMIENTO_SELECT)
        .order('fecha', { ascending: false });
      if (camionId) {
        q = q.or(`camion_id.eq.${camionId},vehiculo_empresa_id.eq.${camionId}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MantenimientoCamion[];
    },
    staleTime: 60000,
  });
}

// ── useAddMantenimientoCamion ─────────────────────────────────

export function useAddMantenimientoCamion() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MantenimientoCamionInsert) => {
      const { data, error } = await supabase
        .from('logistica_mantenimiento')
        .insert([{ ...payload, created_by: payload.created_by ?? createdBy }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_mantenimiento'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdateMantenimientoCamion ──────────────────────────────

export function useUpdateMantenimientoCamion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: TablesUpdate<'logistica_mantenimiento'> & { id: string }) => {
      const { error } = await supabase
        .from('logistica_mantenimiento')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_mantenimiento'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useDeleteMantenimiento ────────────────────────────────────

export function useDeleteMantenimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('logistica_mantenimiento').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_mantenimiento'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useCombustible ────────────────────────────────────────────

export function useCombustible(vehiculoId?: string, vehiculoTipo?: string) {
  return useQuery<Combustible[]>({
    queryKey: ['logistica_combustible', vehiculoId ?? 'all', vehiculoTipo ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('logistica_combustible')
        .select('*')
        .order('fecha', { ascending: false });
      if (vehiculoId)   q = q.eq('vehiculo_id', vehiculoId);
      if (vehiculoTipo) q = q.eq('vehiculo_tipo', vehiculoTipo);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Combustible[];
    },
    staleTime: 30000,
  });
}

// ── useAddCombustible ─────────────────────────────────────────

export function useAddCombustible() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Combustible, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('logistica_combustible')
        .insert([{ ...payload, created_by: createdBy }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_combustible'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdateCombustible ──────────────────────────────────────

export function useUpdateCombustible() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Combustible> & { id: string }) => {
      const { error } = await supabase
        .from('logistica_combustible')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_combustible'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useDeleteCombustible ──────────────────────────────────────

export function useDeleteCombustible() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('logistica_combustible').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_combustible'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useLogisticaInventarioSync ────────────────────────────────

export function useLogisticaInventarioSync() {
  return useQuery<LogisticaInventarioSync[]>({
    queryKey: ['logistica_inventario_sync'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistica_inventario_sync')
        .select('*')
        .eq('activo', true);
      if (error) throw error;
      return (data ?? []) as LogisticaInventarioSync[];
    },
    staleTime: 60000,
  });
}

export function useAddLogisticaSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<LogisticaInventarioSync, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('logistica_inventario_sync')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_inventario_sync'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useTiposTrabajoLogistica ──────────────────────────────────

export function useTiposTrabajoLogistica() {
  return useQuery<TipoTrabajoLogistica[]>({
    queryKey: ['catalogo_tipos_trabajo', 'logistica'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_tipos_trabajo')
        .select('id, nombre, categoria, activo')
        .eq('categoria', 'logistica')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return (data ?? []) as TipoTrabajoLogistica[];
    },
    staleTime: 60000,
  });
}

export function useAddTipoTrabajoLogistica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { data, error } = await supabase
        .from('catalogo_tipos_trabajo')
        .insert({ nombre, categoria: 'logistica', activo: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogo_tipos_trabajo', 'logistica'] }),
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
