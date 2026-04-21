import React from 'react'
import {
  X, ChevronRight, Activity, Sprout, Wheat, Camera, FlaskConical, Leaf, Droplets, Layers,
} from 'lucide-react'
import type { Map as LeafletMap } from 'leaflet'
import type { ParcelFeature, ParcelStatus } from '@/types/farm'
import { STATUS_COLORS } from '@/types/farm'
import { MENU_ITEMS, type MenuId, type RegisterAction } from '@/components/FarmMap/farmMapConstants'
import ParcelHistory from '@/components/ParcelHistory'

type StatusMap = Record<string, ParcelStatus> | undefined

type Props = {
  activeMenu: MenuId | null
  setActiveMenu: (m: MenuId | null) => void
  parcels: ParcelFeature[]
  statuses: StatusMap
  selectedParcel: ParcelFeature | null
  setSelectedParcel: (p: ParcelFeature | null) => void
  setTooltipParcel: (p: ParcelFeature | null) => void
  sueloParam: string
  setSueloParam: (s: string) => void
  setActiveModal: (a: RegisterAction) => void
  parcelNombre: string
  parcelId: string | null
  mapRef: React.RefObject<LeafletMap | null>
}

export function FarmMapSidePanels({
  activeMenu,
  setActiveMenu,
  parcels,
  statuses,
  selectedParcel,
  setSelectedParcel,
  setTooltipParcel,
  sueloParam,
  setSueloParam,
  setActiveModal,
  parcelNombre,
  parcelId,
  mapRef,
}: Props) {
  const panelShell =
    'absolute z-[999] bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 rounded-lg flex flex-col overflow-hidden shadow-2xl max-md:inset-x-3 max-md:top-14 max-md:bottom-[5.5rem] max-md:w-auto max-md:max-h-[min(70vh,calc(100dvh-8rem))] md:top-4 md:right-52 md:bottom-10 md:left-auto md:max-h-none'

  return (
    <>
      {activeMenu === 'sectores' && (
        <div className={`${panelShell} md:w-72`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
            <span className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest">Sectores</span>
            <button type="button" onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {parcels.map(p => {
              const status = statuses?.[p.properties.parcel_id] ?? 'vacia'
              return (
                <button
                  key={p.properties.parcel_id}
                  type="button"
                  onClick={() => {
                    setSelectedParcel(p)
                    setTooltipParcel(p)
                    const map = mapRef.current
                    if (map) {
                      const rawCoords = p.geometry.type === 'Polygon'
                        ? p.geometry.coordinates[0]
                        : p.geometry.coordinates[0][0]
                      const lats = (rawCoords as number[][]).map(c => c[1])
                      const lngs = (rawCoords as number[][]).map(c => c[0])
                      map.flyTo(
                        [(Math.min(...lats) + Math.max(...lats)) / 2,
                         (Math.min(...lngs) + Math.max(...lngs)) / 2],
                        16, { duration: 1 }
                      )
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                    selectedParcel?.properties.parcel_id === p.properties.parcel_id
                      ? 'bg-[#6d9b7d]/10 border-[#6d9b7d]/30 dark:border-[#6d9b7d]/40'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                  }`}
                >
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white">{p.properties.parcela}</p>
                    <p className="text-[9px] text-slate-500">{p.properties.superficie?.toFixed(2)} ha</p>
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status] }} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {activeMenu === 'suelo' && (
        <div className={`${panelShell} md:w-72`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Capa Agronómica
            </span>
            <button type="button" onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white transition-colors" /></button>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">Selecciona el parámetro agronómico para colorear los sectores del mapa (basado en el último análisis de suelo).</p>
            <div className="space-y-1.5">
              {['pH', 'EC', 'N', 'P', 'K', 'MO'].map(param => (
                <button
                  key={param}
                  type="button"
                  onClick={() => setSueloParam(param)}
                  className={`w-full text-left px-3 py-2.5 rounded border text-[11px] font-bold transition-all flex justify-between items-center ${
                    sueloParam === param
                      ? 'bg-[#6d9b7d]/10 border-[#6d9b7d]/40 text-[#6d9b7d]'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-white/10 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>
                    {param === 'pH' ? 'pH (Acidez)' : param === 'EC' ? 'EC (Conductividad)' : param === 'N' ? 'Nitrógeno (ppm)' : param === 'P' ? 'Fósforo (ppm)' : param === 'K' ? 'Potasio (ppm)' : 'Materia Orgánica (%)'}
                  </span>
                  {sueloParam === param && <div className="w-1.5 h-1.5 rounded-full bg-[#6d9b7d] animate-pulse" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeMenu === 'registrar' && (
        <div className={`${panelShell} md:w-72`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div>
              <span className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest">Registrar</span>
              {selectedParcel && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{parcelNombre}</p>}
            </div>
            <button type="button" onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!selectedParcel ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-8 uppercase tracking-widest">
                Selecciona un sector en el mapa primero
              </p>
            ) : (
              <div className="space-y-2">
                {[
                  { label: 'Estado / Análisis', icon: Activity, action: 'estado_unificado' as RegisterAction },
                  { label: 'Plantación', icon: Sprout, action: 'estado_unificado' as RegisterAction },
                  { label: 'Cosecha', icon: Wheat, action: 'estado_unificado' as RegisterAction },
                  { label: 'Foto', icon: Camera, action: 'photo' as RegisterAction },
                ].map(({ label, icon: Icon, action }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setActiveModal(action); setActiveMenu(null) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-[#6d9b7d]/30 transition-all text-left"
                  >
                    <Icon className="w-4 h-4 text-[#6d9b7d] shrink-0" />
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">{label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 ml-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeMenu === 'analisis' && (
        <div className={`${panelShell} md:w-72`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div>
              <span className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest">Análisis</span>
              {selectedParcel && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{parcelNombre}</p>}
            </div>
            <button type="button" onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!selectedParcel ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-8 uppercase tracking-widest">
                Selecciona un sector en el mapa primero
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 px-1 pb-1">
                  Suelo, agua y sensor están integrados en el formulario unificado.
                </p>
                {[
                  { label: 'Análisis de Suelo', icon: FlaskConical, desc: 'pH · EC · NPK · textura' },
                  { label: 'Sensor NDVI / SPAD', icon: Leaf, desc: 'Salud vegetal · clorofila' },
                  { label: 'Análisis Agua Riego', icon: Droplets, desc: 'Calidad agua por fuente' },
                ].map(({ label, icon: Icon, desc }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setActiveModal('estado_unificado'); setActiveMenu(null) }}
                    className="w-full flex items-start gap-3 px-3 py-3 rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-[#6d9b7d]/30 transition-all text-left"
                  >
                    <Icon className="w-4 h-4 text-[#6d9b7d] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wide">{label}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 mt-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeMenu === 'historico' && (
        <div className={`${panelShell} md:w-[480px]`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div>
              <span className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest">Histórico</span>
              {selectedParcel && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{parcelNombre}</p>}
            </div>
            <button type="button" onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedParcel ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-8 uppercase tracking-widest p-4">
                Selecciona un sector en el mapa primero
              </p>
            ) : (
              <ParcelHistory parcelId={parcelId!} onClose={() => setActiveMenu(null)} />
            )}
          </div>
        </div>
      )}

      {['trazabilidad', 'alertas'].includes(activeMenu ?? '') && (
        <div className={`${panelShell} md:w-72`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
            <span className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest">
              {MENU_ITEMS.find(m => m.id === activeMenu)?.label}
            </span>
            <button type="button" onClick={() => setActiveMenu(null)}><X className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-white" /></button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
            {selectedParcel ? (
              <>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-widest">{parcelNombre}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center">
                  Módulo disponible cuando se introduzcan datos de campo
                </p>
              </>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center uppercase tracking-widest">
                Selecciona un sector en el mapa primero
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
