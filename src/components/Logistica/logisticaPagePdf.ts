import type {
  Camion,
  VehiculoEmpresa,
  Viaje,
  MantenimientoCamion,
} from '@/hooks/useLogistica';
import type { Personal } from '@/hooks/usePersonal';
import {
  generarPDFCorporativoBase,
  pdfCorporateSection,
  pdfCorporateTable,
  PDF_COLORS,
  PDF_MARGIN,
} from '@/utils/pdfUtils';
import { getVehiculoLabel } from '@/utils/logisticaMantenimiento';
import {
  itvDias,
  fmtFecha,
  fmtDatetime,
  matriculaVehiculo,
  nombreDe,
  mismoDia,
} from '@/components/Logistica/logisticaModals';

export type LogisticaKpisResumen = {
  totalCamiones: number;
  camionesActivos: number;
  totalVehiculos: number;
  totalConductores: number;
  totalViajes: number;
};

export type LogisticaPdfContext = {
  firmaPdf: string;
  camiones: Camion[];
  vehiculos: VehiculoEmpresa[];
  viajes: Viaje[];
  mants: MantenimientoCamion[];
  personal: Personal[];
  kpis: LogisticaKpisResumen;
  totalKm: number;
  totalLitros: number;
  totalCostComb: number;
  totalCostMant: number;
};

function fmtFechaCorta(f: string | null) {
  return fmtFecha(f);
}

export function estadoCamionTexto(c: Camion): string {
  if (!c.activo) return 'Inactivo';
  const d = itvDias(c.fecha_proxima_itv);
  if (d !== null && d < 0) return 'Activo · ITV vencida';
  if (d !== null && d < 30) return `Activo · ITV en ${d}d`;
  return 'Activo';
}

export async function logisticaPdfGenerarCompleto(ctx: LogisticaPdfContext) {
  const {
    firmaPdf, camiones, vehiculos, viajes, mants, personal,
  } = ctx;
  const ref = new Date();
  const fs = ref.toISOString().slice(0, 10);
  await generarPDFCorporativoBase({
    titulo: 'LOGÍSTICA',
    subtitulo: 'Informe completo de flota y operaciones',
    fecha: ref,
    filename: `Logistica_Completa_${fs}.pdf`,
    accentColor: PDF_COLORS.violet,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Camiones');
        pdfCorporateTable(
          ctxB,
          ['CÓDIGO', 'MATRÍCULA', 'MARCA', 'KM', 'ITV', 'ESTADO'],
          [20, 26, 30, 22, 26, 58],
          camiones.map(c => [
            c.codigo_interno ?? '—',
            c.matricula,
            c.marca ?? '—',
            c.kilometros_actuales != null
              ? c.kilometros_actuales.toLocaleString('es-ES')
              : '—',
            fmtFechaCorta(c.fecha_proxima_itv),
            estadoCamionTexto(c),
          ]),
        );
      },
      ctxB => {
        pdfCorporateSection(ctxB, 'Vehículos de empresa');
        if (vehiculos.length === 0) {
          ctxB.checkPage(8);
          ctxB.doc.setFontSize(9);
          ctxB.doc.setTextColor(100, 116, 139);
          ctxB.doc.text('Sin vehículos registrados.', PDF_MARGIN, ctxB.y);
          ctxB.y += 6;
          return;
        }
        pdfCorporateTable(
          ctxB,
          ['CÓDIGO', 'MATRÍCULA', 'MARCA', 'TIPO', 'KM', 'ESTADO'],
          [20, 26, 28, 28, 22, 58],
          vehiculos.map(v => [
            v.codigo_interno ?? '—',
            v.matricula,
            v.marca ?? '—',
            v.tipo ?? '—',
            v.km_actuales != null ? v.km_actuales.toLocaleString('es-ES') : '—',
            v.estado_operativo ?? '—',
          ]),
        );
      },
      ctxB => {
        pdfCorporateSection(ctxB, 'Viajes');
        if (viajes.length === 0) {
          ctxB.checkPage(8);
          ctxB.doc.setFontSize(9);
          ctxB.doc.setTextColor(100, 116, 139);
          ctxB.doc.text('Sin viajes registrados.', PDF_MARGIN, ctxB.y);
          ctxB.y += 6;
          return;
        }
        pdfCorporateTable(
          ctxB,
          ['SALIDA', 'LLEGADA', 'VEHÍCULO', 'CONDUCTOR', 'DESTINO', 'KM'],
          [28, 28, 24, 34, 42, 26],
          viajes.map(v => [
            fmtDatetime(v.hora_salida),
            fmtDatetime(v.hora_llegada),
            matriculaVehiculo(camiones, vehiculos, v.camion_id),
            nombreDe(personal, v.personal_id),
            v.destino ?? v.finca ?? '—',
            v.km_recorridos != null ? String(v.km_recorridos) : '—',
          ]),
        );
      },
      ctxB => {
        pdfCorporateSection(ctxB, 'Mantenimientos');
        if (mants.length === 0) {
          ctxB.checkPage(8);
          ctxB.doc.setFontSize(9);
          ctxB.doc.setTextColor(100, 116, 139);
          ctxB.doc.text('Sin mantenimientos.', PDF_MARGIN, ctxB.y);
          ctxB.y += 6;
          return;
        }
        pdfCorporateTable(
          ctxB,
          ['FECHA', 'VEHÍCULO', 'TIPO', 'DESCRIPCIÓN', 'COSTE €', 'PROVEEDOR'],
          [22, 22, 24, 50, 20, 44],
          mants.map(m => [
            fmtFechaCorta(m.fecha),
            getVehiculoLabel(m, { camiones, vehiculos }),
            m.tipo,
            m.descripcion ?? '—',
            m.coste_euros != null ? m.coste_euros.toFixed(2) : '—',
            m.proveedor ?? '—',
          ]),
        );
      },
    ],
  });
}

