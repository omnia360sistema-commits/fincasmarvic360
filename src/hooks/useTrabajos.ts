import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

// ── Tipos locales ────────────────────────────────────────────
export type TipoBloque =
  | 'logistica'
  | 'maquinaria_agricola'
  | 'mano_obra_interna'
  | 'mano_obra_externa';

export type EstadoIncidencia = 'abierta' | 'en_proceso' | 'resuelta';

export interface TrabajoRegistro {
  id:                string;
  tipo_bloque:       TipoBloque;
  fecha:             string;
  hora_inicio:       string | null;
  hora_fin:          string | null;
  finca:             string | null;
  parcel_id:         string | null;
  tipo_trabajo:      string;
  num_operarios:     number | null;
  nombres_operarios: string | null;
  foto_url:          string | null;
  notas:             string | null;
  created_at:        string;
  created_by:        string | null;
}

export interface TrabajoIncidencia {
  id:               string;
  urgente:          boolean;
  titulo:           string;
  descripcion:      string | null;
  finca:            string | null;
  parcel_id:        string | null;
  estado:           EstadoIncidencia;
  foto_url:         string | null;
  fecha:            string;
  fecha_resolucion: string | null;
  notas_resolucion: string | null;
  created_at:       string;
  created_by:       string | null;
}

// ── useRegistrosTrabajos ─────────────────────────────────────
export function useRegistrosTrabajos(tipoBloque?: TipoBloque) {
  return useQuery<TrabajoRegistro[]>({
    queryKey: ['trabajos_registro', tipoBloque ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('trabajos_registro')
        .select('*')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });
      if (tipoBloque) q = q.eq('tipo_bloque', tipoBloque);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TrabajoRegistro[];
    },
    staleTime: 30000,
  });
}

// ── useAddTrabajoRegistro ────────────────────────────────────
export function useAddTrabajoRegistro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TrabajoRegistro, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('trabajos_registro')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
    },
  });
}

// ── useIncidencias ────────────────────────────────────────────
export function useIncidencias(soloAbiertas = false) {
  return useQuery<TrabajoIncidencia[]>({
    queryKey: ['trabajos_incidencias', soloAbiertas],
    queryFn: async () => {
      let q = supabase
        .from('trabajos_incidencias')
        .select('*')
        .order('urgente', { ascending: false })
        .order('fecha', { ascending: false });
      if (soloAbiertas) q = q.neq('estado', 'resuelta');
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TrabajoIncidencia[];
    },
    staleTime: 30000,
  });
}

// ── useAddIncidencia ──────────────────────────────────────────
export function useAddIncidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TrabajoIncidencia, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('trabajos_incidencias')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_incidencias'] });
    },
  });
}

// ── useUpdateIncidencia ───────────────────────────────────────
export function useUpdateIncidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      estado,
      notas_resolucion,
      fecha_resolucion,
    }: {
      id: string;
      estado: EstadoIncidencia;
      notas_resolucion?: string;
      fecha_resolucion?: string;
    }) => {
      const { error } = await supabase
        .from('trabajos_incidencias')
        .update({ estado, notas_resolucion, fecha_resolucion })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_incidencias'] });
    },
  });
}

// ── useKPIsTrabajos ───────────────────────────────────────────
export function useKPIsTrabajos() {
  return useQuery({
    queryKey: ['trabajos_kpis'],
    queryFn: async () => {
      const [registros, incidencias] = await Promise.all([
        supabase.from('trabajos_registro').select('tipo_bloque', { count: 'exact' }),
        supabase.from('trabajos_incidencias').select('urgente, estado', { count: 'exact' }),
      ]);
      const totalRegistros = registros.count ?? 0;
      const incAbiertas    = (incidencias.data ?? []).filter(i => i.estado !== 'resuelta').length;
      const incUrgentes    = (incidencias.data ?? []).filter(i => i.urgente && i.estado !== 'resuelta').length;
      return { totalRegistros, incAbiertas, incUrgentes };
    },
    staleTime: 30000,
  });
}
