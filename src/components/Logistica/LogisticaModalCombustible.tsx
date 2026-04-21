import React, { useState, useMemo } from 'react';
import { Fuel, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useAddCombustible,
  useUpdateCombustible,
  type Camion,
  type Combustible,
  type VehiculoEmpresa,
} from '@/hooks/useLogistica';
import type { Personal } from '@/hooks/usePersonal';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import { toast } from '@/hooks/use-toast';
import { uploadImage, buildStoragePath } from '@/utils/uploadImage';
import {
  INPUT,
  LABEL,
  GASOLINERAS,
  matriculaVehiculo,
  nombreDe,
} from './logisticaModalShared';

export const ModalCombustible = React.memo(function ModalCombustible({
  initial, camiones, vehiculos, conductores, onClose,
}: {
  initial?: Combustible;
  camiones: Camion[];
  vehiculos: VehiculoEmpresa[];
  conductores: Personal[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const addMut = useAddCombustible();
  const updMut = useUpdateCombustible();
  const isEdit = !!initial;

  // Catálogo local de gasolineras
  const catGasolineras = useCatalogoLocal('logistica_gasolineras', GASOLINERAS);

  const detectarTipo = (): 'camion' | 'vehiculo' => {
    if (!initial?.vehiculo_id) return 'camion';
    if (camiones.find(c => c.id === initial.vehiculo_id)) return 'camion';
    return 'vehiculo';
  };

  const [vehiculoTipo, setVehiculoTipo] = useState<'camion' | 'vehiculo'>(
    initial?.vehiculo_tipo === 'vehiculo' ? 'vehiculo' : 'camion',
  );
  const [form, setForm] = useState({
    vehiculo_id:  initial?.vehiculo_id ?? '',
    conductor_id: initial?.conductor_id ?? '',
    fecha:        initial?.fecha ? initial.fecha.slice(0, 16) : new Date().toISOString().slice(0, 16),
    litros:       String(initial?.litros ?? ''),
    coste_total:  String(initial?.coste_total ?? ''),
    gasolinera:   initial?.gasolinera ?? '',
    notas:        initial?.notas ?? '',
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const fotoPreview = useMemo(
    () => fotoFile ? URL.createObjectURL(fotoFile) : (initial?.foto_url ?? null),
    [fotoFile, initial?.foto_url],
  );

  const listaVehiculos = vehiculoTipo === 'camion' ? camiones : vehiculos;

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let foto_url = initial?.foto_url ?? null;
      if (fotoFile) {
        foto_url = await uploadImage(fotoFile, 'parcel-images', buildStoragePath('combustible', fotoFile)) ?? null;
      }
      const payload = {
        vehiculo_tipo: vehiculoTipo,
        vehiculo_id:   form.vehiculo_id,
        conductor_id:  form.conductor_id || null,
        fecha:         form.fecha || null,
        litros:        form.litros    ? Number(form.litros)    : null,
        coste_total:   form.coste_total ? Number(form.coste_total) : null,
        gasolinera:    form.gasolinera || null,
        foto_url,
        notas:         form.notas || null,
        created_by:    user?.email ?? 'sistema',
      };
      if (isEdit && initial) {
        await updMut.mutateAsync({ id: initial.id, ...payload });
      } else {
        await addMut.mutateAsync(payload);
      }
      onClose();
    } finally {
      setUploading(false);
    }
  };

  const isPending = addMut.isPending || updMut.isPending || uploading;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <Fuel className="w-5 h-5 text-purple-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {isEdit ? 'Editar repostaje' : 'Nuevo repostaje'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Tipo de vehículo</label>
              <select value={vehiculoTipo} onChange={e => { setVehiculoTipo(e.target.value as 'camion' | 'vehiculo'); set('vehiculo_id', ''); }} className={INPUT}>
                <option value="camion">Camión</option>
                <option value="vehiculo">Vehículo empresa</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Vehículo</label>
              <SelectWithOther
                options={listaVehiculos.map(v => v.matricula + (v.marca ? ' · ' + v.marca : ''))}
                value={listaVehiculos.find(v => v.id === form.vehiculo_id) ? (listaVehiculos.find(v => v.id === form.vehiculo_id)!.matricula + ((listaVehiculos.find(v => v.id === form.vehiculo_id) as Camion)?.marca ? ' · ' + (listaVehiculos.find(v => v.id === form.vehiculo_id) as Camion)?.marca : '')) : ''}
                onChange={v => { const mat = v.split(' · ')[0]; const item = listaVehiculos.find(x => x.matricula === mat); set('vehiculo_id', item?.id ?? ''); }}
                onCreateNew={() => toast({ title: "Valor no persistible", description: "Crea este registro desde su módulo correspondiente." })}
                placeholder="Seleccionar vehículo"
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Conductor</label>
            <SelectWithOther
              options={conductores.map(c => c.nombre)}
              value={conductores.find(c => c.id === form.conductor_id)?.nombre ?? ''}
              onChange={v => { const c = conductores.find(x => x.nombre === v); set('conductor_id', c?.id ?? ''); }}
              onCreateNew={() => toast({ title: "Valor no persistible", description: "Crea este registro desde su módulo correspondiente." })}
              placeholder="Sin conductor"
            />
          </div>
          <div>
            <label className={LABEL}>Fecha y hora</label>
            <input type="datetime-local" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Litros</label>
              <input type="number" min="0" step="0.01" value={form.litros} onChange={e => set('litros', e.target.value)} placeholder="0.00" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Coste total (€)</label>
              <input type="number" min="0" step="0.01" value={form.coste_total} onChange={e => set('coste_total', e.target.value)} placeholder="0.00" className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Gasolinera</label>
            <SelectWithOther options={catGasolineras.opciones} value={form.gasolinera} onChange={v => set('gasolinera', v)} onCreateNew={v => { catGasolineras.addOpcion(v); set('gasolinera', v); }} placeholder="Seleccionar gasolinera" />
          </div>
          <div>
            <label className={LABEL}>Foto — Ticket repostaje</label>
            <PhotoAttachment value={fotoPreview} onChange={setFotoFile} />
          </div>
          <AudioInput label="NOTAS" value={form.notas} onChange={v => set('notas', v)} rows={2} placeholder="Observaciones…" />
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.vehiculo_id || isPending}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40">
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
});

// ── Componente principal ──────────────────────────────────────

