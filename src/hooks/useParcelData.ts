import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// 1. Exportamos los submódulos refactorizados con la ruta relativa correcta
export * from './useOperaciones';
export * from './useAnalisis';

// 2. Restauramos los hooks de catálogo esenciales que se habían borrado

export function useParcelas(finca?: string) {
  return useQuery({
    queryKey: ['parcelas', finca],
    queryFn: async () => {
      let q = supabase.from('parcels').select('*').order('parcel_number');
      if (finca) q = q.eq('farm', finca);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60000,
  });
}

export function useCropCatalog() {
  return useQuery({
    queryKey: ['crop_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cultivos_catalogo').select('*').order('nombre_display');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60000,
  });
}

export function useCuadrillas() {
  return useQuery({
    queryKey: ['cuadrillas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cuadrillas').select('*').eq('activa', true).order('nombre');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60000,
  });
}