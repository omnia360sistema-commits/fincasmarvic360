import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2,
  FileText, Camera, Building2, Wrench, User, Truck,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import {
  usePartePorFecha,
  useEnsureParteHoy,
  useEstadosFinca,
  useAddEstadoFinca,
  useTrabajos,
  useAddTrabajo,
  usePersonales,
  useAddPersonal,
  useResiduos,
  useAddResiduos,
  useDeleteEntradaParte,
  useGanaderos,
  useAddGanadero,
} from '@/hooks/useParteDiario'
import { usePersonal } from '@/hooks/usePersonal'
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms'
import { TIPOS_TRABAJO } from '@/constants/tiposTrabajo'
import { ESTADOS_PARCELA } from '@/constants/estadosParcela'
import { uploadImage } from '@/utils/uploadImage'
import { formatHora, formatFechaLarga, formatFechaNav } from '@/utils/dateFormat'
import jsPDF from 'jspdf'

// ─── Constantes ──────────────────────────────────────────────────────────────

const HOY = new Date().toISOString().split('T')[0]

// ─── Tipos de formulario ──────────────────────────────────────────────────────

type FormA = {
  finca: string; parcel_id: string; estado: string
  num_operarios: string; nombres_operarios: string
  foto1: File | null; foto2: File | null; notas: string
}
type FormB = {
  tipo_trabajo: string; finca: string; ambito: string; parcelas: string
  num_operarios: string; nombres_operarios: string
  hora_inicio: string; hora_fin: string
  foto1: File | null; foto2: File | null; notas: string
}
type FormC = { texto: string; con_quien: string; donde: string }
type FormD = {
  personal_id: string; nombre_conductor: string
  hora_salida_nave: string
  ganadero_id: string; nombre_ganadero: string; nuevo_ganadero: string
  hora_llegada_ganadero: string
  hora_regreso_nave: string; notas_descarga: string
  foto: File | null
}

