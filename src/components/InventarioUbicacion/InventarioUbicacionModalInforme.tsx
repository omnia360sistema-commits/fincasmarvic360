import { X, FileText, AlertCircle } from 'lucide-react'
import type { InformeTipo } from './inventarioUbicacionTypes'
import { MESES_ES } from './inventarioUbicacionConstants'

type CategoriaOpt = { id: string; nombre: string }

type Props = {
  open: boolean
  ubicacionNombre: string | undefined
  categorias: CategoriaOpt[]
  informeTipo: InformeTipo
  setInformeTipo: (t: InformeTipo) => void
  informeFechaInicio: string
  setInformeFechaInicio: (v: string) => void
  informeFechaFin: string
  setInformeFechaFin: (v: string) => void
  informeCategoria: string
  setInformeCategoria: (v: string) => void
  informeMes: number
  setInformeMes: (v: number) => void
  informeAnio: number
  setInformeAnio: (v: number) => void
  generandoPDF: boolean
  generandoExcel: boolean
  pdfError: string | null
  onClose: () => void
  onGenerarPDF: () => void
  onGenerarExcel: () => void
}

export function InventarioUbicacionModalInforme(props: Props) {
  if (!props.open) return null

  const {
    ubicacionNombre,
    categorias,
    informeTipo,
    setInformeTipo,
    informeFechaInicio,
    setInformeFechaInicio,
    informeFechaFin,
    setInformeFechaFin,
    informeCategoria,
    setInformeCategoria,
    informeMes,
    setInformeMes,
    informeAnio,
    setInformeAnio,
    generandoPDF,
    generandoExcel,
    pdfError,
    onClose,
    onGenerarPDF,
    onGenerarExcel,
  } = props

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]">

        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-[0.3em]">
              Informe PDF
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{ubicacionNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-white/10 shrink-0">
          {([
            { id: 'historico' as const, label: 'Histórico' },
            { id: 'categoria' as const, label: 'Por categoría' },
            { id: 'mes' as const, label: 'Stock mes' },
          ]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setInformeTipo(id)}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                informeTipo === id
                  ? 'border-[#6d9b7d] text-[#6d9b7d]'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {informeTipo === 'historico' && (
            <>
              <p className="text-[10px] text-slate-400">
                Todos los registros de esta ubicación en el periodo, agrupados por categoría.
              </p>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={informeFechaInicio}
                  onChange={e => setInformeFechaInicio(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={informeFechaFin}
                  onChange={e => setInformeFechaFin(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
                />
              </div>
            </>
          )}

          {informeTipo === 'categoria' && (
            <>
              <p className="text-[10px] text-slate-400">
                Todos los registros de una categoría específica en el periodo seleccionado.
              </p>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Categoría <span className="text-red-400">*</span>
                </label>
                <select
                  value={informeCategoria}
                  onChange={e => setInformeCategoria(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
                >
                  <option value="">Seleccionar…</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={informeFechaInicio}
                  onChange={e => setInformeFechaInicio(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Fecha fin
                </label>
                <input
                  type="date"
                  value={informeFechaFin}
                  onChange={e => setInformeFechaFin(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
                />
              </div>
            </>
          )}

          {informeTipo === 'mes' && (
            <>
              <p className="text-[10px] text-slate-400">
                El último registro de cada categoría registrado hasta el día 1 del mes seleccionado.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Mes
                  </label>
                  <select
                    value={informeMes}
                    onChange={e => setInformeMes(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
                  >
                    {MESES_ES.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Año
                  </label>
                  <input
                    type="number"
                    min="2024"
                    max="2030"
                    value={informeAnio}
                    onChange={e => setInformeAnio(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
                  />
                </div>
              </div>
            </>
          )}

          {pdfError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">{pdfError}</p>
            </div>
          )}

        </div>

        <div className="shrink-0 px-5 py-4 border-t border-white/10 flex gap-2">
          <button
            onClick={onGenerarPDF}
            disabled={generandoPDF || generandoExcel || (informeTipo === 'categoria' && !informeCategoria)}
            className="flex-1 py-2.5 rounded-lg bg-[#6d9b7d]/20 border border-[#6d9b7d]/40 hover:bg-[#6d9b7d]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-black uppercase tracking-widest text-[#6d9b7d] flex items-center justify-center gap-2"
          >
            {generandoPDF ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#6d9b7d] border-t-transparent rounded-full animate-spin" />
                PDF...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Generar PDF
              </>
            )}
          </button>
          <button
            onClick={onGenerarExcel}
            disabled={generandoPDF || generandoExcel || (informeTipo === 'categoria' && !informeCategoria)}
            className="flex-1 py-2.5 rounded-lg bg-slate-800 border border-white/10 hover:border-[#6d9b7d]/30 hover:text-[#6d9b7d] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-black uppercase tracking-widest text-slate-300 flex items-center justify-center gap-2"
          >
            {generandoExcel ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Excel...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Exportar Excel
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
