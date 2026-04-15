import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { TablesInsert } from '@/integrations/supabase/types';

export function usePalots(parcelId?: string | null, estado?: string) {
  return useQuery({
    queryKey: ['palots', parcelId, estado],
    queryFn: async () => {
      let q = supabase.from('palots').select('*, parcels(parcel_number)').order('created_at', { ascending: false });
      if (parcelId) q = q.eq('parcel_id', parcelId);
      if (estado && estado !== 'todos') q = q.eq('estado', estado);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useAddPalot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TablesInsert<'palots'>, 'numero_palot'>) => {
      const qr_code = `PLT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const numero_palot = qr_code;
      const { data, error } = await supabase.from('palots').insert([{ ...payload, numero_palot }]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['palots'] });
      toast({ title: 'Palot registrado correctamente' });
    },
    onError: (err: Error) => toast({ title: 'Error al registrar palot', description: err.message, variant: 'destructive' })
  });
}

export function useCamarasAlmacen() {
  return useQuery({
    queryKey: ['camaras_almacen'],
    queryFn: async () => {
      const { data, error } = await supabase.from('camaras_almacen').select('*').eq('activa', true).order('nombre');
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useMovimientosPalot(palotId: string | null) {
  return useQuery({
    queryKey: ['movimientos_palot', palotId],
    queryFn: async () => {
      if (!palotId) return [];
      const { data, error } = await supabase.from('movimientos_palot').select('*, camiones(matricula)').eq('palot_id', palotId).order('fecha', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!palotId
  });
}

export function useAddMovimientoPalot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<'movimientos_palot'>) => {
      const { data, error } = await supabase.from('movimientos_palot').insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['movimientos_palot', vars.palot_id] });
      qc.invalidateQueries({ queryKey: ['palots'] });
      qc.invalidateQueries({ queryKey: ['trazabilidad_timeline'] });
      toast({ title: 'Movimiento registrado correctamente' });
    },
    onError: (err: Error) => toast({ title: 'Error al registrar movimiento', description: err.message, variant: 'destructive' })
  });
}

export function useDeletePalot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('palots').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['palots'] });
      qc.invalidateQueries({ queryKey: ['trazabilidad_timeline'] });
      toast({ title: 'Palot eliminado' });
    },
    onError: (err: Error) => toast({ title: 'Error al eliminar palot', description: err.message, variant: 'destructive' })
  });
}

export function useUpdatePalot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<TablesInsert<'palots'>>) => {
      const { data, error } = await supabase.from('palots').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['palots'] });
      toast({ title: 'Palot actualizado' });
    },
    onError: (err: Error) => toast({ title: 'Error al actualizar palot', description: err.message, variant: 'destructive' })
  });
}

export function useLocalPalot(qrCode: string) {
  return useQuery({
    queryKey: ['palot_qr', qrCode],
    queryFn: async () => {
      if (!qrCode) return null;
      const { data, error } = await supabase.from('palots').select('*, parcels(parcel_number)').ilike('numero_palot', `${qrCode}%`).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data ?? null;
    },
    enabled: !!qrCode
  });
}