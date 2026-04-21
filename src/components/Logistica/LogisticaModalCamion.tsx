import React, { useState, useMemo } from 'react';
import { Truck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAddCamion, useUpdateCamion, type Camion } from '@/hooks/useLogistica';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import { toast } from '@/hooks/use-toast';
import { uploadImage, buildStoragePath } from '@/utils/uploadImage';
import {
  INPUT,
  LABEL,
  MARCAS_CAMION,
  MODELOS_CAMION,
  TIPOS_CAMION,
  EMPRESAS_TRANSP,
} from './logisticaModalShared';

export const ModalCamion = React.memo(function ModalCamion({
  initial, ubicaciones, onClose,
}: {
  initial?: Camion;
  ubicaciones: { id: string; nombre: string }[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const addMut = useAddCamion();
  const updMut = useUpdateCamion();
  const isEdit = !!initial;

  // Catálogos locales persistidos
  const catMarcas = useCatalogoLocal('logistica_marcas_camion', MARCAS_CAMION);
  const catModelos = useCatalogoLocal('logistica_modelos_camion', MODELOS_CAMION);
  const catTipos = useCatalogoLocal('logistica_tipos_camion', TIPOS_CAMION);
  const catEmpresas = useCatalogoLocal('logistica_empresas_transporte', EMPRESAS_TRANSP);

  const [form, setForm] = useState({
    matricula:                initial?.matricula ?? '',
    marca:                    initial?.marca ?? '',
    modelo:                   initial?.modelo ?? '',
    anio:                     String(initial?.anio ?? ''),
    capacidad_kg:             String(initial?.capacidad_kg ?? ''),
    tipo:                     initial?.tipo ?? '',
    empresa_transporte:       initial?.empresa_transporte ?? '',
    kilometros_actuales:      String(initial?.kilometros_actuales ?? ''),
    estado_operativo:         initial?.estado_operativo ?? 'disponible',
    fecha_itv:                initial?.fecha_itv ?? '',
    fecha_proxima_itv:        initial?.fecha_proxima_itv ?? '',
    fecha_proxima_revision:   initial?.fecha_proxima_revision ?? '',
    km_proximo_mantenimiento: String(initial?.km_proximo_mantenimiento ?? ''),
    gps_info:                 initial?.gps_info ?? '',
    notas_mantenimiento:      initial?.notas_mantenimiento ?? '',
    ubicacion_id:             '',
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
      foto_url = await uploadImage(fotoFile, 'parcel-images', buildStoragePath('logistica-camion', fotoFile)) ?? null;
    }
    const payload = {
      matricula:                form.matricula.toUpperCase().trim(),
      activo:                   initial?.activo ?? true,
      marca:                    form.marca || null,
      modelo:                   form.modelo || null,
      anio:                     form.anio ? Number(form.anio) : null,
      capacidad_kg:             form.capacidad_kg ? Number(form.capacidad_kg) : null,
      tipo:                     form.tipo || null,
      empresa_transporte:       form.empresa_transporte || null,
      kilometros_actuales:      form.kilometros_actuales ? Number(form.kilometros_actuales) : null,
      estado_operativo:         form.estado_operativo || null,
      fecha_itv:                form.fecha_itv || null,
      fecha_proxima_itv:        form.fecha_proxima_itv || null,
      fecha_proxima_revision:   form.fecha_proxima_revision || null,
      km_proximo_mantenimiento: form.km_proximo_mantenimiento ? Number(form.km_proximo_mantenimiento) : null,
      gps_info:                 null,
      notas_mantenimiento:      form.notas_mantenimiento || null,
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
          <Truck className="w-5 h-5 text-purple-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {isEdit ? `Editar camión${initial!.codigo_interno ? ' · ' + initial!.codigo_interno : ''}` : 'Nuevo camión'}
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
              <SelectWithOther options={catMarcas.opciones} value={form.marca} onChange={v => set('marca', v)} onCreateNew={v => { catMarcas.addOpcion(v); set('marca', v); }} placeholder="Seleccionar marca" />
            </div>
            <div>
              <label className={LABEL}>Modelo</label>
              <SelectWithOther options={catModelos.opciones} value={form.modelo} onChange={v => set('modelo', v)} onCreateNew={v => { catModelos.addOpcion(v); set('modelo', v); }} placeholder="Seleccionar modelo" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Año</label>
              <input type="number" min="1990" max="2030" value={form.anio} onChange={e => set('anio', e.target.value)} placeholder="2020" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Capacidad (kg)</label>
              <input type="number" min="0" value={form.capacidad_kg} onChange={e => set('capacidad_kg', e.target.value)} placeholder="10000" className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Tipo</label>
            <SelectWithOther options={catTipos.opciones} value={form.tipo} onChange={v => set('tipo', v)} onCreateNew={v => { catTipos.addOpcion(v); set('tipo', v); }} placeholder="Seleccionar tipo" />
          </div>
          <div>
            <label className={LABEL}>Empresa de transporte</label>
            <SelectWithOther options={catEmpresas.opciones} value={form.empresa_transporte} onChange={v => set('empresa_transporte', v)} onCreateNew={v => { catEmpresas.addOpcion(v); set('empresa_transporte', v); }} placeholder="Seleccionar empresa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Km actuales</label>
              <input type="number" min="0" value={form.kilometros_actuales} onChange={e => set('kilometros_actuales', e.target.value)} placeholder="0" className={INPUT} />
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
              <label className={LABEL}>ITV actual</label>
              <input type="date" value={form.fecha_itv} onChange={e => set('fecha_itv', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Próxima ITV</label>
              <input type="date" value={form.fecha_proxima_itv} onChange={e => set('fecha_proxima_itv', e.target.value)} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Próxima revisión</label>
              <input type="date" value={form.fecha_proxima_revision} onChange={e => set('fecha_proxima_revision', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Km próx. mantenimiento</label>
              <input type="number" min="0" value={form.km_proximo_mantenimiento} onChange={e => set('km_proximo_mantenimiento', e.target.value)} placeholder="0" className={INPUT} />
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
            <input type="text" value="Conexión GPS — próximamente" disabled className={INPUT + ' opacity-40 cursor-not-allowed'} />
          </div>
          <AudioInput label="NOTAS MANTENIMIENTO" value={form.notas_mantenimiento} onChange={v => set('notas_mantenimiento', v)} rows={2} placeholder="Estado general, revisiones pendientes…" />
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
