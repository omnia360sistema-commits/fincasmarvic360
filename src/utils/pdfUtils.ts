/**
 * pdfUtils.ts — Utilidades PDF compartidas para todos los módulos de Agrícola Marvic 360
 *
 * Patrón de uso:
 *   const ctx = createPdfContext(doc)
 *   ctx.addPageHeader('MÓDULO', 'Subtítulo opcional')
 *   ctx.writeLine('Campo', 'valor')
 *   ctx.separator()
 *   await ctx.addPhoto(url)
 *   doc.save('archivo.pdf')
 */

import jsPDF from 'jspdf'

// ── Constantes globales de layout ────────────────────────────────────────────

export const PDF_MARGIN       = 14
export const PDF_PAGE_W       = 210
export const PDF_PAGE_H       = 297
export const PDF_TEXT_W       = PDF_PAGE_W - 2 * PDF_MARGIN
export const PDF_BOTTOM_LIMIT = 280

// Colores corporativos por módulo
export const PDF_COLORS = {
  accent:    [14,  94,  131] as [number, number, number],   // azul Marvic
  orange:    [251, 146, 60]  as [number, number, number],   // maquinaria
  violet:    [167, 139, 250] as [number, number, number],   // logística
  amber:     [245, 158, 11]  as [number, number, number],   // trabajos
  green:     [74,  222, 128] as [number, number, number],   // parte diario
  fuchsia:   [232, 121, 249] as [number, number, number],   // personal
  gray:      [100, 116, 139] as [number, number, number],
  lightGray: [160, 160, 160] as [number, number, number],
  white:     [255, 255, 255] as [number, number, number],
  dark:      [40,  40,  40]  as [number, number, number],
}

// ── Carga de imagen desde URL → base64 ──────────────────────────────────────

export interface PdfImage {
  b64:  string
  natW: number
  natH: number
}

export async function loadPdfImage(url: string): Promise<PdfImage | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    const bmp  = await createImageBitmap(blob)
    const natW = bmp.width
    const natH = bmp.height
    const MAX  = 1200
    const scale = Math.min(1, MAX / Math.max(natW, natH))
    const canvas = document.createElement('canvas')
    canvas.width  = natW * scale
    canvas.height = natH * scale
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    return { b64: canvas.toDataURL('image/jpeg', 0.82), natW, natH }
  } catch {
    return null
  }
}

// ── Contexto de documento PDF ────────────────────────────────────────────────

export interface PdfContext {
  doc:         jsPDF
  y:           number
  logoData:    PdfImage | null
  accentColor: [number, number, number]

  /** Salta a nueva página si no hay espacio suficiente */
  checkPage(needed?: number): void

  /** Línea horizontal separadora */
  separator(): void

  /** Cabecera de página con logo + título del módulo */
  addPageHeader(modulo: string, subtitulo?: string): void

  /** Línea de texto con etiqueta en negrita */
  writeLine(label: string, value: string | null | undefined, size?: number): void

  /** Etiqueta de sección (sin valor) */
  writeLabel(label: string, size?: number): void

  /** Cabecera de entrada cronológica con barra lateral de color */
  entryHeader(letra: string, titulo: string, hora: string): void

  /** Inserta foto con caption. No hace nada si url es null. */
  addPhoto(url: string | null, maxW?: number): Promise<void>

  /** Tabla de KPIs en una fila horizontal */
  kpiRow(items: Array<{ label: string; value: string | number }>): void

  /** Pie de página final */
  footer(totalEntradas?: number): void
}

