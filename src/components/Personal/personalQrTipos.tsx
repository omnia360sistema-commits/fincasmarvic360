import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import {
  useTiposTrabajoPersonal,
  useAddTipoTrabajoPersonal,
  useRemoveTipoTrabajoPersonal,
  useTiposTrabajoCatalogoPersonal,
  useAddTipoTrabajoCatalogo,
} from '../../hooks/usePersonal';
import { SelectWithOther } from '@/components/base';
import { generarQRDataUrl } from './personalConstants';

export function QRPanel({ qrCode, nombre }: { qrCode: string; nombre: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    generarQRDataUrl(qrCode).then(setDataUrl).catch(() => {});
  }, [qrCode]);

  function descargar() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href     = dataUrl;
    a.download = `QR_${nombre.replace(/\s+/g, '_')}.png`;
    a.click();
  }

  if (!dataUrl) return null;

  return (
    <div className="flex items-center gap-3">
      <img src={dataUrl} alt="QR" className="w-16 h-16 rounded border border-white/10" />
      <div>
        <p className="text-slate-500 text-xs mb-1">Codigo QR</p>
        <button
          type="button"
          onClick={descargar}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-white/10 rounded px-2 py-1"
        >
          <Download className="w-3 h-3" />
          Descargar
        </button>
      </div>
    </div>
  );
}

// ── Sección tipos trabajo (operarios) ─────────────────────────────────────────

export function TiposTrabajoSection({ personalId }: { personalId: string }) {
  const { data: asignados = [] }  = useTiposTrabajoPersonal(personalId);
  const { data: catalogo = [] }   = useTiposTrabajoCatalogoPersonal('operario_campo');
  const addTipo    = useAddTipoTrabajoPersonal();
  const removeTipo = useRemoveTipoTrabajoPersonal();
  const addCat     = useAddTipoTrabajoCatalogo();

  const asignadosIds = new Set(asignados.map(t => t.id));
  const disponibles  = catalogo.filter(t => !asignadosIds.has(t.id));

  async function handleAdd(nombre: string) {
    const existente = catalogo.find(t => t.nombre === nombre);
    let id = existente?.id;
    if (!id) {
      const nuevo = await addCat.mutateAsync({ nombre, categoria: 'operario_campo' });
      id = nuevo.id;
    }
    await addTipo.mutateAsync({ personal_id: personalId, tipo_trabajo_id: id });
  }

  return (
    <div>
      <p className="text-slate-500 text-xs uppercase tracking-wide font-bold mb-2">Trabajos que puede realizar</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {asignados.map(t => (
          <span
            key={t.id}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-green-500/40 text-green-400 text-xs"
          >
            {t.nombre}
            <button
              type="button"
              onClick={() => removeTipo.mutate({ personal_id: personalId, tipo_trabajo_id: t.id })}
              className="text-green-400/60 hover:text-red-400 ml-0.5 leading-none"
            >
              x
            </button>
          </span>
        ))}
        {asignados.length === 0 && (
          <span className="text-slate-600 text-xs">Sin trabajos asignados</span>
        )}
      </div>
      <SelectWithOther
        options={disponibles.map(t => t.nombre)}
        value=""
        onChange={nombre => handleAdd(nombre)}
        onCreateNew={nombre => handleAdd(nombre)}
        placeholder="Añadir trabajo..."
      />
    </div>
  );
}
