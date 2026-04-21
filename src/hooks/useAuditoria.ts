import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type TablaOrigenAudit = 'trabajos_registro' | 'inventario_movimientos' | 'logistica_viajes' | 'personal';

export function useDeleteAuditOrigen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tabla, id }: { tabla: TablaOrigenAudit; id: string }) => {
      const { error } = await supabase.from(tabla).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audit_trail'] });
      toast({ title: 'Registro eliminado' });
    },
    onError: (err: Error) =>
      toast({ title: 'Error al eliminar', description: err.message, variant: 'destructive' }),
  });
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  modulo: string;
  usuario: string;
  accion: string;
  detalle: string;
  url?: string;
}

export function useAuditTrail({ fechaDesde, fechaHasta, modulo, usuario }: {
  fechaDesde?: string;
  fechaHasta?: string;
  modulo?: string;
  usuario?: string;
}) {
  return useQuery<AuditEntry[]>({
    queryKey: ['audit_trail', fechaDesde, fechaHasta, modulo, usuario],
    queryFn: async () => {
      const desde = fechaDesde ? `${fechaDesde}T00:00:00` : new Date(0).toISOString();
      const hasta = fechaHasta ? `${fechaHasta}T23:59:59` : new Date().toISOString();

      const queries = [
        // Trabajos
        supabase.from('trabajos_registro').select('id, created_at, created_by, tipo_trabajo, finca').gte('created_at', desde).lte('created_at', hasta),
        // Inventario
        supabase.from('inventario_movimientos').select('id, created_at, created_by, cantidad, unidad, producto_id').gte('created_at', desde).lte('created_at', hasta),
        // Logística
        supabase.from('logistica_viajes').select('id, created_at, created_by, trabajo_realizado, destino').gte('created_at', desde).lte('created_at', hasta),
        // Personal
        supabase.from('personal').select('id, created_at, created_by, nombre, categoria').gte('created_at', desde).lte('created_at', hasta),
      ];

      const [trabajosRes, inventarioRes, logisticaRes, personalRes] = await Promise.all(queries);

      const entries: AuditEntry[] = [];

      (trabajosRes.data || []).forEach((t: any) => entries.push({
        id: `trab-${t.id}`,
        timestamp: t.created_at,
        modulo: 'Trabajos',
        usuario: t.created_by || 'Sistema',
        accion: 'Creación de Trabajo',
        detalle: `${t.tipo_trabajo} en ${t.finca || 'finca no especificada'}`,
        url: '/trabajos'
      }));

      (inventarioRes.data || []).forEach((i: any) => entries.push({
        id: `inv-${i.id}`,
        timestamp: i.created_at,
        modulo: 'Inventario',
        usuario: i.created_by || 'Sistema',
        accion: 'Movimiento de Stock',
        detalle: `Movimiento de ${i.cantidad} ${i.unidad} de producto ${i.producto_id || ''}`,
        url: '/inventario'
      }));

      (logisticaRes.data || []).forEach((l: any) => entries.push({
        id: `log-${l.id}`,
        timestamp: l.created_at,
        modulo: 'Logística',
        usuario: l.created_by || 'Sistema',
        accion: 'Registro de Viaje',
        detalle: `${l.trabajo_realizado} a ${l.destino || 'destino no especificado'}`,
        url: '/logistica'
      }));
      
      (personalRes.data || []).forEach((p: any) => entries.push({
        id: `pers-${p.id}`,
        timestamp: p.created_at,
        modulo: 'Personal',
        usuario: p.created_by || 'Sistema',
        accion: 'Alta de Personal',
        detalle: `Nuevo ${p.categoria}: ${p.nombre}`,
        url: '/personal'
      }));

      // Filtrar y ordenar
      let filtered = entries
        .filter(e => !modulo || e.modulo.toLowerCase() === modulo.toLowerCase())
        .filter(e => !usuario || e.usuario.toLowerCase().includes(usuario.toLowerCase()));
      
      return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    staleTime: 60000,
  });
}