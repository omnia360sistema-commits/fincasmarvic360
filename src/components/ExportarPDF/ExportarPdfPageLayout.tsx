import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Loader2, Check } from 'lucide-react'
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms'
import { MODULOS } from '@/components/ExportarPDF/exportarPdfConstants'

export type ExportarPdfTab = 'global' | 'agronomico'

type PreviewCounts = {
  parte_diario: number
  trabajos: number
  maquinaria: number
  logistica: number
  personal: number
  campo: number
}

type Props = {
  tab: ExportarPdfTab
  setTab: (t: ExportarPdfTab) => void
  desde: string
  setDesde: (v: string) => void
  hasta: string
  setHasta: (v: string) => void
  modulos: Set<string>
  toggleModulo: (id: string) => void
  preview: PreviewCounts | undefined
  fincaAgro: string
  setFincaAgro: (v: string) => void
  tipoAgro: string
  setTipoAgro: (v: string) => void
  error: string | null
  generando: boolean
  onGenerar: () => void
}

export function ExportarPdfPageLayout({
  tab,
  setTab,
  desde,
  setDesde,
  hasta,
  setHasta,
  modulos,
  toggleModulo,
  preview,
  fincaAgro,
  setFincaAgro,
  tipoAgro,
  setTipoAgro,
  error,
  generando,
  onGenerar,
}: Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <header className="bg-slate-900/80 border-b border-white/10 pl-14 pr-4 py-2.5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <FileText className="w-4 h-4 text-[#6d9b7d]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#6d9b7d]">Exportar PDF Global</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl w-full mx-auto space-y-5">
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setTab('global')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${
              tab === 'global' ? 'bg-[#6d9b7d] text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Global / Módulos
          </button>
          <button
            type="button"
            onClick={() => setTab('agronomico')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${
              tab === 'agronomico' ? 'bg-green-500 text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Reportes Agronómicos
          </button>
        </div>

        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rango de fechas</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={e => setDesde(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#6d9b7d]/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={e => setHasta(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#6d9b7d]/50 outline-none"
              />
            </div>
          </div>
        </div>

        {tab === 'global' && (
          <>
            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Módulos a incluir</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MODULOS.map(m => {
                  const seleccionado = modulos.has(m.id)
                  const count = preview?.[m.id as keyof PreviewCounts] ?? null
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModulo(m.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        seleccionado ? 'border-[#6d9b7d]/40 bg-[#6d9b7d]/5' : 'border-white/10 bg-slate-900/40 hover:border-white/20'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
                        <m.icon className="w-4 h-4" style={{ color: `rgb(${m.color.join(',')})` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white">{m.label}</p>
                        {count !== null && <p className="text-[9px] text-slate-500">{count} registros en el período</p>}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          seleccionado ? 'border-[#6d9b7d] bg-[#6d9b7d]' : 'border-slate-600'
                        }`}
                      >
                        {seleccionado && <Check className="w-3 h-3 text-[#020617]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-slate-500">
                El PDF incluirá todos los registros de los módulos seleccionados en el rango de fechas indicado, ordenados
                cronológicamente.
              </p>
            </div>
          </>
        )}

        {tab === 'agronomico' && (
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Finca (Opcional)
              </label>
              <select
                value={fincaAgro}
                onChange={e => setFincaAgro(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
              >
                <option value="">Todas las fincas</option>
                {FINCAS.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Tipo de Reporte
              </label>
              <select
                value={tipoAgro}
                onChange={e => setTipoAgro(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none"
              >
                <option value="suelo">📊 Análisis de Suelo (pH, EC, NPK)</option>
                <option value="produccion">🚜 Producción y Cosecha</option>
                <option value="certificacion">🛡️ Certificación Ecológica</option>
                <option value="residuos">♻️ Residuos y Plásticos</option>
                <option value="hidrica">💧 Eficiencia Hídrica (L/Kg)</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onGenerar}
          disabled={generando || (tab === 'global' && modulos.size === 0)}
          className={`w-full py-3.5 rounded-xl text-[#020617] font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
            tab === 'agronomico' ? 'bg-green-500 hover:bg-green-400' : 'bg-[#6d9b7d] hover:bg-emerald-400'
          }`}
        >
          {generando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generando PDF…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Descargar PDF Global
            </>
          )}
        </button>
      </main>

      <footer className="bg-slate-900/80 border-t border-white/10 px-4 py-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Marvic 360 · Exportar PDF · {tab === 'global' ? `${modulos.size} módulo(s)` : 'Reporte Agronómico'}
        </span>
      </footer>
    </div>
  )
}
