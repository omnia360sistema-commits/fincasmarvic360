import React from 'react';
import {
  Truck, Users, Plus, MapPin, Fuel, Gauge, Calendar, Wrench, Car, Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type {
  Camion,
  VehiculoEmpresa,
  Viaje,
  MantenimientoCamion,
  Combustible,
} from '@/hooks/useLogistica';
import type { Personal } from '@/hooks/usePersonal';
import { RecordActions } from '@/components/base';
import {
  BadgeEstado,
  fmtFecha,
  fmtDatetime,
  itvDias,
  matriculaVehiculo,
} from '@/components/Logistica/logisticaModals';
import { getVehiculoLabel } from '@/utils/logisticaMantenimiento';

type PanelClass = string;

export function LogisticaTabCamiones(props: {
  panel: PanelClass;
  camiones: Camion[];
  viajes: Viaje[];
  onAdd: () => void;
  onEdit: (c: Camion) => void;
  onDelete: (id: string) => void;
}) {
  const { panel, camiones, viajes, onAdd, onEdit, onDelete } = props;
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {camiones.length} camión{camiones.length !== 1 ? 'es' : ''}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo camión
        </button>
      </div>
      {camiones.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">Sin camiones registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {camiones.map(c => {
            const dias = itvDias(c.fecha_proxima_itv);
            const misViajes = viajes.filter(v => v.camion_id === c.id).length;
            return (
              <div key={c.id} className={`${panel} border rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {c.codigo_interno && (
                        <span className="text-[8px] text-slate-500">{c.codigo_interno}</span>
                      )}
                      <span className="text-[12px] font-black text-white uppercase">{c.matricula}</span>
                      <BadgeEstado estado={c.estado_operativo} />
                      {dias !== null && dias < 0 && (
                        <span className="text-[8px] font-black text-red-400">ITV VENCIDA</span>
                      )}
                      {dias !== null && dias >= 0 && dias < 30 && (
                        <span className="text-[8px] font-black text-amber-400">ITV en {dias}d</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {[c.marca, c.modelo, c.anio].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[8px] text-slate-500">{misViajes} viajes</span>
                      {c.kilometros_actuales != null && (
                        <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                          <Gauge className="w-2.5 h-2.5" />
                          {c.kilometros_actuales.toLocaleString('es-ES')} km
                        </span>
                      )}
                      {c.fecha_proxima_itv && (
                        <span
                          className={`text-[8px] flex items-center gap-0.5 ${
                            dias !== null && dias < 0
                              ? 'text-red-400'
                              : dias !== null && dias < 30
                                ? 'text-amber-400'
                                : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          ITV: {fmtFecha(c.fecha_proxima_itv)}
                        </span>
                      )}
                      {c.empresa_transporte && (
                        <span className="text-[8px] text-slate-500">{c.empresa_transporte}</span>
                      )}
                    </div>
                  </div>
                  <RecordActions
                    onEdit={() => onEdit(c)}
                    onDelete={() => onDelete(c.id)}
                    confirmMessage={`¿Eliminar camión ${c.matricula}?`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function LogisticaTabVehiculos(props: {
  panel: PanelClass;
  vehiculos: VehiculoEmpresa[];
  conductores: Personal[];
  onAdd: () => void;
  onEdit: (v: VehiculoEmpresa) => void;
  onDelete: (id: string) => void;
}) {
  const { panel, vehiculos, conductores, onAdd, onEdit, onDelete } = props;
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {vehiculos.length} vehículo{vehiculos.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo vehículo
        </button>
      </div>
      {vehiculos.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Car className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">
            Sin vehículos de empresa registrados
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehiculos.map(v => {
            const dias = itvDias(v.fecha_proxima_itv);
            const condNombre = v.conductor_habitual_id
              ? conductores.find(c => c.id === v.conductor_habitual_id)?.nombre
              : null;
            return (
              <div key={v.id} className={`${panel} border rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <Car className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {v.codigo_interno && (
                        <span className="text-[8px] text-slate-500">{v.codigo_interno}</span>
                      )}
                      <span className="text-[12px] font-black text-white uppercase">{v.matricula}</span>
                      <BadgeEstado estado={v.estado_operativo} />
                      {dias !== null && dias < 0 && (
                        <span className="text-[8px] font-black text-red-400">ITV VENCIDA</span>
                      )}
                      {dias !== null && dias >= 0 && dias < 30 && (
                        <span className="text-[8px] font-black text-amber-400">ITV en {dias}d</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {[v.marca, v.modelo, v.anio, v.tipo].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {v.km_actuales != null && (
                        <span className="text-[8px] text-slate-500 flex items-center gap-0.5">
                          <Gauge className="w-2.5 h-2.5" />
                          {v.km_actuales.toLocaleString('es-ES')} km
                        </span>
                      )}
                      {v.fecha_proxima_itv && (
                        <span
                          className={`text-[8px] flex items-center gap-0.5 ${
                            dias !== null && dias < 0
                              ? 'text-red-400'
                              : dias !== null && dias < 30
                                ? 'text-amber-400'
                                : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          ITV: {fmtFecha(v.fecha_proxima_itv)}
                        </span>
                      )}
                      {condNombre && <span className="text-[8px] text-slate-500">{condNombre}</span>}
                    </div>
                  </div>
                  <RecordActions
                    onEdit={() => onEdit(v)}
                    onDelete={() => onDelete(v.id)}
                    confirmMessage={`¿Eliminar vehículo ${v.matricula}?`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function LogisticaTabConductores(props: {
  panel: PanelClass;
  isDark: boolean;
  conductores: Personal[];
  viajes: Viaje[];
}) {
  const { panel, isDark, conductores, viajes } = props;
  const navigate = useNavigate();
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {conductores.length} conductor{conductores.length !== 1 ? 'es' : ''} activos
        </p>
        <button
          type="button"
          onClick={() => navigate('/personal')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e879f9]/10 border border-[#e879f9]/20 text-[#e879f9] text-[9px] font-black uppercase tracking-widest hover:bg-[#e879f9]/20 transition-colors"
        >
          <Users className="w-3 h-3" />
          Gestionar personal
        </button>
      </div>
      {conductores.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">Sin conductores de camión</p>
          <p className="text-[10px] mt-1">Añade conductores de camión en el módulo Personal</p>
        </div>
      ) : (
        <div className={`${panel} border rounded-xl overflow-hidden`}>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#1e293b] text-white">
                {['Nombre', 'DNI', 'Teléfono', 'Estado', 'Viajes'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conductores.map((c, i) => {
                const misViajes = viajes.filter(v => v.personal_id === c.id).length;
                return (
                  <tr
                    key={c.id}
                    className={
                      i % 2 === 0
                        ? isDark
                          ? 'bg-slate-900/40'
                          : 'bg-white'
                        : isDark
                          ? 'bg-slate-800/30'
                          : 'bg-slate-50'
                    }
                  >
                    <td className="px-3 py-2 font-medium text-white">{c.nombre}</td>
                    <td className="px-3 py-2 text-slate-400">{c.dni ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {c.telefono ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          {c.telefono}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-[8px] font-black uppercase border px-1.5 py-0.5 rounded ${
                          c.activo
                            ? 'text-green-400 border-green-400/60'
                            : 'text-red-400 border-red-400/60'
                        }`}
                      >
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{misViajes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function LogisticaTabViajes(props: {
  panel: PanelClass;
  viajes: Viaje[];
  camiones: Camion[];
  vehiculos: VehiculoEmpresa[];
  personal: Personal[];
  onAdd: () => void;
  onEdit: (v: Viaje) => void;
  onDelete: (id: string) => void;
}) {
  const { panel, viajes, camiones, vehiculos, personal, onAdd, onEdit, onDelete } = props;
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {viajes.length} viaje{viajes.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo viaje
        </button>
      </div>
      {viajes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">Sin viajes registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {viajes.map(v => {
            const conductor = personal.find(p => p.id === v.personal_id);
            const vehiculoLabel = matriculaVehiculo(camiones, vehiculos, v.camion_id);
            return (
              <div key={v.id} className={`${panel} border rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black text-white">
                        {v.trabajo_realizado ?? v.ruta ?? 'Viaje sin descripción'}
                      </span>
                      {v.hora_salida && (
                        <span className="text-[8px] text-slate-500 shrink-0">
                          {fmtDatetime(v.hora_salida)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {conductor && <span className="text-[9px] text-slate-400">{conductor.nombre}</span>}
                      {vehiculoLabel !== '—' && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <Truck className="w-2.5 h-2.5" />
                          {vehiculoLabel}
                        </span>
                      )}
                      {v.finca && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <MapPin className="w-2 h-2" />
                          {v.finca}
                        </span>
                      )}
                      {v.destino && <span className="text-[9px] text-slate-400">→ {v.destino}</span>}
                      {v.km_recorridos != null && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <Gauge className="w-2.5 h-2.5" />
                          {v.km_recorridos} km
                        </span>
                      )}
                      {v.gasto_gasolina_litros != null && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <Fuel className="w-2.5 h-2.5" />
                          {v.gasto_gasolina_litros}L
                        </span>
                      )}
                      {v.gasto_gasolina_euros != null && (
                        <span className="text-[9px] text-purple-300 font-black">{v.gasto_gasolina_euros}€</span>
                      )}
                    </div>
                  </div>
                  <RecordActions
                    onEdit={() => onEdit(v)}
                    onDelete={() => onDelete(v.id)}
                    confirmMessage="¿Eliminar este viaje?"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export function LogisticaTabMantenimiento(props: {
  panel: PanelClass;
  mants: MantenimientoCamion[];
  camiones: Camion[];
  vehiculos: VehiculoEmpresa[];
  onAdd: () => void;
  onEdit: (m: MantenimientoCamion) => void;
  onDelete: (id: string) => void;
}) {
  const { panel, mants, camiones, vehiculos, onAdd, onEdit, onDelete } = props;
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {mants.length} registro{mants.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo mantenimiento
        </button>
      </div>
      {mants.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">Sin mantenimientos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mants.map(m => (
            <div key={m.id} className={`${panel} border rounded-xl p-4`}>
              <div className="flex items-start gap-3">
                <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black text-white uppercase">{m.tipo}</span>
                    <span className="text-[8px] text-slate-500 shrink-0">{fmtFecha(m.fecha)}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[9px] text-slate-400">
                      {getVehiculoLabel(m, { camiones, vehiculos })}
                    </span>
                    {m.descripcion && <span className="text-[9px] text-slate-400">{m.descripcion}</span>}
                    {m.proveedor && <span className="text-[9px] text-slate-500">· {m.proveedor}</span>}
                    {m.coste_euros != null && (
                      <span className="text-[9px] text-purple-300 font-black">{m.coste_euros.toFixed(2)}€</span>
                    )}
                  </div>
                </div>
                <RecordActions
                  onEdit={() => onEdit(m)}
                  onDelete={() => onDelete(m.id)}
                  confirmMessage="¿Eliminar este mantenimiento?"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function LogisticaTabCombustible(props: {
  panel: PanelClass;
  combustibles: Combustible[];
  camiones: Camion[];
  vehiculos: VehiculoEmpresa[];
  personal: Personal[];
  onAdd: () => void;
  onEdit: (c: Combustible) => void;
  onDelete: (id: string) => void;
}) {
  const { panel, combustibles, camiones, vehiculos, personal, onAdd, onEdit, onDelete } = props;
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {combustibles.length} repostaje{combustibles.length !== 1 ? 's' : ''}
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo repostaje
        </button>
      </div>
      {combustibles.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Fuel className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">Sin repostajes registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {combustibles.map(c => {
            const conductor = personal.find(p => p.id === c.conductor_id);
            const vehiculoLabel = matriculaVehiculo(camiones, vehiculos, c.vehiculo_id);
            return (
              <div key={c.id} className={`${panel} border rounded-xl p-4`}>
                <div className="flex items-start gap-3">
                  <Fuel className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black text-white">{c.gasolinera ?? 'Repostaje'}</span>
                      <span className="text-[8px] text-slate-500 shrink-0">{fmtDatetime(c.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {vehiculoLabel !== '—' && (
                        <span className="text-[9px] text-slate-400">{vehiculoLabel}</span>
                      )}
                      {conductor && <span className="text-[9px] text-slate-400">{conductor.nombre}</span>}
                      {c.litros != null && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <Fuel className="w-2.5 h-2.5" />
                          {c.litros}L
                        </span>
                      )}
                      {c.coste_total != null && (
                        <span className="text-[9px] text-purple-300 font-black">{c.coste_total.toFixed(2)}€</span>
                      )}
                    </div>
                  </div>
                  <RecordActions
                    onEdit={() => onEdit(c)}
                    onDelete={() => onDelete(c.id)}
                    confirmMessage="¿Eliminar este repostaje?"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
