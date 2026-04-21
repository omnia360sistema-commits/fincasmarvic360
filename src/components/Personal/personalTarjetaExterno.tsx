// ── Tarjeta Empresa Externa ───────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Building2,
  Phone,
  CreditCard,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PersonalExterno, TIPO_EXTERNO_LABELS } from '../../hooks/usePersonal';
import { RecordActions } from '@/components/base';
import { QRPanel } from './personalQrTipos';

export function TarjetaExterno({
  p,
  onEdit,
  onDelete,
}: {
  p: PersonalExterno;
  onEdit: (p: PersonalExterno) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded(x => !x)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f472b6]/10">
            <Building2 className="w-4 h-4 text-[#f472b6]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm truncate">{p.nombre_empresa}</p>
              {p.codigo_interno && (
                <span className="text-slate-500 font-mono text-[10px]">{p.codigo_interno}</span>
              )}
            </div>
            <p className="text-slate-400 text-xs">{TIPO_EXTERNO_LABELS[p.tipo]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {p.activo
            ? <CheckCircle2 className="w-4 h-4 text-green-400" />
            : <XCircle      className="w-4 h-4 text-red-400" />
          }
          {expanded
            ? <ChevronUp   className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {p.nif && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <CreditCard className="w-3 h-3 text-slate-500 flex-shrink-0" />
                {p.nif}
              </div>
            )}
            {p.telefono_contacto && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                {p.telefono_contacto}
              </div>
            )}
            {p.persona_contacto && (
              <div className="col-span-2 text-slate-300">
                Contacto: {p.persona_contacto}
              </div>
            )}
          </div>

          {p.trabajos_realiza && (
            <p className="text-xs text-slate-300">
              <span className="text-slate-500">Trabajos: </span>{p.trabajos_realiza}
            </p>
          )}

          {p.presupuesto && (
            <p className="text-xs text-slate-300">
              <span className="text-slate-500">Presupuesto: </span>{p.presupuesto}
            </p>
          )}

          {p.notas && (
            <p className="text-xs text-slate-400 italic">{p.notas}</p>
          )}

          <hr className="border-white/5" />

          <QRPanel qrCode={p.qr_code} nombre={p.nombre_empresa} />

          <RecordActions
            onEdit={() => onEdit(p)}
            onDelete={() => onDelete(p.id)}
            confirmMessage={`Eliminar ${p.nombre_empresa}?`}
          />
        </div>
      )}
    </div>
  );
}
