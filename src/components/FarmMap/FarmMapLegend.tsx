import React from 'react'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/farm'
import type { ParcelStatus } from '@/types/farm'

export function MapLegend({ activeMenu, sueloParam }: { activeMenu: string | null; sueloParam: string }) {
  if (activeMenu === 'suelo') {
    return (
      <div className="absolute z-[1000] bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 space-y-1.5 shadow-lg max-md:bottom-[5.5rem] max-md:left-2 max-md:max-w-[min(92vw,280px)] md:bottom-8 md:left-4">
        <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-200 dark:border-white/10 pb-1">Capa: {sueloParam}</p>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-[#22c55e]" /><span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">Óptimo</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-[#eab308]" /><span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">Alerta / Precaución</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-[#ef4444]" /><span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">Crítico</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-[#64748b]" /><span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium">Sin datos</span></div>
      </div>
    )
  }
  const entries = Object.entries(STATUS_COLORS) as [ParcelStatus, string][]
  return (
    <div className="absolute z-[1000] bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 space-y-1 shadow-lg max-md:bottom-[5.5rem] max-md:left-2 max-md:max-w-[min(92vw,280px)] md:bottom-8 md:left-4">
      {entries.map(([status, color]) => (
        <div key={status} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wide">
            {STATUS_LABELS[status]}
          </span>
        </div>
      ))}
    </div>
  )
}
