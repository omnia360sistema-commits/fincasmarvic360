import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ChevronDown, FileText, LogOut,
} from 'lucide-react'
import {
  usePartePorFecha,
  useEnsureParteHoy,
  useEstadosFinca,
  useTrabajos,
  usePersonales,
  useResiduos,
  useDeleteEntradaParte,
} from '@/hooks/useParteDiario'
import { useCerrarJornada } from '@/hooks/useTrabajos'
import { NavegadorFechas } from '@/components/ParteDiario/NavegadorFechas'
import { FormEstadoFinca } from '@/components/ParteDiario/FormEstadoFinca'
import { FormTrabajosRealizado } from '@/components/ParteDiario/FormTrabajosRealizado'
import { FormAnotacionesLibres } from '@/components/ParteDiario/FormAnotacionesLibres'
import { FormLogisticaResiduos } from '@/components/ParteDiario/FormLogisticaResiduos'
import { nombreFirmaPdfFromUser } from '@/utils/pdfUtils'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { ejecutarCosechaDiaria } from '@/utils/liaCosechadora'
import { HOY } from '@/utils/parteDiarioHelpers'
import {
  ejecutarParteDiarioPdfOpcion,
  type ParteDiarioPdfDeps,
} from '@/utils/parteDiarioPdfOpciones'
import {
  ModalCierreJornadaParteDiario,
  type CierreJornadaResultado,
} from '@/components/ParteDiario/ModalCierreJornadaParteDiario'

