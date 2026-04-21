/**
 * Motor de formato corporativo ejecutivo para todos los PDFs del Parte Diario.
 * Cabecera por página, pie con firma y numeración; contenido sobre fondo blanco.
 */
import jsPDF from 'jspdf'
import { loadPdfImage, type PdfImage } from '@/utils/pdfUtils'
import { formatFechaEjecutiva } from '@/utils/parteDiarioHelpers'

export function generarPDFCorporativo(
  tituloInforme: string,
  subtituloInforme: string,
  fechaISO: string,
  logoData: PdfImage | null,
  firmaNombre: string,
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const M = 14
  const PAGE_W = 210
  const PAGE_H = 297
  const TW = PAGE_W - 2 * M
  const FOOTER_LINE_Y = 282
  const FOOTER_TEXT_Y = 287
  const CONTENT_MAX_Y = FOOTER_LINE_Y - 6

  let y = M
  const fechaLarga = formatFechaEjecutiva(fechaISO)

  function drawPageBackground() {
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F')
  }

  function drawHeader() {
    drawPageBackground()
    const top = M
    let bandBottom = top
    if (logoData) {
      const logoW = 45
      const logoH = Math.min(logoW * (logoData.natH / logoData.natW), 22)
      doc.setFillColor(255, 255, 255)
      doc.rect(M - 0.5, top - 0.5, logoW + 1, logoH + 1, 'F')
      doc.addImage(logoData.b64, 'JPEG', M, top, logoW, logoH)
      bandBottom = Math.max(bandBottom, top + logoH)
    }
    const right = PAGE_W - M
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(tituloInforme.toUpperCase(), right, top + 4, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(subtituloInforme, right, top + 9, { align: 'right' })
    doc.text(fechaLarga, right, top + 14, { align: 'right' })
    bandBottom = Math.max(bandBottom, top + 16)
    y = bandBottom + 2
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.35)
    doc.line(M, y, PAGE_W - M, y)
    y += 5
  }

  function checkPage(need: number) {
    if (y + need > CONTENT_MAX_Y) {
      doc.addPage()
      y = M
      drawHeader()
    }
  }

  /** Resumen 2 columnas (solo parte completo). Sin borde exterior. */
  function addResumenDosColumnas(rows: Array<{ label: string; value: string }>) {
    let stripe = 0
    const rowH = 6
    const labelX = M + 2
    const valueX = M + 52
    for (const row of rows) {
      const valueLines = doc.splitTextToSize(row.value, TW - 56) as string[]
      const linesH = Math.max(1, valueLines.length) * 4.2 + 2
      checkPage(linesH + rowH)
      const fill = stripe % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      doc.setFillColor(fill[0], fill[1], fill[2])
      doc.rect(M, y - 4.5, TW, Math.max(rowH, linesH + 1), 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(row.label, labelX, y)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      let yy = y
      valueLines.forEach((line, i) => {
        if (i > 0) {
          yy += 4.2
          checkPage(5)
        }
        doc.text(line, valueX, yy)
      })
      y = yy + 5
      stripe++
      doc.setFont('helvetica', 'normal')
    }
    y += 2
  }

  function addSectionHeader(letra: string, titulo: string, horario: string) {
    checkPage(10)
    doc.setFillColor(30, 41, 59)
    doc.rect(M, y, TW, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const extra = horario ? `  ${horario}` : ''
    doc.text(`[${letra}] ${titulo.toUpperCase()}${extra}`, M + 2, y + 4.8)
    y += 9
    doc.setTextColor(0, 0, 0)
  }

  let pairStripe = 0

  function resetPairStripe() {
    pairStripe = 0
  }

  function addKeyValueRow(label: string, value: string | null | undefined) {
    if (value === null || value === undefined || value === '') return
    const lines = doc.splitTextToSize(String(value), TW - 58) as string[]
    const blockH = 5 + lines.length * 4
    checkPage(blockH + 2)
    const fill = pairStripe % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
    doc.setFillColor(fill[0], fill[1], fill[2])
    doc.rect(M, y - 4, TW, blockH + 1, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(label, M + 2, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    let yy = y
    lines.forEach((ln, i) => {
      if (i > 0) {
        yy += 4
        checkPage(4)
      }
      doc.text(ln, M + 55, yy)
    })
    y = yy + 5
    pairStripe++
  }

  async function addPhoto120(url: string | null, pie: string) {
    if (!url) return
    const img = await loadPdfImage(url)
    if (!img) return
    const w = 120
    const h = Math.min(w * (img.natH / img.natW), 95)
    checkPage(h + 14)
    const x = (PAGE_W - w) / 2
    doc.addImage(img.b64, 'JPEG', x, y, w, h)
    y += h + 2
    if (pie) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      const capLines = doc.splitTextToSize(pie, TW) as string[]
      capLines.forEach(ln => {
        checkPage(4)
        doc.text(ln, PAGE_W / 2, y, { align: 'center' })
        y += 3.5
      })
    }
    y += 2
  }

  /** Tabla HORA | ACTIVIDAD | ESTADO (bloque C). */
  function addTablaPartePersonal(
    filas: Array<{ hora: string; actividad: string; estado: 'COMPLETADO' | 'INCIDENCIA' }>,
  ) {
    checkPage(14)
    const c1 = M + 2
    const c2 = M + 24
    const c3 = M + 138
    const headerH = 6
    doc.setFillColor(30, 41, 59)
    doc.rect(M, y, TW, headerH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text('HORA', c1, y + 4.2)
    doc.text('ACTIVIDAD', c2, y + 4.2)
    doc.text('ESTADO', c3, y + 4.2)
    y += headerH + 1
    let stripe = 0
    for (const f of filas) {
      const actLines = doc.splitTextToSize(f.actividad, 108) as string[]
      const rowH = Math.max(6, actLines.length * 3.8 + 2)
      checkPage(rowH + 1)
      const fill = stripe % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      doc.setFillColor(fill[0], fill[1], fill[2])
      doc.rect(M, y - 1, TW, rowH, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(f.hora, c1, y + 3.5)
      doc.setTextColor(0, 0, 0)
      let yy = y + 3.5
      actLines.forEach(ln => {
        doc.text(ln, c2, yy)
        yy += 3.8
      })
      doc.setFont('helvetica', 'bold')
      if (f.estado === 'INCIDENCIA') {
        doc.setTextColor(239, 68, 68)
      } else {
        doc.setTextColor(0, 0, 0)
      }
      doc.text(f.estado, c3, y + 3.5)
      y += rowH
      stripe++
    }
    y += 3
    doc.setTextColor(0, 0, 0)
  }

  /** Tabla planning: Nº | TAREA | RESPONSABLE | PRIORIDAD */
  function addTablaPlanning(
    filas: Array<{ num: number; tarea: string; responsable: string; prioridad: 'ALTA' | 'MEDIA' }>,
  ) {
    checkPage(14)
    const colN = M + 3
    const colT = M + 14
    const colR = M + 95
    const colP = M + 155
    const headerH = 6
    doc.setFillColor(30, 41, 59)
    doc.rect(M, y, TW, headerH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.text('Nº', colN, y + 4.2)
    doc.text('TAREA', colT, y + 4.2)
    doc.text('RESPONSABLE', colR, y + 4.2)
    doc.text('PRIORIDAD', colP, y + 4.2)
    y += headerH + 1
    let stripe = 0
    for (const f of filas) {
      const tLines = doc.splitTextToSize(f.tarea, 75) as string[]
      const rowH = Math.max(6, tLines.length * 3.8 + 2)
      checkPage(rowH + 1)
      const fill = stripe % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      doc.setFillColor(fill[0], fill[1], fill[2])
      doc.rect(M, y - 1, TW, rowH, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.text(String(f.num), colN, y + 3.5)
      let yy = y + 3.5
      tLines.forEach(ln => {
        doc.text(ln, colT, yy)
        yy += 3.8
      })
      doc.text(f.responsable || '—', colR, y + 3.5)
      doc.setFont('helvetica', 'bold')
      if (f.prioridad === 'ALTA') {
        doc.setTextColor(239, 68, 68)
      } else {
        doc.setTextColor(51, 65, 85)
      }
      doc.text(f.prioridad, colP, y + 3.5)
      y += rowH
      stripe++
    }
    y += 3
    doc.setTextColor(0, 0, 0)
  }

  function addMutedParagraph(texto: string) {
    checkPage(12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    const lines = doc.splitTextToSize(texto, TW) as string[]
    lines.forEach(ln => {
      checkPage(5)
      doc.text(ln, M, y)
      y += 4.5
    })
    y += 2
  }

  function finalize(filename: string) {
    const total = doc.getNumberOfPages()
    const pieFecha = new Date(fechaISO + 'T12:00:00').toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
    for (let i = 1; i <= total; i++) {
      doc.setPage(i)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.25)
      doc.line(M, FOOTER_LINE_Y, PAGE_W - M, FOOTER_LINE_Y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      const left = `Firmado: ${firmaNombre} — Dirección Técnica de Campo  |  Agrícola Marvic 360  |  ${pieFecha}`
      doc.text(left, M, FOOTER_TEXT_Y)
      doc.text(`Página ${i} de ${total}`, PAGE_W - M, FOOTER_TEXT_Y, { align: 'right' })
    }
    doc.save(filename)
  }

  drawHeader()

  return {
    doc,
    checkPage,
    addResumenDosColumnas,
    addSectionHeader,
    resetPairStripe,
    addKeyValueRow,
    addPhoto120,
    addTablaPartePersonal,
    addTablaPlanning,
    addMutedParagraph,
    finalize,
  }
}
