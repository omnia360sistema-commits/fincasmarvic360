import React, { useState } from 'react';
import { Car, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAddVehiculoEmpresa, useUpdateVehiculoEmpresa, type VehiculoEmpresa } from '@/hooks/useLogistica';
import type { Personal } from '@/hooks/usePersonal';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import { toast } from '@/hooks/use-toast';
import { uploadImage, buildStoragePath } from '@/utils/uploadImage';
import {
  INPUT,
  LABEL,
  MARCAS_VH,
  MODELOS_VH,
  TIPOS_VH_OPTS,
  itvDias,
  fmtFecha,
} from './logisticaModalShared';

export const ModalVehiculo = React.memo(function ModalVehiculo({
  initial, ubicaciones, conductores, onClose,
}: {
  initial?: VehiculoEmpresa;
  ubicaciones: { id: string; nombre: string }[];
  conductores: Personal[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const addMut = useAddVehiculoEmpresa();
  const updMut = useUpdateVehiculoEmpresa();
  const isEdit = !!initial;

  // Catálogos locales persistidos
  const catMarcasVh = useCatalogoLocal('logistica_marcas_vehiculo', MARCAS_VH);
  const catModelosVh = useCatalogoLocal('logistica_modelos_vehiculo', MODELOS_VH);

  const [form, setForm] = useState({
    matricula:             initial?.matricula ?? '',
    marca:                 initial?.marca ?? '',
    modelo:                initial?.modelo ?? '',
    anio:                  String(initial?.anio ?? ''),
    tipo:                  initial?.tipo ?? 'furgoneta',
    conductor_habitual_id: initial?.conductor_habitual_id ?? '',
    km_actuales:           String(initial?.km_actuales ?? ''),
    estado_operativo:      initial?.estado_operativo ?? 'disponible',
    fecha_proxima_itv:     initial?.fecha_proxima_itv ?? '',
    fecha_proxima_revision:initial?.fecha_proxima_revision ?? '',
    gps_info:              initial?.gps_info ?? '',
    notas:                 initial?.notas ?? '',
    ubicacion_id:          '',
  });
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const fotoPreview = useMemo(
    () => fotoFile ? URL.createObjectURL(fotoFile) : (initial?.foto_url ?? null),
    [fotoFile, initial?.foto_url],
  );

  const handleSubmit = async () => {
    if (!form.matricula.trim()) return;
    let foto_url = initial?.foto_url ?? null;
    if (fotoFile) {
      foto_url = await uploadImage(fotoFile, 'parcel-images', buildStoragePath('logistica-vehiculo', fotoFile)) ?? null;
    }
    const payload = {
      matricula:             form.matricula.toUpperCase().trim(),
      marca:                 form.marca || null,
      modelo:                form.modelo || null,
      anio:                  form.anio ? Number(form.anio) : null,
      tipo:                  form.tipo || null,
      conductor_habitual_id: form.conductor_habitual_id ?? null,
      km_actuales:           form.km_actuales ? Number(form.km_actuales) : null,
      estado_operativo:      form.estado_operativo || null,
      fecha_proxima_itv:     form.fecha_proxima_itv || null,
      fecha_proxima_revision:form.fecha_proxima_revision || null,
      gps_info:              null,
      notas:                 form.notas || null,
      foto_url,
      created_by: user?.email ?? 'sistema',
    };
    if (isEdit && initial) {
      await updMut.mutateAsync({ id: initial.id, ...payload });
    } else {
      await addMut.mutateAsync({ ...payload, ubicacion_id: form.ubicacion_id || null });
    }
    onClose();
  };

  const isPending = addMut.isPending || updMut.isPending;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <Car className="w-5 h-5 text-purple-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {isEdit ? `Editar vehículo${initial!.codigo_interno ? ' · ' + initial!.codigo_interno : ''}` : 'Nuevo vehículo de empresa'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {isEdit && initial?.codigo_interno && (
            <div>
              <label className={LABEL}>Código interno</label>
              <input type="text" value={initial.codigo_interno} disabled className={INPUT + ' opacity-50 cursor-not-allowed'} />
            </div>
          )}
          <div>
            <label className={LABEL}>Matrícula *</label>
            <input type="text" value={form.matricula} onChange={e => set('matricula', e.target.value)}
              placeholder="1234 ABC" className={INPUT + ' uppercase'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Marca</label>
              <SelectWithOther options={catMarcasVh.opciones} value={form.marca} onChange={v => set('marca', v)} onCreateNew={v => { catMarcasVh.addOpcion(v); set('marca', v); }} placeholder="Seleccionar marca" />
            </div>
            <div>
              <label className={LABEL}>Modelo</label>
              <SelectWithOther options={catModelosVh.opciones} value={form.modelo} onChange={v => set('modelo', v)} onCreateNew={v => { catModelosVh.addOpcion(v); set('modelo', v); }} placeholder="Seleccionar modelo" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Año</label>
              <input type="number" min="1990" max="2030" value={form.anio} onChange={e => set('anio', e.target.value)} placeholder="2020" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Tipo</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={INPUT}>
                {TIPOS_VH_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Conductor habitual</label>
            <SelectWithOther
              options={conductores.map(c => c.nombre)}
              value={conductores.find(c => c.id === form.conductor_habitual_id)?.nombre ?? ''}
              onChange={v => { const c = conductores.find(x => x.nombre === v); set('conductor_habitual_id', c?.id ?? ''); }}
              onCreateNew={() => toast({ title: "Valor no persistible", description: "Crea este registro desde su módulo correspondiente." })}
              placeholder="Sin asignación"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Km actuales</label>
              <input type="number" min="0" value={form.km_actuales} onChange={e => set('km_actuales', e.target.value)} placeholder="0" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Estado operativo</label>
              <select value={form.estado_operativo} onChange={e => set('estado_operativo', e.target.value)} className={INPUT}>
                {ESTADOS_OP.map(s => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Próxima ITV</label>
              <input type="date" value={form.fecha_proxima_itv} onChange={e => set('fecha_proxima_itv', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Próxima revisión</label>
              <input type="date" value={form.fecha_proxima_revision} onChange={e => set('fecha_proxima_revision', e.target.value)} className={INPUT} />
            </div>
          </div>
          {!isEdit && (
            <div>
              <label className={LABEL}>Asignar a ubicación inventario</label>
              <SelectWithOther
                options={ubicaciones.map(u => u.nombre)}
                value={ubicaciones.find(u => u.id === form.ubicacion_id)?.nombre ?? ''}
                onChange={v => { const u = ubicaciones.find(x => x.nombre === v); if (u) set('ubicacion_id', u.id); }}
                onCreateNew={() => toast({ title: "Valor no persistible", description: "Crea este registro desde su módulo correspondiente." })}
                placeholder="Sin asignación"
              />
            </div>
          )}
          <div>
            <label className={LABEL}>Foto</label>
            <PhotoAttachment value={fotoPreview} onChange={setFotoFile} />
          </div>
          <div>
            <label className={LABEL}>GPS</label>
            <input type="text" value="Datos GPS — próximamente" disabled className={INPUT + ' opacity-40 cursor-not-allowed'} />
          </div>
          <AudioInput label="NOTAS" value={form.notas} onChange={v => set('notas', v)} rows={2} placeholder="Observaciones, estado general…" />
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.matricula || isPending}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40">
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
});
