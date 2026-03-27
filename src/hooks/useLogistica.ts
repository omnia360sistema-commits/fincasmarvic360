import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

// ── Tipos locales ────────────────────────────────────────────
export interface Camion {
  id:                       string;
  matricula:                string;
  activo:                   boolean;
  marca:                    string | null;
  modelo:                   string | null;
  anio:                     number | null;
  fecha_itv:                string | null;
  notas_mantenimiento:      string | null;
  foto_url:                 string | null;
  created_by:               string | null;
  kilometros_actuales:      number | null;
  fecha_proxima_itv:        string | null;
  fecha_proxima_revision:   string | null;
  km_proximo_mantenimiento: number | null;
  gps_info:                 string | null;
}

export interface Conductor {
  id:         string;
  nombre:     string;
  telefono:   string | null;
  activo:     boolean;
  notas:      string | null;
  created_at: string;
  created_by: string | null;
}

export interface Viaje {
  id:                    string;
  conductor_id:          string | null;
  personal_id:           string | null;
  camion_id:             string | null;
  finca:                 string | null;
  destino:               string | null;
  trabajo_realizado:     string | null;
  ruta:                  string | null;
  hora_salida:           string | null;
  hora_llegada:          string | null;
  gasto_gasolina_litros: number | null;
  gasto_gasolina_euros:  number | null;
  km_recorridos:         number | null;
  notas:                 string | null;
  created_at:            string;
  created_by:            string | null;
}

export interface MantenimientoCamion {
  id:          string;
  camion_id:   string | null;
  tipo:        string;
  descripcion: string | null;
  fecha:       string;
  coste_euros: number | null;
  proveedor:   string | null;
  foto_url:    string | null;
  foto_url_2:  string | null;
  created_at:  string;
  created_by:  string | null;
}

// ── useCamiones ───────────────────────────────────────────────
export function useCamiones() {
  return useQuery<Camion[]>({
    queryKey: ['camiones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camiones')
        .select('id, matricula, activo, marca, modelo, anio, fecha_itv, notas_mantenimiento, foto_url, created_by, kilometros_actuales, fecha_proxima_itv, fecha_proxima_revision, km_proximo_mantenimiento, gps_info')
        .order('matricula');
      if (error) throw error;
      return (data ?? []) as Camion[];
    },
    staleTime: 60000,
  });
}

// ── useAddCamion ──────────────────────────────────────────────
export function useAddCamion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Camion, 'id'>) => {
      const { data, error } = await supabase
        .from('camiones')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['camiones'] }),
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
  });
}

// ── useConductores ────────────────────────────────────────────
export function useConductores() {
  return useQuery<Conductor[]>({
    queryKey: ['logistica_conductores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistica_conductores')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return (data ?? []) as Conductor[];
    },
    staleTime: 60000,
  });
}

// ── useAddConductor ───────────────────────────────────────────
export function useAddConductor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Conductor, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('logistica_conductores')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_conductores'] }),
  });
}

// ── useViajes ─────────────────────────────────────────────────
export function useViajes(conductorId?: string) {
  return useQuery<Viaje[]>({
    queryKey: ['logistica_viajes', conductorId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('logistica_viajes')
        .select('*')
        .order('hora_salida', { ascending: false });
      if (conductorId) q = q.eq('conductor_id', conductorId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Viaje[];
    },
    staleTime: 30000,
  });
}

// ── useAddViaje ───────────────────────────────────────────────
export function useAddViaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Viaje, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('logistica_viajes')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_viajes'] }),
  });
}

// ── useMantenimientoCamion ────────────────────────────────────
export function useMantenimientoCamion(camionId?: string) {
  return useQuery<MantenimientoCamion[]>({
    queryKey: ['logistica_mantenimiento', camionId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('logistica_mantenimiento')
        .select('*')
        .order('fecha', { ascending: false });
      if (camionId) q = q.eq('camion_id', camionId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MantenimientoCamion[];
    },
    staleTime: 60000,
  });
}

// ── useAddMantenimientoCamion ─────────────────────────────────
export function useAddMantenimientoCamion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<MantenimientoCamion, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('logistica_mantenimiento')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logistica_mantenimiento'] }),
  });
}

// ── useKPIsLogistica ──────────────────────────────────────────
export function useKPIsLogistica() {
  return useQuery({
    queryKey: ['logistica_kpis'],
    queryFn: async () => {
      const [camiones, conductores, viajes] = await Promise.all([
        supabase.from('camiones').select('activo', { count: 'exact' }),
        supabase.from('logistica_conductores').select('activo', { count: 'exact' }),
        supabase.from('logistica_viajes').select('id', { count: 'exact' }),
      ]);
      const totalCamiones    = camiones.count ?? 0;
      const camionesActivos  = (camiones.data ?? []).filter(c => c.activo).length;
      const totalConductores = conductores.count ?? 0;
      const totalViajes      = viajes.count ?? 0;
      return { totalCamiones, camionesActivos, totalConductores, totalViajes };
    },
    staleTime: 30000,
  });
}