export async function logisticaPdfGenerarViajesHoy(ctx: LogisticaPdfContext) {
  const { firmaPdf, camiones, vehiculos, viajes, personal } = ctx;
  const ref = new Date();
  const fs = ref.toISOString().slice(0, 10);
  const hoy = viajes.filter(v => v.hora_salida && mismoDia(new Date(v.hora_salida), ref));
  await generarPDFCorporativoBase({
    titulo: 'LOGÍSTICA — VIAJES',
    subtitulo: 'Movimientos del día',
    fecha: ref,
    filename: `Logistica_Viajes_${fs}.pdf`,
    accentColor: PDF_COLORS.violet,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Viajes del día');
        if (hoy.length === 0) {
          ctxB.checkPage(8);
          ctxB.doc.setFontSize(9);
          ctxB.doc.setTextColor(100, 116, 139);
          ctxB.doc.text('Sin viajes hoy.', PDF_MARGIN, ctxB.y);
          ctxB.y += 6;
          return;
        }
        pdfCorporateTable(
          ctxB,
          ['SALIDA', 'LLEGADA', 'VEHÍCULO', 'CONDUCTOR', 'DESTINO', 'KM'],
          [28, 28, 24, 34, 42, 26],
          hoy.map(v => [
            fmtDatetime(v.hora_salida),
            fmtDatetime(v.hora_llegada),
            matriculaVehiculo(camiones, vehiculos, v.camion_id),
            nombreDe(personal, v.personal_id),
            v.destino ?? '—',
            v.km_recorridos != null ? String(v.km_recorridos) : '—',
          ]),
        );
      },
    ],
  });
}

export async function logisticaPdfGenerarFlota(ctx: LogisticaPdfContext) {
  const { firmaPdf, camiones, vehiculos } = ctx;
  const ref = new Date();
  const fs = ref.toISOString().slice(0, 10);
  await generarPDFCorporativoBase({
    titulo: 'LOGÍSTICA — FLOTA',
    subtitulo: 'Estado operativo de camiones y vehículos',
    fecha: ref,
    filename: `Logistica_Flota_${fs}.pdf`,
    accentColor: PDF_COLORS.violet,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Camiones');
        pdfCorporateTable(
          ctxB,
          ['CÓDIGO', 'MATRÍCULA', 'MARCA', 'ITV', 'ESTADO'],
          [20, 28, 34, 30, 70],
          camiones.map(c => [
            c.codigo_interno ?? '—',
            c.matricula,
            c.marca ?? '—',
            fmtFechaCorta(c.fecha_proxima_itv),
            estadoCamionTexto(c),
          ]),
        );
      },
      ctxB => {
        pdfCorporateSection(ctxB, 'Vehículos empresa');
        if (vehiculos.length === 0) {
          ctxB.checkPage(8);
          ctxB.doc.setFontSize(9);
          ctxB.doc.setTextColor(100, 116, 139);
          ctxB.doc.text('Sin vehículos.', PDF_MARGIN, ctxB.y);
          ctxB.y += 6;
          return;
        }
        pdfCorporateTable(
          ctxB,
          ['CÓDIGO', 'MATRÍCULA', 'MARCA', 'TIPO', 'ESTADO'],
          [20, 28, 34, 24, 76],
          vehiculos.map(v => [
            v.codigo_interno ?? '—',
            v.matricula,
            v.marca ?? '—',
            v.tipo ?? '—',
            v.estado_operativo ?? '—',
          ]),
        );
      },
    ],
  });
}

