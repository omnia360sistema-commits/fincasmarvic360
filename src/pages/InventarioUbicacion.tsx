import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, X, Clock, History, Plus, Package, AlertCircle,
  FlaskConical, Droplets, Layers, Wind, Wrench, Tractor, FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import jsPDF from 'jspdf'
import {
  useUbicaciones, useCategorias, useUltimoRegistro,
  useRegistros, useAddRegistro,
} from '@/hooks/useInventario'
import { supabase } from '@/integrations/supabase/client'
import type { TablesInsert } from '@/integrations/supabase/types'

// ── Mapa slug → icono Lucide ──────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  FlaskConical, Droplets, Layers, Wind, Wrench, Package, Tractor,
}

const UNIDADES = [
  'kg', 'g', 'litros', 'ml', 'm²', 'm',
  'unidades', 'rollos', 'sacos', 'bidones', 'cajas', 'palés', 'otro',
]

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type RegistroConCategoria = {
  id: string
  ubicacion_id: string
  categoria_id: string
  cantidad: number
  unidad: string
  descripcion: string | null
  foto_url: string | null
  notas: string | null
  created_at: string
  inventario_categorias: { nombre: string; orden: number } | null
}

type PanelView  = 'estado' | 'historico'
type InformeTipo = 'historico' | 'categoria' | 'mes'

