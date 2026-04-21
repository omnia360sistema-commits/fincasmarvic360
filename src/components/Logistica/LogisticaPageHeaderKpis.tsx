import React from 'react';
import {
  ArrowLeft, Truck, FileText, ChevronDown, Fuel, Gauge, Wrench, Calendar, Car,
} from 'lucide-react';
import type { LogisticaKpisResumen } from '@/components/Logistica/logisticaPagePdf';
import { BadgeEstado, fmtFecha, itvDias } from '@/components/Logistica/logisticaModals';

export type LogisticaFlotaItem = {
  id: string;
  tipo: 'Camión' | 'Vehículo';
  codigo: string | null | undefined;
  matricula: string;
  marca: string | null | undefined;
  estado: string | null | undefined;
  itvDate: string | null | undefined;
  km: number | null | undefined;
  conductor: string | null;
};

type Props = {
  children?: React.ReactNode;
  isDark: boolean;
  onBackDashboard: () => void;
  pdfMenuRef: React.RefObject<HTMLDivElement | null>;
  pdfMenuOpen: boolean;
  setPdfMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  generandoPdf: boolean;
  onElegirPdf: (op: 1 | 2 | 3 | 4 | 5) => void;
  kpis: LogisticaKpisResumen;
  totalKm: number;
  totalLitros: number;
  totalCostComb: number;
  totalCostMant: number;
  panel: string;
  flotaItems: LogisticaFlotaItem[];
};

export function LogisticaPageHeaderKpis({
  children,
  isDark,
  onBackDashboard,
  pdfMenuRef,
  pdfMenuOpen,
  setPdfMenuOpen,
  generandoPdf,
  onElegirPdf,
  kpis,
  totalKm,
  totalLitros,
  totalCostComb,
  totalCostMant,
  panel,
  flotaItems,
}: Props) {
  return (
    <>
      <header
        className={`w-full ${
          isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/90 border-slate-200'
        } border-b pl-14 pr-4 py-2 flex items-center gap-3 z-50`}
      >
        <button
          type="button"
          onClick={onBackDashboard}
          className="flex items-center gap-1.5 text-slate-400 hover:text-[#6d9b7d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <span className="text-slate-600">|</span>
        <Truck className="w-4 h-4 text-purple-400" />
        <span className="text-[11px] font-black uppercase tracking-wider">Logística</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative" ref={pdfMenuRef}>
            <button
              type="button"
              onClick={() => setPdfMenuOpen(o => !o)}
              disabled={generandoPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#6d9b7d]/20 bg-[#6d9b7d]/5 hover:bg-[#6d9b7d]/10 text-[#6d9b7d] text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {generandoPdf ? (
                <span className="w-3 h-3 border-2 border-[#6d9b7d]/20 border-t-[#6d9b7d] rounded-full animate-spin" />
              ) : (
                <FileText className="w-3 h-3" />
              )}
              PDF
              <ChevronDown className={`w-3 h-3 transition-transform ${pdfMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {pdfMenuOpen && (
              <div
                className={`absolute right-0 top-full z-[70] mt-1 min-w-[240px] rounded-lg border shadow-lg py-1 ${
                  isDark
                    ? 'border-slate-600 bg-slate-900 shadow-black/40'
                    : 'border-slate-200 bg-white shadow-slate-400/20'
                }`}
              >
                {[
                  { k: 1 as const, label: 'Informe completo logística' },
                  { k: 2 as const, label: 'Viajes del día' },
                  { k: 3 as const, label: 'Estado de flota' },
                  { k: 4 as const, label: 'Mantenimientos' },
                  { k: 5 as const, label: 'Resumen operativo' },
                ].map(({ k, label }) => (
                  <button
                    key={k}
                    type="button"
                    disabled={generandoPdf}
                    onClick={() => onElegirPdf(k)}
                    className={`w-full px-3 py-2.5 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-3 mb-3 sm:grid-cols-5">
          {[
            { label: 'Camiones', value: kpis.totalCamiones, color: '#a78bfa' },
            { label: 'Activos', value: kpis.camionesActivos, color: '#34d399' },
            { label: 'Vehículos', value: kpis.totalVehiculos, color: '#a78bfa' },
            { label: 'Conductores', value: kpis.totalConductores, color: '#a78bfa' },
            { label: 'Viajes', value: kpis.totalViajes, color: '#60a5fa' },
          ].map(kpi => (
            <div key={kpi.label} className={`${panel} border rounded-xl p-3 text-center`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {kpi.label}
              </p>
              <p className="text-xl font-black" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
          {[
            {
              icon: <Gauge className="w-4 h-4 text-purple-400" />,
              label: 'Km totales',
              value: `${totalKm.toLocaleString('es-ES')} km`,
              color: 'text-purple-300',
            },
            {
              icon: <Fuel className="w-4 h-4 text-emerald-400" />,
              label: 'Combustible',
              value: `${totalLitros.toFixed(1)} L`,
              color: 'text-emerald-300',
            },
            {
              icon: <Fuel className="w-4 h-4 text-amber-400" />,
              label: 'Gasto comb.',
              value: `${totalCostComb.toFixed(2)} €`,
              color: 'text-amber-300',
            },
            {
              icon: <Wrench className="w-4 h-4 text-amber-400" />,
              label: 'Coste mant.',
              value: `${totalCostMant.toFixed(2)} €`,
              color: 'text-amber-300',
            },
          ].map(kpi => (
            <div key={kpi.label} className={`${panel} border rounded-xl p-3 flex items-center gap-2`}>
              {kpi.icon}
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                <p className={`text-[13px] font-black ${kpi.color}`}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {flotaItems.length > 0 && (
          <div className={`${panel} border rounded-xl p-4 mb-5`}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Estado de flota
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {flotaItems.map(item => {
                const dias = itvDias(item.itvDate);
                const itvRojo = dias !== null && dias < 30;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      isDark ? 'bg-slate-800/50' : 'bg-slate-50'
                    } border ${isDark ? 'border-white/5' : 'border-slate-200'}`}
                  >
                    {item.tipo === 'Camión' ? (
                      <Truck className="w-4 h-4 text-purple-400 shrink-0" />
                    ) : (
                      <Car className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.codigo && <span className="text-[8px] text-slate-500">{item.codigo}</span>}
                        <span className="text-[10px] font-black text-white uppercase">{item.matricula}</span>
                        {item.marca && <span className="text-[9px] text-slate-400">{item.marca}</span>}
                        <BadgeEstado estado={item.estado} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {item.itvDate && (
                          <span
                            className={`text-[8px] flex items-center gap-0.5 ${
                              itvRojo ? 'text-red-400' : 'text-slate-400'
                            }`}
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            ITV: {fmtFecha(item.itvDate)}
                            {itvRojo && dias !== null && ` (${dias}d)`}
                          </span>
                        )}
                        {item.km != null && (
                          <span className="text-[8px] text-slate-400 flex items-center gap-0.5">
                            <Gauge className="w-2.5 h-2.5" />
                            {item.km.toLocaleString('es-ES')} km
                          </span>
                        )}
                        {item.conductor && (
                          <span className="text-[8px] text-slate-400">{item.conductor}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {children}
      </main>
    </>
  );
}
