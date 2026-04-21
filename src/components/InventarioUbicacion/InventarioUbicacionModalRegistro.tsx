import { X, Plus, AlertCircle } from 'lucide-react'
import { UNIDADES } from './inventarioUbicacionConstants'
import type { Tables } from '@/integrations/supabase/types'

type ProductoRow = Tables<'inventario_productos_catalogo'>

type Props = {
  open: boolean
  activeCat: { id: string; nombre: string; slug?: string | null } | undefined
  isFito: boolean
  productos: ProductoRow[]
  productoId: string
  setProductoId: (v: string) => void
  productoNombre: string
  setProductoNombre: (v: string) => void
  cantidad: string
  setCantidad: (v: string) => void
  unidad: string
  setUnidad: (v: string) => void
  precioUnitario: string
  setPrecioUnitario: (v: string) => void
  importe: number
  descripcion: string
  setDescripcion: (v: string) => void
  notas: string
  setNotas: (v: string) => void
  preview: string | null
  preview2: string | null
  setFotoFile: (f: File | null) => void
  setPreview: (v: string | null) => void
  setFotoFile2: (f: File | null) => void
  setPreview2: (v: string | null) => void
  responsable: string
  setResponsable: (v: string) => void
  submitError: string | null
  submitting: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function InventarioUbicacionModalRegistro(props: Props) {
  const {
    open,
    activeCat,
    isFito,
    productos,
    productoId,
    setProductoId,
    productoNombre,
    setProductoNombre,
    cantidad,
    setCantidad,
    unidad,
    setUnidad,
    precioUnitario,
    setPrecioUnitario,
    importe,
    descripcion,
    setDescripcion,
    notas,
    setNotas,
    preview,
    preview2,
    setFotoFile,
    setPreview,
    setFotoFile2,
    setPreview2,
    responsable,
    setResponsable,
    submitError,
    submitting,
    onClose,
    onSubmit,
    onFileChange,
  } = props

  if (!open || !activeCat) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]">

        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-[0.3em]">
              Añadir Registro
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
              value={productoId}
              onChange={e => {
                const val = e.target.value
                setProductoId(val)
                if (val && val !== 'nuevo') {
                  const p = productos.find(pr => pr.id === val)
                  if (p) {
                    setPrecioUnitario(p.precio_unitario != null ? String(p.precio_unitario) : '')
                    setUnidad(p.unidad_defecto ?? 'kg')
                  }
                } else if (val === 'nuevo') {
                  setPrecioUnitario('')
                }
              }}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
            >
              <option value="">Sin especificar</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
              <option value="nuevo">— Otro / Nuevo producto —</option>
            </select>
          </div>

          {productoId === 'nuevo' && (
            <div className="pl-3 border-l-2 border-[#6d9b7d]/30 space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Nombre del producto <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={productoNombre}
                  onChange={e => setProductoNombre(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50"
                  placeholder="Ej: Glifosato 36%, THIOVIT..."
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Cantidad <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
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
                value={unidad}
                onChange={e => setUnidad(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6d9b7d]/50"
              >
                {UNIDADES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Precio unitario (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precioUnitario}
                onChange={e => setPrecioUnitario(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50"
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Importe total
              </label>
              <div className="bg-slate-800/40 border border-white/5 rounded-lg px-3 py-2 text-sm font-black text-[#6d9b7d]">
                {importe > 0
                  ? importe.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
                  : '— €'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Descripción
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50"
              placeholder="Ej: Herbicida Glifosato 36%, lote 2024..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50 resize-none"
              placeholder="Observaciones opcionales..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Foto
            </label>
            {preview ? (
              <div className="relative rounded-lg overflow-hidden border border-white/10">
                <img src={preview} alt="Preview" className="w-full max-h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => { setFotoFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-[#6d9b7d]/40 transition-colors">
                <Plus className="w-4 h-4 text-slate-500" />
                <span className="text-[11px] text-slate-500">Seleccionar imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {isFito && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Foto lote / código de barras <span className="text-amber-500/70">(recomendada)</span>
              </label>
              {preview2 ? (
                <div className="relative rounded-lg overflow-hidden border border-white/10">
                  <img src={preview2} alt="Preview lote" className="w-full max-h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setFotoFile2(null); setPreview2(null) }}
                    className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-red-400/30 cursor-pointer hover:border-red-400/60 transition-colors">
                  <Plus className="w-4 h-4 text-red-400" />
                  <span className="text-[11px] text-red-400">Seleccionar foto del lote</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const f = e.target.files?.[0] ?? null
                      setFotoFile2(f)
                      setPreview2(f ? URL.createObjectURL(f) : null)
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Responsable
            </label>
            <input
              type="text"
              value={responsable}
              onChange={e => setResponsable(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50"
              placeholder="Nombre de quien registra..."
            />
          </div>

          {submitError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !cantidad}
            className="w-full py-2.5 rounded-lg bg-[#6d9b7d]/20 border border-[#6d9b7d]/40 hover:bg-[#6d9b7d]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-black uppercase tracking-widest text-[#6d9b7d]"
          >
            {submitting ? 'Guardando...' : 'Guardar registro'}
          </button>

        </form>
      </div>
    </div>
  )
}
