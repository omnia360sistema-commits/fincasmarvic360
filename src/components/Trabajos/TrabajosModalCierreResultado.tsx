import React from 'react';

// ── Modal Cierre Resultado ────────────────────────────────────
export interface CierreResultado {
  ejecutados: number;
  arrastrados: number;
  incidenciasNuevasTrabajo: number;
  pendientes: number;
  fechaMañana: string;
}
export const ModalCierreResultado = React.memo(function ModalCierreResultado({ resultado, onClose, onVerMañana }: {
  resultado: CierreResultado;
  onClose: () => void;
  onVerMañana: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-[11px] font-black text-white uppercase tracking-wider">Jornada cerrada</p>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Trabajos ejecutados',              value: resultado.ejecutados,                color: 'text-green-400' },
            { label: 'Trabajos arrastrados a mañana',    value: resultado.arrastrados,               color: resultado.arrastrados > 0 ? 'text-amber-400' : 'text-slate-400' },
            { label: 'Incidencias que generaron trabajo',value: resultado.incidenciasNuevasTrabajo,  color: resultado.incidenciasNuevasTrabajo > 0 ? 'text-red-400' : 'text-slate-400' },
            { label: 'Trabajos pendientes sin arrastrar', value: resultado.pendientes - resultado.arrastrados, color: 'text-slate-400' },
          ].map(k => (
            <div key={k.label} className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">{k.label}</span>
              <span className={`text-[14px] font-black ${k.color}`}>{k.value}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cerrar</button>
          <button onClick={onVerMañana}
            className="flex-1 py-2 rounded-lg bg-[#6d9b7d] text-[10px] font-black uppercase tracking-widest text-black"
          >Ver planning de mañana</button>
        </div>
      </div>
    </div>
  );
});
