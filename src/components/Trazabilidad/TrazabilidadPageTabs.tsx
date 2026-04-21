import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import {
  QrCode,
  Package,
  Thermometer,
  Plus,
  Search,
  MapPin,
  Box,
  FileText,
  Loader2,
} from 'lucide-react'
import SelectWithOther from '@/components/base/SelectWithOther'
import RecordActions from '@/components/base/RecordActions'
import { toast } from '@/hooks/use-toast'
import { FINCAS_NOMBRES } from '@/constants/farms'
import { ESTADOS_PALOT, TIPOS_MOVIMIENTO } from '@/components/Trazabilidad/trazabilidadConstants'
import type { PalotRow, TrazabilidadTimelineEvent, TrazabilidadTimelineMissingFlags } from '@/components/Trazabilidad/trazabilidadTypes'
import {
  getTrazabilidadTimelineIcon,
  renderTrazabilidadTimelineEventInfo,
  TrazabilidadTimelineMissingBadges,
} from '@/components/Trazabilidad/trazabilidadTimelineUi'

type CamaraRow = {
  id: string
  nombre: string
  temperatura_objetivo?: number | null
  capacidad_palots?: number | null
}

type MovimientoRow = {
  id: string
  tipo: string
  timestamp: string
  operador?: string | null
}

type ParcelaOpt = { parcel_id: string; parcel_number: string }

