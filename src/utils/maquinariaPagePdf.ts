import type { Apero, MantenimientoTractor, Tractor, UsoMaquinaria } from '@/hooks/useMaquinaria'
import type { Personal } from '@/hooks/usePersonal'
import {
  generarPDFCorporativoBase,
  pdfCorporateSection,
  pdfCorporateTable,
  PDF_COLORS,
  PDF_MARGIN,
} from '@/utils/pdfUtils'
import {
  fmtFechaCorta,
  matriculaTractor,
  tipoApero,
  estadoTractorTexto,
  nombreOperarioUso,
} from '@/components/Maquinaria/maquinariaConstants'

export type MaquinariaPdfContext = {
  firmaPdf: string
  tractores: Tractor[]
  aperos: Apero[]
  usos: UsoMaquinaria[]
  mants: MantenimientoTractor[]
  personalTractoristas: Personal[]
}

export async function maquinariaPdfGenerarCompleta(ctx: MaquinariaPdfContext) {
  const { firmaPdf, tractores, aperos, usos, mants, personalTractoristas } = ctx
  const ref = new Date()
  const fs = ref.toISOString().slice(0, 10)
  await generarPDFCorporativoBase({
    titulo: 'MAQUINARIA',
    subtitulo: 'Informe completo de flota y operaciones',
    fecha: ref,
    filename: `Maquinaria_Completa_${fs}.pdf`,
    accentColor: PDF_COLORS.orange,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Tractores')
        if (tractores.length === 0) {
          ctxB.checkPage(8)
          ctxB.doc.setFontSize(9)
          ctxB.doc.setTextColor(100, 116, 139)
          ctxB.doc.text('Sin tractores registrados.', PDF_MARGIN, ctxB.y)
          ctxB.y += 6
          return
        }
        pdfCorporateTable(
          ctxB,
          ['COD.', 'MATRICULA', 'MARCA', 'MODELO', 'HORAS', 'ESTADO'],
          [18, 26, 28, 32, 20, 58],
          tractores.map(t => [
            t.codigo_interno ?? '—',
            t.matricula,
            t.marca ?? '—',
            t.modelo ?? '—',
            t.horas_motor != null ? String(t.horas_motor) : '—',
            estadoTractorTexto(t),
          ]),
        )
      },
      ctxB => {
        pdfCorporateSection(ctxB, 'Aperos')
        if (aperos.length === 0) {
          ctxB.checkPage(8)
          ctxB.doc.setFontSize(9)
          ctxB.doc.setTextColor(100, 116, 139)
          ctxB.doc.text('Sin aperos registrados.', PDF_MARGIN, ctxB.y)
          ctxB.y += 6
          return
        }
        pdfCorporateTable(
          ctxB,
          ['COD.', 'TIPO', 'DESCRIPCION', 'TRACTOR', 'ESTADO'],
          [16, 34, 64, 36, 32],
          aperos.map(a => [
            a.codigo_interno ?? '—',
            a.tipo,
            a.descripcion ?? '—',
            matriculaTractor(tractores, a.tractor_id),
            a.estado ?? (a.activo ? 'Disponible' : 'Baja'),
          ]),
        )
      },
      ctxB => {
        pdfCorporateSection(ctxB, 'Uso de maquinaria')
        if (usos.length === 0) {
          ctxB.checkPage(8)
          ctxB.doc.setFontSize(9)
          ctxB.doc.setTextColor(100, 116, 139)
          ctxB.doc.text('Sin registros de uso.', PDF_MARGIN, ctxB.y)
          ctxB.y += 6
          return
        }
        const ordenados = [...usos].sort((a, b) => a.fecha.localeCompare(b.fecha))
        pdfCorporateTable(
          ctxB,
          ['FECHA', 'TRACTOR', 'APERO', 'OPERARIO', 'FINCA', 'HORAS'],
          [26, 28, 36, 44, 30, 18],
          ordenados.map(u => [
            fmtFechaCorta(u.fecha),
            matriculaTractor(tractores, u.tractor_id),
            tipoApero(aperos, u.apero_id),
            nombreOperarioUso(u, personalTractoristas),
            u.finca ?? '—',
            u.horas_trabajadas != null ? String(u.horas_trabajadas) : '—',
          ]),
        )
      },
      ctxB => {
        pdfCorporateSection(ctxB, 'Mantenimientos')
        if (mants.length === 0) {
          ctxB.checkPage(8)
          ctxB.doc.setFontSize(9)
          ctxB.doc.setTextColor(100, 116, 139)
          ctxB.doc.text('Sin mantenimientos registrados.', PDF_MARGIN, ctxB.y)
          ctxB.y += 6
          return
        }
        pdfCorporateTable(
          ctxB,
          ['FECHA', 'TRACTOR', 'TIPO', 'COSTE EUR', 'PROVEEDOR'],
          [28, 28, 32, 22, 72],
          mants.map(m => [
            fmtFechaCorta(m.fecha),
            matriculaTractor(tractores, m.tractor_id),
            m.tipo,
            m.coste_euros != null ? m.coste_euros.toFixed(2) : '—',
            m.proveedor ?? '—',
          ]),
        )
      },
    ],
  })
}

