import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCreatedBy } from './useCreatedBy';
import { getAccionCierre, puedeAvanzarEstado } from '@/constants/cierreTrabajoMap';
import type { AccionCierre } from '@/constants/cierreTrabajoMap';
import { buildNotasConsumoInventarioPorTrabajo } from '@/utils/costeTrabajo';

export interface DatosCierreTrabajo {
  trabajoId: string;
  tipoTrabajo: string;
  parcelId: string | null;
  finca: string | null;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  notas: string | null;
  fotoUrl: string | null;
  datosCosecha?: {
    crop: string;
    productionKg: number;
    date: string;
  };
  datosPlantacion?: {
    crop: string;
    variedad: string;
    date: string;
  };
  materialesConsumidos?: {
    nombre: string;
    cantidad: number;
    unidad: string;
    productoId: string | null;
    categoriaId: string | null;
    ubicacionOrigenId: string | null;
  }[];
}

export function useCerrarTrabajoCompleto() {
  const createdBy = useCreatedBy();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (datos: DatosCierreTrabajo) => {
      const { accion, estadoParcela } = getAccionCierre(datos.tipoTrabajo);
      const resultado: { accion: AccionCierre; harvestId?: string; plantingId?: string; movimientos: number; estadoActualizado: boolean } = {
        accion,
        movimientos: 0,
        estadoActualizado: false,
      };

      // 1. Inserts primero (antes de marcar ejecutado)

      if (accion === 'cosecha' && datos.datosCosecha && datos.parcelId) {
        const { crop, productionKg, date } = datos.datosCosecha;

        const { data: existente } = await supabase
          .from('harvests')
          .select('id')
          .eq('parcel_id', datos.parcelId)
          .eq('crop', crop)
          .eq('date', date)
          .maybeSingle();

        if (!existente) {
          const { data, error } = await supabase
            .from('harvests')
            .insert({
              parcel_id: datos.parcelId,
              crop,
              date,
              production_kg: productionKg,
            })
            .select('id')
            .single();
          if (error) throw new Error(`Error registrando cosecha: ${error.message}`);
          resultado.harvestId = data.id;
        }
      }

      if (accion === 'plantacion' && datos.datosPlantacion && datos.parcelId) {
        const { crop, variedad, date } = datos.datosPlantacion;

        const { data: existente } = await supabase
          .from('plantings')
          .select('id')
          .eq('parcel_id', datos.parcelId)
          .eq('crop', crop)
          .eq('variedad', variedad)
          .eq('date', date)
          .maybeSingle();

        if (!existente) {
          const { data, error } = await supabase
            .from('plantings')
            .insert({
              parcel_id: datos.parcelId,
              crop,
              variedad,
              date,
            })
            .select('id')
            .single();
          if (error) throw new Error(`Error registrando plantación: ${error.message}`);
          resultado.plantingId = data.id;
        }
      }

      // 2. Actualizar estado de parcela (solo si avanza)

      if (estadoParcela && datos.parcelId) {
        const { data: parcela } = await supabase
          .from('parcels')
          .select('status')
          .eq('parcel_id', datos.parcelId)
          .single();

        if (puedeAvanzarEstado(parcela?.status ?? null, estadoParcela)) {
          const { error } = await supabase
            .from('parcels')
            .update({ status: estadoParcela })
            .eq('parcel_id', datos.parcelId);
          if (error) throw new Error(`Error actualizando parcela: ${error.message}`);
          resultado.estadoActualizado = true;
        }
      }

      // 3. Registrar consumo de materiales via inventario_movimientos

      if (datos.materialesConsumidos && datos.materialesConsumidos.length > 0) {
        for (const mat of datos.materialesConsumidos) {
          if (!mat.productoId) continue;
          if (mat.cantidad <= 0) continue;

          const { error } = await supabase
            .from('inventario_movimientos')
            .insert({
              producto_id: mat.productoId,
              categoria_id: mat.categoriaId,
              cantidad: mat.cantidad,
              unidad: mat.unidad,
              ubicacion_origen_id: mat.ubicacionOrigenId,
              ubicacion_destino_id: null,
              notas: buildNotasConsumoInventarioPorTrabajo(
                datos.trabajoId,
                datos.tipoTrabajo,
                datos.finca,
                datos.parcelId,
                datos.fecha
              ),
              responsable: createdBy,
              created_by: createdBy,
            });
          if (!error) resultado.movimientos++;
        }
      }

      // 4. Marcar trabajo como ejecutado (al final, cuando todo lo anterior OK)

      const updatePayload: Record<string, unknown> = {
        estado_planificacion: 'ejecutado',
      };
      if (datos.horaInicio) updatePayload.hora_inicio = datos.horaInicio;
      if (datos.horaFin) updatePayload.hora_fin = datos.horaFin;
      if (datos.notas) updatePayload.notas = datos.notas;
      if (datos.fotoUrl) updatePayload.foto_url = datos.fotoUrl;

      const { error: errTrabajo } = await supabase
        .from('trabajos_registro')
        .update(updatePayload)
        .eq('id', datos.trabajoId);
      if (errTrabajo) throw new Error(`Error cerrando trabajo: ${errTrabajo.message}`);

      return resultado;
    },

    onSuccess: (resultado) => {
      qc.invalidateQueries({ queryKey: ['trabajos_registro'] });
      qc.invalidateQueries({ queryKey: ['planificacion_dia'] });
      qc.invalidateQueries({ queryKey: ['trabajos_kpis'] });
      qc.invalidateQueries({ queryKey: ['farm_parcel_statuses'] });

      if (resultado.harvestId) {
        qc.invalidateQueries({ queryKey: ['harvests'] });
      }
      if (resultado.plantingId) {
        qc.invalidateQueries({ queryKey: ['plantings'] });
        qc.invalidateQueries({ queryKey: ['parcel_production'] });
      }
      if (resultado.movimientos > 0) {
        qc.invalidateQueries({ queryKey: ['inventario_movimientos'] });
        qc.invalidateQueries({ queryKey: ['inventario_registros'] });
        qc.invalidateQueries({ queryKey: ['materiales_stock'] });
      }

      const msgs: string[] = ['Trabajo marcado como ejecutado'];
      if (resultado.harvestId) msgs.push('Cosecha registrada');
      if (resultado.plantingId) msgs.push('Plantación registrada');
      if (resultado.estadoActualizado) msgs.push('Estado de parcela actualizado');
      if (resultado.movimientos > 0) msgs.push(`${resultado.movimientos} material(es) consumido(s)`);

      toast({ title: msgs[0], description: msgs.slice(1).join(' · ') || undefined });
    },

    onError: (error: Error) => {
      console.error('[CerrarTrabajo]:', error.message);
      toast({ title: 'Error al cerrar trabajo', description: error.message, variant: 'destructive' });
    },
  });
}
