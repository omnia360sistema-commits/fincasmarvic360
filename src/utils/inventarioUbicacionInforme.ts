import jsPDF from 'jspdf'
import { supabase } from '@/integrations/supabase/client'
import { formatFecha } from '@/utils/dateFormat'
import type { RegistroConCategoria } from '@/components/InventarioUbicacion/inventarioUbicacionTypes'

export function fmtEur(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

export type FetchGruposInformeParams = {
  ubicacionId: string
  informeTipo: InformeTipo
  informeFechaInicio: string
  informeFechaFin: string
  informeCategoria: string
  informeMes: number
  informeAnio: number
}

export async function fetchGruposInforme(
  p: FetchGruposInformeParams
): Promise<Map<string, { nombre: string; rows: RegistroConCategoria[] }>> {
  const base = supabase
    .from('inventario_registros')
    .select('*, inventario_categorias(nombre, orden)')
    .eq('ubicacion_id', p.ubicacionId)

  let query = base
  if (p.informeTipo === 'historico') {
    query = query
      .gte('created_at', `${p.informeFechaInicio}T00:00:00`)
      .lte('created_at', `${p.informeFechaFin}T23:59:59`)
      .order('categoria_id')
      .order('created_at', { ascending: false })
  } else if (p.informeTipo === 'categoria') {
    query = query
      .eq('categoria_id', p.informeCategoria)
      .gte('created_at', `${p.informeFechaInicio}T00:00:00`)
      .lte('created_at', `${p.informeFechaFin}T23:59:59`)
      .order('created_at', { ascending: false })
  } else {
    const firstDay = `${p.informeAnio}-${String(p.informeMes).padStart(2, '0')}-01`
    query = query
      .lte('created_at', `${firstDay}T23:59:59`)
      .order('categoria_id')
      .order('created_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as unknown as RegistroConCategoria[]

  if (p.informeTipo === 'mes') {
    const porCategoria = new Map<string, RegistroConCategoria>()
    for (const r of rows) {
      if (!porCategoria.has(r.categoria_id)) porCategoria.set(r.categoria_id, r)
    }
    const sorted = Array.from(porCategoria.values()).sort(
      (a, b) => (a.inventario_categorias?.orden ?? 0) - (b.inventario_categorias?.orden ?? 0)
    )
    const groups = new Map<string, { nombre: string; rows: RegistroConCategoria[] }>()
    for (const r of sorted) {
      const nombre = r.inventario_categorias?.nombre ?? 'Sin categoria'
      groups.set(r.categoria_id, { nombre, rows: [r] })
    }
    return groups
  }

  const groups = new Map<string, { nombre: string; rows: RegistroConCategoria[] }>()
  for (const r of rows) {
    const nombre = r.inventario_categorias?.nombre ?? 'Sin categoria'
    if (!groups.has(r.categoria_id)) groups.set(r.categoria_id, { nombre, rows: [] })
    groups.get(r.categoria_id)!.rows.push(r)
  }
  return groups
}

export type InventarioUbicacionInformeCallbacks = {
  setGenerandoPDF: (v: boolean) => void
  setGenerandoExcel: (v: boolean) => void
  setPdfError: (v: string | null) => void
  setShowInformeModal: (v: boolean) => void
}

export async function inventarioUbicacionGenerarPDF(
  ubicacionId: string | null,
  ubicacionNombre: string | undefined,
  categorias: { id: string; nombre: string }[],
  fetchParams: FetchGruposInformeParams,
  cb: InventarioUbicacionInformeCallbacks
): Promise<void> {
  if (!ubicacionId || !ubicacionNombre) return
  const {
    informeTipo,
    informeFechaInicio,
    informeFechaFin,
    informeCategoria,
    informeMes,
    informeAnio,
  } = fetchParams
  cb.setGenerandoPDF(true)
  cb.setPdfError(null)

  try {
    const doc = new jsPDF()
    const margin = 15
    const maxW = 180
    let y = 25
    const lh = 6

    async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        return await new Promise(resolve => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            const data = canvas.toDataURL('image/jpeg', 0.8)
            URL.revokeObjectURL(img.src)
            resolve({ data, w: img.naturalWidth, h: img.naturalHeight })
          }
          img.onerror = () => resolve(null)
          img.src = URL.createObjectURL(blob)
        })
      } catch {
        return null
      }
    }

    const logo = await loadImage('/MARVIC_logo.png')

    function addLogoToPage() {
      if (!logo) return
      const lw = 38
      const lh2 = lw * (logo.h / logo.w)
      doc.addImage(logo.data, 'JPEG', 210 - margin - lw, 6, lw, lh2)
    }

    function checkPage() {
      if (y > 272) {
        doc.addPage()
        addLogoToPage()
        y = 25
      }
    }

    function writeLine(text: string, bold = false, size = 10) {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, maxW) as string[]
      for (const l of lines) {
        checkPage()
        doc.text(l, margin, y)
        y += lh
      }
    }

    function separator() {
      checkPage()
      doc.setDrawColor(160)
      doc.line(margin, y, margin + maxW, y)
      y += lh
    }

    async function addPhoto(url: string | null) {
      if (!url) return
      const img = await loadImage(url)
      if (!img) return
      writeLine('Foto adjunta:')
      const imgW = 80
      const imgH = imgW * (img.h / img.w)
      if (y + imgH > 272) {
        doc.addPage()
        addLogoToPage()
        y = 25
      }
      doc.addImage(img.data, 'JPEG', margin, y, imgW, imgH)
      y += imgH + 4
    }

    addLogoToPage()

    writeLine('INVENTARIO DE ACTIVOS FISICOS — AGRICOLA MARVIC 360', true, 13)
    y += 2
    writeLine(`Ubicacion: ${ubicacionNombre}`)
    writeLine(`Generado el: ${new Date().toLocaleString('es-ES')}`)

    if (informeTipo === 'historico') {
      writeLine(`Periodo: ${informeFechaInicio} a ${informeFechaFin}`)
    } else if (informeTipo === 'categoria') {
      const cat = categorias.find(c => c.id === informeCategoria)
      writeLine(`Categoria: ${cat?.nombre ?? ''}`)
      writeLine(`Periodo: ${informeFechaInicio} a ${informeFechaFin}`)
    } else {
      writeLine(`Stock a 01/${String(informeMes).padStart(2, '0')}/${informeAnio}`)
    }

    y += 2
    separator()

    const groups = await fetchGruposInforme(fetchParams)
    let totalGeneral = 0

    if (groups.size === 0) {
      writeLine('Sin registros en el periodo seleccionado.')
    }

    for (const [, g] of groups) {
      writeLine(g.nombre.toUpperCase(), true, 11)
      y += 1
      let totalSeccion = 0

      for (const r of g.rows) {
        writeLine(`  Fecha: ${formatFecha(r.created_at)}`)
        writeLine(`  Cantidad: ${r.cantidad} ${r.unidad}`)
        if (r.descripcion) writeLine(`  Descripcion: ${r.descripcion}`)
        if (r.precio_unitario != null) {
          const imp = r.cantidad * r.precio_unitario
          totalSeccion += imp
          writeLine(`  Precio: ${fmtEur(r.precio_unitario)}/unidad  —  Importe: ${fmtEur(imp)}`)
        }
        if (r.notas) writeLine(`  Notas: ${r.notas}`)
        await addPhoto(r.foto_url)
        if (r.foto_url_2) await addPhoto(r.foto_url_2)
        y += 2
      }

      if (totalSeccion > 0) {
        y += 1
        writeLine(`  TOTAL ${g.nombre.toUpperCase()}: ${fmtEur(totalSeccion)}`, true)
        totalGeneral += totalSeccion
      }
      y += 3
    }

    if (totalGeneral > 0) {
      y += 2
      separator()
      writeLine(`TOTAL GENERAL: ${fmtEur(totalGeneral)}`, true, 12)
    }

    const slug = ubicacionNombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)
    const fecha = new Date().toISOString().slice(0, 10)
    doc.save(`inventario_${slug}_${fecha}.pdf`)
    cb.setShowInformeModal(false)
  } catch (err: unknown) {
    cb.setPdfError(err instanceof Error ? err.message : 'Error generando el PDF')
  } finally {
    cb.setGenerandoPDF(false)
  }
}