const initA = (): FormA => ({
  finca: '', parcel_id: '', estado: '', num_operarios: '',
  nombres_operarios: '', foto1: null, foto2: null, notas: '',
})
const initB = (): FormB => ({
  tipo_trabajo: '', finca: '', ambito: 'finca_completa', parcelas: '',
  num_operarios: '', nombres_operarios: '',
  hora_inicio: '', hora_fin: '', foto1: null, foto2: null, notas: '',
})
const initC = (): FormC => ({ texto: '', con_quien: '', donde: '' })
const initD = (): FormD => ({
  personal_id: '', nombre_conductor: '',
  hora_salida_nave: '',
  ganadero_id: '', nombre_ganadero: '', nuevo_ganadero: '',
  hora_llegada_ganadero: '',
  hora_regreso_nave: '', notas_descarga: '',
  foto: null,
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToISO(fecha: string, time: string): string | null {
  if (!time) return null
  return `${fecha}T${time}:00`
}

async function uploadFoto(file: File, parteId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${parteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  return uploadImage(file, 'partes-images', path)
}

async function loadImageData(url: string): Promise<{ b64: string; natW: number; natH: number } | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    const bmp = await createImageBitmap(blob)
    const natW = bmp.width, natH = bmp.height
    const canvas = document.createElement('canvas')
    const MAX = 1200
    const scale = Math.min(1, MAX / Math.max(natW, natH))
    canvas.width = natW * scale
    canvas.height = natH * scale
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    return { b64: canvas.toDataURL('image/jpeg', 0.82), natW, natH }
  } catch { return null }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ParteDiario() {
  const navigate = useNavigate()
  const [fecha, setFecha]           = useState(HOY)
  const [modal, setModal]           = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [saving, setSaving]         = useState(false)
  const [generandoPdf, setGenPdf]   = useState(false)
  const [formA, setFormA]           = useState<FormA>(initA())
  const [formB, setFormB]           = useState<FormB>(initB())
  const [formC, setFormC]           = useState<FormC>(initC())
  const [formD, setFormD]           = useState<FormD>(initD())

  const esHoy = fecha === HOY

  const ensureHoy                             = useEnsureParteHoy()
  const { data: parte, isLoading: cargando }  = usePartePorFecha(fecha)
  const parteId                               = parte?.id ?? null

  const { data: estadosFinca = [] }  = useEstadosFinca(parteId)
  const { data: trabajos      = [] } = useTrabajos(parteId)
  const { data: personales    = [] } = usePersonales(parteId)
  const { data: residuos      = [] } = useResiduos(parteId)

  const addEstadoFinca = useAddEstadoFinca()
  const addTrabajo     = useAddTrabajo()
  const addPersonal    = useAddPersonal()
  const addResiduos    = useAddResiduos()
  const deleteEntrada  = useDeleteEntradaParte()
  const addGanadero    = useAddGanadero()

  const { data: conductoresCamion = [] } = usePersonal('conductor_camion')
  const { data: ganaderos          = [] } = useGanaderos()

  // Asegurar parte del día actual al montar y al cambiar a hoy
  useEffect(() => {
    if (fecha === HOY) {
      ensureHoy.mutate(HOY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  // ── Navegación de fechas ──
  function irAnterior() {
    const d = new Date(fecha + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    setFecha(d.toISOString().split('T')[0])
  }
  function irSiguiente() {
    const d = new Date(fecha + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const sig = d.toISOString().split('T')[0]
    if (sig <= HOY) setFecha(sig)
  }

  // ── Submit Modal A ──
  async function submitA() {
    if (!parteId || !formA.finca) return
    setSaving(true)
    try {
      const foto_url   = formA.foto1 ? await uploadFoto(formA.foto1, parteId) : null
      const foto_url_2 = formA.foto2 ? await uploadFoto(formA.foto2, parteId) : null
      const numOp = parseInt(formA.num_operarios)
      await addEstadoFinca.mutateAsync({
        parte_id: parteId,
        finca: formA.finca,
        parcel_id:         formA.parcel_id         || null,
        estado:            formA.estado             || null,
        num_operarios:     isNaN(numOp) ? null : numOp,
        nombres_operarios: formA.nombres_operarios  || null,
        foto_url, foto_url_2,
        notas: formA.notas || null,
      })
      setModal(null); setFormA(initA())
    } finally { setSaving(false) }
  }

  // ── Submit Modal B ──
  async function submitB() {
    if (!parteId || !formB.tipo_trabajo) return
    setSaving(true)
    try {
      const foto_url   = formB.foto1 ? await uploadFoto(formB.foto1, parteId) : null
      const foto_url_2 = formB.foto2 ? await uploadFoto(formB.foto2, parteId) : null
      const numOp = parseInt(formB.num_operarios)
      const parcelasArr = formB.ambito === 'parcelas_concretas' && formB.parcelas
        ? formB.parcelas.split(',').map(s => s.trim()).filter(Boolean)
        : null
      await addTrabajo.mutateAsync({
        parte_id: parteId,
        tipo_trabajo: formB.tipo_trabajo,
        finca:  formB.finca  || null,
        ambito: formB.ambito || null,
        parcelas: parcelasArr,
        num_operarios:     isNaN(numOp) ? null : numOp,
        nombres_operarios: formB.nombres_operarios || null,
        hora_inicio: timeToISO(fecha, formB.hora_inicio),
        hora_fin:    timeToISO(fecha, formB.hora_fin),
        foto_url, foto_url_2,
        notas: formB.notas || null,
      })
      setModal(null); setFormB(initB())
    } finally { setSaving(false) }
  }

  // ── Submit Modal C ──
  async function submitC() {
    if (!parteId || !formC.texto.trim()) return
    setSaving(true)
    try {
      await addPersonal.mutateAsync({
        parte_id:  parteId,
        texto:     formC.texto,
        con_quien: formC.con_quien || null,
        donde:     formC.donde     || null,
      })
      setModal(null); setFormC(initC())
    } finally { setSaving(false) }
  }

  // ── Submit Modal D ──
  async function submitD() {
    if (!parteId) return
    setSaving(true)
    try {
      // Si nuevo ganadero, crear primero
      let ganaderoId = formD.ganadero_id ?? null
      if (!ganaderoId && formD.nuevo_ganadero.trim()) {
        const nuevo = await addGanadero.mutateAsync(formD.nuevo_ganadero.trim())
        ganaderoId = nuevo.id
      }

      // Subir foto si existe
      let foto_url: string | null = null
      if (formD.foto && parteId) {
        foto_url = await uploadFoto(formD.foto, parteId)
      }

      // Nombre conductor desde selector
      const nombreConductor = formD.personal_id
        ? ((conductoresCamion.find(c => c.id === formD.personal_id)?.nombre ?? formD.nombre_conductor) || null)
        : (formD.nombre_conductor || null)

      // Nombre ganadero para PDF/texto
      const nombreGanadero = ganaderoId
        ? ((ganaderos.find(g => g.id === ganaderoId)?.nombre ?? formD.nuevo_ganadero) || null)
        : (formD.nombre_ganadero || null)

      await addResiduos.mutateAsync({
        parte_id:               parteId,
        nombre_conductor:       nombreConductor,
        hora_salida_nave:       timeToISO(fecha, formD.hora_salida_nave),
        nombre_ganadero:        nombreGanadero,
        hora_llegada_ganadero:  timeToISO(fecha, formD.hora_llegada_ganadero),
        hora_regreso_nave:      timeToISO(fecha, formD.hora_regreso_nave),
        notas_descarga:         formD.notas_descarga || null,
        foto_url,
        personal_id:            formD.personal_id ?? null,
        ganadero_id:            ganaderoId,
      })
      setModal(null); setFormD(initD())
    } finally { setSaving(false) }
  }

  // ── Eliminar entrada ──
  function eliminar(tabla: string, id: string) {
    if (!parteId) return
    deleteEntrada.mutate({ tabla, id, parteId })
  }

  // ─────────────────────────────────────────────────────────────────
  // PDF — INFORME DIARIO ULTRA-DETALLADO
  // ─────────────────────────────────────────────────────────────────
  async function generarPDF() {
    setGenPdf(true)
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const PAGE_W = 210
      const M = 14        // margen
      const TW = PAGE_W - 2 * M  // ancho de texto
      let y = M

      // Cargar logo
      const logoData = await loadImageData(window.location.origin + '/MARVIC_logo.png')

      // ── helpers de layout ──
      const checkPage = (needed = 10) => {
        if (y + needed > 280) {
          doc.addPage()
          y = M
          addPageHeader()
        }
      }

      const addPageHeader = () => {
        if (logoData) {
          doc.addImage(logoData.b64, 'JPEG', M, y, 38, 10)
        }
        doc.setFontSize(8)
        doc.setTextColor(80, 80, 80)
        doc.text('AGRÍCOLA MARVIC 360', PAGE_W - M, y + 4, { align: 'right' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(14, 94, 131)
        doc.text(`PARTE DIARIO — ${formatFechaLarga(fecha)}`, PAGE_W - M, y + 8.5, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        y += 14
        doc.setDrawColor(14, 94, 131)
        doc.setLineWidth(0.4)
        doc.line(M, y, PAGE_W - M, y)
        y += 5
      }

      const writeLine = (label: string, value: string | null | undefined, size = 9) => {
        if (!value) return
        checkPage(7)
        doc.setFontSize(size)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 40)
        const txt = `${label}: ${value}`
        const lines = doc.splitTextToSize(txt, TW) as string[]
        lines.forEach((line: string) => {
          checkPage(5)
          doc.text(line, M, y)
          y += size * 0.44
        })
        y += 0.5
      }

      const writeLabel = (label: string, size = 8) => {
        checkPage(6)
        doc.setFontSize(size)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(100, 100, 100)
        doc.text(label, M, y)
        doc.setFont('helvetica', 'normal')
        y += size * 0.44 + 0.5
      }

      const separator = () => {
        checkPage(5)
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.2)
        doc.line(M, y, PAGE_W - M, y)
        y += 4
      }

      const addPhoto = async (url: string | null) => {
        if (!url) return
        const img = await loadImageData(url)
        if (!img) return
        const W_FOTO = 80
        const H_FOTO = Math.min(W_FOTO * (img.natH / img.natW), 100)
        checkPage(H_FOTO + 12)
        doc.setFontSize(7)
        doc.setTextColor(120, 120, 120)
        doc.text('Foto adjunta:', M, y)
        y += 4
        doc.addImage(img.b64, 'JPEG', M, y, W_FOTO, H_FOTO)
        y += H_FOTO + 4
      }

      const entryHeader = (letra: string, titulo: string, hora: string) => {
        checkPage(14)
        // Barra lateral de color
        doc.setFillColor(14, 94, 131)
        doc.rect(M, y, 2, 9, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(14, 94, 131)
        doc.text(`[${letra}]  ${titulo}`, M + 4, y + 6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(hora, PAGE_W - M, y + 6, { align: 'right' })
        y += 12
      }

      // ── Cabecera primera página ──
      addPageHeader()

      // ── Resumen del día ──
      const totalEntradas = estadosFinca.length + trabajos.length + personales.length + residuos.length
      writeLabel(`Resumen: ${totalEntradas} entradas registradas el ${formatFechaLarga(fecha)}`, 8)
      y += 2

      if (totalEntradas === 0) {
        checkPage(12)
        doc.setFontSize(10)
        doc.setTextColor(140, 140, 140)
        doc.text('Sin entradas registradas para este día.', M, y)
        y += 10
      }

      // ── Tipo unificado para orden cronológico ──
      type EntradaPDF =
        | { ts: string; tipo: 'A'; data: Tables<'parte_estado_finca'> }
        | { ts: string; tipo: 'B'; data: Tables<'parte_trabajo'> }
        | { ts: string; tipo: 'C'; data: Tables<'parte_personal'> }
        | { ts: string; tipo: 'D'; data: Tables<'parte_residuos_vegetales'> }

      const entradas: EntradaPDF[] = [
        ...estadosFinca.map(e => ({ ts: e.created_at, tipo: 'A' as const, data: e })),
        ...trabajos.map(e     => ({ ts: e.hora_inicio ?? e.created_at, tipo: 'B' as const, data: e })),
        ...personales.map(e   => ({ ts: e.fecha_hora, tipo: 'C' as const, data: e })),
        ...residuos.map(e     => ({ ts: e.hora_salida_nave ?? e.created_at, tipo: 'D' as const, data: e })),
      ].sort((a, b) => a.ts.localeCompare(b.ts))

      // ── Renderizar cada entrada en orden cronológico ──
      for (const entrada of entradas) {

        if (entrada.tipo === 'A') {
          const e = entrada.data
          entryHeader('A', 'ESTADO FINCA / PARCELA', formatHora(e.created_at))
          writeLine('Finca', e.finca)
          writeLine('Parcela / Sector', e.parcel_id)
          writeLine('Estado', ESTADOS_PARCELA.find(s => s.value === e.estado)?.label ?? e.estado)
          writeLine('Número de operarios', e.num_operarios?.toString())
          writeLine('Nombres operarios', e.nombres_operarios)
          writeLine('Notas', e.notas)
          await addPhoto(e.foto_url)
          await addPhoto(e.foto_url_2)
          separator()
        }

        else if (entrada.tipo === 'B') {
          const e = entrada.data
          const rangoHora = e.hora_inicio
            ? `${formatHora(e.hora_inicio)} → ${formatHora(e.hora_fin)}`
            : formatHora(e.created_at)
          entryHeader('B', 'TRABAJO EN CURSO', rangoHora)
          writeLine('Tipo de trabajo', e.tipo_trabajo)
          writeLine('Finca', e.finca)
          writeLine('Ámbito', e.ambito === 'finca_completa' ? 'Finca completa' : 'Parcelas concretas')
          if (e.parcelas && e.parcelas.length > 0) {
            writeLine('Parcelas', e.parcelas.join(', '))
          }
          writeLine('Número de operarios', e.num_operarios?.toString())
          writeLine('Nombres operarios', e.nombres_operarios)
          if (e.hora_inicio) writeLine('Hora inicio', formatHora(e.hora_inicio))
          if (e.hora_fin)    writeLine('Hora fin', formatHora(e.hora_fin))
          writeLine('Notas', e.notas)
          await addPhoto(e.foto_url)
          await addPhoto(e.foto_url_2)
          separator()
        }

        else if (entrada.tipo === 'C') {
          const e = entrada.data
          entryHeader('C', 'PARTE PERSONAL JUANPE', formatHora(e.fecha_hora))
          writeLine('Texto', e.texto)
          writeLine('Con quién', e.con_quien)
          writeLine('Dónde', e.donde)
          separator()
        }

        else if (entrada.tipo === 'D') {
          const e = entrada.data
          entryHeader('D', 'RESIDUOS VEGETALES', e.hora_salida_nave ? `Salida ${formatHora(e.hora_salida_nave)}` : '')
          writeLine('Conductor', e.nombre_conductor)
          writeLine('Hora salida nave', formatHora(e.hora_salida_nave))
          writeLine('Ganadero / Destino', e.nombre_ganadero)
          writeLine('Hora llegada ganadero', formatHora(e.hora_llegada_ganadero))
          writeLine('Hora regreso nave', formatHora(e.hora_regreso_nave))
          writeLine('Notas descarga', e.notas_descarga)
          separator()
        }
      }

      // Pie de página final
      checkPage(10)
      y += 4
      doc.setFontSize(7)
      doc.setTextColor(160, 160, 160)
      doc.text(
        `Generado por Agrícola Marvic 360 · ${new Date().toLocaleString('es-ES')} · ${totalEntradas} entradas`,
        PAGE_W / 2, y, { align: 'center' }
      )

      doc.save(`Parte_Diario_${fecha}.pdf`)
    } finally {
      setGenPdf(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  // Pequeño componente de fila de entrada para reutilizar
  const EntradaRow = ({
    hora, titulo, subtitulo, hasPhoto, tabla, id,
  }: {
    hora: string; titulo: string; subtitulo?: string
    hasPhoto?: boolean; tabla: string; id: string
  }) => (
    <div className="px-4 py-3 flex items-start justify-between gap-2 hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#38bdf8] shrink-0">{hora}</span>
          {hasPhoto && <Camera className="w-3 h-3 text-slate-500 shrink-0" />}
        </div>
        <p className="text-sm text-white font-medium truncate mt-0.5">{titulo}</p>
        {subtitulo && <p className="text-[11px] text-slate-400 truncate mt-0.5">{subtitulo}</p>}
      </div>
      {esHoy && parteId && (
        <button
          onClick={() => eliminar(tabla, id)}
          className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )

  const EmptyState = ({ texto }: { texto: string }) => (
    <div className="px-4 py-8 text-center">
      <p className="text-[11px] text-slate-600 uppercase tracking-widest">{texto}</p>
    </div>
  )

  // ─── Bloque card ───
  const BloqueCard = ({
    letra, icono: Icon, titulo, color, children, onAdd,
  }: {
    letra: string; icono: React.ElementType; titulo: string
    color: string; children: React.ReactNode; onAdd?: () => void
  }) => (
    <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
      <div className="bg-slate-800/60 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${color}`}>{letra}</span>
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">{titulo}</span>
        </div>
        {esHoy && parteId && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-[#38bdf8]/30 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/15 text-[#38bdf8] text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Plus className="w-3 h-3" /> Añadir
          </button>
        )}
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">

      {/* ── CABECERA ── */}
      <header className="bg-slate-900/80 border-b border-white/10 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>

        <div className="w-px h-4 bg-white/10" />

        <span className="text-[10px] font-black uppercase tracking-widest text-[#38bdf8]">
          Parte Diario
        </span>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={irAnterior}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-white min-w-[140px] text-center">
            {formatFechaNav(fecha)}
            {esHoy && <span className="ml-1 text-[9px] text-[#38bdf8] font-black">HOY</span>}
          </span>
          <button
            onClick={irSiguiente}
            disabled={esHoy}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={generarPDF}
          disabled={generandoPdf || !parteId}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#38bdf8]/30 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/15 text-[#38bdf8] text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {generandoPdf
            ? <span className="w-3.5 h-3.5 border-2 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin" />
            : <FileText className="w-3.5 h-3.5" />
          }
          Generar PDF
        </button>
      </header>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-3xl w-full mx-auto">

        {cargando && (
          <div className="flex items-center justify-center py-16">
            <span className="w-5 h-5 border-2 border-white/10 border-t-[#38bdf8] rounded-full animate-spin" />
          </div>
        )}

        {!cargando && !parteId && !esHoy && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">Sin parte registrado para esta fecha.</p>
          </div>
        )}

        {/* BLOQUE A */}
        <BloqueCard
          letra="A" icono={Building2} titulo="Estado Finca / Parcela"
          color="text-sky-400 border-sky-400/40 bg-sky-400/5"
          onAdd={() => { setFormA(initA()); setModal('A') }}
        >
          {estadosFinca.length === 0
            ? <EmptyState texto="Sin estados registrados" />
            : estadosFinca.map(e => (
                <EntradaRow
                  key={e.id}
                  hora={formatHora(e.created_at)}
                  titulo={`${e.finca}${e.parcel_id ? ` · ${e.parcel_id}` : ''}`}
                  subtitulo={[
                    ESTADOS_PARCELA.find(s => s.value === e.estado)?.label,
                    e.num_operarios ? `${e.num_operarios} op.` : null,
                    e.nombres_operarios,
                  ].filter(Boolean).join(' · ')}
                  hasPhoto={!!(e.foto_url || e.foto_url_2)}
                  tabla="parte_estado_finca"
                  id={e.id}
                />
              ))
          }
        </BloqueCard>

        {/* BLOQUE B */}
        <BloqueCard
          letra="B" icono={Wrench} titulo="Trabajo en Curso"
          color="text-amber-400 border-amber-400/40 bg-amber-400/5"
          onAdd={() => { setFormB(initB()); setModal('B') }}
        >
          {trabajos.length === 0
            ? <EmptyState texto="Sin trabajos registrados" />
            : trabajos.map(e => (
                <EntradaRow
                  key={e.id}
                  hora={e.hora_inicio
                    ? `${formatHora(e.hora_inicio)}–${formatHora(e.hora_fin)}`
                    : formatHora(e.created_at)}
                  titulo={e.tipo_trabajo}
                  subtitulo={[
                    e.finca,
                    e.ambito === 'finca_completa' ? 'Finca completa' : e.parcelas?.join(', '),
                    e.num_operarios ? `${e.num_operarios} op.` : null,
                  ].filter(Boolean).join(' · ')}
                  hasPhoto={!!(e.foto_url || e.foto_url_2)}
                  tabla="parte_trabajo"
                  id={e.id}
                />
              ))
          }
        </BloqueCard>

        {/* BLOQUE C */}
        <BloqueCard
          letra="C" icono={User} titulo="Parte Personal JuanPe"
          color="text-green-400 border-green-400/40 bg-green-400/5"
          onAdd={() => { setFormC(initC()); setModal('C') }}
        >
          {personales.length === 0
            ? <EmptyState texto="Sin anotaciones personales" />
            : personales.map(e => (
                <EntradaRow
                  key={e.id}
                  hora={formatHora(e.fecha_hora)}
                  titulo={e.texto.length > 60 ? e.texto.slice(0, 60) + '…' : e.texto}
                  subtitulo={[
                    e.con_quien ? `Con: ${e.con_quien}` : null,
                    e.donde     ? `En: ${e.donde}`      : null,
                  ].filter(Boolean).join(' · ')}
                  tabla="parte_personal"
                  id={e.id}
                />
              ))
          }
        </BloqueCard>

        {/* BLOQUE D */}
        <BloqueCard
          letra="D" icono={Truck} titulo="Residuos Vegetales"
          color="text-orange-400 border-orange-400/40 bg-orange-400/5"
          onAdd={() => { setFormD(initD()); setModal('D') }}
        >
          {residuos.length === 0
            ? <EmptyState texto="Sin viajes de residuos registrados" />
            : residuos.map(e => (
                <EntradaRow
                  key={e.id}
                  hora={formatHora(e.hora_salida_nave ?? e.created_at)}
                  titulo={[
                    e.nombre_conductor ? `Conductor: ${e.nombre_conductor}` : 'Viaje residuos',
                  ].join('')}
                  subtitulo={[
                    e.nombre_ganadero          ? `Ganadero: ${e.nombre_ganadero}` : null,
                    e.hora_llegada_ganadero    ? `Llegada: ${formatHora(e.hora_llegada_ganadero)}` : null,
                    e.hora_regreso_nave        ? `Regreso: ${formatHora(e.hora_regreso_nave)}` : null,
                  ].filter(Boolean).join(' · ')}
                  tabla="parte_residuos_vegetales"
                  id={e.id}
                />
              ))
          }
        </BloqueCard>

      </main>

      {/* ── BARRA INFERIOR ── */}
      <footer className="bg-slate-900/80 border-t border-white/10 px-4 py-1.5 flex items-center gap-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Marvic 360 · Parte Diario
        </span>
        <span className="text-[10px] text-slate-600">|</span>
        <span className="text-[10px] text-slate-500">
          {estadosFinca.length + trabajos.length + personales.length + residuos.length} entradas
        </span>
        <span className="text-[10px] font-mono text-slate-600 ml-auto">
          {new Date().toTimeString().slice(0, 8)}
        </span>
      </footer>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL A — Estado Finca/Parcela                            */}
      {/* ══════════════════════════════════════════════════════════ */}
      {modal === 'A' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-sky-400">
                A · Estado Finca / Parcela
              </span>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Finca *</label>
                <select
                  value={formA.finca}
                  onChange={e => setFormA(p => ({ ...p, finca: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                >
                  <option value="">— Seleccionar finca —</option>
                  {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Parcela / Sector (opcional)</label>
                <input
                  type="text"
                  value={formA.parcel_id}
                  onChange={e => setFormA(p => ({ ...p, parcel_id: e.target.value }))}
                  placeholder="Ej: S-12, Sector Norte..."
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Estado actual</label>
                <select
                  value={formA.estado}
                  onChange={e => setFormA(p => ({ ...p, estado: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                >
                  <option value="">— Sin especificar —</option>
                  {ESTADOS_PARCELA.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nº Operarios</label>
                  <input
                    type="number" min="0"
                    value={formA.num_operarios}
                    onChange={e => setFormA(p => ({ ...p, num_operarios: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nombres</label>
                  <input
                    type="text"
                    value={formA.nombres_operarios}
                    onChange={e => setFormA(p => ({ ...p, nombres_operarios: e.target.value }))}
                    placeholder="Juan, Pedro..."
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notas</label>
                <textarea
                  rows={3}
                  value={formA.notas}
                  onChange={e => setFormA(p => ({ ...p, notas: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map(n => (
                  <div key={n}>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                      Foto {n} {n === 1 ? '(estado)' : '(opcional)'}
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-white/10 rounded-lg cursor-pointer hover:border-[#38bdf8]/30 transition-colors">
                      <Camera className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-[11px] text-slate-400 truncate">
                        {n === 1
                          ? (formA.foto1?.name ?? 'Capturar / Subir')
                          : (formA.foto2?.name ?? 'Capturar / Subir')}
                      </span>
                      <input
                        type="file" accept="image/*" capture="environment" className="sr-only"
                        onChange={e => {
                          const f = e.target.files?.[0] ?? null
                          setFormA(p => n === 1 ? { ...p, foto1: f } : { ...p, foto2: f })
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 transition-colors"
                >Cancelar</button>
                <button
                  onClick={submitA}
                  disabled={saving || !formA.finca}
                  className="flex-1 py-2.5 rounded-lg bg-[#38bdf8] text-[#020617] text-sm font-black hover:bg-sky-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL B — Trabajo en Curso                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      {modal === 'B' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-amber-400">
                B · Trabajo en Curso
              </span>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tipo de trabajo *</label>
                <input
                  list="tipos-trabajo"
                  value={formB.tipo_trabajo}
                  onChange={e => setFormB(p => ({ ...p, tipo_trabajo: e.target.value }))}
                  placeholder="Seleccionar o escribir..."
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none"
                />
                <datalist id="tipos-trabajo">
                  {TIPOS_TRABAJO.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Finca</label>
                <select
                  value={formB.finca}
                  onChange={e => setFormB(p => ({ ...p, finca: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                >
                  <option value="">— Sin especificar —</option>
                  {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ámbito</label>
                <div className="flex gap-2">
                  {[
                    { value: 'finca_completa', label: 'Finca completa' },
                    { value: 'parcelas_concretas', label: 'Parcelas concretas' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFormB(p => ({ ...p, ambito: opt.value }))}
                      className={`flex-1 py-2 rounded-lg border text-[11px] font-bold transition-colors ${
                        formB.ambito === opt.value
                          ? 'border-[#38bdf8]/50 bg-[#38bdf8]/10 text-[#38bdf8]'
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </div>

              {formB.ambito === 'parcelas_concretas' && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Parcelas (separadas por coma)</label>
                  <input
                    type="text"
                    value={formB.parcelas}
                    onChange={e => setFormB(p => ({ ...p, parcelas: e.target.value }))}
                    placeholder="S-01, S-02, S-03..."
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hora inicio</label>
                  <input
                    type="time"
                    value={formB.hora_inicio}
                    onChange={e => setFormB(p => ({ ...p, hora_inicio: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hora fin</label>
                  <input
                    type="time"
                    value={formB.hora_fin}
                    onChange={e => setFormB(p => ({ ...p, hora_fin: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nº Operarios</label>
                  <input
                    type="number" min="0"
                    value={formB.num_operarios}
                    onChange={e => setFormB(p => ({ ...p, num_operarios: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nombres</label>
                  <input
                    type="text"
                    value={formB.nombres_operarios}
                    onChange={e => setFormB(p => ({ ...p, nombres_operarios: e.target.value }))}
                    placeholder="Juan, Pedro..."
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notas</label>
                <textarea
                  rows={3}
                  value={formB.notas}
                  onChange={e => setFormB(p => ({ ...p, notas: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map(n => (
                  <div key={n}>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Foto {n}</label>
                    <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 border border-white/10 rounded-lg cursor-pointer hover:border-[#38bdf8]/30 transition-colors">
                      <Camera className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-[11px] text-slate-400 truncate">
                        {n === 1 ? (formB.foto1?.name ?? 'Capturar / Subir') : (formB.foto2?.name ?? 'Capturar / Subir')}
                      </span>
                      <input
                        type="file" accept="image/*" capture="environment" className="sr-only"
                        onChange={e => {
                          const f = e.target.files?.[0] ?? null
                          setFormB(p => n === 1 ? { ...p, foto1: f } : { ...p, foto2: f })
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 transition-colors">Cancelar</button>
                <button
                  onClick={submitB}
                  disabled={saving || !formB.tipo_trabajo}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 text-[#020617] text-sm font-black hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL C — Parte Personal JuanPe                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      {modal === 'C' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-green-400">
                C · Parte Personal JuanPe
              </span>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Texto libre *</label>
                <textarea
                  rows={5}
                  value={formC.texto}
                  onChange={e => setFormC(p => ({ ...p, texto: e.target.value }))}
                  placeholder="Qué gestiona, decisiones tomadas, observaciones..."
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none resize-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Con quién</label>
                <input
                  type="text"
                  value={formC.con_quien}
                  onChange={e => setFormC(p => ({ ...p, con_quien: e.target.value }))}
                  placeholder="Técnico CAAE, proveedor, gestor..."
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Dónde</label>
                <input
                  type="text"
                  value={formC.donde}
                  onChange={e => setFormC(p => ({ ...p, donde: e.target.value }))}
                  placeholder="Murcia, nave, oficina..."
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none"
                />
              </div>

              <p className="text-[10px] text-slate-600">La fecha y hora se registran automáticamente.</p>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 transition-colors">Cancelar</button>
                <button
                  onClick={submitC}
                  disabled={saving || !formC.texto.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-black hover:bg-green-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL D — Residuos Vegetales                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {modal === 'D' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-orange-400">
                D · Residuos Vegetales
              </span>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">

              {/* CONDUCTOR — desde Personal */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Conductor</label>
                <select
                  value={formD.personal_id}
                  onChange={e => {
                    const id = e.target.value
                    const nombre = conductoresCamion.find(c => c.id === id)?.nombre ?? ''
                    setFormD(p => ({ ...p, personal_id: id, nombre_conductor: nombre }))
                  }}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                >
                  <option value="">— Seleccionar conductor —</option>
                  {conductoresCamion.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* GANADERO DESTINO — desde tabla ganaderos */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ganadero destino</label>
                <select
                  value={formD.ganadero_id}
                  onChange={e => setFormD(p => ({ ...p, ganadero_id: e.target.value, nuevo_ganadero: '' }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                >
                  <option value="">— Seleccionar ganadero —</option>
                  <option value="__nuevo__">+ Nuevo ganadero…</option>
                  {ganaderos.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
                {formD.ganadero_id === '__nuevo__' && (
                  <input
                    type="text"
                    placeholder="Nombre del ganadero (se guardará)"
                    value={formD.nuevo_ganadero}
                    onChange={e => setFormD(p => ({ ...p, nuevo_ganadero: e.target.value, ganadero_id: '__nuevo__' }))}
                    className="mt-2 w-full bg-slate-800 border border-orange-400/40 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-orange-400/70 outline-none"
                  />
                )}
              </div>

              {/* HORAS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hora salida nave</label>
                  <input
                    type="time"
                    value={formD.hora_salida_nave}
                    onChange={e => setFormD(p => ({ ...p, hora_salida_nave: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hora llegada ganadero</label>
                  <input
                    type="time"
                    value={formD.hora_llegada_ganadero}
                    onChange={e => setFormD(p => ({ ...p, hora_llegada_ganadero: e.target.value }))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Hora regreso nave</label>
                <input
                  type="time"
                  value={formD.hora_regreso_nave}
                  onChange={e => setFormD(p => ({ ...p, hora_regreso_nave: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none"
                />
              </div>

              {/* NOTAS */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notas de la descarga</label>
                <textarea
                  rows={3}
                  value={formD.notas_descarga}
                  onChange={e => setFormD(p => ({ ...p, notas_descarga: e.target.value }))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-[#38bdf8]/50 outline-none resize-none"
                />
              </div>

              {/* FOTO OBLIGATORIA */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Foto <span className="text-orange-400">*</span>
                </label>
                {formD.foto ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-white/10">
                    <img
                      src={URL.createObjectURL(formD.foto)}
                      alt="preview"
                      className="w-14 h-14 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{formD.foto.name}</p>
                      <p className="text-[10px] text-slate-500">{(formD.foto.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormD(p => ({ ...p, foto: null }))}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >×</button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-orange-400/50 transition-colors">
                    <Camera className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-400">Tomar foto o seleccionar</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) setFormD(p => ({ ...p, foto: f }))
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm hover:border-white/20 transition-colors">Cancelar</button>
                <button
                  onClick={submitD}
                  disabled={saving || !formD.foto}
                  className="flex-1 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-black hover:bg-orange-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
