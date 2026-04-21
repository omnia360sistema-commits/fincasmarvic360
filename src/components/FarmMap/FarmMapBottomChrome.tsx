import React from 'react'
import { LocateFixed, Tractor } from 'lucide-react'
import type { Map as LeafletMap } from 'leaflet'

type Props = {
  decodedFarm: string
  sectoresActivos: number
  showTractores: boolean
  setShowTractores: React.Dispatch<React.SetStateAction<boolean>>
  coords: { lat: number; lng: number }
  horaStr: string
  mapRef: React.RefObject<LeafletMap | null>
}

export function FarmMapBottomChrome({
  decodedFarm,
  sectoresActivos,
  showTractores,
  setShowTractores,
  coords,
  horaStr,
  mapRef,
}: Props) {
  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-white/10 px-3 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 max-md:pb-[max(0.35rem,env(safe-area-inset-bottom))] md:px-4 md:gap-6 md:py-1.5">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Finca: <span className="text-slate-900 dark:text-white">{decodedFarm}</span>
        </span>
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Sectores: <span className="text-slate-900 dark:text-white">{sectoresActivos}</span>
        </span>

        <button
          type="button"
          onClick={() => setShowTractores(prev => !prev)}
          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 ${
            showTractores ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <Tractor className="w-3 h-3" /> GPS TRACTORES
        </button>

        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Conexión: <span className="text-green-400">Online</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 ml-auto">
          {coords.lat !== 0 ? `${coords.lat.toFixed(5)}° N  ${coords.lng.toFixed(5)}° E` : '—'}
        </span>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400">{horaStr}</span>
      </div>

      <button
        type="button"
        onClick={() => mapRef.current?.locate({ setView: true, maxZoom: 16 })}
        className="absolute z-[1000] w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 hover:border-[#6d9b7d]/40 shadow-lg transition-colors max-md:bottom-[5.5rem] max-md:right-3 md:bottom-10 md:right-4"
      >
        <LocateFixed className="w-4 h-4 text-[#6d9b7d]" />
      </button>
    </>
  )
}
