import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';

// ── useTiposMantenimientoLogistica ────────────────────────────

export function useTiposMantenimientoLogistica() {
  return useQuery<{ id: string; nombre: string }[]>({
    queryKey: ['catalogo_tipos_mantenimiento', 'logistica'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalogo_tipos_mantenimiento')
        .select('id, nombre')
        .eq('modulo', 'logistica')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return (data ?? []) as { id: string; nombre: string }[];
    },
    staleTime: 60000,
  });
}

// ── useKPIsLogistica ──────────────────────────────────────────

export function useKPIsLogistica() {
  return useQuery({
    queryKey: ['logistica_kpis'],
    queryFn: async () => {
      const [camiones, vehiculos, conductores, viajes] = await Promise.all([
        supabase.from('camiones').select('activo'),
        supabase.from('vehiculos_empresa').select('estado_operativo'),
        supabase.from('personal').select('id').eq('categoria', 'conductor_camion').eq('activo', true),
        supabase.from('logistica_viajes').select('id', { count: 'exact', head: true }),
      ]);
      const totalCamiones = (camiones.data ?? []).length;
      const camionesActivos = (camiones.data ?? []).filter((c) => c.activo).length;
      const totalVehiculos = (vehiculos.data ?? []).length;
      const totalConductores = (conductores.data ?? []).length;
      const totalViajes = viajes.count ?? 0;
      return { totalCamiones, camionesActivos, totalVehiculos, totalConductores, totalViajes };
    },
    staleTime: 30000,
  });
}
