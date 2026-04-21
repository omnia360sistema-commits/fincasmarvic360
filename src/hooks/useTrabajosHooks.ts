import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { logLiaEvento } from '@/utils/liaLogger';
import { toast } from '@/hooks/use-toast';
import { useCreatedBy } from './useCreatedBy';
import type {
  CierreJornada,
  EstadoCampana,
  EstadoPlanificacion,
  PlanificacionCampana,
  Prioridad,
  TipoBloque,
  TrabajoIncidencia,
  TrabajoRegistro,
  TrabajoRegistroDbRow,
} from './useTrabajosTypes';
import { toTrabajoRegistroPlanificado } from './useTrabajosTypes';

// ── useRegistrosTrabajos ─────────────────────────────────────
export function useRegistrosTrabajos(tipoBloque?: TipoBloque) {
  return useQuery({
    queryKey: ['trabajos_registro', tipoBloque ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('trabajos_registro')
        .select('*, maquinaria_tractores(matricula, marca), maquinaria_aperos(tipo, descripcion)')
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });
      if (tipoBloque) q = q.eq('tipo_bloque', tipoBloque);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30000,
  });
}

// ── useAddTrabajoRegistro ────────────────────────────────────
export function useAddTrabajoRegistro() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TrabajoRegistro, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('trabajos_registro')
        .insert([{ ...payload, created_at: new Date().toISOString(), created_by: createdBy }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, payload) => {
      logLiaEvento('planificacion', 'trabajo_creado', {
        tipo_bloque: payload.tipo_bloque,
        finca: payload.finca,
        tipo_trabajo: payload.tipo_trabajo,
        num_operarios: payload.num_operarios,
      });
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TrabajoIncidencia, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('trabajos_incidencias')
        .insert([{ ...payload, created_at: new Date().toISOString(), created_by: createdBy }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_incidencias'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
      ...rest
    }: {
      id: string;
      estado: EstadoIncidencia;
      notas_resolucion?: string;
      fecha_resolucion?: string;
      [key: string]: unknown;
    }) => {
      const { error } = await supabase
        .from('trabajos_incidencias')
        .update({ estado, notas_resolucion, fecha_resolucion, ...rest })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_incidencias'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useDeleteIncidencia ───────────────────────────────────────
export function useDeleteIncidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trabajos_incidencias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_incidencias'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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

// ════════════════════════════════════════════════════════════
// HOOKS NUEVOS — PLANIFICACIÓN
// ════════════════════════════════════════════════════════════

// ── usePlanificacionDia ───────────────────────────────────────
export function usePlanificacionDia(fecha: string) {
  return useQuery({
    queryKey: ['planificacion_dia', fecha],
    queryFn: async (): Promise<TrabajoRegistroPlanificado[]> => {
      const { data, error } = await supabase
        .from('trabajos_registro')
        .select('*, maquinaria_tractores(matricula, marca), maquinaria_aperos(tipo, descripcion)')
        .eq('fecha_planificada', fecha)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const orden: Record<string, number> = { alta: 1, media: 2, baja: 3 };
      return (data ?? [])
        .sort(
          (a, b) => (orden[a.prioridad ?? 'media'] ?? 2) - (orden[b.prioridad ?? 'media'] ?? 2)
        )
        .map((row) => toTrabajoRegistroPlanificado(row as TrabajoRegistroDbRow));
    },
    staleTime: 30000,
    enabled: !!fecha,
  });
}

// ── useAddTrabajoPlanificado ──────────────────────────────────
export function useAddTrabajoPlanificado() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TrabajoRegistro, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('trabajos_registro')
        .insert([{ ...payload, created_at: new Date().toISOString(), created_by: createdBy }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
      qc.invalidateQueries({ queryKey: ['planificacion_dia'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdateTrabajoPlanificado ───────────────────────────────
export function useUpdateTrabajoPlanificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<TrabajoRegistro> & { id: string }) => {
      const { error } = await supabase
        .from('trabajos_registro')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
      qc.invalidateQueries({ queryKey: ['planificacion_dia'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useDeleteTrabajo ──────────────────────────────────────────
export function useDeleteTrabajo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trabajos_registro').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
      qc.invalidateQueries({ queryKey: ['planificacion_dia'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdateEstadoPlanificacion ──────────────────────────────
export function useUpdateEstadoPlanificacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado_planificacion }: { id: string; estado_planificacion: EstadoPlanificacion }) => {
      const { error } = await supabase
        .from('trabajos_registro')
        .update({ estado_planificacion })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
      qc.invalidateQueries({ queryKey: ['planificacion_dia'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── usePlanificacionCampana ───────────────────────────────────
export function usePlanificacionCampana() {
  return useQuery<PlanificacionCampana[]>({
    queryKey: ['planificacion_campana'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planificacion_campana')
        .select('*')
        .order('fecha_prevista_plantacion', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as PlanificacionCampana[];
    },
    staleTime: 30000,
  });
}

// ── useAddPlanificacionCampana ────────────────────────────────
export function useAddPlanificacionCampana() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<PlanificacionCampana, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('planificacion_campana')
        .insert([{ ...payload, created_at: new Date().toISOString(), created_by: createdBy }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planificacion_campana'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdatePlanificacionCampana ─────────────────────────────
export function useUpdatePlanificacionCampana() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PlanificacionCampana> & { id: string }) => {
      const { error } = await supabase
        .from('planificacion_campana')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planificacion_campana'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useDeletePlanificacionCampana ─────────────────────────────
export function useDeletePlanificacionCampana() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('planificacion_campana')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planificacion_campana'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useCierresJornada ─────────────────────────────────────────
export function useCierresJornada() {
  return useQuery<CierreJornada[]>({
    queryKey: ['cierres_jornada'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cierres_jornada')
        .select('*')
        .order('fecha', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CierreJornada[];
    },
    staleTime: 60000,
  });
}

// ── useAddCierreJornada ───────────────────────────────────────
export function useAddCierreJornada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CierreJornada, 'id' | 'cerrado_at'>) => {
      const { data, error } = await supabase
        .from('cierres_jornada')
        .insert([{ ...payload, cerrado_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cierres_jornada'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// ── useUpdateEstadoTrabajo ──────────────────────────────────
export function useUpdateEstadoTrabajo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado_planificacion, prioridad }: { id: string; estado_planificacion: EstadoPlanificacion; prioridad: Prioridad }) => {
      const { error } = await supabase
        .from('trabajos_registro')
        .update({ estado_planificacion, prioridad })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
      qc.invalidateQueries({ queryKey: ['planificacion_dia'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

/*
================================================
29. CERRAR JORNADA — lógica completa de arrastre
================================================
*/

export function useCerrarJornada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fecha: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUser = user?.email || 'sistema';

      // Llamada a la función RPC atómica en la base de datos
      const { data, error } = await supabase.rpc('cerrar_jornada_atomica', {
        p_fecha: fecha,
        p_usuario: currentUser,
      });

      if (error) {
        throw error;
      }
      
      // La función RPC debe devolver un objeto con la misma estructura que el anterior
      return data;
    },
    onSuccess: () => {
      // Invalidar las queries relevantes para que la UI se actualice
      qc.invalidateQueries({ queryKey: ['planificacion_dia'] });
      qc.invalidateQueries({ queryKey: ['cierres_jornada'] });
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
      qc.invalidateQueries({ queryKey: ['trabajos_kpis'] });
      qc.invalidateQueries({ queryKey: ['trabajos_incidencias'] });
    },
    onError: (error: Error) => {
      console.error('[Hook Error]:', error.message);
      console.error('[Hook Error]: Cierre de jornada fallido', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
