import React from 'react'
import { Tractor, Wrench, Plus, MapPin, Clock, Fuel, Activity, Navigation } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'
import type { Apero, MantenimientoTractor, Tractor as TractorType, UsoMaquinaria } from '@/hooks/useMaquinaria'
import type { Personal } from '@/hooks/usePersonal'
import { RecordActions } from '@/components/base'
import { ESTADO_OP_BADGE, ESTADO_OP_LABEL } from '@/components/Maquinaria/maquinariaConstants'
import { BaseInput, BaseSelect, FieldLabel } from '@/components/Maquinaria/MaquinariaFormPrimitives'
import { TarjetaTractor } from '@/components/Maquinaria/TarjetaTractor'

type DeleteTractorMut = Pick<UseMutationResult<unknown, Error, string, unknown>, 'mutate'>
type DeleteAperoMut = Pick<UseMutationResult<unknown, Error, string, unknown>, 'mutate'>
type AddPosicionVars = {
  vehicle_id: string
  vehicle_tipo: string
  latitud: number
  longitud: number
  velocidad_kmh: number
}
type MutAddPosicionFn = (vars: AddPosicionVars) => void

type GpsPunto = { latitud: number; longitud: number; timestamp: string; velocidad_kmh?: number | null }

export function MaquinariaTabTractores(props: {
  tractores: TractorType[]
  aperos: Apero[]
  usos: UsoMaquinaria[]
  mants: MantenimientoTractor[]
  deleteTractorMut: DeleteTractorMut
  onNuevoTractor: () => void
  onEditTractor: (t: TractorType) => void
}) {
  const { tractores, aperos, usos, mants, deleteTractorMut, onNuevoTractor, onEditTractor } = props
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {tractores.length} tractor{tractores.length !== 1 ? 'es' : ''}
        </p>
        <button
          type="button"
          onClick={onNuevoTractor}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo
        </button>
      </div>
      <div className="space-y-3">
        {tractores.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600">
            <Tractor className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-black uppercase tracking-widest">Sin tractores</p>
          </div>
        ) : (
          tractores.map(t => (
            <TarjetaTractor
              key={t.id}
              tractor={t}
              aperos={aperos}
              usos={usos}
              mantenimientos={mants}
              onEdit={() => onEditTractor(t)}
              onDelete={() => deleteTractorMut.mutate(t.id)}
            />
          ))
        )}
      </div>
    </>
  )
}