export function TrazabilidadTabPalots(props: {
  filtroEstado: string
  setFiltroEstado: (v: string) => void
  loadingPalots: boolean
  palots: PalotRow[]
  onOpenAlta: () => void
  onOpenMovimiento: (palotId: string) => void
  onDeletePalot: (id: string) => void
  onStartEdit: (p: PalotRow) => void
}) {
  const {
    filtroEstado,
    setFiltroEstado,
    loadingPalots,
    palots,
    onOpenAlta,
    onOpenMovimiento,
    onDeletePalot,
    onStartEdit,
  } = props

  return (
    <TabsContent value="palots" className="flex-1 overflow-y-auto mt-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <SelectWithOther
          options={['todos', ...Object.keys(ESTADOS_PALOT)]}
          value={filtroEstado}
          onChange={setFiltroEstado}
          onCreateNew={() =>
            toast({
              title: 'Estado fijo',
              description: 'Los estados de palot están predefinidos por el flujo de trazabilidad.',
            })
          }
          placeholder="Filtrar por estado..."
        />
        <button
          type="button"
          onClick={onOpenAlta}
          className="px-4 py-2 bg-[#6d9b7d] text-slate-900 font-bold rounded-lg text-xs uppercase flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Alta Palot
        </button>
      </div>

      {loadingPalots && <p className="text-center py-10 text-slate-500 animate-pulse">Cargando palots...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {palots.map(p => (
          <div
            key={p.id}
            className="bg-slate-900/60 border border-white/5 p-4 rounded-xl relative overflow-hidden group hover:border-[#6d9b7d]/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Nº palot</p>
                <p className="text-xs font-mono text-slate-300">{p.numero_palot.split('-')[0]}</p>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  ESTADOS_PALOT[p.estado as keyof typeof ESTADOS_PALOT]
                }`}
              >
                {p.estado?.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-1.5 mb-4">
              <p className="text-sm font-black text-white">
                {p.cultivo ?? 'Sin cultivo'}{' '}
                <span className="text-slate-500 font-normal">| Lote {p.lote ?? '-'}</span>
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Sector {p.parcels?.parcel_number ?? p.parcel_id ?? 'N/A'}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Box className="w-3 h-3" /> {p.peso_kg ? `${p.peso_kg} Kg` : 'Peso sin registrar'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenMovimiento(p.id)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-[#6d9b7d] rounded-lg transition-colors border border-white/5"
            >
              Registrar Movimiento
            </button>
            <div className="mt-2 pt-2 border-t border-white/5">
              <RecordActions
                onEdit={() => onStartEdit(p)}
                onDelete={() => onDeletePalot(p.id)}
                confirmMessage="¿Eliminar este palot? Esta acción no puede deshacerse."
              />
            </div>
          </div>
        ))}
      </div>
    </TabsContent>
  )
}

export function TrazabilidadTabCamaras(props: { camaras: CamaraRow[] }) {
  const { camaras } = props
  return (
    <TabsContent value="camaras" className="flex-1 overflow-y-auto mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {camaras.map(c => (
          <div key={c.id} className="bg-slate-900 border border-white/10 rounded-xl p-5 relative overflow-hidden">
            <Thermometer className="absolute top-4 right-4 w-12 h-12 text-slate-800" />
            <h3 className="text-lg font-black text-white mb-1">{c.nombre}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Objetivo: <span className="text-emerald-400 font-bold">{c.temperatura_objetivo ?? '-'}°C</span>
            </p>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Capacidad Máxima</p>
              <p className="text-xl font-black text-white">
                {c.capacidad_palots ?? 'N/D'} <span className="text-xs text-slate-400 font-normal">palots</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </TabsContent>
  )
}

export function TrazabilidadTabScanner(props: {
  scanInput: string
  setScanInput: (v: string) => void
  onConsultar: () => void
  loadingScan: boolean
  palotEscaneado: PalotRow | null | undefined
  palotMovimientos: MovimientoRow[] | null | undefined
}) {
  const { scanInput, setScanInput, onConsultar, loadingScan, palotEscaneado, palotMovimientos } = props

  return (
    <TabsContent value="scanner" className="flex-1 overflow-y-auto mt-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="p-6 bg-slate-900/80 rounded-2xl border border-[#6d9b7d]/20 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(56,189,248,0.1)]">
          <div className="w-16 h-16 bg-[#6d9b7d]/20 rounded-full flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-[#6d9b7d]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Escáner de Palot</h3>
          <p className="text-xs text-slate-400 mb-6">
            Introduce el código QR exacto del palot para consultar su trazabilidad completa.
          </p>

          <div className="relative w-full">
            <input
              type="text"
              placeholder="Escanear o teclear QR..."
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onConsultar()
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#6d9b7d] transition-colors font-mono"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>
          <button
            type="button"
            onClick={onConsultar}
            className="w-full mt-3 py-3 bg-[#6d9b7d] text-slate-900 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#6d9b7d]/90"
          >
            Consultar Palot
          </button>
        </div>

        {loadingScan && <p className="text-center text-slate-500 animate-pulse">Buscando en base de datos...</p>}

        {palotEscaneado && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">FICHA DE PALOT</p>
                <p className="text-sm font-mono text-[#6d9b7d]">{palotEscaneado.numero_palot}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider ${
                  ESTADOS_PALOT[palotEscaneado.estado as keyof typeof ESTADOS_PALOT]
                }`}
              >
                {palotEscaneado.estado?.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Cultivo</p>
                <p className="text-sm font-bold">{palotEscaneado.cultivo || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Lote</p>
                <p className="text-sm font-bold">{palotEscaneado.lote || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Peso</p>
                <p className="text-sm font-bold">{palotEscaneado.peso_kg ? `${palotEscaneado.peso_kg} Kg` : '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Sector</p>
                <p className="text-sm font-bold">
                  {palotEscaneado.parcels?.parcel_number || palotEscaneado.parcel_id || '-'}
                </p>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-3">
              Historial de Movimientos
            </h4>
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
              {palotMovimientos?.map(m => (
                <div
                  key={m.id}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-700 bg-slate-900 text-slate-500 group-[.is-active]:text-emerald-500 group-[.is-active]:bg-emerald-500/10 group-[.is-active]:border-emerald-500/30 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    <p className="text-xs font-bold text-[#6d9b7d] mb-1">
                      {TIPOS_MOVIMIENTO.find(t => t.value === m.tipo)?.label || m.tipo}
                    </p>
                    <p className="text-[10px] text-slate-400">{new Date(m.timestamp).toLocaleString('es-ES')}</p>
                    {m.operador && <p className="text-[10px] text-slate-500 mt-1">Operador: {m.operador}</p>}
                  </div>
                </div>
              ))}
              {!palotMovimientos?.length && (
                <p className="text-xs text-slate-500 text-center italic py-2">No hay movimientos registrados</p>
              )}
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  )
}

export function TrazabilidadTabTimeline(props: {
  timelineFinca: string
  setTimelineFinca: (v: string) => void
  setTimelineParcela: (v: string) => void
  timelineParcela: string
  parcelasTimeline: ParcelaOpt[]
  loadingTimeline: boolean
  timelineData: TrazabilidadTimelineEvent[] | null | undefined
  missingFlags: TrazabilidadTimelineMissingFlags
  generandoPDF: boolean
  onGenerarPdf: () => void
}) {
  const {
    timelineFinca,
    setTimelineFinca,
    setTimelineParcela,
    timelineParcela,
    parcelasTimeline,
    loadingTimeline,
    timelineData,
    missingFlags,
    generandoPDF,
    onGenerarPdf,
  } = props

  return (
    <TabsContent value="timeline" className="flex-1 overflow-y-auto mt-4 space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/60 p-4 border border-white/5 rounded-xl">
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Finca</p>
          <select
            value={timelineFinca}
            onChange={e => {
              setTimelineFinca(e.target.value)
              setTimelineParcela('')
            }}
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6d9b7d]"
          >
            <option value="">-- Seleccionar --</option>
            {FINCAS_NOMBRES.map(f => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Parcela / Sector</p>
          <select
            disabled={!timelineFinca}
            value={timelineParcela}
            onChange={e => setTimelineParcela(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6d9b7d] disabled:opacity-50"
          >
            <option value="">-- Seleccionar --</option>
            {parcelasTimeline.map(p => (
              <option key={p.parcel_id} value={p.parcel_id}>
                {p.parcel_number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {timelineParcela && !loadingTimeline && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Trazabilidad del Sector</h3>
              <TrazabilidadTimelineMissingBadges missingFlags={missingFlags} />
            </div>
            <button
              type="button"
              onClick={onGenerarPdf}
              disabled={generandoPDF || !timelineData?.length}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#6d9b7d] hover:bg-emerald-500 text-slate-900 font-black rounded-lg text-xs uppercase tracking-widest transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            >
              {generandoPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Descargar PDF
            </button>
          </div>

          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6 pb-4">
            {timelineData?.map((ev, idx) => (
              <div key={ev.id + ev.type + idx} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                </div>
                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getTrazabilidadTimelineIcon(ev.type)}
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{ev.type}</span>
                    </div>
                    <span className="text-[10px] text-[#6d9b7d] font-mono bg-[#6d9b7d]/10 border border-[#6d9b7d]/20 px-2 py-1 rounded">
                      {ev.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{renderTrazabilidadTimelineEventInfo(ev)}</p>
                </div>
              </div>
            ))}
            {(!timelineData || timelineData.length === 0) && (
              <p className="pl-6 text-slate-500 italic text-sm">No hay eventos registrados para esta parcela.</p>
            )}
          </div>
        </div>
      )}
      {loadingTimeline && (
        <p className="text-center py-10 text-slate-500 animate-pulse">Cargando línea de tiempo...</p>
      )}
    </TabsContent>
  )
}
