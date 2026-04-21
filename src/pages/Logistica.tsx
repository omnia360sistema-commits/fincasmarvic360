import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, Users, MapPin, Fuel, Wrench, Car } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  useCamiones, useDeleteCamion,
  useVehiculosEmpresa, useDeleteVehiculoEmpresa,
  useViajes, useDeleteViaje,
  useMantenimientoCamion, useDeleteMantenimiento,
  useCombustible, useDeleteCombustible,
  useTiposTrabajoLogistica, useAddTipoTrabajoLogistica,
  useTiposMantenimientoLogistica,
  useKPIsLogistica,
  Camion, VehiculoEmpresa, Viaje, MantenimientoCamion, Combustible,
} from '../hooks/useLogistica';
import { usePersonal } from '../hooks/usePersonal';
import { useUbicaciones } from '../hooks/useInventario';
import { nombreFirmaPdfFromUser } from '../utils/pdfUtils';
import {
  type TabType,
  ModalCamion,
  ModalVehiculo,
  ModalViaje,
  ModalMantenimiento,
  ModalCombustible,
} from '@/components/Logistica/logisticaModals';
import {
  logisticaPdfOnElegir,
  type LogisticaPdfContext,
} from '@/components/Logistica/logisticaPagePdf';
import { LogisticaPageHeaderKpis } from '@/components/Logistica/LogisticaPageHeaderKpis';
import {
  LogisticaTabCamiones,
  LogisticaTabVehiculos,
  LogisticaTabConductores,
  LogisticaTabViajes,
  LogisticaTabMantenimiento,
  LogisticaTabCombustible,
} from '@/components/Logistica/LogisticaPageTabs';

const TAB_KEYS = ['camiones', 'vehiculos', 'conductores', 'viajes', 'mantenimiento', 'combustible'] as const;

