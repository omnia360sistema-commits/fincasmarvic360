import React from 'react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { usePlanificacionDia } from '@/hooks/useTrabajos';
import { fmtFecha, hoy } from './trabajosPiecesShared';

// ── Panel Estado Día ──────────────────────────────────────────
interface PanelDiaProps {
  fecha: string;
  onPrev: () => void;
  onNext: () => void;
  onCerrar: () => void;
  isDark: boolean;
}
export const PanelDia = React.memo(function PanelDia({ fecha, onPrev, onNext, onCerrar, isDark }: PanelDiaProps) {
  const { data: trabajos = [] } = usePlanificacionDia(fecha);
  const esHoy = fecha === hoy();

  const confirmados = trabajos.filter(t => t.estado_planificacion === 'confirmado').length;
  const ejecutados  = trabajos.filter(t => t.estado_planificacion === 'ejecutado').length;
  const pendientes  = trabajos.filter(t => t.estado_planificacion === 'pendiente').length;
  const arrastrados = trabajos.filter(t => t.fecha_original && t.fecha_original !== t.fecha_planificada).length;

  return (
    <div className={`rounded-xl border p-4 mb-4 ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'}`}>
      {/* Navegador fecha */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-[11px] font-black text-white uppercase tracking-widest">{fmtFecha(fecha)}</p>
          {esHoy && <p className="text-[9px] text-[#6d9b7d] font-black uppercase tracking-widest">Hoy</p>}
        </div>
        <button onClick={onNext} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Confirmados', value: confirmados, color: 'text-emerald-400' },
          { label: 'Ejecutados',  value: ejecutados,  color: 'text-green-400' },
          { label: 'Pendientes',  value: pendientes,  color: pendientes > 0 ? 'text-red-400' : 'text-slate-400' },
          { label: 'Arrastrados', value: arrastrados, color: arrastrados > 0 ? 'text-red-400' : 'text-slate-400' },
        ].map(k => (
          <div key={k.label} className="text-center">
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[8px] text-slate-500 uppercase tracking-wider">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Botón cerrar jornada */}
      {esHoy && (
        <button
          onClick={onCerrar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar jornada
        </button>
      )}
    </div>
  );
});
