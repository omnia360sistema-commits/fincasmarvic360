import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useAddTrabajoPlanificado,
  useUpdateTrabajoPlanificado,
  type TrabajoRegistro,
} from '@/hooks/useTrabajos';
import { useParcelas, useCropCatalog } from '@/hooks/useParcelData';
import {
  usePersonal,
  useTiposTrabajoCatalogoPersonal,
  useAddTipoTrabajoCatalogo,
} from '@/hooks/usePersonal';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { useTractores, useAperos } from '@/hooks/useMaquinaria';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms';
import { TIPOS_TRABAJO } from '@/constants/tiposTrabajo';
import { uploadImage, buildStoragePath } from '@/utils/uploadImage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormError } from '@/components/base/FormError';
import { INPUT, trabajoSchema, type TrabajoFormValues } from './trabajosPiecesShared';

// ── Modal Trabajo Planificado ─────────────────────────────────
export interface ModalTrabajoPlanProps {
  fecha: string;
  editData?: TrabajoRegistro | null;
  onClose: () => void;
}

export const ModalTrabajoPlan = React.memo(function ModalTrabajoPlan({ fecha, editData, onClose }: ModalTrabajoPlanProps) {
  const isEdit = !!editData;
  const { user } = useAuth();
  const currentUser = user?.email || 'sistema';

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TrabajoFormValues>({
    resolver: zodResolver(trabajoSchema),
    defaultValues: {
      fecha_planificada: editData?.fecha_planificada ?? fecha,
      finca: editData?.finca ?? '',
      parcel_id: editData?.parcel_id ?? '',
      tipo_bloque: editData?.tipo_bloque ?? 'mano_obra_interna',
      tipo_trabajo: editData?.tipo_trabajo ?? '',
      recursos_personal: editData?.recursos_personal ?? [],
      tractor_id: editData?.tractor_id ?? '',
      apero_id: editData?.apero_id ?? '',
      prioridad: editData?.prioridad ?? 'media',
      estado_planificacion: editData?.estado_planificacion ?? 'borrador',
      hora_inicio: editData?.hora_inicio?.slice(0, 5) ?? '',
      hora_fin: editData?.hora_fin?.slice(0, 5) ?? '',
      notas: editData?.notas ?? '',
    }
  });

  const finca = watch('finca');
  const parcelId = watch('parcel_id');
  const tipoTrabajo = watch('tipo_trabajo');
  const personalSel = watch('recursos_personal');
  const tractorId = watch('tractor_id');
  const aperoId = watch('apero_id');
  const notas = watch('notas');

  const [materiales,   setMateriales]   = useState<{ nombre: string; cantidad: string }[]>(
    editData?.materiales_previstos && Array.isArray(editData.materiales_previstos) ? (editData.materiales_previstos as { nombre: string; cantidad: string }[]) : []
  );
  const [foto,         setFoto]         = useState<File | null>(null);
  const [matNombre,    setMatNombre]    = useState('');
  const [matCantidad,  setMatCantidad]  = useState('');
  const [saving,       setSaving]       = useState(false);

  const { data: parcelas  = [] } = useParcelas(finca || undefined);
  const { data: personal  = [] } = usePersonal();
  const { data: tractores = [] } = useTractores();
  const { data: aperos    = [] } = useAperos(tractorId || undefined);
  const { data: tiposCat  = [] } = useTiposTrabajoCatalogoPersonal('');
  const addTipoCat = useAddTipoTrabajoCatalogo();

  const addMut    = useAddTrabajoPlanificado();
  const updateMut = useUpdateTrabajoPlanificado();

  const tiposOpciones = [...new Set([...TIPOS_TRABAJO, ...tiposCat.map(t => t.nombre)])];
  const personalActivo = personal.filter(p => p.activo);

  const addMaterial = () => {
    if (matNombre.trim()) {
      setMateriales(p => [...p, { nombre: matNombre.trim(), cantidad: matCantidad }]);
      setMatNombre(''); setMatCantidad('');
    }
  };

  const onSubmit = async (data: TrabajoFormValues) => {
    setSaving(true);
    try {
      let foto_url = editData?.foto_url ?? null;
      if (foto) foto_url = await uploadImage(foto, 'parcel-images', buildStoragePath('planificacion', foto));

      const payload = {
        tipo_bloque:          data.tipo_bloque,
        fecha:                data.fecha_planificada,
        hora_inicio:          data.hora_inicio || null,
        hora_fin:             data.hora_fin || null,
        finca:                data.finca || null,
        parcel_id:            data.parcel_id || null,
        tipo_trabajo:         data.tipo_trabajo,
        num_operarios:        data.recursos_personal.length || null,
        nombres_operarios:    data.recursos_personal.join(', ') || null,
        foto_url,
        notas:                data.notas || null,
        created_by:           currentUser,
        estado_planificacion: data.estado_planificacion,
        prioridad:            data.prioridad,
        fecha_planificada:    data.fecha_planificada,
        fecha_original:       editData?.fecha_original ?? null,
        recursos_personal:    data.recursos_personal.length > 0 ? data.recursos_personal : null,
        tractor_id:           data.tractor_id || null,
        apero_id:             data.apero_id || null,
        materiales_previstos: materiales.length > 0 ? materiales : null,
      };

      if (isEdit) {
        await updateMut.mutateAsync({ id: editData!.id, ...(payload as unknown as Parameters<typeof updateMut.mutateAsync>[0]) });
      } else {
        await addMut.mutateAsync(payload as unknown as Parameters<typeof addMut.mutateAsync>[0]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <Calendar className="w-4 h-4 text-[#6d9b7d]" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {isEdit ? 'Editar trabajo' : 'Nuevo trabajo planificado'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Fecha planificada */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fecha planificada</label>
            <input type="date" {...register('fecha_planificada')} className={INPUT} />
            <FormError message={errors.fecha_planificada?.message} />
          </div>

          {/* Finca */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca</label>
            <SelectWithOther
              value={finca || ''}
              onChange={v => { setValue('finca', v, { shouldValidate: true }); setValue('parcel_id', '', { shouldValidate: true }); }}
              options={FINCAS}
              onCreateNew={(newFinca) => setValue('finca', newFinca, { shouldValidate: true })}
              placeholder="Seleccionar finca…"
            />
            <FormError message={errors.finca?.message} />
          </div>

          {/* Parcela cascada */}
          {finca && parcelas.length > 0 && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Parcela</label>
              <SelectWithOther
                value={parcelId || ''}
                onChange={v => setValue('parcel_id', v, { shouldValidate: true })}
                options={parcelas.map(p => p.parcel_id)}
                onCreateNew={(newParcel) => setValue('parcel_id', newParcel, { shouldValidate: true })}
                placeholder="Finca completa"
              />
              <FormError message={errors.parcel_id?.message} />
            </div>
          )}

          {/* Tipo bloque */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo bloque</label>
            <select {...register('tipo_bloque')} className={INPUT}>
              <option value="mano_obra_interna">Mano Obra Interna</option>
              <option value="mano_obra_externa">Mano Obra Externa</option>
              <option value="maquinaria_agricola">Maquinaria Agrícola</option>
              <option value="logistica">Logística</option>
            </select>
            <FormError message={errors.tipo_bloque?.message} />
          </div>

          {/* Tipo trabajo */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo de trabajo *</label>
            <SelectWithOther
              value={tipoTrabajo || ''}
              onChange={v => setValue('tipo_trabajo', v, { shouldValidate: true })}
              options={tiposOpciones}
              onCreateNew={(newTipo) => {
                addTipoCat.mutate({ nombre: newTipo, categoria: 'general' });
                setValue('tipo_trabajo', newTipo, { shouldValidate: true });
              }}
              placeholder="Seleccionar tipo…"
            />
            <FormError message={errors.tipo_trabajo?.message} />
          </div>

          {/* Personal */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Personal asignado ({personalSel.length})
            </label>
            <SelectWithOther
              value=""
              onChange={v => { if (v && !personalSel.includes(v)) setValue('recursos_personal', [...personalSel, v], { shouldValidate: true }); }}
              options={personalActivo.map(p => p.nombre)}
              onCreateNew={(newPersonal) => { if (newPersonal && !personalSel.includes(newPersonal)) setValue('recursos_personal', [...personalSel, newPersonal], { shouldValidate: true }); }}
              placeholder="+ Añadir operario…"
            />
            {personalSel.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {personalSel.map(n => (
                  <span key={n} className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-full text-[10px] text-white">
                    {n}
                    <button type="button" onClick={() => setValue('recursos_personal', personalSel.filter(x => x !== n), { shouldValidate: true })} className="text-slate-400 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            )}
            <FormError message={errors.recursos_personal?.message} />
          </div>

          {/* Tractor / Apero */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tractor</label>
            <select
              value={tractorId || ''}
              onChange={e => { setValue('tractor_id', e.target.value || null, { shouldValidate: true }); setValue('apero_id', '', { shouldValidate: true }); }}
              className={INPUT}
            >
              <option value="">Sin tractor</option>
              {tractores.filter(t => t.activo).map(t => (
                <option key={t.id} value={t.id}>{t.matricula} — {t.marca}</option>
              ))}
            </select>
            <FormError message={errors.tractor_id?.message} />
          </div>
          {tractorId && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Apero</label>
              <select
                value={aperoId || ''}
                onChange={e => setValue('apero_id', e.target.value || null, { shouldValidate: true })}
                className={INPUT}
              >
                <option value="">Sin apero</option>
                {aperos.filter(a => a.activo).map(a => (
                  <option key={a.id} value={a.id}>{a.tipo} — {a.descripcion}</option>
                ))}
              </select>
              <FormError message={errors.apero_id?.message} />
            </div>
          )}

          {/* Materiales */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Materiales previstos</label>
            <div className="flex gap-2">
              <input type="text" value={matNombre} onChange={e => setMatNombre(e.target.value)}
                placeholder="Producto…" className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#6d9b7d]/50 focus:outline-none" />
              <input type="text" value={matCantidad} onChange={e => setMatCantidad(e.target.value)}
                placeholder="Cant." className="w-20 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#6d9b7d]/50 focus:outline-none" />
              <button type="button" onClick={addMaterial} className="px-3 py-2 rounded-lg bg-slate-700 text-white text-[10px] font-black hover:bg-slate-600 transition-colors">+</button>
            </div>
            {materiales.length > 0 && (
              <div className="mt-2 space-y-1">
                {materiales.map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-slate-800 rounded-lg border border-white/10">
                    <span className="text-[10px] text-white">{m.nombre} {m.cantidad && `· ${m.cantidad}`}</span>
                    <button type="button" onClick={() => setMateriales(p => p.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Prioridad</label>
            <select {...register('prioridad')} className={INPUT}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
            <FormError message={errors.prioridad?.message} />
          </div>

          {/* Estado planificación */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado</label>
            <select {...register('estado_planificacion')} className={INPUT}>
              <option value="borrador">Borrador</option>
              <option value="confirmado">Confirmado</option>
              <option value="ejecutado">Ejecutado</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <FormError message={errors.estado_planificacion?.message} />
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hora inicio</label>
              <input type="time" {...register('hora_inicio')} className={INPUT} />
              <FormError message={errors.hora_inicio?.message} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hora fin</label>
              <input type="time" {...register('hora_fin')} className={INPUT} />
              <FormError message={errors.hora_fin?.message} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas</label>
            <AudioInput value={notas || ''} onChange={v => setValue('notas', v, { shouldValidate: true })} rows={3} placeholder="Observaciones…" />
            <FormError message={errors.notas?.message} />
          </div>

          {/* Foto */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Foto (opcional)</label>
            <PhotoAttachment value={foto ? URL.createObjectURL(foto) : editData?.foto_url} onChange={setFoto} />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
          >Cancelar</button>
          <button type="button" onClick={(e) => { void handleSubmit(onSubmit)(e); }} disabled={saving}
            className="flex-1 py-2 rounded-lg bg-[#6d9b7d] text-[10px] font-black uppercase tracking-widest text-black transition-colors disabled:opacity-40"
          >
            {saving ? 'Guardando…' : isEdit ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
});
