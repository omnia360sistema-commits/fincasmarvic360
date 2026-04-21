import React from 'react'
import { ArrowLeft, Tractor, Wrench, Plus, Activity, Navigation } from 'lucide-react'
import type { TabType } from '@/components/Maquinaria/maquinariaConstants'

export type MaquinariaKpisResumen = {
  tractoresActivos: number
  aperosActivos: number
  totalHoras: string
  totalGasolina: string
}

type Props = {
  children?: React.ReactNode
  isDark: boolean
  onBackDashboard: () => void
  onOpenModalUso: () => void
  pdfMenuRef: React.RefObject<HTMLDivElement | null>
  pdfMenuOpen: boolean
  setPdfMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  generandoPdf: boolean
  onElegirPdf: (op: 1 | 2 | 3 | 4 | 5) => void
  kpis?: MaquinariaKpisResumen
  tab: TabType
  setTab: (t: TabType) => void
}

export function MaquinariaPageHeaderKpis({
  children,
  isDark,
  onBackDashboard,
  onOpenModalUso,
  pdfMenuRef,
  pdfMenuOpen,
  setPdfMenuOpen,
  generandoPdf,
  onElegirPdf,
  kpis,
  tab,
  setTab,
}: Props) {
  return (
    <>
      <header className="w-full bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 pl-14 pr-4 py-2 flex items-center gap-3 z-50">
        <button
          type="button"
          onClick={onBackDashboard}
          className="flex items-center gap-1.5 text-slate-400 hover:text-[#6d9b7d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <span className="text-slate-200 dark:text-slate-700">|</span>
        <Tractor className="w-4 h-4 text-orange-400" />
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-white">Maquinaria</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenModalUso}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Uso
          </button>
          <div className="relative" ref={pdfMenuRef}>
            <button
              type="button"
              onClick={() => setPdfMenuOpen(o => !o)}
              disabled={generandoPdf}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#6d9b7d]/20 bg-[#6d9b7d]/5 hover:bg-[#6d9b7d]/10 text-[#6d9b7d] text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {generandoPdf && (
                <span className="w-3 h-3 border-2 border-[#6d9b7d]/20 border-t-[#6d9b7d] rounded-full animate-spin" />
              )}
              PDF {pdfMenuOpen ? '▲' : '▼'}
            </button>
            {pdfMenuOpen && (
              <div
                className={`absolute right-0 top-full z-[70] mt-1 min-w-[240px] rounded-lg border shadow-lg py-1 ${
                  isDark ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-black/40' : 'border-slate-200 bg-white text-slate-800 shadow-slate-400/20'
                }`}
              >
                {(
                  [
                    { k: 1 as const, label: 'Informe completo maquinaria' },
                    { k: 2 as const, label: 'Estado de tractores' },
                    { k: 3 as const, label: 'Aperos activos' },
                    { k: 4 as const, label: 'Uso de maquinaria' },
                    { k: 5 as const, label: 'Mantenimientos' },
                  ] as const
                ).map(({ k, label }) => (
                  <button
                    key={k}
                    type="button"
                    disabled={generandoPdf}
                    onClick={() => {
                      void onElegirPdf(k)
                    }}
                    className={`w-full px-3 py-2.5 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tractores', value: kpis?.tractoresActivos ?? 0, color: '#fb923c' },
            { label: 'Aperos', value: kpis?.aperosActivos ?? 0, color: '#fb923c' },
            { label: 'H. totales', value: kpis?.totalHoras ?? '0', color: '#34d399' },
            { label: 'Gasoil (L)', value: kpis?.totalGasolina ?? '0', color: '#60a5fa' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-1">
          {([
            { id: 'tractores' as TabType, label: 'Tractores', icon: Tractor },
            { id: 'aperos' as TabType, label: 'Aperos', icon: Wrench },
            { id: 'uso' as TabType, label: 'Registros uso', icon: Activity },
            { id: 'gps' as TabType, label: 'GPS / Recorridos', icon: Navigation },
          ]).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                tab === t.id
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <t.icon className="w-3.5 h-3.5 inline mr-1.5" />
              {t.label}
            </button>
          ))}
        </div>

        {children}
      </main>
    </>
  )
}
