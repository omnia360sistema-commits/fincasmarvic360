import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

function serializarJsonColumna<T>(value: T): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
import { toast } from '@/hooks/use-toast';
import { useCreatedBy } from './useCreatedBy';
import { getAccionCierre, puedeAvanzarEstado } from '@/constants/cierreTrabajoMap';
import type { AccionCierre } from '@/constants/cierreTrabajoMap';
import { buildNotasConsumoInventarioPorTrabajo, calcularCosteTrabajo } from '@/utils/costeTrabajo';
import { TARIFA_EUR_HORA_OPERARIO, TARIFA_EUR_HORA_TRACTOR } from '@/constants/tarifasCosteTrabajo';

const SNAPSHOT_VERSION = 1;

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

      const updatePayload: TablesUpdate<'trabajos_registro'> = {
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

      // 5. Snapshot de coste (no revierte el cierre si falla)
      let snapshotGuardado = false;
      let snapshotError: string | null = null;
      try {
        const coste = await calcularCosteTrabajo(datos.trabajoId, {
          crop: datos.datosCosecha?.crop ?? datos.datosPlantacion?.crop ?? null,
        });
        if (coste) {
          const produccionKg = coste.produccionKgTotal;
          const costeTotalCalc = coste.costeTotal;
          const costePorKg =
            produccionKg != null &&
            produccionKg > 0 &&
            Number.isFinite(costeTotalCalc)
              ? Number((costeTotalCalc / produccionKg).toFixed(4))
              : null;

          const snapshotPayload: TablesInsert<'trabajos_coste_snapshot'> = {
            trabajo_id: datos.trabajoId,
            version_calculo: SNAPSHOT_VERSION,
            calculado_por: createdBy,
            calculado_en: new Date().toISOString(),
            horas: coste.horas,
            num_operarios: coste.numOperarios,
            tractor_id: coste.tractorId,
            apero_id: coste.aperoId,
            tarifa_tractor_eur_h: TARIFA_EUR_HORA_TRACTOR,
            tarifa_operario_eur_h: TARIFA_EUR_HORA_OPERARIO,
            coste_materiales: Number(coste.costeMateriales.toFixed(2)),
            coste_maquinaria: Number(coste.costeMaquinaria.toFixed(2)),
            coste_mano_obra: Number(coste.costeManoObra.toFixed(2)),
            produccion_kg_total: coste.produccionKgTotal,
            coste_por_kg: costePorKg,
            lineas_materiales: serializarJsonColumna(coste.lineasMateriales),
            produccion_vinculada: serializarJsonColumna(coste.produccionVinculada),
          };

          const { error: errSnap } = await supabase
            .from('trabajos_coste_snapshot')
            .upsert(snapshotPayload, { onConflict: 'trabajo_id' });

          if (errSnap) {
            snapshotError = errSnap.message;
          } else {
            snapshotGuardado = true;
          }
        }
      } catch (e: unknown) {
        snapshotError = e instanceof Error ? e.message : String(e);
      }

      return { ...resultado, snapshotGuardado, snapshotError };
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
      if (resultado.snapshotGuardado) msgs.push('Coste registrado');

      toast({ title: msgs[0], description: msgs.slice(1).join(' · ') || undefined });

      if (resultado.snapshotError) {
        toast({
          title: 'Trabajo cerrado, pero el snapshot de coste falló',
          description: resultado.snapshotError,
          variant: 'destructive',
        });
      } else if (resultado.snapshotGuardado) {
        qc.invalidateQueries({ queryKey: ['trabajos_coste_snapshot'] });
      }
    },

    onError: (error: Error) => {
      console.error('[CerrarTrabajo]:', error.message);
      toast({ title: 'Error al cerrar trabajo', description: error.message, variant: 'destructive' });
    },
  });
}
