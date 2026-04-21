import { X, AlertCircle } from 'lucide-react'
import type { ActivoAssignTab } from './inventarioUbicacionTypes'

type TractorOpt = { id: string; matricula: string | null; marca: string | null; modelo: string | null }
type AperoInvOpt = { id: string; denominacion: string | null; codigo: string | null }
type MaqAperoOpt = { id: string; tipo: string; descripcion: string | null; activo: boolean | null }

type Props = {
  open: boolean
  ubicacionId: string | undefined
  activoTab: ActivoAssignTab
  setActivoTab: (t: ActivoAssignTab) => void
  selTractorId: string
  setSelTractorId: (v: string) => void
  selAperoId: string
  setSelAperoId: (v: string) => void
  selMaquinariaAperoId: string
  setSelMaquinariaAperoId: (v: string) => void
  tractoresLibres: TractorOpt[]
  aperosLibres: AperoInvOpt[]
  maquinariaAperosLibres: MaqAperoOpt[]
  activoError: string | null
  setActivoError: (v: string | null) => void
  activoSubmitting: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function InventarioUbicacionModalActivo(props: Props) {
  const {
    open,
    ubicacionId,
    activoTab,
    setActivoTab,
    selTractorId,
    setSelTractorId,
    selAperoId,
    setSelAperoId,
    selMaquinariaAperoId,
    setSelMaquinariaAperoId,
    tractoresLibres,
    aperosLibres,
    maquinariaAperosLibres,
    activoError,
    setActivoError,
    activoSubmitting,
    onClose,
    onSubmit,
  } = props

  if (!open || !ubicacionId) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-slate-900 border border-[#fb923c]/40 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-black text-[#fb923c] uppercase tracking-[0.3em]">
              Asignar a esta ubicación
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Tractor, <span className="font-mono">aperos</span> legacy o <span className="font-mono">maquinaria_aperos</span> (uno por fila, según BD).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="grid grid-cols-3 rounded-lg border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => { setActivoTab('tractor'); setActivoError(null) }}
              className={`py-2 text-[9px] font-black uppercase tracking-wider ${
                activoTab === 'tractor' ? 'bg-[#fb923c]/20 text-[#fb923c]' : 'text-slate-500'
              }`}
            >
              Tractor
            </button>
            <button
              type="button"
              onClick={() => { setActivoTab('apero'); setActivoError(null) }}
              className={`py-2 text-[9px] font-black uppercase tracking-wider border-x border-white/10 ${
                activoTab === 'apero' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500'
              }`}
            >
              Apero legacy
            </button>
            <button
              type="button"
              onClick={() => { setActivoTab('maquinaria_apero'); setActivoError(null) }}
              className={`py-2 text-[9px] font-black uppercase tracking-wider ${
                activoTab === 'maquinaria_apero' ? 'bg-orange-500/20 text-orange-300' : 'text-slate-500'
              }`}
            >
              Apero maq.
            </button>
          </div>
          {activoTab === 'tractor' ? (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Tractor (maquinaria_tractores)
              </label>
              <select
                value={selTractorId}
                onChange={e => setSelTractorId(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fb923c]/50"
              >
                <option value="">Seleccionar…</option>
                {tractoresLibres.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.matricula}
                    {t.marca ? ` · ${t.marca}` : ''}
                    {t.modelo ? ` ${t.modelo}` : ''}
                  </option>
                ))}
              </select>
              {tractoresLibres.length === 0 ? (
                <p className="text-[9px] text-slate-500 mt-2">
                  No hay tractores libres. Quita uno de otra ubicación o da de alta en Maquinaria.
                </p>
              ) : null}
            </div>
          ) : activoTab === 'apero' ? (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Apero (tabla aperos)
              </label>
              <select
                value={selAperoId}
                onChange={e => setSelAperoId(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Seleccionar…</option>
                {aperosLibres.map(ap => (
                  <option key={ap.id} value={ap.id}>
                    {ap.denominacion}
                    {ap.codigo ? ` (${ap.codigo})` : ''}
                  </option>
                ))}
              </select>
              {aperosLibres.length === 0 ? (
                <p className="text-[9px] text-slate-500 mt-2">
                  No hay aperos libres en tabla <span className="font-mono">aperos</span>.
                </p>
              ) : null}
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Apero (maquinaria_aperos)
              </label>
              <select
                value={selMaquinariaAperoId}
                onChange={e => setSelMaquinariaAperoId(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-400/50"
              >
                <option value="">Seleccionar…</option>
                {maquinariaAperosLibres.filter(a => a.activo).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.tipo}
                    {a.descripcion ? ` · ${a.descripcion}` : ''}
                  </option>
                ))}
              </select>
              {maquinariaAperosLibres.length === 0 ? (
                <p className="text-[9px] text-slate-500 mt-2">
                  Crea el apero en Maquinaria o quítalo de otra ubicación.
                </p>
              ) : null}
            </div>
          )}
          {activoError ? (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">{activoError}</p>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={
              activoSubmitting
              || (activoTab === 'tractor' && !selTractorId)
              || (activoTab === 'apero' && !selAperoId)
              || (activoTab === 'maquinaria_apero' && !selMaquinariaAperoId)
            }
            className="w-full py-2.5 rounded-lg bg-[#fb923c]/20 border border-[#fb923c]/50 hover:bg-[#fb923c]/30 disabled:opacity-40 text-[11px] font-black uppercase tracking-widest text-[#fb923c]"
          >
            {activoSubmitting ? 'Guardando…' : 'Asignar a esta ubicación'}
          </button>
        </form>
      </div>
    </div>
  )
}
