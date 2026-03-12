import { useState } from 'react';
import { X, Shovel, Sprout, Wheat, History } from 'lucide-react';
import type { ParcelFeature } from '@/types/farm';

import {
  useParcelRecords,
  useParcelProduction,
  useParcelTickets,
  useParcelResiduos,
  useParcelCertification
} from '@/hooks/useParcelData';

import RegisterWorkForm from './RegisterWorkForm';
import RegisterPlantingForm from './RegisterPlantingForm';
import RegisterHarvestForm from './RegisterHarvestForm';
import ParcelHistory from './ParcelHistory';

type ActiveForm = 'work' | 'planting' | 'harvest' | 'history' | null;

interface Props {
  parcel: ParcelFeature | null;
  open: boolean;
  onClose: () => void;
}

export default function ParcelDetailPanel({ parcel, open, onClose }: Props) {

  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

  const parcelId = parcel?.properties.parcel_id || null;

  const { plantings, harvests } = useParcelRecords(parcelId);

  const latestPlanting = plantings.data?.[0];
  const latestHarvest = harvests.data?.[0];

  const crop = latestPlanting?.crop ?? null;

  const { data: production } = useParcelProduction(parcelId, crop);
  const { data: tickets } = useParcelTickets(parcelId);
  const { data: residuos } = useParcelResiduos(parcelId);
  const { data: certification } = useParcelCertification(parcelId);

  if (!parcel) return null;

  const p = parcel.properties;

  const handleCloseForm = () => setActiveForm(null);

  const area = p.superficie || 0;

  /*
  ========================================================
  PRODUCCIÓN ESTIMADA
  ========================================================
  */

  const estimatedProduction = production?.estimated_production_kg ?? null;
  const plasticKg = production?.estimated_plastic_kg ?? null;
  const dripMeters = production?.estimated_drip_meters ?? null;

  const estimatedCost =
    estimatedProduction ? Math.round(area * 650) : null;

  /*
  ========================================================
  COSECHA REAL
  ========================================================
  */

  const realProduction = latestHarvest?.production_kg ?? null;
  const priceKg = latestHarvest?.price_kg ?? null;

  const realIncome =
    realProduction && priceKg
      ? Math.round(realProduction * priceKg)
      : null;

  /*
  ========================================================
  CERTIFICACIÓN
  ========================================================
  */

  const certificationStatus = certification?.estado ?? null;

  /*
  ========================================================
  RESIDUOS
  ========================================================
  */

  const residuosCount = residuos?.length ?? 0;

  /*
  ========================================================
  TICKETS
  ========================================================
  */

  const ticketsCount = tickets?.length ?? 0;

  /*
  ========================================================
  PLAN DE TRABAJO
  ========================================================
  */

  const tractorHours = Math.round(area * 2);
  const plasticInstallHours = Math.round(area * 3);
  const dripInstallHours = Math.round(area * 2);
  const plantingHours = Math.round(area * 4);

  const workersPlastic = 2;
  const workersDrip = 2;
  const workersPlanting = 6;

  const totalWorkHours =
    tractorHours +
    plasticInstallHours +
    dripInstallHours +
    plantingHours;

  return (
    <>
      <div
        className={`fixed inset-0 z-[1001] bg-black/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed bottom-0 left-0 right-0 z-[1002] transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="glass-strong rounded-t-3xl max-h-[80vh] overflow-y-auto">

          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="px-5 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">
                {p.parcela || p.parcel_id}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Código: {p.codigo || '—'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="px-5 pb-4 grid grid-cols-2 gap-3">
            <InfoCard label="Superficie" value={`${area.toFixed(2)} ha`} />
            <InfoCard label="Riego" value={p.riego || '—'} />
            <InfoCard label="Cultivo actual" value={latestPlanting?.crop || '—'} />
            <InfoCard label="Fecha plantación" value={latestPlanting?.date || '—'} />
          </div>

          <div className="px-5 pb-4 grid grid-cols-2 gap-3">
            <InfoCard label="Certificación" value={certificationStatus ?? '—'} />
            <InfoCard label="Tickets cosecha" value={`${ticketsCount}`} />
            <InfoCard label="Registros residuos" value={`${residuosCount}`} />
          </div>

          <div className="px-5 pb-4">
            <h3 className="text-sm font-bold mb-3">Planificación de cultivo</h3>

            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                label="Producción estimada"
                value={estimatedProduction ? `${estimatedProduction} kg` : '—'}
              />

              <InfoCard
                label="Plástico necesario"
                value={plasticKg ? `${plasticKg} kg` : '—'}
              />

              <InfoCard
                label="Cinta de riego"
                value={dripMeters ? `${dripMeters} m` : '—'}
              />

              <InfoCard
                label="Coste preparación"
                value={estimatedCost ? `${estimatedCost} €` : '—'}
              />
            </div>
          </div>

          {realProduction && (
            <div className="px-5 pb-4">
              <h3 className="text-sm font-bold mb-3">Resultado de cosecha</h3>

              <div className="grid grid-cols-2 gap-3">

                <InfoCard label="Producción real" value={`${realProduction} kg`} />

                <InfoCard
                  label="Precio venta"
                  value={priceKg ? `${priceKg} €/kg` : '—'}
                />

                <InfoCard
                  label="Ingresos"
                  value={realIncome ? `${realIncome} €` : '—'}
                />

              </div>
            </div>
          )}

          <div className="px-5 pb-4">
            <h3 className="text-sm font-bold mb-3">Plan de trabajo estimado</h3>

            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Horas tractor" value={`${tractorHours} h`} />
              <InfoCard label="Plástico instalación" value={`${plasticInstallHours} h`} />
              <InfoCard label="Cinta riego instalación" value={`${dripInstallHours} h`} />
              <InfoCard label="Plantación" value={`${plantingHours} h`} />
              <InfoCard label="Operarios plástico" value={`${workersPlastic}`} />
              <InfoCard label="Operarios riego" value={`${workersDrip}`} />
              <InfoCard label="Operarios plantación" value={`${workersPlanting}`} />
              <InfoCard label="Horas totales estimadas" value={`${totalWorkHours} h`} />
            </div>
          </div>

          {!activeForm && (
            <div className="px-5 pb-6 grid grid-cols-2 gap-3">

              <ActionButton
                icon={<Shovel className="w-5 h-5" />}
                label="Registrar Trabajo"
                onClick={() => setActiveForm('work')}
                color="bg-primary/15 text-primary"
              />

              <ActionButton
                icon={<Sprout className="w-5 h-5" />}
                label="Registrar Plantación"
                onClick={() => setActiveForm('planting')}
                color="bg-primary/15 text-primary"
              />

              <ActionButton
                icon={<Wheat className="w-5 h-5" />}
                label="Registrar Cosecha"
                onClick={() => setActiveForm('harvest')}
                color="bg-accent/15 text-accent"
              />

              <ActionButton
                icon={<History className="w-5 h-5" />}
                label="Ver Historial"
                onClick={() => setActiveForm('history')}
                color="bg-secondary text-muted-foreground"
              />

            </div>
          )}

          {activeForm === 'work' && (
            <RegisterWorkForm parcelId={p.parcel_id} onClose={handleCloseForm} />
          )}

          {activeForm === 'planting' && (
            <RegisterPlantingForm parcelId={p.parcel_id} onClose={handleCloseForm} />
          )}

          {activeForm === 'harvest' && (
            <RegisterHarvestForm parcelId={p.parcel_id} onClose={handleCloseForm} />
          )}

          {activeForm === 'history' && (
            <ParcelHistory parcelId={p.parcel_id} onClose={handleCloseForm} />
          )}

        </div>
      </div>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-2xl ${color} active:scale-[0.97] transition-transform font-semibold text-sm`}
    >
      {icon}
      {label}
    </button>
  );
}
