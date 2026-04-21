import React, { useState } from 'react'
import {
  Tractor,
  Wrench,
  ChevronRight,
  Clock,
  Calendar,
  Navigation,
  MapPin,
  Fuel,
  Plus,
} from 'lucide-react'
import { RecordActions } from '@/components/base'
import type {
  Tractor as TractorType,
  Apero,
  UsoMaquinaria,
  MantenimientoTractor,
} from '@/hooks/useMaquinaria'
import { ESTADO_OP_BADGE, ESTADO_OP_LABEL } from './maquinariaConstants'
import { ModalMantenimiento } from './ModalMantenimiento'

export const TarjetaTractor = React.memo(function TarjetaTractor({
  tractor,
  aperos,
  usos,
  mantenimientos,
  onEdit,
  onDelete,
}: {
  tractor: TractorType
  aperos: Apero[]
  usos: UsoMaquinaria[]
  mantenimientos: MantenimientoTractor[]
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [modalMant, setModalMant] = useState(false)

  const misAperos = aperos.filter(a => a.tractor_id === tractor.id)
  const misUsos = usos.filter(u => u.tractor_id === tractor.id)
  const misMant = mantenimientos.filter(m => m.tractor_id === tractor.id)
  const totalH = misUsos.reduce((s, u) => s + (u.horas_trabajadas ?? 0), 0)
  const totalL = misUsos.reduce((s, u) => s + (u.gasolina_litros ?? 0), 0)

  const itvDiff = tractor.fecha_proxima_itv
    ? (new Date(tractor.fecha_proxima_itv).getTime() - Date.now()) / 86400000
    : null
  const itvClase =
    itvDiff !== null
      ? itvDiff < 0
        ? 'text-red-400'
        : itvDiff < 30
          ? 'text-amber-400'
          : 'text-slate-400'
      : 'text-slate-400'

  const estadoOp = tractor.estado_operativo ?? 'disponible'

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        className="p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(e => !e)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded(e => !e)
          }
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
          <Tractor className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {tractor.codigo_interno && (
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{tractor.codigo_interno}</span>
            )}
            <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase">{tractor.matricula}</p>
            <span
              className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${ESTADO_OP_BADGE[estadoOp] ?? 'border-slate-500 text-slate-400'}`}
            >
              {ESTADO_OP_LABEL[estadoOp] ?? estadoOp}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {[tractor.marca, tractor.modelo, tractor.anio].filter(Boolean).join(' · ')}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {tractor.horas_motor != null && (
              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {tractor.horas_motor}h motor
              </span>
            )}
            {totalH > 0 && <span className="text-[9px] text-slate-400">{totalH.toFixed(1)}h trabajadas</span>}
            {misAperos.length > 0 && (
              <span className="text-[9px] text-slate-400">
                {misAperos.length} apero{misAperos.length !== 1 ? 's' : ''}
              </span>
            )}
            {tractor.fecha_proxima_itv && (
              <span className={`text-[9px] flex items-center gap-0.5 ${itvClase}`}>
                <Calendar className="w-2.5 h-2.5" />
                ITV {new Date(tractor.fecha_proxima_itv).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronRight className="w-4 h-4 text-slate-400 rotate-90 transition-transform shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 transition-transform shrink-0" />
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-white/10 p-4 space-y-4">
          {tractor.ficha_tecnica && (
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ficha técnica</p>
              <p className="text-[10px] text-slate-300">{tractor.ficha_tecnica}</p>
            </div>
          )}

          {(tractor.fecha_proxima_revision || tractor.horas_proximo_mantenimiento || tractor.gps_info) && (
            <div className="grid grid-cols-2 gap-2">
              {tractor.fecha_proxima_revision && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-200 dark:border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Próxima revisión</p>
                  <p className="text-[10px] font-bold text-white mt-0.5">
                    {new Date(tractor.fecha_proxima_revision).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              {tractor.horas_proximo_mantenimiento != null && (
                <div
                  className={`bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border ${
                    tractor.horas_motor != null && tractor.horas_motor >= tractor.horas_proximo_mantenimiento
                      ? 'border-amber-500/40'
                      : 'border-slate-200 dark:border-white/5'
                  }`}
                >
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Horas próx. mant.</p>
                  <p
                    className={`text-[10px] font-bold mt-0.5 ${
                      tractor.horas_motor != null && tractor.horas_motor >= tractor.horas_proximo_mantenimiento
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {tractor.horas_proximo_mantenimiento}h
                  </p>
                </div>
              )}
              {tractor.gps_info && (
                <div className="col-span-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-200 dark:border-white/5 flex items-center gap-2">
                  <Navigation className="w-3 h-3 text-orange-400 shrink-0" />
                  <p className="text-[9px] text-slate-300">{tractor.gps_info}</p>
                </div>
              )}
            </div>
          )}

          {misAperos.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Aperos asignados</p>
              <div className="flex flex-wrap gap-1.5">
                {misAperos.map(a => (
                  <span
                    key={a.id}
                    className="text-[9px] font-black px-2 py-1 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20"
                  >
                    {a.codigo_interno ? `${a.codigo_interno} · ` : ''}
                    {a.tipo}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Ultimos usos ({totalH.toFixed(1)}h · {totalL.toFixed(1)}L)
            </p>
            {misUsos.length === 0 ? (
              <p className="text-[10px] text-slate-600">Sin usos registrados</p>
            ) : (
              <div className="space-y-1.5">
                {misUsos.slice(0, 5).map(u => (
                  <div key={u.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-700 dark:text-white">{u.tipo_trabajo ?? 'Uso'}</p>
                      <span className="text-[8px] text-slate-400">{new Date(u.fecha).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {u.finca && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <MapPin className="w-2 h-2" />
                          {u.finca}
                        </span>
                      )}
                      {u.horas_trabajadas && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2 h-2" />
                          {u.horas_trabajadas}h
                        </span>
                      )}
                      {u.gasolina_litros && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <Fuel className="w-2 h-2" />
                          {u.gasolina_litros}L
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mantenimientos</p>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  setModalMant(true)
                }}
                className="flex items-center gap-1 text-[9px] font-black text-orange-400 hover:text-orange-300 uppercase tracking-widest"
              >
                <Plus className="w-3 h-3" />
                Añadir
              </button>
            </div>
            {misMant.length === 0 ? (
              <p className="text-[10px] text-slate-600">Sin mantenimientos</p>
            ) : (
              <div className="space-y-1">
                {misMant.slice(0, 4).map(m => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5"
                  >
                    <div>
                      <span className="text-[9px] font-black text-white uppercase">{m.tipo}</span>
                      {m.descripcion && <span className="text-[8px] text-slate-500 ml-2">{m.descripcion}</span>}
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-400">{new Date(m.fecha).toLocaleDateString('es-ES')}</p>
                      {m.horas_motor_al_momento && <p className="text-[8px] text-orange-300">{m.horas_motor_al_momento}h</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-white/5" />
          <RecordActions
            onEdit={onEdit}
            onDelete={onDelete}
            confirmMessage={`¿Eliminar el tractor ${tractor.matricula}? Esta acción no se puede deshacer.`}
          />
        </div>
      )}

      {modalMant && (
        <ModalMantenimiento
          tractorId={tractor.id}
          horasActuales={tractor.horas_motor}
          tractores={[tractor]}
          onClose={() => setModalMant(false)}
        />
      )}
    </div>
  )
})
