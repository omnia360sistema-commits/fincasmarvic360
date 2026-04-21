import React from 'react'
import { X } from 'lucide-react'
import type { ParcelFeature } from '@/types/farm'

export function FarmMapModal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} mx-4 flex flex-col max-h-[85vh]`}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-[0.3em]">{title}</p>
            {subtitle && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export function SectorTooltip({ parcel, onClose }: { parcel: ParcelFeature; onClose: () => void }) {
  const p = parcel.properties
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border border-[#6d9b7d]/30 rounded-lg p-3 min-w-[180px] shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest">{p.parcela}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.finca}</p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase">Superficie</p>
          <p className="text-[11px] font-bold text-slate-900 dark:text-white">{p.superficie?.toFixed(2)} ha</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded px-2 py-1">
          <p className="text-[9px] text-slate-500 uppercase">Código</p>
          <p className="text-[11px] font-bold text-slate-900 dark:text-white">{p.codigo || '—'}</p>
        </div>
      </div>
      <p className="text-[9px] text-slate-500 dark:text-slate-600 text-center mt-2 uppercase tracking-widest">
        Usa el menú derecho para acceder
      </p>
    </div>
  )
}