export async function maquinariaPdfGenerarEstadoTractores(ctx: MaquinariaPdfContext) {
  const { firmaPdf, tractores } = ctx
  const ref = new Date()
  await generarPDFCorporativoBase({
    titulo: 'MAQUINARIA — TRACTORES',
    subtitulo: 'Estado de tractores',
    fecha: ref,
    filename: `Maquinaria_Tractores_${ref.toISOString().slice(0, 10)}.pdf`,
    accentColor: PDF_COLORS.orange,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Estado de tractores')
        if (tractores.length === 0) {
          ctxB.checkPage(8)
          ctxB.doc.setFontSize(9)
          ctxB.doc.setTextColor(100, 116, 139)
          ctxB.doc.text('Sin tractores registrados.', PDF_MARGIN, ctxB.y)
          ctxB.y += 6
          return
        }
        pdfCorporateTable(
          ctxB,
          ['COD.', 'MATRICULA', 'MARCA', 'MODELO', 'HORAS', 'ESTADO'],
          [18, 26, 28, 32, 20, 58],
          tractores.map(t => [
            t.codigo_interno ?? '—',
            t.matricula,
            t.marca ?? '—',
            t.modelo ?? '—',
            t.horas_motor != null ? String(t.horas_motor) : '—',
            estadoTractorTexto(t),
          ]),
        )
      },
    ],
  })
}

export async function maquinariaPdfGenerarAperosActivos(ctx: MaquinariaPdfContext) {
  const { firmaPdf, tractores, aperos } = ctx
  const ref = new Date()
  const activos = aperos.filter(a => a.activo)
  await generarPDFCorporativoBase({
    titulo: 'MAQUINARIA — APEROS',
    subtitulo: 'Aperos activos',
    fecha: ref,
    filename: `Maquinaria_Aperos_${ref.toISOString().slice(0, 10)}.pdf`,
    accentColor: PDF_COLORS.orange,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Aperos activos')
        if (activos.length === 0) {
          ctxB.checkPage(8)
          ctxB.doc.setFontSize(9)
          ctxB.doc.setTextColor(100, 116, 139)
          ctxB.doc.text('Sin aperos activos.', PDF_MARGIN, ctxB.y)
          ctxB.y += 6
          return
        }
        pdfCorporateTable(
          ctxB,
          ['COD.', 'TIPO', 'DESCRIPCION', 'TRACTOR', 'ESTADO'],
          [16, 34, 64, 36, 32],
          activos.map(a => [
            a.codigo_interno ?? '—',
            a.tipo,
            a.descripcion ?? '—',
            matriculaTractor(tractores, a.tractor_id),
            a.estado ?? 'Disponible',
          ]),
        )
      },
    ],
  })
}

export async function maquinariaPdfGenerarUso(ctx: MaquinariaPdfContext) {
  const { firmaPdf, tractores, aperos, usos, personalTractoristas } = ctx
  const ref = new Date()
  const ordenados = [...usos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  await generarPDFCorporativoBase({
    titulo: 'MAQUINARIA — USO',
    subtitulo: 'Registros de uso',
    fecha: ref,
    filename: `Maquinaria_Uso_${ref.toISOString().slice(0, 10)}.pdf`,
    accentColor: PDF_COLORS.orange,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Uso de maquinaria')
        if (ordenados.length === 0) {
          ctxB.checkPage(8)
          ctxB.doc.setFontSize(9)
          ctxB.doc.setTextColor(100, 116, 139)
          ctxB.doc.text('Sin registros de uso.', PDF_MARGIN, ctxB.y)
          ctxB.y += 6
          return
        }
        pdfCorporateTable(
          ctxB,
          ['FECHA', 'TRACTOR', 'APERO', 'OPERARIO', 'FINCA', 'HORAS'],
          [26, 28, 36, 44, 30, 18],
          ordenados.map(u => [
            fmtFechaCorta(u.fecha),
            matriculaTractor(tractores, u.tractor_id),
            tipoApero(aperos, u.apero_id),
            nombreOperarioUso(u, personalTractoristas),
            u.finca ?? '—',
            u.horas_trabajadas != null ? String(u.horas_trabajadas) : '—',
          ]),
        )
      },
    ],
  })
}

export async function maquinariaPdfGenerarMantenimientos(ctx: MaquinariaPdfContext) {
  const { firmaPdf, tractores, mants } = ctx
  const ref = new Date()
  await generarPDFCorporativoBase({
    titulo: 'MAQUINARIA — MANTENIMIENTO',
    subtitulo: 'Intervenciones en tractores',
    fecha: ref,
    filename: `Maquinaria_Mantenimientos_${ref.toISOString().slice(0, 10)}.pdf`,
    accentColor: PDF_COLORS.orange,
    firmaNombre: firmaPdf,
    bloques: [
      ctxB => {
        pdfCorporateSection(ctxB, 'Mantenimientos')
        if (mants.length === 0) {
          ctxB.checkPage(8)
          ctxB.doc.setFontSize(9)
          ctxB.doc.setTextColor(100, 116, 139)
          ctxB.doc.text('Sin mantenimientos registrados.', PDF_MARGIN, ctxB.y)
          ctxB.y += 6
          return
        }
        pdfCorporateTable(
          ctxB,
          ['FECHA', 'TRACTOR', 'TIPO', 'COSTE EUR', 'PROVEEDOR'],
          [28, 28, 32, 22, 72],
          mants.map(m => [
            fmtFechaCorta(m.fecha),
            matriculaTractor(tractores, m.tractor_id),
            m.tipo,
            m.coste_euros != null ? m.coste_euros.toFixed(2) : '—',
            m.proveedor ?? '—',
          ]),
        )
      },
    ],
  })
}

export async function maquinariaPdfOnElegir(op: 1 | 2 | 3 | 4 | 5, ctx: MaquinariaPdfContext) {
  if (op === 1) await maquinariaPdfGenerarCompleta(ctx)
  else if (op === 2) await maquinariaPdfGenerarEstadoTractores(ctx)
  else if (op === 3) await maquinariaPdfGenerarAperosActivos(ctx)
  else if (op === 4) await maquinariaPdfGenerarUso(ctx)
  else await maquinariaPdfGenerarMantenimientos(ctx)
}