export default function ParteDiario() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const firmaNombre = nombreFirmaPdfFromUser(user)
  const { theme } = useTheme()
  const pdfMenuRef = useRef<HTMLDivElement>(null)
  const [fecha, setFecha]           = useState(HOY)
  const [generandoPdf, setGenPdf]   = useState(false)
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false)

  const esHoy = fecha === HOY

  // Cerrar jornada
  const [showCierre, setShowCierre] = useState(false)
  const [cierreResultado, setCierreResultado] = useState<CierreJornadaResultado | null>(null)

  const ensureHoy                             = useEnsureParteHoy()
  const { data: parte, isLoading: cargando }  = usePartePorFecha(fecha)
  const parteId                               = parte?.id ?? null

  const { data: estadosFinca = [] }  = useEstadosFinca(parteId)
  const { data: trabajos      = [] } = useTrabajos(parteId)
  const { data: personales    = [] } = usePersonales(parteId)
  const { data: residuos      = [] } = useResiduos(parteId)

  const deleteEntrada  = useDeleteEntradaParte()
  const cerrarJornada  = useCerrarJornada()

  // Asegurar parte del día actual al montar y al cambiar a hoy
  useEffect(() => {
    if (fecha === HOY) {
      ensureHoy.mutate(HOY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha])

  useEffect(() => {
    if (!pdfMenuOpen) return
    function onDown(ev: MouseEvent) {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(ev.target as Node)) {
        setPdfMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [pdfMenuOpen])

  useEffect(() => {
    const b = searchParams.get('bloque')?.toUpperCase()
    if (!b || !['A', 'B', 'C', 'D'].includes(b)) return
    const id = `parte-bloque-${b.toLowerCase()}`
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [searchParams])

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

  // ── Cerrar jornada ──
  async function handleCerrarJornada() {
    if (!parteId || !confirm('¿Cerrar la jornada de hoy? Se marcarán trabajos ejecutados/pendientes y se arrastrarán a mañana.')) return
    try {
      const res = await cerrarJornada.mutateAsync(fecha)
      setCierreResultado(res as CierreJornadaResultado)
      setShowCierre(true)
      // Ejecutar cosechadora LIA sin bloquear
      ejecutarCosechaDiaria(fecha)
    } catch (e) {
      alert('Error al cerrar jornada: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  // ── Eliminar entrada ──
  function eliminar(tabla: string, id: string) {
    if (!parteId) return
    deleteEntrada.mutate({ tabla, id, parteId })
  }

  const pdfDeps: ParteDiarioPdfDeps = {
    parteId,
    fecha,
    firmaNombre,
    parte,
    estadosFinca,
    trabajos,
    personales,
    residuos,
    setGenPdf,
  }

  async function onElegirOpcionPdf(opcion: 1 | 2 | 3 | 4 | 5) {
    setPdfMenuOpen(false)
    await ejecutarParteDiarioPdfOpcion(opcion, pdfDeps)
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">

      {/* ── CABECERA ── */}
      <header className="bg-slate-900/80 border-b border-white/10 pl-14 pr-4 py-2.5 flex flex-col gap-2 max-md:items-stretch md:flex-row md:flex-wrap md:items-center md:gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>

        <div className="w-px h-4 bg-white/10" />

        <span className="text-[10px] font-black uppercase tracking-widest text-[#6d9b7d]">
          Parte Diario
        </span>

        <NavegadorFechas
          fecha={fecha}
          esHoy={esHoy}
          onAnterior={irAnterior}
          onSiguiente={irSiguiente}
        />

        <div className="relative" ref={pdfMenuRef}>
          <button
            type="button"
            onClick={() => setPdfMenuOpen(o => !o)}
            disabled={generandoPdf || !parteId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#6d9b7d]/30 bg-[#6d9b7d]/5 hover:bg-[#6d9b7d]/15 text-[#6d9b7d] text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {generandoPdf
              ? <span className="w-3.5 h-3.5 border-2 border-[#6d9b7d]/20 border-t-[#6d9b7d] rounded-full animate-spin" />
              : <FileText className="w-3.5 h-3.5" />
            }
            PDF
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${pdfMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {pdfMenuOpen && (
            <div
              className={`absolute right-0 top-full z-[70] mt-1 min-w-[280px] rounded-lg border shadow-lg py-1 ${
                theme === 'dark'
                  ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-black/40'
                  : 'border-slate-200 bg-white text-slate-800 shadow-slate-400/20'
              }`}
            >
              {[
                { k: 1 as const, label: 'Parte completo del día' },
                { k: 2 as const, label: 'Solo incidencias de la jornada' },
                { k: 3 as const, label: 'Solo residuos vegetales' },
                { k: 4 as const, label: `Solo parte personal (${firmaNombre})` },
                { k: 5 as const, label: 'Planning del día siguiente' },
              ].map(({ k, label }) => (
                <button
                  key={k}
                  type="button"
                  disabled={generandoPdf}
                  onClick={() => { void onElegirOpcionPdf(k) }}
                  className={`w-full px-3 py-2.5 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
                    theme === 'dark'
                      ? 'hover:bg-slate-800 text-slate-200'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {esHoy && parteId && (
          <button
            type="button"
            onClick={handleCerrarJornada}
            disabled={cerrarJornada.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar jornada
          </button>
        )
      }
      </header>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-3xl w-full mx-auto">

        {cargando && (
          <div className="flex items-center justify-center py-16">
            <span className="w-5 h-5 border-2 border-white/10 border-t-[#6d9b7d] rounded-full animate-spin" />
          </div>
        )}

        {!cargando && !parteId && !esHoy && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">Sin parte registrado para esta fecha.</p>
          </div>
        )}

        <div id="parte-bloque-a" className="scroll-mt-4">
          <FormEstadoFinca
            parteId={parteId}
            estadosFinca={estadosFinca}
            esHoy={esHoy}
            onDelete={(id) => eliminar('parte_estado_finca', id)}
          />
        </div>

        <div id="parte-bloque-b" className="scroll-mt-4">
          <FormTrabajosRealizado
            parteId={parteId}
            trabajos={trabajos}
            fecha={fecha}
            esHoy={esHoy}
            onDelete={(id) => eliminar('parte_trabajo', id)}
          />
        </div>

        <div id="parte-bloque-c" className="scroll-mt-4">
          <FormAnotacionesLibres
            parteId={parteId}
            personales={personales}
            esHoy={esHoy}
            onDelete={(id) => eliminar('parte_personal', id)}
          />
        </div>

        <div id="parte-bloque-d" className="scroll-mt-4">
          <FormLogisticaResiduos
            parteId={parteId}
            residuos={residuos}
            fecha={fecha}
            esHoy={esHoy}
            onDelete={(id) => eliminar('parte_residuos_vegetales', id)}
          />
        </div>

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

      <ModalCierreJornadaParteDiario
        open={showCierre}
        resultado={cierreResultado}
        onClose={() => setShowCierre(false)}
        onVerPlanificacion={() => { setShowCierre(false); navigate('/trabajos') }}
      />

    </div>
  )
}
