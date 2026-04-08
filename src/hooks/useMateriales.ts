import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

export type MaterialStockRow = {
  id: string;
  cantidad: number;
  unidad: string;
  descripcion: string | null;
  precio_unitario: number | null;
  ubicacion_id: string;
  categoria_id: string;
  producto_id: string | null;
  inventario_productos_catalogo: { nombre: string; precio_unitario: number | null } | null;
  inventario_ubicaciones: { nombre: string } | null;
};

export function useMaterialesStock(categoriaSlug: string) {
  return useQuery({
    queryKey: ['materiales_stock', categoriaSlug],
    queryFn: async () => {
      // 1. Buscamos el ID de la categoría usando el slug (ej: 'fitosanitarios', 'riego', 'plasticos')
      const { data: categoria, error: catError } = await supabase
        .from('inventario_categorias')
        .select('id')
        .eq('slug', categoriaSlug)
        .maybeSingle();

      if (catError) throw catError;
      // Si la categoría no existe en la BD aún, retornamos vacío
      if (!categoria) return [];

      // 2. Traemos todos los registros de stock de esa categoría con sus relaciones
      const { data, error } = await supabase
        .from('inventario_registros')
        .select(`
          *,
          inventario_productos_catalogo ( nombre, precio_unitario ),
          inventario_ubicaciones ( nombre )
        `)
        .eq('categoria_id', categoria.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const latestStock = new Map<string, MaterialStockRow>();
      for (const row of (data || []) as unknown as MaterialStockRow[]) {
        const key = `${row.ubicacion_id}_${row.producto_id || row.descripcion}`;
        if (!latestStock.has(key)) {
          latestStock.set(key, row);
        }
      }
      return Array.from(latestStock.values());
    },
    // Solo ejecutamos la query si nos pasan un slug válido
    enabled: !!categoriaSlug,
    staleTime: 30000,
  });
}

export function useAddMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: TablesInsert<'inventario_registros'>) => {
      const { data, error } = await supabase
        .from('inventario_registros')
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiales_stock'] });
      toast({ title: 'Material registrado correctamente' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error al registrar', description: err.message, variant: 'destructive' });
    }
  });
}