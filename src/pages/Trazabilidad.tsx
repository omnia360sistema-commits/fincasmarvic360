import React, { useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, X } from 'lucide-react'
import {
  usePalots,
  useAddPalot,
  useCamarasAlmacen,
  useMovimientosPalot,
  useAddMovimientoPalot,
  useLocalPalot,
  useDeletePalot,
  useUpdatePalot,
} from '@/hooks/useTrazabilidad'
import { useParcelas } from '@/hooks/useParcelData'
import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/integrations/supabase/types'
import { useQuery } from '@tanstack/react-query'
import SelectWithOther from '@/components/base/SelectWithOther'
import { useAuth } from '@/context/AuthContext'
import { nombreFirmaPdfFromUser } from '@/utils/pdfUtils'
import { trazabilidadGenerarPdfTimeline } from '@/utils/trazabilidadTimelinePdf'
import type { PalotRow, TrazabilidadTimelineEvent } from '@/components/Trazabilidad/trazabilidadTypes'
import { TIPOS_MOVIMIENTO } from '@/components/Trazabilidad/trazabilidadConstants'
import {
  TrazabilidadTabPalots,
  TrazabilidadTabCamaras,
  TrazabilidadTabScanner,
  TrazabilidadTabTimeline,
} from '@/components/Trazabilidad/TrazabilidadPageTabs'

const URL_TO_TAB: Record<string, string> = {
  palots: 'palots',
  camaras: 'camaras',
  escaner: 'scanner',
  scanner: 'scanner',
  timeline: 'timeline',
}

const TAB_TO_URL: Record<string, string> = {
  palots: 'palots',
  camaras: 'camaras',
  scanner: 'escaner',
  timeline: 'timeline',
}

