import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

// ── Tipos locales ────────────────────────────────────────────
export interface Tractor {
  id:                          string;
  matricula:                   string;
  marca:                       string | null;
  modelo:                      string | null;
  anio:                        number | null;
  horas_motor:                 number | null;
  ficha_tecnica:               string | null;
  activo:                      boolean;
  foto_url:                    string | null;
  notas:                       string | null;
  created_at:                  string;
  created_by:                  string | null;
  fecha_proxima_itv:           string | null;
  fecha_proxima_revision:      string | null;
  horas_proximo_mantenimiento: number | null;
  gps_info:                    string | null;
}

export interface Apero {
  id:          string;
  tipo:        string;
  descripcion: string | null;
  tractor_id:  string | null;
  activo:      boolean;
  foto_url:    string | null;
  notas:       string | null;
  created_at:  string;
  created_by:  string | null;
}

export interface UsoMaquinaria {
  id:               string;
  tractor_id:       string | null;
  apero_id:         string | null;
  tractorista:      string | null;
  personal_id:      string | null;
  finca:            string | null;
  parcel_id:        string | null;
  tipo_trabajo:     string | null;
  fecha:            string;
  hora_inicio:      string | null;
  hora_fin:         string | null;
  horas_trabajadas: number | null;
  gasolina_litros:  number | null;
  foto_url:         string | null;
  notas:            string | null;
  created_at:       string;
  created_by:       string | null;
}

export interface MantenimientoTractor {
  id:                     string;
  tractor_id:             string | null;
  tipo:                   string;
  descripcion:            string | null;
  fecha:                  string;
  horas_motor_al_momento: number | null;
  coste_euros:            number | null;
  proveedor:              string | null;
  foto_url:               string | null;
  foto_url_2:             string | null;
  created_at:             string;
  created_by:             string | null;
}

// ── useTractores ──────────────────────────────────────────────
export function useTractores() {
  return useQuery<Tractor[]>({
    queryKey: ['maquinaria_tractores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maquinaria_tractores')
        .select('*')
        .order('matricula');
      if (error) throw error;
      return (data ?? []) as Tractor[];
    },
    staleTime: 60000,
  });
}

// ── useAddTractor ─────────────────────────────────────────────
export function useAddTractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Tractor, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('maquinaria_tractores')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maquinaria_tractores'] }),
  });
}

// ── useUpdateTractor ──────────────────────────────────────────
export function useUpdateTractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Tractor> & { id: string }) => {
      const { error } = await supabase
        .from('maquinaria_tractores')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maquinaria_tractores'] }),
  });
}

// ── useAperos ─────────────────────────────────────────────────
export function useAperos(tractorId?: string) {
  return useQuery<Apero[]>({
    queryKey: ['maquinaria_aperos', tractorId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('maquinaria_aperos')
        .select('*')
        .order('tipo');
      if (tractorId) q = q.eq('tractor_id', tractorId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Apero[];
    },
    staleTime: 60000,
  });
}

// ── useAddApero ───────────────────────────────────────────────
export function useAddApero() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Apero, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('maquinaria_aperos')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maquinaria_aperos'] }),
  });
}

// ── useUsosMaquinaria ─────────────────────────────────────────
export function useUsosMaquinaria(tractorId?: string) {
  return useQuery<UsoMaquinaria[]>({
    queryKey: ['maquinaria_uso', tractorId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('maquinaria_uso')
        .select('*')
        .order('fecha', { ascending: false });
      if (tractorId) q = q.eq('tractor_id', tractorId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as UsoMaquinaria[];
    },
    staleTime: 30000,
  });
}

// ── useAddUsoMaquinaria ───────────────────────────────────────
export function useAddUsoMaquinaria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<UsoMaquinaria, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('maquinaria_uso')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maquinaria_uso'] }),
  });
}

// ── useMantenimientoTractor ───────────────────────────────────
export function useMantenimientoTractor(tractorId?: string) {
  return useQuery<MantenimientoTractor[]>({
    queryKey: ['maquinaria_mantenimiento', tractorId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('maquinaria_mantenimiento')
        .select('*')
        .order('fecha', { ascending: false });
      if (tractorId) q = q.eq('tractor_id', tractorId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MantenimientoTractor[];
    },
    staleTime: 60000,
  });
}

// ── useAddMantenimientoTractor ────────────────────────────────
export function useAddMantenimientoTractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<MantenimientoTractor, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('maquinaria_mantenimiento')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maquinaria_mantenimiento'] }),
  });
}

// ── useKPIsMaquinaria ─────────────────────────────────────────
export function useKPIsMaquinaria() {
  return useQuery({
    queryKey: ['maquinaria_kpis'],
    queryFn: async () => {
      const [tractores, aperos, usos] = await Promise.all([
        supabase.from('maquinaria_tractores').select('activo, horas_motor'),
        supabase.from('maquinaria_aperos').select('activo'),
        supabase.from('maquinaria_uso').select('horas_trabajadas, gasolina_litros'),
      ]);
      const tractoresActivos = (tractores.data ?? []).filter(t => t.activo).length;
      const aperosActivos    = (aperos.data ?? []).filter(a => a.activo).length;
      const totalHoras       = (usos.data ?? []).reduce((s, u) => s + (u.horas_trabajadas ?? 0), 0);
      const totalGasolina    = (usos.data ?? []).reduce((s, u) => s + (u.gasolina_litros ?? 0), 0);
      return { tractoresActivos, aperosActivos, totalHoras: totalHoras.toFixed(1), totalGasolina: totalGasolina.toFixed(1) };
    },
    staleTime: 30000,
  });
}