export default function InventarioUbicacion() {
  const { ubicacionId } = useParams<{ ubicacionId: string }>()
  const navigate = useNavigate()

  // ── UI state ─────────────────────────────────────────────────
  const [activeCatId, setActiveCatId] = useState<string | null>(null)
  const [panelView,   setPanelView]   = useState<PanelView>('estado')
  const [showModal,   setShowModal]   = useState(false)
  const [now, setNow]                 = useState(new Date())

  // ── Form state ───────────────────────────────────────────────
  const [cantidad,    setCantidad]    = useState('')
  const [unidad,      setUnidad]      = useState('kg')
  const [descripcion, setDescripcion] = useState('')
  const [notas,       setNotas]       = useState('')
  const [fotoFile,    setFotoFile]    = useState<File | null>(null)
  const [preview,     setPreview]     = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Informe state ─────────────────────────────────────────────
  const [showInformeModal,   setShowInformeModal]   = useState(false)
  const [informeTipo,        setInformeTipo]        = useState<InformeTipo>('historico')
  const [informeFechaInicio, setInformeFechaInicio] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [informeFechaFin,    setInformeFechaFin]    = useState(() => new Date().toISOString().slice(0, 10))
  const [informeCategoria,   setInformeCategoria]   = useState('')
  const [informeMes,         setInformeMes]         = useState(() => new Date().getMonth() + 1)
  const [informeAnio,        setInformeAnio]        = useState(() => new Date().getFullYear())
  const [generandoPDF,       setGenerandoPDF]       = useState(false)
  const [pdfError,           setPdfError]           = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Datos ────────────────────────────────────────────────────
  const { data: ubicaciones = [] }  = useUbicaciones()
  const { data: categorias  = [] }  = useCategorias()
  const { data: ultimoRegistro }    = useUltimoRegistro(ubicacionId ?? null, activeCatId)
  const { data: registros   = [] }  = useRegistros(ubicacionId ?? null, activeCatId)
  const addRegistro                 = useAddRegistro()

  const ubicacion = ubicaciones.find(u => u.id === ubicacionId)
  const activeCat = categorias.find(c => c.id === activeCatId)
  const horaStr   = now.toTimeString().slice(0, 8)

  // ── Handlers ─────────────────────────────────────────────────
  function handleSelectCat(id: string) {
    if (activeCatId === id) {
      setActiveCatId(null)
    } else {
      setActiveCatId(id)
      setPanelView('estado')
      setShowModal(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFotoFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  function openModal() {
    setCantidad('')
    setUnidad('kg')
    setDescripcion('')
    setNotas('')
    setFotoFile(null)
    setPreview(null)
    setSubmitError(null)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ubicacionId || !activeCatId || !cantidad) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      let foto_url: string | null = null

      if (fotoFile) {
        const ext  = fotoFile.name.split('.').pop()
        const path = `${ubicacionId}/${activeCatId}/${Date.now()}.${ext}`
        console.log('[Inventario] Subiendo foto, path:', path)
        const { error: uploadError } = await supabase.storage
          .from('inventario-images')
          .upload(path, fotoFile, { upsert: false })
        if (uploadError) {
          console.error('[Inventario] Error upload:', uploadError)
          throw uploadError
        }
        const { data: urlData } = supabase.storage
          .from('inventario-images')
          .getPublicUrl(path)
        foto_url = urlData.publicUrl
        console.log('[Inventario] URL pública generada:', foto_url)
      }

      const record: TablesInsert<'inventario_registros'> = {
        ubicacion_id: ubicacionId,
        categoria_id: activeCatId,
        cantidad:     parseFloat(cantidad),
        unidad,
        descripcion:  descripcion || null,
        notas:        notas       || null,
        foto_url,
      }

      await addRegistro.mutateAsync(record)
      setShowModal(false)
      setPanelView('estado')

    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Generación PDF ───────────────────────────────────────────
  async function generarPDF() {
    if (!ubicacionId || !ubicacion) return
    setGenerandoPDF(true)
    setPdfError(null)

    try {
      const doc    = new jsPDF()
      const margin = 15
      const maxW   = 180      // mm usable en A4
      let y        = 20
      const lh     = 6        // interlineado mm

      function checkPage() {
        if (y > 272) { doc.addPage(); y = 20 }
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

      async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
        try {
          const res  = await fetch(url)
          const blob = await res.blob()
          return await new Promise(resolve => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width  = img.naturalWidth
              canvas.height = img.naturalHeight
              canvas.getContext('2d')!.drawImage(img, 0, 0)
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

      async function addPhoto(url: string | null) {
        if (!url) return
        const img = await loadImage(url)
        if (!img) return
        writeLine('Foto adjunta:')
        const imgW = 80
        const imgH = imgW * (img.h / img.w)
        if (y + imgH > 272) { doc.addPage(); y = 20 }
        doc.addImage(img.data, 'JPEG', margin, y, imgW, imgH)
        y += imgH + 4
      }

      // ── Cabecera ─────────────────────────────────────────────
      writeLine('INVENTARIO DE ACTIVOS FISICOS — AGRICOLA MARVIC 360', true, 13)
      y += 2
      writeLine(`Ubicacion: ${ubicacion.nombre}`)
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

      // ── Datos ────────────────────────────────────────────────
      if (informeTipo === 'historico') {
        const { data, error } = await supabase
          .from('inventario_registros')
          .select('*, inventario_categorias(nombre, orden)')
          .eq('ubicacion_id', ubicacionId)
          .gte('created_at', `${informeFechaInicio}T00:00:00`)
          .lte('created_at', `${informeFechaFin}T23:59:59`)
          .order('categoria_id')
          .order('created_at', { ascending: false })
        if (error) throw error

        const rows = (data ?? []) as unknown as RegistroConCategoria[]
        const groups = new Map<string, { nombre: string; rows: RegistroConCategoria[] }>()
        for (const r of rows) {
          const nombre = r.inventario_categorias?.nombre ?? 'Sin categoria'
          if (!groups.has(r.categoria_id)) groups.set(r.categoria_id, { nombre, rows: [] })
          groups.get(r.categoria_id)!.rows.push(r)
        }

        if (groups.size === 0) {
          writeLine('Sin registros en el periodo seleccionado.')
        }
        for (const [, g] of groups) {
          writeLine(g.nombre.toUpperCase(), true, 11)
          y += 1
          for (const r of g.rows) {
            writeLine(`  Fecha: ${formatFecha(r.created_at)}`)
            writeLine(`  Cantidad: ${r.cantidad} ${r.unidad}`)
            if (r.descripcion) writeLine(`  Descripcion: ${r.descripcion}`)
            if (r.notas)       writeLine(`  Notas: ${r.notas}`)
            await addPhoto(r.foto_url)
            y += 2
          }
          y += 3
        }

      } else if (informeTipo === 'categoria') {
        const cat = categorias.find(c => c.id === informeCategoria)
        const { data, error } = await supabase
          .from('inventario_registros')
          .select('*')
          .eq('ubicacion_id', ubicacionId)
          .eq('categoria_id', informeCategoria)
          .gte('created_at', `${informeFechaInicio}T00:00:00`)
          .lte('created_at', `${informeFechaFin}T23:59:59`)
          .order('created_at', { ascending: false })
        if (error) throw error

        writeLine((cat?.nombre ?? '').toUpperCase(), true, 11)
        y += 2

        if (!data || data.length === 0) {
          writeLine('Sin registros en el periodo seleccionado.')
        }
        for (const r of data ?? []) {
          writeLine(`Fecha: ${formatFecha(r.created_at)}`)
          writeLine(`Cantidad: ${r.cantidad} ${r.unidad}`)
          if (r.descripcion) writeLine(`Descripcion: ${r.descripcion}`)
          if (r.notas)       writeLine(`Notas: ${r.notas}`)
          await addPhoto(r.foto_url)
          y += 4
        }

      } else {
        // Stock a 1 del mes
        const firstDay = `${informeAnio}-${String(informeMes).padStart(2, '0')}-01`
        const { data, error } = await supabase
          .from('inventario_registros')
          .select('*, inventario_categorias(nombre, orden)')
          .eq('ubicacion_id', ubicacionId)
          .lte('created_at', `${firstDay}T23:59:59`)
          .order('created_at', { ascending: false })
        if (error) throw error

        const rows = (data ?? []) as unknown as RegistroConCategoria[]
        const porCategoria = new Map<string, RegistroConCategoria>()
        for (const r of rows) {
          if (!porCategoria.has(r.categoria_id)) porCategoria.set(r.categoria_id, r)
        }
        const sorted = Array.from(porCategoria.values()).sort(
          (a, b) => (a.inventario_categorias?.orden ?? 0) - (b.inventario_categorias?.orden ?? 0)
        )

        if (sorted.length === 0) {
          writeLine('Sin registros hasta esta fecha.')
        }
        for (const r of sorted) {
          writeLine(r.inventario_categorias?.nombre ?? 'Sin categoria', true)
          writeLine(`  Cantidad: ${r.cantidad} ${r.unidad}`)
          if (r.descripcion) writeLine(`  ${r.descripcion}`)
          writeLine(`  Ultimo registro: ${formatFecha(r.created_at)}`)
          await addPhoto(r.foto_url)
          y += 3
        }
      }

      // ── Descarga ─────────────────────────────────────────────
      const slug  = ubicacion.nombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)
      const fecha = new Date().toISOString().slice(0, 10)
      doc.save(`inventario_${slug}_${fecha}.pdf`)
      setShowInformeModal(false)

    } catch (err: unknown) {
      setPdfError(err instanceof Error ? err.message : 'Error generando el PDF')
    } finally {
      setGenerandoPDF(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen relative overflow-hidden bg-[#020617]">

      {/* ── FONDO — LOGO WATERMARK ─────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/MARVIC_logo.png"
          className="w-[520px] opacity-[0.04]"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* ── PANEL IDENTIDAD ────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 border border-white/10 rounded-lg px-4 py-3 min-w-[200px] max-w-[260px]">
        <p className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.3em] mb-1">
          Marvic 360 · Inventario
        </p>
        <p className="text-sm font-black text-white uppercase tracking-tight leading-tight">
          {ubicacion?.nombre ?? '…'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Operativo</span>
          <span className="text-[10px] text-slate-500 ml-auto font-mono">{horaStr}</span>
        </div>
      </div>

      {/* ── BOTÓN VOLVER ───────────────────────────────────── */}
      <button
        onClick={() => navigate('/inventario')}
        className="absolute top-4 left-[276px] z-[1000] w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-slate-900/90 hover:border-[#38bdf8]/40 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 text-slate-400" />
      </button>

      {/* ── MENÚ VERTICAL DERECHA — 7 CATEGORÍAS + INFORME ── */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
        {categorias.map(cat => {
          const Icon = ICON_MAP[cat.icono] ?? Package
          return (
            <button
              key={cat.id}
              onClick={() => handleSelectCat(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCatId === cat.id
                  ? 'bg-[#38bdf8]/20 border-[#38bdf8]/60 text-[#38bdf8]'
                  : 'bg-slate-900/90 border-white/10 text-slate-300 hover:border-[#38bdf8]/30 hover:text-[#38bdf8]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {cat.nombre}
            </button>
          )
        })}

        {/* Separador + botón Informe PDF */}
        <div className="w-full h-px bg-white/10 my-1" />
        <button
          onClick={() => { setPdfError(null); setShowInformeModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-slate-900/90 border-white/10 text-slate-300 hover:border-[#38bdf8]/30 hover:text-[#38bdf8]"
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          Informe PDF
        </button>
      </div>

      {/* ── PANEL LATERAL ──────────────────────────────────── */}
      {activeCatId && activeCat && (
        <div className="absolute top-4 right-[300px] bottom-10 z-[999] w-80 bg-slate-900/95 border border-white/10 rounded-lg flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <span className="text-[11px] font-black text-[#38bdf8] uppercase tracking-widest">
              {activeCat.nombre}
            </span>
            <button onClick={() => setActiveCatId(null)}>
              <X className="w-4 h-4 text-slate-500 hover:text-white" />
            </button>
          </div>

          {/* Sub-nav */}
          <div className="flex border-b border-white/10 shrink-0">
            {([
              { id: 'estado',    label: 'Estado actual', icon: Clock    },
              { id: 'historico', label: 'Histórico',     icon: History  },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPanelView(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                  panelView === id
                    ? 'border-[#38bdf8] text-[#38bdf8]'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* ── ESTADO ACTUAL ── */}
            {panelView === 'estado' && (
              !ultimoRegistro ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <Package className="w-6 h-6 text-slate-600" />
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest text-center">
                    Sin registros aún
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-800/60 border border-white/10 rounded-lg p-3">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Último registro</p>
                    <p className="text-2xl font-black text-white">
                      {ultimoRegistro.cantidad}
                      <span className="text-base text-slate-400 font-normal ml-1">
                        {ultimoRegistro.unidad}
                      </span>
                    </p>
                    {ultimoRegistro.descripcion && (
                      <p className="text-[11px] text-slate-400 mt-1">{ultimoRegistro.descripcion}</p>
                    )}
                    <p className="text-[9px] text-slate-600 mt-2 font-mono">
                      {formatFecha(ultimoRegistro.created_at)}
                    </p>
                  </div>
                  {ultimoRegistro.notas && (
                    <div className="bg-slate-800/40 rounded-lg p-3">
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Notas</p>
                      <p className="text-[11px] text-slate-400">{ultimoRegistro.notas}</p>
                    </div>
                  )}
                  {ultimoRegistro.foto_url && (
                    <img
                      src={ultimoRegistro.foto_url}
                      alt="Foto registro"
                      className="w-full rounded-lg border border-white/10 object-cover max-h-40"
                    />
                  )}
                </div>
              )
            )}

            {/* ── HISTÓRICO ── */}
            {panelView === 'historico' && (
              registros.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <History className="w-6 h-6 text-slate-600" />
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest text-center">
                    Sin registros aún
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {registros.map(r => (
                    <div
                      key={r.id}
                      className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-black text-white">
                          {r.cantidad}
                          <span className="text-[11px] text-slate-400 font-normal ml-1">{r.unidad}</span>
                        </p>
                        <p className="text-[9px] text-slate-600 font-mono shrink-0">
                          {formatFecha(r.created_at)}
                        </p>
                      </div>
                      {r.descripcion && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{r.descripcion}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

          </div>

          {/* Footer — botón añadir */}
          <div className="shrink-0 p-3 border-t border-white/10">
            <button
              onClick={openModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 hover:bg-[#38bdf8]/30 transition-all text-[11px] font-black uppercase tracking-widest text-[#38bdf8]"
            >
              <Plus className="w-4 h-4" />
              Añadir registro
            </button>
          </div>

        </div>
      )}

      {/* ── BARRA INFERIOR ─────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-slate-900/90 border-t border-white/10 px-4 py-1.5 flex items-center gap-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[300px]">
          Ubicación: <span className="text-white">{ubicacion?.nombre ?? '…'}</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Categorías: <span className="text-white">7</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Conexión: <span className="text-green-400">Online</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400 ml-auto">{horaStr}</span>
      </div>

      {/* ── MODAL — INFORME PDF ──────────────────────────────── */}
      {showInformeModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInformeModal(false)} />
          <div className="relative z-10 bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div>
                <p className="text-[11px] font-black text-[#38bdf8] uppercase tracking-[0.3em]">
                  Informe PDF
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{ubicacion?.nombre}</p>
              </div>
              <button
                onClick={() => setShowInformeModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors ml-4 shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Tipo tabs */}
            <div className="flex border-b border-white/10 shrink-0">
              {([
                { id: 'historico', label: 'Histórico'     },
                { id: 'categoria', label: 'Por categoría' },
                { id: 'mes',       label: 'Stock mes'     },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setInformeTipo(id)}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                    informeTipo === id
                      ? 'border-[#38bdf8] text-[#38bdf8]'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Campos según tipo */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* ── Histórico completo ── */}
              {informeTipo === 'historico' && (
                <>
                  <p className="text-[10px] text-slate-400">
                    Todos los registros de esta ubicación en el periodo, agrupados por categoría.
                  </p>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={informeFechaInicio}
                      onChange={e => setInformeFechaInicio(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={informeFechaFin}
                      onChange={e => setInformeFechaFin(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                    />
                  </div>
                </>
              )}

              {/* ── Por categoría ── */}
              {informeTipo === 'categoria' && (
                <>
                  <p className="text-[10px] text-slate-400">
                    Todos los registros de una categoría específica en el periodo seleccionado.
                  </p>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Categoría <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={informeCategoria}
                      onChange={e => setInformeCategoria(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                    >
                      <option value="">Seleccionar…</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={informeFechaInicio}
                      onChange={e => setInformeFechaInicio(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      value={informeFechaFin}
                      onChange={e => setInformeFechaFin(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                    />
                  </div>
                </>
              )}

              {/* ── Stock día 1 del mes ── */}
              {informeTipo === 'mes' && (
                <>
                  <p className="text-[10px] text-slate-400">
                    El último registro de cada categoría registrado hasta el día 1 del mes seleccionado.
                  </p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Mes
                      </label>
                      <select
                        value={informeMes}
                        onChange={e => setInformeMes(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                      >
                        {MESES_ES.map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Año
                      </label>
                      <input
                        type="number"
                        min="2024"
                        max="2030"
                        value={informeAnio}
                        onChange={e => setInformeAnio(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Error PDF */}
              {pdfError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-[11px] text-red-400">{pdfError}</p>
                </div>
              )}

            </div>

            {/* Footer — generar */}
            <div className="shrink-0 px-5 py-4 border-t border-white/10">
              <button
                onClick={generarPDF}
                disabled={generandoPDF || (informeTipo === 'categoria' && !informeCategoria)}
                className="w-full py-2.5 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 hover:bg-[#38bdf8]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-black uppercase tracking-widest text-[#38bdf8] flex items-center justify-center gap-2"
              >
                {generandoPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generar PDF
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL — AÑADIR REGISTRO ─────────────────────────── */}
      {showModal && activeCat && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]">

            {/* Modal header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div>
                <p className="text-[11px] font-black text-[#38bdf8] uppercase tracking-[0.3em]">
                  Añadir Registro
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{activeCat.nombre}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors ml-4 shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* Cantidad + Unidad */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Cantidad <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#38bdf8]/50"
                    placeholder="0"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Unidad
                  </label>
                  <select
                    value={unidad}
                    onChange={e => setUnidad(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                  >
                    {UNIDADES.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#38bdf8]/50"
                  placeholder="Ej: Herbicida Glifosato 36%, lote 2024..."
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Notas
                </label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#38bdf8]/50 resize-none"
                  placeholder="Observaciones opcionales..."
                />
              </div>

              {/* Foto */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Foto
                </label>
                {preview ? (
                  <div className="relative rounded-lg overflow-hidden border border-white/10">
                    <img src={preview} alt="Preview" className="w-full max-h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setFotoFile(null); setPreview(null) }}
                      className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-[#38bdf8]/40 transition-colors">
                    <Plus className="w-4 h-4 text-slate-500" />
                    <span className="text-[11px] text-slate-500">Seleccionar imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Error */}
              {submitError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-[11px] text-red-400">{submitError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !cantidad}
                className="w-full py-2.5 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 hover:bg-[#38bdf8]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-black uppercase tracking-widest text-[#38bdf8]"
              >
                {submitting ? 'Guardando...' : 'Guardar registro'}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
