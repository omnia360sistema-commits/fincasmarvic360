// ── Tarjeta Personal Fijo ─────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Users,
  Phone,
  CreditCard,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Personal, CATEGORIA_COLORS } from '../../hooks/usePersonal';
import { RecordActions } from '@/components/base';
import { diasHastaCaducidad, formatFecha } from './personalConstants';
import { QRPanel, TiposTrabajoSection } from './personalQrTipos';

export function TarjetaPersonal({
  p,
  onEdit,
  onDelete,
}: {
  p: Personal;
  onEdit: (p: Personal) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = CATEGORIA_COLORS[p.categoria];
  const dias  = diasHastaCaducidad(p.carnet_caducidad);
  const carnetAlerta = dias !== null && dias <= 30;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded(x => !x)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {p.foto_url
            ? <img src={p.foto_url} alt={p.nombre} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + '22' }}>
                <Users className="w-4 h-4" style={{ color }} />
              </div>
            )
          }
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-semibold text-sm truncate">{p.nombre}</p>
              {p.codigo_interno && (
                <span className="text-slate-500 font-mono text-[10px]">{p.codigo_interno}</span>
              )}
            </div>
            {p.telefono && (
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" />{p.telefono}
              </p>
            )}
            {carnetAlerta && (
              <p className="text-red-400 text-xs">
                Carnet {dias! <= 0 ? 'CADUCADO' : `caduca en ${dias} dias`}
              </p>
            )}
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
          {/* Datos base */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {p.dni && (
              <div className="flex items-center gap-1.5 text-slate-300">
                <CreditCard className="w-3 h-3 text-slate-500 flex-shrink-0" />
                {p.dni}
              </div>
            )}
            {p.fecha_alta && (
              <div className="text-slate-400">
                Alta: {formatFecha(p.fecha_alta)}
              </div>
            )}
          </div>

          {/* Especificos por categoria */}
          {p.categoria === 'encargado' && p.finca_asignada && (
            <p className="text-xs text-slate-300">
              <span className="text-slate-500">Finca: </span>{p.finca_asignada}
            </p>
          )}

          {p.categoria === 'conductor_maquinaria' && p.licencias && (
            <p className="text-xs text-slate-300">
              <span className="text-slate-500">Licencias: </span>{p.licencias}
            </p>
          )}

          {p.categoria === 'conductor_camion' && (
            <div className="space-y-1 text-xs">
              {p.carnet_tipo && (
                <p className={carnetAlerta ? 'text-red-400' : 'text-slate-300'}>
                  <span className={carnetAlerta ? 'text-red-500' : 'text-slate-500'}>Carnet: </span>
                  {p.carnet_tipo}
                  {p.carnet_caducidad && ` — Caduca: ${formatFecha(p.carnet_caducidad)}`}
                  {dias !== null && dias <= 0 && <span className="ml-1 font-bold"> CADUCADO</span>}
                  {dias !== null && dias > 0 && dias <= 30 && (
                    <span className="ml-1"> ({dias} dias)</span>
                  )}
                </p>
              )}
              {p.tacografo !== null && (
                <p className="text-slate-400">
                  Tacografo: <span className="text-slate-200">{p.tacografo ? 'Si' : 'No'}</span>
                </p>
              )}
            </div>
          )}

          {/* Tipos trabajo: solo operarios */}
          {p.categoria === 'operario_campo' && (
            <TiposTrabajoSection personalId={p.id} />
          )}

          {p.notas && (
            <p className="text-xs text-slate-400 italic">{p.notas}</p>
          )}

          <hr className="border-white/5" />

          <QRPanel qrCode={p.qr_code} nombre={p.nombre} />

          <RecordActions
            onEdit={() => onEdit(p)}
            onDelete={() => onDelete(p.id)}
            confirmMessage={`Eliminar a ${p.nombre}? Esta accion no se puede deshacer.`}
          />
        </div>
      )}
    </div>
  );
}
