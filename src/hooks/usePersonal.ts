import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type CategoriaPersonal =
  | 'operario_campo'
  | 'encargado'
  | 'conductor_maquinaria'
  | 'conductor_camion';

export const CATEGORIA_LABELS: Record<CategoriaPersonal, string> = {
  operario_campo:      'Operario de campo',
  encargado:           'Encargado',
  conductor_maquinaria:'Conductor de maquinaria',
  conductor_camion:    'Conductor de camión',
};

export const CATEGORIA_COLORS: Record<CategoriaPersonal, string> = {
  operario_campo:      '#22c55e',
  encargado:           '#38bdf8',
  conductor_maquinaria:'#fb923c',
  conductor_camion:    '#a78bfa',
};

export type TipoExterno = 'destajo' | 'jornal_servicio';

export const TIPO_EXTERNO_LABELS: Record<TipoExterno, string> = {
  destajo:         'A destajo',
  jornal_servicio: 'A jornal / servicio',
};

export interface Personal {
  id:         string;
  nombre:     string;
  dni:        string | null;
  telefono:   string | null;
  categoria:  CategoriaPersonal;
  activo:     boolean;
  foto_url:   string | null;
  qr_code:    string;
  notas:      string | null;
  created_at: string;
  created_by: string | null;
}

export interface PersonalExterno {
  id:                string;
  nombre_empresa:    string;
  nif:               string | null;
  telefono_contacto: string | null;
  tipo:              TipoExterno;
  activo:            boolean;
  qr_code:           string;
  notas:             string | null;
  created_at:        string;
  created_by:        string | null;
}

// ── Hooks personal fijo ──────────────────────────────────────────────────────

export function usePersonal(categoria?: CategoriaPersonal) {
  return useQuery({
    queryKey: ['personal', categoria ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('personal')
        .select('*')
        .order('nombre', { ascending: true });
      if (categoria) q = q.eq('categoria', categoria);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Personal[];
    },
    staleTime: 60000,
  });
}

export function useAddPersonal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      nombre:    string;
      dni?:      string | null;
      telefono?: string | null;
      categoria: CategoriaPersonal;
      activo?:   boolean;
      foto_url?: string | null;
      notas?:    string | null;
    }) => {
      const { error } = await supabase.from('personal').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal'] }),
  });
}

export function useUpdatePersonal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Personal> & { id: string }) => {
      const { error } = await supabase.from('personal').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal'] }),
  });
}

// ── Hooks personal externo ───────────────────────────────────────────────────

export function usePersonalExterno() {
  return useQuery({
    queryKey: ['personal_externo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_externo')
        .select('*')
        .order('nombre_empresa', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PersonalExterno[];
    },
    staleTime: 60000,
  });
}

export function useAddPersonalExterno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      nombre_empresa:     string;
      nif?:               string | null;
      telefono_contacto?: string | null;
      tipo:               TipoExterno;
      activo?:            boolean;
      notas?:             string | null;
    }) => {
      const { error } = await supabase.from('personal_externo').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_externo'] }),
  });
}

export function useUpdatePersonalExterno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PersonalExterno> & { id: string }) => {
      const { error } = await supabase.from('personal_externo').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal_externo'] }),
  });
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

export function useKPIsPersonal() {
  return useQuery({
    queryKey: ['personal', 'kpis'],
    queryFn: async () => {
      const [{ data: fijo }, { data: externo }] = await Promise.all([
        supabase.from('personal').select('categoria, activo'),
        supabase.from('personal_externo').select('tipo, activo'),
      ]);

      const activos = (fijo ?? []).filter(p => p.activo).length;
      const externos = (externo ?? []).filter(p => p.activo).length;
      const total = activos + externos;

      const porCategoria = (fijo ?? []).reduce<Record<string, number>>((acc, p) => {
        if (p.activo) acc[p.categoria] = (acc[p.categoria] ?? 0) + 1;
        return acc;
      }, {});

      return { total, activos, externos, porCategoria };
    },
    staleTime: 60000,
  });
}
