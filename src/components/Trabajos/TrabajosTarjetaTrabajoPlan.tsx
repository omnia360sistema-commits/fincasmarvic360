import React from 'react';
import { Clock, Layers, MapPin, Tractor, Users } from 'lucide-react';
import { useDeleteTrabajo, type TrabajoRegistroPlanificado } from '@/hooks/useTrabajos';
import { RecordActions } from '@/components/base';
import { formatFechaCorta } from '@/utils/dateFormat';
import { BadgeEstado, BadgePrioridad } from './trabajosPiecesShared';

// ── Tarjeta Trabajo Planificado ───────────────────────────────
export const TarjetaTrabajoPlan = React.memo(function TarjetaTrabajoPlan({ t, onEdit, onCerrar }: { t: TrabajoRegistroPlanificado; onEdit: (t: TrabajoRegistroPlanificado) => void; onCerrar: (t: TrabajoRegistroPlanificado) => void }) {
  const deleteMut = useDeleteTrabajo();
  const yaEjecutado = t.estado_planificacion === 'ejecutado' || t.estado_planificacion === 'cancelado';

  return (
    <div className={`p-3 rounded-lg border border-white/10 bg-slate-800/40 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <BadgePrioridad p={t.prioridad} />
          <BadgeEstado e={t.estado_planificacion} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!yaEjecutado && (
            <button
              onClick={() => onCerrar(t)}
              className="px-2 py-1 rounded bg-green-600/20 border border-green-500/30 text-[8px] font-black uppercase tracking-widest text-green-400 hover:bg-green-600/30 transition-colors"
            >
              Ejecutar
            </button>
          )}
          <RecordActions
            onEdit={() => onEdit(t)}
            onDelete={() => deleteMut.mutate(t.id)} 
            confirmMessage="Eliminar este trabajo"
          />
        </div>
      </div>
      <p className="text-[11px] font-bold text-white leading-tight">{t.tipo_trabajo}</p>
      <div className="flex flex-wrap gap-3">
        {t.finca && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <MapPin className="w-2.5 h-2.5" />{t.finca}{t.parcel_id ? ` · ${t.parcel_id}` : ''}
          </span>
        )}
        {(t.maquinaria_tractores?.matricula || t.maquinaria_tractores?.marca) && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Tractor className="w-2.5 h-2.5" />
            {t.maquinaria_tractores?.matricula ?? '—'}
            {' — '}
            {t.maquinaria_tractores?.marca ?? '—'}
          </span>
        )}
        {(t.maquinaria_aperos?.tipo || t.maquinaria_aperos?.descripcion) && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Layers className="w-2.5 h-2.5" />
            {t.maquinaria_aperos?.tipo ?? '—'}
            {' — '}
            {t.maquinaria_aperos?.descripcion ?? '—'}
          </span>
        )}
        {(t.hora_inicio || t.hora_fin) && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Clock className="w-2.5 h-2.5" />
            {t.hora_inicio?.slice(11, 16) ?? ''}{t.hora_fin ? ` → ${t.hora_fin.slice(11, 16)}` : ''}
          </span>
        )}
        {t.nombres_operarios && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Users className="w-2.5 h-2.5" />{t.nombres_operarios}
          </span>
        )}
      </div>
      {t.fecha_original && t.fecha_original !== t.fecha_planificada && (
        <p className="text-[8px] text-amber-400/80">Arrastrado desde {formatFechaCorta(t.fecha_original)}</p>
      )}
      {t.notas && <p className="text-[9px] text-slate-500 italic">{t.notas}</p>}
      {t.materiales_previstos && Array.isArray(t.materiales_previstos) && t.materiales_previstos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(t.materiales_previstos as { nombre: string; cantidad: string }[]).map((m, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-slate-700 rounded text-[8px] text-slate-300">{m.nombre} {m.cantidad}</span>
          ))}
        </div>
      )}
    </div>
  );
});