export default function Trazabilidad() {
  const { user } = useAuth()
  const firmaPdf = nombreFirmaPdfFromUser(user)
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const tabValue = useMemo(() => {
    if (!rawTab) return 'palots'
    return URL_TO_TAB[rawTab] ?? 'palots'
  }, [rawTab])

  const setTabValue = useCallback(
    (v: string) => {
      setSearchParams(
        prev => {
          const p = new URLSearchParams(prev)
          p.set('tab', TAB_TO_URL[v] ?? 'palots')
          return p
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const { data: palots = [], isLoading: loadingPalots } = usePalots(null, filtroEstado)
  const { data: camaras = [] } = useCamarasAlmacen()
  const [scanInput, setScanInput] = useState('')
  const [searchedQR, setSearchedQR] = useState('')

  const [showAltaPalot, setShowAltaPalot] = useState(false)
  const [showMovimiento, setShowMovimiento] = useState<string | null>(null)

  const [altaParcela, setAltaParcela] = useState('')
  const [altaCosecha, setAltaCosecha] = useState('')
  const [altaCultivo, setAltaCultivo] = useState('')
  const [altaLote, setAltaLote] = useState('')
  const [altaPeso, setAltaPeso] = useState('')

  const [movTipo, setMovTipo] = useState('')
  const [movOperador, setMovOperador] = useState('')
  const [movNotas, setMovNotas] = useState('')

  const mutAddPalot = useAddPalot()
  const mutAddMov = useAddMovimientoPalot()
  const mutDeletePalot = useDeletePalot()
  const mutUpdatePalot = useUpdatePalot()
  const [editPalot, setEditPalot] = useState<PalotRow | null>(null)
  const [editPeso, setEditPeso] = useState('')
  const [editCultivo, setEditCultivo] = useState('')
  const [editLote, setEditLote] = useState('')

  const { data: parcelas = [] } = useParcelas()

  const { data: palotEscaneado, isLoading: loadingScan } = useLocalPalot(searchedQR)
  const { data: palotMovimientos } = useMovimientosPalot(palotEscaneado?.id ?? null)

  const [timelineFinca, setTimelineFinca] = useState('')
  const [timelineParcela, setTimelineParcela] = useState('')
  const { data: parcelasTimeline = [] } = useParcelas(timelineFinca || undefined)

  const { data: timelineData, isLoading: loadingTimeline } = useQuery({
    queryKey: ['trazabilidad_timeline', timelineParcela],
    queryFn: async () => {
      if (!timelineParcela) return null

      const [
        { data: suelo },
        { data: plantaciones },
        { data: trabajos },
        { data: sensores },
        { data: cosechas },
        { data: palots },
      ] = await Promise.all([
        supabase.from('analisis_suelo').select('*').eq('parcel_id', timelineParcela),
        supabase.from('plantings').select('*').eq('parcel_id', timelineParcela),
        supabase.from('work_records').select('*, cuadrillas(nombre)').eq('parcel_id', timelineParcela),
        supabase.from('lecturas_sensor_planta').select('*').eq('parcel_id', timelineParcela),
        supabase.from('harvests').select('*').eq('parcel_id', timelineParcela),
        supabase.from('palots').select('*').eq('parcel_id', timelineParcela),
      ])

      const { data: zonasTimeline } = await supabase.from('sistema_riego_zonas').select('id').eq('parcel_id', timelineParcela)
      const zonaIdsTimeline = (zonasTimeline ?? []).map(z => z.id)
      const { data: riegos } =
        zonaIdsTimeline.length > 0
          ? await supabase.from('registros_riego').select('*').in('zona_id', zonaIdsTimeline)
          : { data: [] as Tables<'registros_riego'>[] }

      const palotIds = (palots || []).map(p => p.id)
      let movimientos: (Tables<'movimientos_palot'> & { camiones?: { matricula: string | null } | null })[] = []
      if (palotIds.length > 0) {
        const { data: movs } = await supabase.from('movimientos_palot').select('*, camiones(matricula)').in('palot_id', palotIds)
        movimientos = movs || []
      }

      const events: TrazabilidadTimelineEvent[] = []

      ;((suelo ?? []) as TrazabilidadTimelineEvent['data'][]).forEach(e =>
        events.push({ id: e.id, type: 'suelo', date: new Date(e.fecha || e.created_at || 0), data: e }),
      )
      ;((plantaciones ?? []) as TrazabilidadTimelineEvent['data'][]).forEach(e =>
        events.push({ id: e.id, type: 'plantacion', date: new Date(e.date || e.created_at || 0), data: e }),
      )
      ;((trabajos ?? []) as TrazabilidadTimelineEvent['data'][]).forEach(e =>
        events.push({ id: e.id, type: 'trabajo', date: new Date(e.date || e.created_at || 0), data: e }),
      )
      ;((riegos ?? []) as TrazabilidadTimelineEvent['data'][]).forEach(e =>
        events.push({ id: e.id, type: 'riego', date: new Date(e.fecha || e.created_at || 0), data: e }),
      )
      ;((sensores ?? []) as TrazabilidadTimelineEvent['data'][]).forEach(e =>
        events.push({ id: e.id, type: 'sensor', date: new Date(e.fecha || e.created_at || 0), data: e }),
      )
      ;((cosechas ?? []) as TrazabilidadTimelineEvent['data'][]).forEach(e =>
        events.push({ id: e.id, type: 'cosecha', date: new Date(e.date || e.created_at || 0), data: e }),
      )
      ;((palots ?? []) as TrazabilidadTimelineEvent['data'][]).forEach(e =>
        events.push({ id: e.id, type: 'palot', date: new Date(e.created_at || 0), data: e }),
      )
      ;((movimientos ?? []) as TrazabilidadTimelineEvent['data'][]).forEach(e =>
        events.push({ id: e.id, type: 'movimiento', date: new Date(e.timestamp || e.created_at || 0), data: e }),
      )

      return events.sort((a, b) => b.date.getTime() - a.date.getTime())
    },
    enabled: !!timelineParcela,
  })

  const missingFlags = {
    suelo: timelineData && !timelineData.some(e => e.type === 'suelo'),
    plantacion: timelineData && !timelineData.some(e => e.type === 'plantacion'),
    cosecha: timelineData && !timelineData.some(e => e.type === 'cosecha'),
    palot: timelineData && !timelineData.some(e => e.type === 'palot'),
  }

  const [generandoPDF, setGenerandoPDF] = useState(false)

  async function generarPDFTimeline() {
    if (!timelineData || !timelineParcela) return
    await trazabilidadGenerarPdfTimeline({
      timelineData,
      timelineParcela,
      timelineFinca,
      firmaPdf,
      setGenerandoPDF,
    })
  }

  async function handleAltaPalot(e: React.FormEvent) {
    e.preventDefault()
    await mutAddPalot.mutateAsync({
      parcel_id: altaParcela || null,
      harvest_id: altaCosecha || null,
      cultivo: altaCultivo || null,
      lote: altaLote || null,
      peso_kg: parseFloat(altaPeso) || null,
      estado: 'en_campo',
    })
    setShowAltaPalot(false)
    setAltaParcela('')
    setAltaCosecha('')
    setAltaCultivo('')
    setAltaLote('')
    setAltaPeso('')
  }

  async function handleMovimiento(e: React.FormEvent) {
    e.preventDefault()
    if (!showMovimiento || !movTipo) return

    let lat = null,
      lng = null
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
        })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch (err) {
        console.warn('No GPS', err)
      }
    }

    let nuevoEstado = 'en_campo'
    if (movTipo === 'carga_campo') nuevoEstado = 'en_transporte'
    if (movTipo === 'descarga_almacen' || movTipo === 'entrada_camara') nuevoEstado = 'en_almacen'
    if (movTipo === 'salida_expedicion') nuevoEstado = 'expedido'

    await mutAddMov.mutateAsync({
      palot_id: showMovimiento,
      tipo: movTipo,
      operador: movOperador || null,
      notas: movNotas || null,
      latitud: lat,
      longitud: lng,
    })

    await mutUpdatePalot.mutateAsync({ id: showMovimiento, estado: nuevoEstado })

    setShowMovimiento(null)
    setMovTipo('')
    setMovOperador('')
    setMovNotas('')
  }

  return (
    <div className="flex flex-col min-h-screen pt-4 pb-10 pr-4 pl-14 md:p-4 md:pb-10 max-w-6xl mx-auto w-full text-slate-200">
      <div className="flex flex-col gap-3 mb-6 shrink-0 max-md:items-stretch md:flex-row md:items-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <Package className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">Trazabilidad Lotes</h1>
          <p className="text-xs text-slate-400 font-medium">Control integral de palots y cámaras de almacenamiento</p>
        </div>
      </div>

      <Tabs value={tabValue} onValueChange={setTabValue} className="flex-1 flex flex-col min-h-0">
        <TabsList className="bg-slate-900 border border-white/5 shrink-0 grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger
            value="palots"
            className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-[#6d9b7d]/10 data-[state=active]:text-[#6d9b7d]"
          >
            PALOTS
          </TabsTrigger>
          <TabsTrigger
            value="camaras"
            className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-[#6d9b7d]/10 data-[state=active]:text-[#6d9b7d]"
          >
            CÁMARAS
          </TabsTrigger>
          <TabsTrigger
            value="scanner"
            className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-[#6d9b7d]/10 data-[state=active]:text-[#6d9b7d]"
          >
            SCANNER QR
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="text-xs font-bold uppercase tracking-wider data-[state=active]:bg-[#6d9b7d]/10 data-[state=active]:text-[#6d9b7d]"
          >
            TIMELINE PARCELA
          </TabsTrigger>
        </TabsList>

        <TrazabilidadTabPalots
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          loadingPalots={loadingPalots}
          palots={palots}
          onOpenAlta={() => setShowAltaPalot(true)}
          onOpenMovimiento={setShowMovimiento}
          onDeletePalot={id => mutDeletePalot.mutate(id)}
          onStartEdit={p => {
            setEditPalot(p)
            setEditPeso(p.peso_kg != null ? String(p.peso_kg) : '')
            setEditCultivo(p.cultivo ?? '')
            setEditLote(p.lote ?? '')
          }}
        />

        <TrazabilidadTabCamaras camaras={camaras} />

        <TrazabilidadTabScanner
          scanInput={scanInput}
          setScanInput={setScanInput}
          onConsultar={() => setSearchedQR(scanInput)}
          loadingScan={loadingScan}
          palotEscaneado={palotEscaneado as PalotRow | null | undefined}
          palotMovimientos={palotMovimientos}
        />

        <TrazabilidadTabTimeline
          timelineFinca={timelineFinca}
          setTimelineFinca={setTimelineFinca}
          setTimelineParcela={setTimelineParcela}
          timelineParcela={timelineParcela}
          parcelasTimeline={parcelasTimeline}
          loadingTimeline={loadingTimeline}
          timelineData={timelineData ?? undefined}
          missingFlags={missingFlags}
          generandoPDF={generandoPDF}
          onGenerarPdf={() => {
            void generarPDFTimeline()
          }}
        />
      </Tabs>

      {showAltaPalot && (
        <div className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">Alta de Palot</h3>
              <button type="button" onClick={() => setShowAltaPalot(false)}>
                <X className="w-5 h-5 text-slate-500 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleAltaPalot} className="space-y-4">
              <SelectWithOther
                label="Parcela / Sector"
                options={parcelas.map(p => p.parcel_id)}
                value={altaParcela}
                onChange={setAltaParcela}
                onCreateNew={setAltaParcela}
                placeholder="Seleccionar..."
              />
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Cultivo</p>
                <input
                  type="text"
                  value={altaCultivo}
                  onChange={e => setAltaCultivo(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Lote</p>
                <input
                  type="text"
                  value={altaLote}
                  onChange={e => setAltaLote(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Peso Neto (Kg)</p>
                <input
                  type="number"
                  step="0.1"
                  value={altaPeso}
                  onChange={e => setAltaPeso(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#6d9b7d] text-slate-900 font-bold rounded-xl mt-4 uppercase tracking-widest text-xs hover:bg-[#6d9b7d]/90 transition-colors"
              >
                Generar Palot
              </button>
            </form>
          </div>
        </div>
      )}

      {showMovimiento && (
        <div className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">Registrar Movimiento</h3>
              <button type="button" onClick={() => setShowMovimiento(null)}>
                <X className="w-5 h-5 text-slate-500 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleMovimiento} className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Tipo de Movimiento *</p>
                <select
                  required
                  value={movTipo}
                  onChange={e => setMovTipo(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white"
                >
                  <option value="">-- Seleccionar --</option>
                  {TIPOS_MOVIMIENTO.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Operador</p>
                <input
                  type="text"
                  value={movOperador}
                  onChange={e => setMovOperador(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Notas</p>
                <textarea
                  rows={3}
                  value={movNotas}
                  onChange={e => setMovNotas(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#6d9b7d] text-slate-900 font-bold rounded-xl mt-4 uppercase tracking-widest text-xs hover:bg-[#6d9b7d]/90 transition-colors"
              >
                Guardar Movimiento
              </button>
            </form>
          </div>
        </div>
      )}

      {editPalot && (
        <div className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">Editar Palot</h3>
              <button type="button" onClick={() => setEditPalot(null)}>
                <X className="w-5 h-5 text-slate-500 hover:text-white" />
              </button>
            </div>
            <form
              onSubmit={async e => {
                e.preventDefault()
                await mutUpdatePalot.mutateAsync({
                  id: editPalot.id,
                  peso_kg: editPeso ? parseFloat(editPeso) : null,
                  cultivo: editCultivo || null,
                  lote: editLote || null,
                })
                setEditPalot(null)
              }}
              className="space-y-4"
            >
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Cultivo</p>
                <input
                  type="text"
                  value={editCultivo}
                  onChange={e => setEditCultivo(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Lote</p>
                <input
                  type="text"
                  value={editLote}
                  onChange={e => setEditLote(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase font-bold">Peso Neto (Kg)</p>
                <input
                  type="number"
                  step="0.1"
                  value={editPeso}
                  onChange={e => setEditPeso(e.target.value)}
                  className="w-full bg-slate-800 rounded-lg border border-slate-700 px-3 py-2 text-sm text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-[#6d9b7d] text-slate-900 font-bold rounded-xl mt-4 uppercase tracking-widest text-xs hover:bg-[#6d9b7d]/90 transition-colors"
              >
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
