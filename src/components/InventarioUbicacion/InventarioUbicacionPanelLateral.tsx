import { X, Clock, History, Plus, Package, MoveRight } from 'lucide-react'
import { RecordActions } from '@/components/base'
import { formatFecha } from '@/utils/dateFormat'
import type { Tables } from '@/integrations/supabase/types'
import type { PanelView } from './inventarioUbicacionTypes'

type RegistroRow = Tables<'inventario_registros'>

type Props = {
  activeCat: { nombre: string }
  panelView: PanelView
  setPanelView: (v: PanelView) => void
  setActiveCatId: (v: string | null) => void
  ultimoRegistro: RegistroRow | null | undefined
  registros: RegistroRow[]
  onDeleteRegistro: (registroId: string) => Promise<void>
  openModal: () => void
  openMoverModal: () => void
}

export function InventarioUbicacionPanelLateral(props: Props) {
  const {
    activeCat,
    panelView,
    setPanelView,
    setActiveCatId,
    ultimoRegistro,
    registros,
    onDeleteRegistro,
    openModal,
    openMoverModal,
  } = props

  return (
    <div className="absolute top-4 right-[300px] bottom-10 z-[999] w-80 bg-slate-900/95 border border-white/10 rounded-lg flex flex-col overflow-hidden">

      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <span className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-widest">
          {activeCat.nombre}
        </span>
        <button type="button" onClick={() => setActiveCatId(null)}>
          <X className="w-4 h-4 text-slate-500 hover:text-white" />
        </button>
      </div>

      <div className="flex border-b border-white/10 shrink-0">
        {([
          { id: 'estado' as const, label: 'Estado actual', icon: Clock },
          { id: 'historico' as const, label: 'Histórico', icon: History },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanelView(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
              panelView === id
                ? 'border-[#6d9b7d] text-[#6d9b7d]'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {panelView === 'estado' && (
          !ultimoRegistro ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Package className="w-6 h-6 text-slate-600" />
              <p className="text-[11px] text-slate-500 uppercase tracking-widest text-center">
                Sin registros aún
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-white/10 rounded-lg p-3">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Último registro</p>
                <p className="text-2xl font-black text-white">
                  {ultimoRegistro.cantidad}
                  <span className="text-base text-slate-400 font-normal ml-1">
                    {ultimoRegistro.unidad}
                  </span>
                </p>
                {ultimoRegistro.descripcion && (
                  <p className="text-[11px] text-slate-400 mt-1">{ultimoRegistro.descripcion}</p>
                )}
                <p className="text-[9px] text-slate-600 mt-2 font-mono">
                  {formatFecha(ultimoRegistro.created_at)}
                </p>
              </div>
              {ultimoRegistro.precio_unitario != null && (
                <div className="bg-slate-800/40 rounded-lg p-3">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Valor aprox.</p>
                  <p className="text-lg font-black text-[#6d9b7d]">
                    {(ultimoRegistro.cantidad * ultimoRegistro.precio_unitario)
                      .toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">
                    {ultimoRegistro.precio_unitario
                      .toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/unidad
                  </p>
                </div>
              )}
              {ultimoRegistro.notas && (
                <div className="bg-slate-800/40 rounded-lg p-3">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Notas</p>
                  <p className="text-[11px] text-slate-400">{ultimoRegistro.notas}</p>
                </div>
              )}
              {ultimoRegistro.foto_url && (
                <img
                  src={ultimoRegistro.foto_url}
                  alt="Foto registro"
                  className="w-full rounded-lg border border-white/10 object-cover max-h-40"
                />
              )}
            </div>
          )
        )}

        {panelView === 'historico' && (
          registros.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <History className="w-6 h-6 text-slate-600" />
              <p className="text-[11px] text-slate-500 uppercase tracking-widest text-center">
                Sin registros aún
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {registros.map(r => (
                <div
                  key={r.id}
                  className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-black text-white">
                      {r.cantidad}
                      <span className="text-[11px] text-slate-400 font-normal ml-1">{r.unidad}</span>
                    </p>
                    <p className="text-[9px] text-slate-600 font-mono shrink-0">
                      {formatFecha(r.created_at)}
                    </p>
                  </div>
                  {r.descripcion && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{r.descripcion}</p>
                  )}
                  <div className="flex justify-end mt-1">
                    <RecordActions
                      onEdit={() => {}}
                      onDelete={async () => {
                        if (!confirm('¿Eliminar este registro?')) return
                        await onDeleteRegistro(r.id)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>

      <div className="shrink-0 p-3 border-t border-white/10 flex gap-2">
        <button
          type="button"
          onClick={openModal}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#6d9b7d]/20 border border-[#6d9b7d]/40 hover:bg-[#6d9b7d]/30 transition-all text-[10px] font-black uppercase tracking-widest text-[#6d9b7d]"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir
        </button>
        <button
          type="button"
          onClick={openMoverModal}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-800 border border-white/10 hover:border-[#6d9b7d]/30 hover:text-[#6d9b7d] transition-all text-[10px] font-black uppercase tracking-widest text-slate-400"
        >
          <MoveRight className="w-3.5 h-3.5" />
          Mover
        </button>
      </div>

    </div>
  )
}