export async function inventarioUbicacionGenerarExcel(
  ubicacionId: string | null,
  ubicacionNombre: string | undefined,
  fetchParams: FetchGruposInformeParams,
  cb: InventarioUbicacionInformeCallbacks
): Promise<void> {
  if (!ubicacionId || !ubicacionNombre) return
  cb.setGenerandoExcel(true)
  cb.setPdfError(null)

  try {
    const XLSX = await import('xlsx')
    const groups = await fetchGruposInforme(fetchParams)

    const wb = XLSX.utils.book_new()

    for (const [, g] of groups) {
      const header = [
        'Descripción / Producto', 'Fecha', 'Cantidad', 'Unidad',
        'Precio Unit. (€)', 'Importe (€)',
      ]
      const filas: (string | number)[][] = [header]
      let totalHoja = 0

      for (const r of g.rows) {
        const imp = r.precio_unitario != null ? r.cantidad * r.precio_unitario : null
        if (imp != null) totalHoja += imp
        filas.push([
          r.descripcion ?? '',
          new Date(r.created_at).toLocaleString('es-ES'),
          r.cantidad,
          r.unidad,
          r.precio_unitario ?? '',
          imp != null ? Math.round(imp * 100) / 100 : '',
        ])
      }

      filas.push(['', '', '', '', 'TOTAL:', Math.round(totalHoja * 100) / 100])

      const ws = XLSX.utils.aoa_to_sheet(filas)
      ws['!cols'] = [
        { wch: 35 }, { wch: 18 }, { wch: 10 },
        { wch: 10 }, { wch: 16 }, { wch: 14 },
      ]
      const sheetName = g.nombre.slice(0, 31).replace(/[\\/*?:[\]]/g, '_')
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }

    const slug = ubicacionNombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)
    const fecha = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Inventario_${slug}_${fecha}.xlsx`)
    cb.setShowInformeModal(false)
  } catch (err: unknown) {
    cb.setPdfError(err instanceof Error ? err.message : 'Error generando Excel')
  } finally {
    cb.setGenerandoExcel(false)
  }
}