export function MaquinariaTabAperos(props: {
  aperos: Apero[]
  tractores: TractorType[]
  deleteAperoMut: DeleteAperoMut
  onNuevoApero: () => void
}) {
  const { aperos, tractores, deleteAperoMut, onNuevoApero } = props
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {aperos.length} apero{aperos.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={onNuevoApero}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {aperos.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 dark:text-slate-600">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-black uppercase tracking-widest">Sin aperos</p>
          </div>
        ) : (
          aperos.map(a => {
            const tractor = tractores.find(t => t.id === a.tractor_id)
            const estadoA = a.estado ?? (a.activo ? 'disponible' : 'baja')
            return (
              <div key={a.id} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className="w-4 h-4 text-orange-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {a.codigo_interno && (
                      <span className="text-[8px] font-black text-slate-500 mr-1">{a.codigo_interno}</span>
                    )}
                    <p className="text-[11px] font-black text-slate-900 dark:text-white inline">{a.tipo}</p>
                  </div>
                  <span
                    className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${ESTADO_OP_BADGE[estadoA] ?? 'border-slate-500 text-slate-400'}`}
                  >
                    {ESTADO_OP_LABEL[estadoA] ?? estadoA}
                  </span>
                </div>
                {a.descripcion && <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-1">{a.descripcion}</p>}
                {tractor && (
                  <p className="text-[9px] text-orange-300 flex items-center gap-1 mb-2">
                    <Tractor className="w-3 h-3" />
                    {tractor.codigo_interno ? `${tractor.codigo_interno} · ` : ''}
                    {tractor.matricula}
                  </p>
                )}
                <RecordActions
                  onEdit={() => {}}
                  onDelete={() => deleteAperoMut.mutate(a.id)}
                  confirmMessage={`¿Eliminar el apero ${a.tipo}?`}
                />
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

export function MaquinariaTabUso(props: {
  usos: UsoMaquinaria[]
  tractores: TractorType[]
  aperos: Apero[]
  personalTractoristas: Personal[]
  onNuevoUso: () => void
}) {
  const { usos, tractores, aperos, personalTractoristas, onNuevoUso } = props
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {usos.length} registro{usos.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={onNuevoUso}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo
        </button>
      </div>
      <div className="space-y-2">
        {usos.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-black uppercase tracking-widest">Sin registros de uso</p>
          </div>
        ) : (
          usos.map(u => {
            const tractor = tractores.find(t => t.id === u.tractor_id)
            const apero = aperos.find(ap => ap.id === u.apero_id)
            const operario = personalTractoristas.find(p => p.id === u.personal_id)
            return (
              <div key={u.id} className="p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold text-slate-800 dark:text-white">{u.tipo_trabajo ?? 'Uso'}</p>
                  <span className="text-[8px] text-slate-400 shrink-0">
                    {new Date(u.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {tractor && (
                    <span className="text-[9px] text-orange-300 flex items-center gap-0.5">
                      <Tractor className="w-2.5 h-2.5" />
                      {tractor.codigo_interno ? `${tractor.codigo_interno} · ` : ''}
                      {tractor.matricula}
                    </span>
                  )}
                  {apero && (
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <Wrench className="w-2.5 h-2.5" />
                      {apero.tipo}
                    </span>
                  )}
                  {operario && <span className="text-[9px] text-slate-400">{operario.nombre}</span>}
                  {u.finca && (
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {u.finca}
                    </span>
                  )}
                  {u.horas_trabajadas && (
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {u.horas_trabajadas}h
                    </span>
                  )}
                  {u.gasolina_litros && (
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <Fuel className="w-2.5 h-2.5" />
                      {u.gasolina_litros}L
                    </span>
                  )}
                </div>
                {u.notas && <p className="text-[9px] text-slate-500 italic mt-1">{u.notas}</p>}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

export function MaquinariaTabGps(props: {
  gpsTractorId: string
  setGpsTractorId: (id: string) => void
  gpsFecha: string
  setGpsFecha: (d: string) => void
  tractores: TractorType[]
  isLoadingGps: boolean
  gpsRecorrido: GpsPunto[]
  mutAddPosicion: MutAddPosicionFn
  gpsMapContainerRef: React.RefObject<HTMLDivElement | null>
  hoyIsoDate: string
}) {
  const {
    gpsTractorId,
    setGpsTractorId,
    gpsFecha,
    setGpsFecha,
    tractores,
    isLoadingGps,
    gpsRecorrido,
    mutAddPosicion,
    gpsMapContainerRef,
    hoyIsoDate,
  } = props

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#fb923c]" />
        <div className="flex-1">
          <FieldLabel>Tractor a monitorear</FieldLabel>
          <BaseSelect value={gpsTractorId} onChange={e => setGpsTractorId(e.target.value)}>
            <option value="">— Seleccionar tractor —</option>
            {tractores.map(t => (
              <option key={t.id} value={t.id}>
                {t.matricula} {t.marca ? `(${t.marca})` : ''}
              </option>
            ))}
          </BaseSelect>
        </div>
        <div className="w-full sm:w-48">
          <FieldLabel>Fecha</FieldLabel>
          <BaseInput type="date" value={gpsFecha} onChange={e => setGpsFecha(e.target.value)} />
        </div>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-3">
        <Activity className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-orange-400">Infraestructura Telemetría GPS</p>
          <p className="text-[10px] text-orange-300/80 mt-1">
            Hardware Teltonika FMC920 pendiente de instalación física.
            Los recorridos mostrados pueden alimentarse manualmente o vía Edge Function API desde el proveedor.
          </p>
        </div>
        {gpsTractorId && gpsFecha === hoyIsoDate && (
          <button
            type="button"
            onClick={() =>
              mutAddPosicion({
                vehicle_id: gpsTractorId,
                vehicle_tipo: 'tractor',
                latitud: 38.2 + Math.random() * 0.05,
                longitud: -0.9 + Math.random() * 0.05,
                velocidad_kmh: Math.floor(Math.random() * 25),
              })
            }
            className="ml-auto shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            Simular Ping
          </button>
        )}
      </div>

      {isLoadingGps ? (
        <div className="h-[500px] bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !gpsTractorId ? (
        <div className="h-[500px] bg-slate-900/50 rounded-xl border border-white/5 flex flex-col items-center justify-center text-slate-500">
          <Navigation className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-bold">Selecciona un tractor para ver su recorrido</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[500px]">
          <div className="lg:col-span-3 rounded-xl overflow-hidden border border-white/10 z-0 bg-slate-900">
            <div ref={gpsMapContainerRef} className="w-full h-full" />
          </div>
          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col">
            <h3 className="text-[11px] font-black text-[#fb923c] uppercase tracking-widest mb-4">Resumen del Día</h3>
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Puntos Registrados</p>
                <p className="text-lg font-black text-white">{gpsRecorrido.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Primera Lectura</p>
                <p className="text-sm font-bold text-slate-300">
                  {gpsRecorrido.length > 0 ? new Date(gpsRecorrido[0].timestamp).toLocaleTimeString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Última Lectura</p>
                <p className="text-sm font-bold text-slate-300">
                  {gpsRecorrido.length > 0
                    ? new Date(gpsRecorrido[gpsRecorrido.length - 1].timestamp).toLocaleTimeString()
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
