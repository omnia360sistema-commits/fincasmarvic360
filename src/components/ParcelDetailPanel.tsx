import type { ParcelFeature } from '@/types/farm';
import {
  useParcelRecords,
  useParcelProduction,
  useParcelTickets,
  useParcelResiduos,
  useParcelCertification
} from '@/hooks/useParcelData';

interface Props {
  parcel: ParcelFeature | null;
  open: boolean;
  onClose: () => void;
}

export default function ParcelDetailPanel({ parcel, open, onClose }: Props) {
  const parcelId = parcel?.properties.parcel_id || null;

  const { plantings, harvests }         = useParcelRecords(parcelId);
  const latestPlanting                  = plantings.data?.[0];
  const latestHarvest                   = harvests.data?.[0];
  const crop                            = latestPlanting?.crop ?? null;
  const { data: production }            = useParcelProduction(parcelId, crop);
  const { data: tickets }               = useParcelTickets(parcelId);
  const { data: residuos }              = useParcelResiduos(parcelId);
  const { data: certification }         = useParcelCertification(parcelId);

  if (!parcel || !open) return null;

  const p                   = parcel.properties;
  const area                = p.superficie || 0;
  const estimatedProduction = production?.estimated_production_kg ?? null;
  const plasticKg           = production?.estimated_plastic_kg ?? null;
  const dripMeters          = production?.estimated_drip_meters ?? null;
  const estimatedCost       = estimatedProduction ? Math.round(area * 650) : null;
  const realProduction      = latestHarvest?.production_kg ?? null;
  const certificationStatus = certification?.estado ?? null;
  const residuosCount       = residuos?.length ?? 0;
  const ticketsCount        = tickets?.length ?? 0;
  const tractorHours        = Math.round(area * 2);
  const plasticHours        = Math.round(area * 3);
  const dripHours           = Math.round(area * 2);
  const plantingHours       = Math.round(area * 4);
  const totalHours          = tractorHours + plasticHours + dripHours + plantingHours;

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 z-[1001] bg-black/40"
        onClick={onClose}
      />

      {/* PANEL CENTRADO */}
      <div className="fixed inset-0 z-[1002] flex items-center justify-center pointer-events-none">
        <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-lg mx-4 pointer-events-auto flex flex-col max-h-[80vh]">

          {/* HEADER */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <div>
              <p className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-[0.3em]">
                Datos del Sector
              </p>
              <h2 className="text-lg font-black text-white uppercase tracking-tight leading-tight mt-0.5">
                {p.parcela || p.parcel_id}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {p.finca} · {p.codigo || '—'} · {area.toFixed(2)} ha
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors ml-4 shrink-0"
            >
              <span className="text-slate-400 text-sm font-bold">✕</span>
            </button>
          </div>

          {/* CONTENIDO */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

            {/* DATOS BÁSICOS */}
            <Section label="Identificación">
              <Grid>
                <DataItem label="Superficie"      value={`${area.toFixed(2)} ha`} />
                <DataItem label="Riego"            value={p.riego || '—'} />
                <DataItem label="Cultivo actual"   value={latestPlanting?.crop || '—'} />
                <DataItem label="Fecha plantación" value={latestPlanting?.date || '—'} />
                <DataItem label="Certificación"    value={certificationStatus ?? '—'} />
                <DataItem label="Tickets cosecha"  value={`${ticketsCount}`} />
                <DataItem label="Residuos"         value={`${residuosCount}`} />
                <DataItem label="Código"           value={p.codigo || '—'} />
              </Grid>
            </Section>

            {/* PLANIFICACIÓN ESTIMADA */}
            <Section label="Planificación estimada">
              <Grid>
                <DataItem label="Producción est."    value={estimatedProduction ? `${estimatedProduction.toLocaleString()} kg` : '—'} />
                <DataItem label="Plástico"           value={plasticKg ? `${plasticKg} kg` : '—'} />
                <DataItem label="Cinta riego"        value={dripMeters ? `${dripMeters} m` : '—'} />
                <DataItem label="Coste prep."        value={estimatedCost ? `${estimatedCost} €` : '—'} />
                <DataItem label="Horas tractor"      value={`${tractorHours} h`} />
                <DataItem label="Horas plástico"     value={`${plasticHours} h`} />
                <DataItem label="Horas riego"        value={`${dripHours} h`} />
                <DataItem label="Horas plantación"   value={`${plantingHours} h`} />
                <DataItem label="Total horas est."   value={`${totalHours} h`} />
              </Grid>
            </Section>

            {/* COSECHA REAL — solo si hay datos */}
            {realProduction && (
              <Section label="Resultado cosecha">
                <Grid>
                  <DataItem label="Producción real" value={`${realProduction.toLocaleString()} kg`} />
                  {latestHarvest?.price_kg && (
                    <DataItem label="Precio venta" value={`${latestHarvest.price_kg} €/kg`} />
                  )}
                </Grid>
              </Section>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

// ── COMPONENTES AUXILIARES ────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {children}
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg px-3 py-2 border border-white/5">
      <p className="text-[9px] text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-[12px] font-semibold text-white mt-0.5 truncate">{value}</p>
    </div>
  );
}