export function createPdfContext(
  doc: jsPDF,
  logoData: PdfImage | null = null,
  accentColor: [number, number, number] = PDF_COLORS.accent
): PdfContext {
  const M  = PDF_MARGIN
  const TW = PDF_TEXT_W
  let y    = M

  const ctx: PdfContext = {
    doc,
    get y() { return y },
    set y(v) { y = v },
    logoData,
    accentColor,

    checkPage(needed = 10) {
      if (y + needed > PDF_BOTTOM_LIMIT) {
        doc.addPage()
        y = M
        ctx.addPageHeader('', '')
      }
    },

    separator() {
      if (y + 5 > PDF_BOTTOM_LIMIT) { doc.addPage(); y = M }
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.2)
      doc.line(M, y, PDF_PAGE_W - M, y)
      y += 4
    },

    addPageHeader(modulo: string, subtitulo = '') {
      if (logoData) {
        doc.addImage(logoData.b64, 'JPEG', M, y, 38, 10)
      }
      doc.setFontSize(8)
      doc.setTextColor(...PDF_COLORS.gray)
      doc.text('AGRÍCOLA MARVIC 360', PDF_PAGE_W - M, y + 4, { align: 'right' })
      if (modulo) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...accentColor)
        doc.text(
          subtitulo ? `${modulo} — ${subtitulo}` : modulo,
          PDF_PAGE_W - M, y + 8.5, { align: 'right' }
        )
        doc.setFont('helvetica', 'normal')
      }
      y += 14
      doc.setDrawColor(...accentColor)
      doc.setLineWidth(0.4)
      doc.line(M, y, PDF_PAGE_W - M, y)
      y += 5
    },

    writeLine(label, value, size = 9) {
      if (!value) return
      ctx.checkPage(7)
      doc.setFontSize(size)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...PDF_COLORS.dark)
      const txt = `${label}: ${value}`
      const lines = doc.splitTextToSize(txt, TW) as string[]
      lines.forEach((line: string) => {
        ctx.checkPage(5)
        doc.text(line, M, y)
        y += size * 0.44
      })
      y += 0.5
    },

    writeLabel(label, size = 8) {
      ctx.checkPage(6)
      doc.setFontSize(size)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...PDF_COLORS.gray)
      doc.text(label, M, y)
      doc.setFont('helvetica', 'normal')
      y += size * 0.44 + 0.5
    },

    entryHeader(letra, titulo, hora) {
      ctx.checkPage(14)
      doc.setFillColor(...accentColor)
      doc.rect(M, y, 2, 9, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...accentColor)
      doc.text(`[${letra}]  ${titulo}`, M + 4, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...PDF_COLORS.gray)
      doc.text(hora, PDF_PAGE_W - M, y + 6, { align: 'right' })
      y += 12
    },

    async addPhoto(url, maxW = 80) {
      if (!url) return
      const img = await loadPdfImage(url)
      if (!img) return
      const hFoto = Math.min(maxW * (img.natH / img.natW), 100)
      ctx.checkPage(hFoto + 12)
      doc.setFontSize(7)
      doc.setTextColor(...PDF_COLORS.lightGray)
      doc.text('Foto adjunta:', M, y)
      y += 4
      doc.addImage(img.b64, 'JPEG', M, y, maxW, hFoto)
      y += hFoto + 4
    },

    kpiRow(items) {
      ctx.checkPage(18)
      const colW = TW / items.length
      doc.setFillColor(15, 23, 42)
      doc.roundedRect(M, y, TW, 14, 2, 2, 'F')
      items.forEach((item, i) => {
        const cx = M + colW * i + colW / 2
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...PDF_COLORS.gray)
        doc.text(item.label.toUpperCase(), cx, y + 5, { align: 'center' })
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...accentColor)
        doc.text(String(item.value), cx, y + 11, { align: 'center' })
      })
      y += 18
    },

    footer(totalEntradas) {
      ctx.checkPage(10)
      y += 4
      doc.setFontSize(7)
      doc.setTextColor(...PDF_COLORS.lightGray)
      const txt = totalEntradas != null
        ? `Generado por Agrícola Marvic 360 · ${new Date().toLocaleString('es-ES')} · ${totalEntradas} entradas`
        : `Generado por Agrícola Marvic 360 · ${new Date().toLocaleString('es-ES')}`
      doc.text(txt, PDF_PAGE_W / 2, y, { align: 'center' })
    },
  }

  return ctx
}

// ── Función de inicio estándar (crea doc + carga logo) ───────────────────────

export async function initPdf(
  accentColor: [number, number, number] = PDF_COLORS.accent
): Promise<{ doc: jsPDF; ctx: PdfContext }> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logoData = await loadPdfImage(window.location.origin + '/MARVIC_logo.png')
  const ctx = createPdfContext(doc, logoData, accentColor)
  return { doc, ctx }
}