export async function logisticaPdfGenerarMantenimientos(ctx: LogisticaPdfContext) {
  const { firmaPdf, camiones, vehiculos, mants } = ctx;
  const ref = new Date();
  const fs = ref.toISOString().slice(0, 10);
  await generarPDFCorporativoBase({
    titulo: 'LOGÍSTICA — MANTENIMIENTO',
    subtitulo: 'Historial de intervenciones',
    fecha: ref,
    filename: `Logistica_Mantenimientos_${fs}.pdf`,
    accentColor: PDF_COLORS.violet,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Mantenimientos');
        if (mants.length === 0) {
          ctxB.checkPage(8);
          ctxB.doc.setFontSize(9);
          ctxB.doc.setTextColor(100, 116, 139);
          ctxB.doc.text('Sin mantenimientos.', PDF_MARGIN, ctxB.y);
          ctxB.y += 6;
          return;
        }
        pdfCorporateTable(
          ctxB,
          ['FECHA', 'VEHÍCULO', 'TIPO', 'COSTE €', 'PROVEEDOR'],
          [26, 28, 32, 22, 74],
          mants.map(m => [
            fmtFechaCorta(m.fecha),
            getVehiculoLabel(m, { camiones, vehiculos }),
            m.tipo,
            m.coste_euros != null ? m.coste_euros.toFixed(2) : '—',
            m.proveedor ?? '—',
          ]),
        );
      },
    ],
  });
}

export async function logisticaPdfGenerarResumen(ctx: LogisticaPdfContext) {
  const {
    firmaPdf, viajes, kpis, totalKm, totalLitros, totalCostComb, totalCostMant,
  } = ctx;
  const ref = new Date();
  const fs = ref.toISOString().slice(0, 10);
  await generarPDFCorporativoBase({
    titulo: 'LOGÍSTICA — RESUMEN',
    subtitulo: 'Indicadores operativos',
    fecha: ref,
    filename: `Logistica_Resumen_${fs}.pdf`,
    accentColor: PDF_COLORS.violet,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Resumen operativo');
        pdfCorporateTable(ctxB, ['INDICADOR', 'VALOR'], [95, 87], [
          ['Total viajes', String(viajes.length)],
          ['Km recorridos (acumulado)', totalKm.toLocaleString('es-ES')],
          [
            'Combustible (litros)',
            totalLitros > 0 ? totalLitros.toFixed(1) : '—',
          ],
          [
            'Gasto combustible (€)',
            totalCostComb > 0 ? `${totalCostComb.toFixed(2)} €` : '—',
          ],
          [
            'Coste mantenimiento (€)',
            totalCostMant > 0 ? `${totalCostMant.toFixed(2)} €` : '—',
          ],
          ['Camiones activos', String(kpis.camionesActivos)],
          ['Vehículos empresa', String(kpis.totalVehiculos)],
        ]);
      },
    ],
  });
}

export async function logisticaPdfOnElegir(op: 1 | 2 | 3 | 4 | 5, ctx: LogisticaPdfContext) {
  if (op === 1) await logisticaPdfGenerarCompleto(ctx);
  else if (op === 2) await logisticaPdfGenerarViajesHoy(ctx);
  else if (op === 3) await logisticaPdfGenerarFlota(ctx);
  else if (op === 4) await logisticaPdfGenerarMantenimientos(ctx);
  else await logisticaPdfGenerarResumen(ctx);
}
