import { useNavigate } from 'react-router-dom'
import { Package, Cog, Tractor, Wrench, Trash2 } from 'lucide-react'
import type { Tables } from '@/integrations/supabase/types'

type ResumenRow = Tables<'inventario_registros'> & {
  inventario_categorias?: { nombre: string; slug?: string | null; icono?: string | null; orden?: number | null } | null
}

type EntradaRow = { categoria_id: string | null }

type ActivoVistaRow = {
  asignacion_id: string | null
  tipo_activo: string
  etiqueta: string
  detalle: string | null
  ubicacion_texto_legacy?: string | null
}

type MaperoUbicRow = {
  id: string
  maquinaria_aperos: { tipo: string; descripcion: string | null } | null
}

type Props = {
  ubicacionId: string | undefined
  ubicacionNombre: string | undefined
  horaStr: string
  resumenUbic: ResumenRow[]
  entradasUbic: EntradaRow[]
  activosVista: ActivoVistaRow[]
  maperosUbic: MaperoUbicRow[]
  activoError: string | null
  showActivoModal: boolean
  openActivoModalFn: () => void
  onRemoveActivo: (asignacionId: string | null) => void
}

export function InventarioUbicacionStockMaquinariaBar(props: Props) {
  const navigate = useNavigate()
  const {
    ubicacionId,
    ubicacionNombre,
    horaStr,
    resumenUbic,
    entradasUbic,
    activosVista,
    maperosUbic,
    activoError,
    showActivoModal,
    openActivoModalFn,
    onRemoveActivo,
  } = props

  return (
    <>
      {resumenUbic.length > 0 && (
        <div className="absolute top-[84px] left-4 z-[997] w-[min(100%-2rem,22rem)] bg-slate-900/95 border border-[#6d9b7d]/20 rounded-lg overflow-hidden shadow-lg">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#6d9b7d]/5">
            <Package className="w-3.5 h-3.5 text-[#6d9b7d]" />
            <span className="text-[10px] font-black text-[#6d9b7d] uppercase tracking-widest">Stock actual</span>
          </div>
          <div className="px-3 py-2 space-y-1 max-h-[28vh] overflow-y-auto">
            {resumenUbic.map(r => {
              const cat = r.inventario_categorias
              const esReciente = (Date.now() - new Date(r.created_at).getTime()) < 7 * 24 * 3600 * 1000
              const nEntradas = entradasUbic.filter(e => e.categoria_id === r.categoria_id).length
              return (
                <div key={r.id} className="flex items-center justify-between gap-2 py-1">
                  <span className="text-[10px] text-slate-400 truncate">{cat?.nombre ?? '—'}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {esReciente && (
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-green-500/40 text-green-400">Entrada reciente</span>
                    )}
                    {nEntradas > 0 && (
                      <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-[#6d9b7d]/40 text-[#6d9b7d]">{nEntradas} entrada{nEntradas !== 1 ? 's' : ''}</span>
                    )}
                    <span className="text-[11px] font-black text-white">{r.cantidad} <span className="text-slate-500 font-normal">{r.unidad}</span></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {ubicacionId && (
        <div className="absolute bottom-14 left-4 z-[998] w-[min(100%-2rem,22rem)] max-h-[38vh] flex flex-col bg-slate-900/95 border border-[#fb923c]/30 rounded-lg overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#fb923c]/10 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Cog className="w-4 h-4 text-[#fb923c] shrink-0" />
              <span className="text-[10px] font-black text-[#fb923c] uppercase tracking-widest truncate">
                Maquinaria aquí
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/maquinaria')}
                className="text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#fb923c] px-2 py-1"
              >
                Módulo
              </button>
              <button
                type="button"
                onClick={openActivoModalFn}
                className="text-[9px] font-black uppercase tracking-wider bg-[#fb923c]/20 border border-[#fb923c]/40 text-[#fb923c] px-2 py-1 rounded"
              >
                + Asignar
              </button>
            </div>
          </div>
          <div className="overflow-y-auto p-2 space-y-1.5 flex-1 min-h-0">
            {activosVista.length === 0 && maperosUbic.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-3 uppercase tracking-widest">
                Ningún activo asignado a esta ubicación
              </p>
            ) : (
              <>
                {activosVista.map(row => {
                  const aid = row.asignacion_id
                  const isTr = row.tipo_activo === 'tractor'
                  return (
                    <div
                      key={aid ?? `${row.tipo_activo}-${row.etiqueta}`}
                      className="flex items-start gap-2 bg-slate-800/50 border border-white/5 rounded-lg px-2 py-1.5"
                    >
                      {isTr ? (
                        <Tractor className="w-3.5 h-3.5 text-[#fb923c] shrink-0 mt-0.5" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{row.etiqueta}</p>
                        {row.detalle ? (
                          <p className="text-[9px] text-slate-500 truncate">{row.detalle}</p>
                        ) : null}
                        {row.ubicacion_texto_legacy ? (
                          <p className="text-[8px] text-slate-600 truncate" title="Texto legacy en ficha">
                            Legacy: {row.ubicacion_texto_legacy}
                          </p>
                        ) : null}
                      </div>
                      {aid ? (
                        <button
                          type="button"
                          title="Quitar de esta ubicación"
                          onClick={() => { void onRemoveActivo(aid) }}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  )
                })}
                {maperosUbic.map(row => {
                  const det = row.maquinaria_aperos
                  return (
                    <div
                      key={row.id}
                      className="flex items-start gap-2 bg-slate-800/50 border border-orange-500/20 rounded-lg px-2 py-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-orange-200/90 uppercase tracking-wider">Apero maquinaria</p>
                        <p className="text-[11px] font-bold text-white truncate">{det?.tipo ?? '—'}</p>
                        {det?.descripcion ? (
                          <p className="text-[9px] text-slate-500 truncate">{det.descripcion}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        title="Quitar de esta ubicación"
                        onClick={() => { void onRemoveActivo(row.id) }}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </div>
          {activoError && !showActivoModal ? (
            <p className="text-[9px] text-red-400 px-2 py-1 border-t border-white/5">{activoError}</p>
          ) : null}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-slate-900/90 border-t border-white/10 px-4 py-1.5 flex items-center gap-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[300px]">
          Ubicación: <span className="text-white">{ubicacionNombre ?? '…'}</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Categorías: <span className="text-white">7</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Conexión: <span className="text-green-400">Online</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400 ml-auto">{horaStr}</span>
      </div>
    </>
  )
}
