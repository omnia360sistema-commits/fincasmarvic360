import { X, MoveRight, AlertCircle } from 'lucide-react'
import { UNIDADES } from './inventarioUbicacionConstants'
import type { Tables } from '@/integrations/supabase/types'

type ProductoRow = Tables<'inventario_productos_catalogo'>
type UbicacionRow = { id: string; nombre: string }

type Props = {
  open: boolean
  ubicacionId: string | undefined
  activeCat: { nombre: string } | undefined
  ubicaciones: UbicacionRow[]
  productos: ProductoRow[]
  moverProductoId: string
  setMoverProductoId: (v: string) => void
  moverCantidad: string
  setMoverCantidad: (v: string) => void
  moverUnidad: string
  setMoverUnidad: (v: string) => void
  moverDestinoId: string
  setMoverDestinoId: (v: string) => void
  moverResponsable: string
  setMoverResponsable: (v: string) => void
  moverNotas: string
  setMoverNotas: (v: string) => void
  moverError: string | null
  submittingMover: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function InventarioUbicacionModalMover(props: Props) {
  const {
    open,
    ubicacionId,
    activeCat,
    ubicaciones,
    productos,
    moverProductoId,
    setMoverProductoId,
    moverCantidad,
    setMoverCantidad,
    moverUnidad,
    setMoverUnidad,
    moverDestinoId,
    setMoverDestinoId,
    moverResponsable,
    setMoverResponsable,
    moverNotas,
    setMoverNotas,
    moverError,
    submittingMover,
    onClose,
    onSubmit,
  } = props

  if (!open || !activeCat) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]">

        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-[0.3em]">
              Mover Producto
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{activeCat.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Producto
            </label>
            <select
              value={moverProductoId}
              onChange={e => setMoverProductoId(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
            >
              <option value="">Sin especificar</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Cantidad <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={moverCantidad}
                onChange={e => setMoverCantidad(e.target.value)}
                required
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50"
                placeholder="0"
              />
            </div>
            <div className="w-32">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Unidad
              </label>
              <select
                value={moverUnidad}
                onChange={e => setMoverUnidad(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
              >
                {UNIDADES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Ubicación destino <span className="text-red-400">*</span>
            </label>
            <select
              value={moverDestinoId}
              onChange={e => setMoverDestinoId(e.target.value)}
              required
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
            >
              <option value="">Seleccionar destino…</option>
              {ubicaciones
                .filter(u => u.id !== ubicacionId)
                .map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Responsable
            </label>
            <input
              type="text"
              value={moverResponsable}
              onChange={e => setMoverResponsable(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50"
              placeholder="Nombre de quien mueve el producto..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Notas
            </label>
            <textarea
              value={moverNotas}
              onChange={e => setMoverNotas(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50 resize-none"
              placeholder="Motivo del movimiento, observaciones..."
            />
          </div>

          {moverError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">{moverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submittingMover || !moverCantidad || !moverDestinoId}
            className="w-full py-2.5 rounded-lg bg-[#6d9b7d]/20 border border-[#6d9b7d]/40 hover:bg-[#6d9b7d]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-black uppercase tracking-widest text-[#6d9b7d] flex items-center justify-center gap-2"
          >
            {submittingMover ? (
              <>
                <div className="w-4 h-4 border-2 border-[#6d9b7d] border-t-transparent rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <MoveRight className="w-4 h-4" />
                Registrar movimiento
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  )
}
