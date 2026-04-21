import React from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { MENU_ITEMS, type MenuId } from '@/components/FarmMap/farmMapConstants'

type Props = {
  decodedFarm: string
  horaStr: string
  onBack: () => void
  activeMenu: MenuId | null
  setActiveMenu: React.Dispatch<React.SetStateAction<MenuId | null>>
  onOpenInformePdf: () => void
}

export function FarmMapHeaderAndMenu({
  decodedFarm,
  horaStr,
  onBack,
  activeMenu,
  setActiveMenu,
  onOpenInformePdf,
}: Props) {
  return (
    <>
      <div className="absolute z-[1000] bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 shadow-lg max-md:top-14 max-md:left-3 max-md:right-14 max-md:min-w-0 md:top-4 md:left-4 md:right-auto md:min-w-[200px]">
        <p className="text-[10px] font-black text-[#6d9b7d] uppercase tracking-[0.3em] mb-1">Marvic 360</p>
        <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{decodedFarm}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-500 dark:text-green-400 font-bold uppercase tracking-widest">Operativo</span>
          <span className="text-[10px] text-slate-500 ml-auto font-mono">{horaStr}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="absolute z-[1000] w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center bg-white/90 dark:bg-slate-900/90 hover:border-[#6d9b7d]/40 shadow-lg transition-colors max-md:top-[max(0.75rem,env(safe-area-inset-top))] max-md:left-14 md:top-4 md:left-[220px]"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>

      <div className="absolute z-[1000] flex flex-col gap-1 max-md:top-14 max-md:right-3 max-md:max-h-[min(38vh,320px)] max-md:overflow-y-auto max-md:pr-0.5 md:top-4 md:right-4 md:max-h-none md:overflow-visible">
        {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveMenu(activeMenu === id ? null : id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${
              activeMenu === id
                ? 'bg-[#6d9b7d]/10 dark:bg-[#6d9b7d]/20 border-[#6d9b7d]/40 dark:border-[#6d9b7d]/60 text-[#6d9b7d]'
                : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#6d9b7d]/30 hover:text-[#6d9b7d]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </button>
        ))}

        <div className="h-px bg-slate-200 dark:bg-white/10 my-1" />
        <button
          type="button"
          onClick={onOpenInformePdf}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-[#6d9b7d]/30 hover:text-[#6d9b7d] shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          Informe PDF
        </button>
      </div>
    </>
  )
}
