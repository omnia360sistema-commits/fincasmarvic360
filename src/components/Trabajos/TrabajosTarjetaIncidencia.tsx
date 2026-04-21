import React from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import { useDeleteIncidencia, type TrabajoIncidencia } from '@/hooks/useTrabajos';
import { RecordActions } from '@/components/base';

// ── Tarjeta Incidencia ────────────────────────────────────────
export const TarjetaIncidencia = React.memo(function TarjetaIncidencia({ inc, onEdit }: { inc: TrabajoIncidencia; onEdit: (i: TrabajoIncidencia) => void }) {
  const deleteMut = useDeleteIncidencia();
  const colorEstado = inc.estado === 'resuelta' ? '#34d399' : inc.urgente ? '#ef4444' : '#f59e0b';
  return (
    <div className={`p-3 rounded-lg border bg-slate-800/40 space-y-1.5 ${inc.urgente && inc.estado !== 'resuelta' ? 'border-red-500/40' : 'border-white/10'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {inc.urgente && inc.estado !== 'resuelta' && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
          <p className="text-[11px] font-bold text-white leading-tight">{inc.titulo}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border"
            style={{ color: colorEstado, borderColor: colorEstado + '60' }}>
            {inc.estado}
          </span>
          <RecordActions onEdit={() => onEdit(inc)} onDelete={() => deleteMut.mutate(inc.id)} confirmMessage="Eliminar incidencia" />
        </div>
      </div>
      {inc.finca && <span className="flex items-center gap-1 text-[9px] text-slate-400"><MapPin className="w-2.5 h-2.5" />{inc.finca}</span>}
      {inc.descripcion && <p className="text-[9px] text-slate-400">{inc.descripcion}</p>}
      {inc.foto_url && <img src={inc.foto_url} alt="foto" className="w-full max-h-28 object-cover rounded-lg opacity-80" />}
    </div>
  );
});