export default function Logistica() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const firmaPdf = nombreFirmaPdfFromUser(user);
  const isDark = theme === 'dark';

  const rawTab = searchParams.get('tab');
  const tab: TabType = rawTab && (TAB_KEYS as readonly string[]).includes(rawTab) ? (rawTab as TabType) : 'camiones';

  const setTab = useCallback((next: TabType) => {
    setSearchParams(
      prev => {
        const p = new URLSearchParams(prev);
        p.set('tab', next);
        return p;
      },
      { replace: true }
    );
  }, [setSearchParams]);
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);

  const [modalAddCamion, setModalAddCamion] = useState(false);
  const [editCamion, setEditCamion] = useState<Camion | null>(null);
  const [modalAddVehiculo, setModalAddVehiculo] = useState(false);
  const [editVehiculo, setEditVehiculo] = useState<VehiculoEmpresa | null>(null);
  const [modalAddViaje, setModalAddViaje] = useState(false);
  const [editViaje, setEditViaje] = useState<Viaje | null>(null);
  const [modalAddMant, setModalAddMant] = useState(false);
  const [editMant, setEditMant] = useState<MantenimientoCamion | null>(null);
  const [modalAddComb, setModalAddComb] = useState(false);
  const [editComb, setEditComb] = useState<Combustible | null>(null);

  const { data: kpis = { totalCamiones: 0, camionesActivos: 0, totalVehiculos: 0, totalConductores: 0, totalViajes: 0 } } = useKPIsLogistica();
  const { data: camiones = [] } = useCamiones();
  const { data: vehiculos = [] } = useVehiculosEmpresa();
  const { data: viajes = [] } = useViajes();
  const { data: mants = [] } = useMantenimientoCamion();
  const { data: combustibles = [] } = useCombustible();
  const { data: personal = [] } = usePersonal();
  const { data: ubicaciones = [] } = useUbicaciones();
  const { data: tiposTrabajo = [] } = useTiposTrabajoLogistica();
  const { data: tiposMant = [] } = useTiposMantenimientoLogistica();
  const addTipoTrabajo = useAddTipoTrabajoLogistica();

  const delCamion = useDeleteCamion();
  const delVehiculo = useDeleteVehiculoEmpresa();
  const delViaje = useDeleteViaje();
  const delMant = useDeleteMantenimiento();
  const delComb = useDeleteCombustible();

  const conductores = personal.filter(p => p.activo && p.categoria === 'conductor_camion');

  const totalKm = viajes.reduce((s, v) => s + (v.km_recorridos ?? 0), 0);
  const totalCostMant = mants.reduce((s, m) => s + (m.coste_euros ?? 0), 0);
  const totalLitros = combustibles.reduce((s, c) => s + (c.litros ?? 0), 0);
  const totalCostComb = combustibles.reduce((s, c) => s + (c.coste_total ?? 0), 0);

  const pdfCtx: LogisticaPdfContext = useMemo(
    () => ({
      firmaPdf,
      camiones,
      vehiculos,
      viajes,
      mants,
      personal,
      kpis,
      totalKm,
      totalLitros,
      totalCostComb,
      totalCostMant,
    }),
    [
      firmaPdf,
      camiones,
      vehiculos,
      viajes,
      mants,
      personal,
      kpis,
      totalKm,
      totalLitros,
      totalCostComb,
      totalCostMant,
    ],
  );

  useEffect(() => {
    if (!pdfMenuOpen) return;
    function onDown(ev: MouseEvent) {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(ev.target as Node)) {
        setPdfMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [pdfMenuOpen]);

  async function onElegirPdf(op: 1 | 2 | 3 | 4 | 5) {
    setPdfMenuOpen(false);
    setGenerandoPdf(true);
    try {
      await logisticaPdfOnElegir(op, pdfCtx);
    } finally {
      setGenerandoPdf(false);
    }
  }

  const flotaItems = useMemo(
    () => [
      ...camiones.map(c => ({
        id: c.id,
        tipo: 'Camión' as const,
        codigo: c.codigo_interno,
        matricula: c.matricula,
        marca: c.marca,
        estado: c.estado_operativo,
        itvDate: c.fecha_proxima_itv,
        km: c.kilometros_actuales,
        conductor: null as string | null,
      })),
      ...vehiculos.map(v => ({
        id: v.id,
        tipo: 'Vehículo' as const,
        codigo: v.codigo_interno,
        matricula: v.matricula,
        marca: v.marca,
        estado: v.estado_operativo,
        itvDate: v.fecha_proxima_itv,
        km: v.km_actuales,
        conductor: v.conductor_habitual_id
          ? conductores.find(c => c.id === v.conductor_habitual_id)?.nombre ?? null
          : null,
      })),
    ],
    [camiones, vehiculos, conductores],
  );

  const panel = isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} flex flex-col`}>
      <LogisticaPageHeaderKpis
        isDark={isDark}
        onBackDashboard={() => navigate('/dashboard')}
        pdfMenuRef={pdfMenuRef}
        pdfMenuOpen={pdfMenuOpen}
        setPdfMenuOpen={setPdfMenuOpen}
        generandoPdf={generandoPdf}
        onElegirPdf={onElegirPdf}
        kpis={kpis}
        totalKm={totalKm}
        totalLitros={totalLitros}
        totalCostComb={totalCostComb}
        totalCostMant={totalCostMant}
        panel={panel}
        flotaItems={flotaItems}
      >
        <div className={`flex gap-1 mb-5 ${panel} border rounded-xl p-1 overflow-x-auto`}>
          {([
            ['camiones', 'Camiones', <Truck key="t" className="w-3 h-3 inline mr-1" />],
            ['vehiculos', 'Vehículos', <Car key="v" className="w-3 h-3 inline mr-1" />],
            ['conductores', 'Conductores', <Users key="c" className="w-3 h-3 inline mr-1" />],
            ['viajes', 'Viajes', <MapPin key="j" className="w-3 h-3 inline mr-1" />],
            ['mantenimiento', 'Mantenimiento', <Wrench key="m" className="w-3 h-3 inline mr-1" />],
            ['combustible', 'Combustible', <Fuel key="f" className="w-3 h-3 inline mr-1" />],
          ] as [TabType, string, React.ReactNode][]).map(([t, label, icon]) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 min-w-fit py-2 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${
                tab === t
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {tab === 'camiones' && (
          <LogisticaTabCamiones
            panel={panel}
            camiones={camiones}
            viajes={viajes}
            onAdd={() => setModalAddCamion(true)}
            onEdit={setEditCamion}
            onDelete={id => delCamion.mutate(id)}
          />
        )}
        {tab === 'vehiculos' && (
          <LogisticaTabVehiculos
            panel={panel}
            vehiculos={vehiculos}
            conductores={conductores}
            onAdd={() => setModalAddVehiculo(true)}
            onEdit={setEditVehiculo}
            onDelete={id => delVehiculo.mutate(id)}
          />
        )}
        {tab === 'conductores' && (
          <LogisticaTabConductores
            panel={panel}
            isDark={isDark}
            conductores={conductores}
            viajes={viajes}
          />
        )}
        {tab === 'viajes' && (
          <LogisticaTabViajes
            panel={panel}
            viajes={viajes}
            camiones={camiones}
            vehiculos={vehiculos}
            personal={personal}
            onAdd={() => setModalAddViaje(true)}
            onEdit={setEditViaje}
            onDelete={id => delViaje.mutate(id)}
          />
        )}
        {tab === 'mantenimiento' && (
          <LogisticaTabMantenimiento
            panel={panel}
            mants={mants}
            camiones={camiones}
            vehiculos={vehiculos}
            onAdd={() => setModalAddMant(true)}
            onEdit={setEditMant}
            onDelete={id => delMant.mutate(id)}
          />
        )}
        {tab === 'combustible' && (
          <LogisticaTabCombustible
            panel={panel}
            combustibles={combustibles}
            camiones={camiones}
            vehiculos={vehiculos}
            personal={personal}
            onAdd={() => setModalAddComb(true)}
            onEdit={setEditComb}
            onDelete={id => delComb.mutate(id)}
          />
        )}
      </LogisticaPageHeaderKpis>

      {(modalAddCamion || editCamion) && (
        <ModalCamion
          initial={editCamion ?? undefined}
          ubicaciones={ubicaciones}
          onClose={() => {
            setModalAddCamion(false);
            setEditCamion(null);
          }}
        />
      )}
      {(modalAddVehiculo || editVehiculo) && (
        <ModalVehiculo
          initial={editVehiculo ?? undefined}
          ubicaciones={ubicaciones}
          conductores={conductores}
          onClose={() => {
            setModalAddVehiculo(false);
            setEditVehiculo(null);
          }}
        />
      )}
      {(modalAddViaje || editViaje) && (
        <ModalViaje
          initial={editViaje ?? undefined}
          camiones={camiones}
          vehiculos={vehiculos}
          conductores={conductores}
          tiposTrabajo={tiposTrabajo}
          onAddTipoTrabajo={nombre => addTipoTrabajo.mutate(nombre)}
          onClose={() => {
            setModalAddViaje(false);
            setEditViaje(null);
          }}
        />
      )}
      {(modalAddMant || editMant) && (
        <ModalMantenimiento
          key={editMant?.id ?? 'nuevo-mantenimiento'}
          initial={editMant ?? undefined}
          camiones={camiones}
          vehiculos={vehiculos}
          tiposMant={tiposMant}
          onClose={() => {
            setModalAddMant(false);
            setEditMant(null);
          }}
        />
      )}
      {(modalAddComb || editComb) && (
        <ModalCombustible
          initial={editComb ?? undefined}
          camiones={camiones}
          vehiculos={vehiculos}
          conductores={conductores}
          onClose={() => {
            setModalAddComb(false);
            setEditComb(null);
          }}
        />
      )}
    </div>
  );
}
