import { supabase } from '@/integrations/supabase/client';
import { TARIFA_EUR_HORA_OPERARIO, TARIFA_EUR_HORA_TRACTOR } from '@/constants/tarifasCosteTrabajo';

/** Token en inventario_movimientos.notas para atribuir consumos a un trabajo */
export function referenciaTrabajoEnNotas(trabajoId: string): string {
  return `trabajo:${trabajoId}`;
}

export function notasMencionanTrabajo(notas: string | null | undefined, trabajoId: string): boolean {
  if (!notas) return false;
  return notas.includes(referenciaTrabajoEnNotas(trabajoId));
}

/** Texto de notas al registrar consumo desde cierre de trabajo (incluye referencia obligatoria). */
export function buildNotasConsumoInventarioPorTrabajo(
  trabajoId: string,
  tipoTrabajo: string,
  finca: string | null,
  parcelId: string | null,
  fecha: string
): string {
  const ref = referenciaTrabajoEnNotas(trabajoId);
  const contexto = `Consumo ${tipoTrabajo} — ${finca ?? ''} ${parcelId ?? ''} ${fecha}`.trim();
  return `${ref} | ${contexto}`;
}

/** Horas efectivas entre dos horas "HH:MM" o "H:MM" el mismo día (sin cruce de medianoche). */
export function horasEntreMarcas(horaInicio: string | null, horaFin: string | null): number {
  if (!horaInicio || !horaFin) return 0;
  const parse = (h: string) => {
    const [hh, mm] = h.trim().split(':').map((x) => Number(x));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  };
  const a = parse(horaInicio);
  const b = parse(horaFin);
  if (a === null || b === null) return 0;
  const mins = b - a;
  if (mins <= 0) return 0;
  return mins / 60;
}

function normalizeCrop(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface LineaMaterialCoste {
  movimientoId: string;
  productoId: string | null;
  nombreProducto: string | null;
  cantidad: number;
  unidad: string | null;
  precioUnitario: number;
  subtotal: number;
}

export interface FilaProduccionVinculada {
  harvestId: string;
  crop: string | null;
  productionKg: number | null;
}

export interface ResultadoCosteTrabajo {
  trabajoId: string;
  horas: number;
  tractorAsignado: boolean;
  tractorId: string | null;
  aperoId: string | null;
  numOperarios: number;
  costeMateriales: number;
  costeMaquinaria: number;
  costeManoObra: number;
  costeTotal: number;
  lineasMateriales: LineaMaterialCoste[];
  /** Cosechas en parcela+fecha (+ cultivo si se pasó en opciones), sin FK al trabajo */
  produccionVinculada: FilaProduccionVinculada[];
  produccionKgTotal: number | null;
}

/**
 * Coste = materiales + (horas × tarifa tractor si hay tractor) + (horas × operarios × tarifa operario).
 * Materiales: suma de movimientos cuyas notas contienen `trabajo:<id>` × precio_unitario del catálogo.
 */
export async function calcularCosteTrabajo(
  trabajoId: string,
  opciones?: { crop?: string | null }
): Promise<ResultadoCosteTrabajo | null> {
  const { data: trabajo, error: errT } = await supabase
    .from('trabajos_registro')
    .select(
      'id, hora_inicio, hora_fin, tractor_id, apero_id, num_operarios, parcel_id, fecha, tipo_trabajo'
    )
    .eq('id', trabajoId)
    .maybeSingle();

  if (errT) throw new Error(errT.message);
  if (!trabajo) return null;

  const horas = horasEntreMarcas(trabajo.hora_inicio, trabajo.hora_fin);
  const tractorAsignado = Boolean(trabajo.tractor_id);
  const numOperarios = Math.max(0, trabajo.num_operarios ?? 0);

  const costeMaquinaria = tractorAsignado && horas > 0 ? horas * TARIFA_EUR_HORA_TRACTOR : 0;
  const costeManoObra = horas > 0 && numOperarios > 0 ? horas * numOperarios * TARIFA_EUR_HORA_OPERARIO : 0;

  const ref = referenciaTrabajoEnNotas(trabajoId);
  const { data: movsRaw, error: errM } = await supabase
    .from('inventario_movimientos')
    .select(
      `
      id,
      cantidad,
      unidad,
      producto_id,
      notas,
      inventario_productos_catalogo ( nombre, precio_unitario )
    `
    )
    .ilike('notas', `%${ref}%`);

  if (errM) throw new Error(errM.message);

  const lineasMateriales: LineaMaterialCoste[] = [];
  let costeMateriales = 0;

  for (const row of movsRaw ?? []) {
    if (!notasMencionanTrabajo(row.notas, trabajoId)) continue;
    const cant = Number(row.cantidad ?? 0);
    if (cant <= 0) continue;
    const cat = row.inventario_productos_catalogo as
      | { nombre?: string; precio_unitario?: number | null }
      | null
      | undefined;
    const precio = Number(cat?.precio_unitario);
    const nombreProducto = cat?.nombre ?? null;
    const pu = Number.isFinite(precio) && precio >= 0 ? precio : 0;
    const subtotal = cant * pu;
    costeMateriales += subtotal;
    lineasMateriales.push({
      movimientoId: row.id,
      productoId: row.producto_id,
      nombreProducto,
      cantidad: cant,
      unidad: (row as { unidad?: string | null }).unidad ?? null,
      precioUnitario: pu,
      subtotal,
    });
  }

  let produccionVinculada: FilaProduccionVinculada[] = [];
  let produccionKgTotal: number | null = null;

  if (trabajo.parcel_id && trabajo.fecha) {
    const { data: harvests, error: errH } = await supabase
      .from('harvests')
      .select('id, crop, production_kg')
      .eq('parcel_id', trabajo.parcel_id)
      .eq('date', trabajo.fecha);

    if (!errH && harvests?.length) {
      let list = harvests;
      const cropOpt = opciones?.crop?.trim();
      if (cropOpt) {
        const n = normalizeCrop(cropOpt);
        list = harvests.filter((h) => normalizeCrop(h.crop ?? '') === n);
      }
      if (list.length) {
        produccionVinculada = list.map((h) => ({
          harvestId: h.id,
          crop: h.crop,
          productionKg: h.production_kg,
        }));
        const sum = list.reduce((acc, h) => acc + Number(h.production_kg ?? 0), 0);
        produccionKgTotal = sum > 0 ? sum : null;
      }
    }
  }

  const costeTotal = costeMateriales + costeMaquinaria + costeManoObra;

  return {
    trabajoId,
    horas,
    tractorAsignado,
    tractorId: trabajo.tractor_id ?? null,
    aperoId: (trabajo as { apero_id?: string | null }).apero_id ?? null,
    numOperarios,
    costeMateriales,
    costeMaquinaria,
    costeManoObra,
    costeTotal,
    lineasMateriales,
    produccionVinculada,
    produccionKgTotal,
  };
}
