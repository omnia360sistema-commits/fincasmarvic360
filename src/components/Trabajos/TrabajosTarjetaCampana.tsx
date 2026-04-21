import React from 'react';
import { useDeletePlanificacionCampana, type PlanificacionCampana } from '@/hooks/useTrabajos';
import { RecordActions } from '@/components/base';
import { formatFechaCorta } from '@/utils/dateFormat';

// ── Tarjeta Campaña ───────────────────────────────────────────
export const TarjetaCampana = React.memo(function TarjetaCampana({ c, onEdit }: { c: PlanificacionCampana; onEdit: (c: PlanificacionCampana) => void }) {
  const deleteMut = useDeletePlanificacionCampana();
  const ESTADO_COLOR: Record<string, string> = {
    planificado: 'text-emerald-500 border-emerald-600',
    en_curso:    'text-amber-400 border-amber-500',
    completado:  'text-green-400 border-green-500',
    cancelado:   'text-slate-500 border-slate-600',
  };
  return (
    <div className="p-3 rounded-lg border border-white/10 bg-slate-800/40 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold text-white">{c.cultivo}</p>
          <p className="text-[9px] text-slate-400">{c.finca}{c.parcel_id ? ` · ${c.parcel_id}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`border rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${ESTADO_COLOR[c.estado] ?? 'text-slate-400 border-slate-500'}`}>
            {c.estado.replace('_', ' ')}
          </span>
          <RecordActions onEdit={() => onEdit(c)} onDelete={() => deleteMut.mutate(c.id)} confirmMessage="Eliminar campaña" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {c.fecha_prevista_plantacion && (
          <span className="text-[9px] text-slate-400">Plantación: {formatFechaCorta(c.fecha_prevista_plantacion)}</span>
        )}
        {c.fecha_estimada_cosecha && (
          <span className="text-[9px] text-slate-400">Cosecha: {formatFechaCorta(c.fecha_estimada_cosecha)}</span>
        )}
      </div>
      {c.observaciones && <p className="text-[9px] text-slate-500 italic">{c.observaciones}</p>}
    </div>
  );
});
