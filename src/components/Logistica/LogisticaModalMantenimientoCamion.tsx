import React, { useState, useMemo } from 'react';
import { Fuel, Wrench, X } from 'lucide-react';
import {
  useAddMantenimientoCamion,
  useUpdateMantenimientoCamion,
  type Camion,
  type MantenimientoCamion,
  type VehiculoEmpresa,
} from '@/hooks/useLogistica';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import { toast } from '@/hooks/use-toast';
import { uploadImage, buildStoragePath } from '@/utils/uploadImage';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import {
  INPUT,
  LABEL,
  TALLERES,
  matriculaVehiculo,
} from './logisticaModalShared';

export const ModalMantenimiento = React.memo(function ModalMantenimiento({
  initial, camiones, vehiculos, tiposMant, onClose,
}: {
  initial?: MantenimientoCamion;
  camiones: Camion[];
  vehiculos: VehiculoEmpresa[];
  tiposMant: { id: string; nombre: string }[];
  onClose: () => void;
}) {
  const addMut = useAddMantenimientoCamion();
  const updMut = useUpdateMantenimientoCamion();
  const isEdit = !!initial;

  // Catálogo local de talleres/proveedores de mantenimiento
  const catTalleres = useCatalogoLocal('logistica_talleres', TALLERES);

  const tipoVehiculoInicial = (): 'camion' | 'vehiculo_empresa' =>
    initial?.vehiculo_empresa_id ? 'vehiculo_empresa' : 'camion';

  const [tipoVehiculo, setTipoVehiculo] = useState<'camion' | 'vehiculo_empresa'>(tipoVehiculoInicial);
  const [selectedId, setSelectedId] = useState(
    () => initial?.vehiculo_empresa_id ?? initial?.camion_id ?? '',
  );
  const [form, setForm] = useState({
    tipo:        initial?.tipo ?? '',
    descripcion: initial?.descripcion ?? '',
    fecha:       initial?.fecha ? initial.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
    coste_euros: String(initial?.coste_euros ?? ''),
    proveedor:   initial?.proveedor ?? '',
  });
  const [foto1, setFoto1] = useState<File | null>(null);
  const [foto2, setFoto2] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const foto1Preview = useMemo(() => foto1 ? URL.createObjectURL(foto1) : (initial?.foto_url ?? null), [foto1, initial?.foto_url]);
  const foto2Preview = useMemo(() => foto2 ? URL.createObjectURL(foto2) : (initial?.foto_url_2 ?? null), [foto2, initial?.foto_url_2]);

  const listaVehiculos = tipoVehiculo === 'camion' ? camiones : vehiculos;

  const tiposOpciones = tiposMant.map(t => t.nombre);

  const handleSubmit = async () => {
    if (!selectedId) {
      toast({ title: 'Vehículo requerido', description: 'Selecciona un camión o vehículo de empresa.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const fotoUrl1 = foto1 ? await uploadImage(foto1, 'parcel-images', buildStoragePath('mant-logistica', foto1)) ?? null : (initial?.foto_url ?? null);
      const fotoUrl2 = foto2 ? await uploadImage(foto2, 'parcel-images', buildStoragePath('mant-logistica', foto2)) ?? null : (initial?.foto_url_2 ?? null);
      const camion_id = tipoVehiculo === 'camion' ? (selectedId || null) : null;
      const vehiculo_empresa_id = tipoVehiculo === 'vehiculo_empresa' ? (selectedId || null) : null;
      const base: TablesInsert<'logistica_mantenimiento'> = {
        camion_id,
        vehiculo_empresa_id,
        tipo:        form.tipo || 'Revisión periódica',
        descripcion: form.descripcion || null,
        fecha:       form.fecha,
        coste_euros: form.coste_euros ? Number(form.coste_euros) : null,
        proveedor:   form.proveedor || null,
        foto_url:    fotoUrl1,
        foto_url_2:  fotoUrl2,
      };
      if (isEdit && initial) {
        const patch: TablesUpdate<'logistica_mantenimiento'> = {
          camion_id,
          vehiculo_empresa_id,
          tipo:        base.tipo,
          descripcion: base.descripcion,
          fecha:       base.fecha,
          coste_euros: base.coste_euros,
          proveedor:   base.proveedor,
          foto_url:    base.foto_url,
          foto_url_2:  base.foto_url_2,
        };
        await updMut.mutateAsync({ id: initial.id, ...patch });
      } else {
        await addMut.mutateAsync(base);
      }
      onClose();
    } finally {
      setUploading(false);
    }
  };

  const isPending = addMut.isPending || updMut.isPending || uploading;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <Wrench className="w-5 h-5 text-purple-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {isEdit ? 'Editar mantenimiento' : 'Nuevo mantenimiento'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Tipo de vehículo</label>
              <select
                value={tipoVehiculo}
                onChange={e => {
                  const v = e.target.value as 'camion' | 'vehiculo_empresa';
                  setTipoVehiculo(v);
                  setSelectedId('');
                }}
                className={INPUT}
              >
                <option value="camion">Camión</option>
                <option value="vehiculo_empresa">Vehículo empresa</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Vehículo</label>
              <SelectWithOther
                options={listaVehiculos.map(v => v.matricula + (v.marca ? ' · ' + v.marca : ''))}
                value={(() => {
                  const sel = listaVehiculos.find(v => v.id === selectedId);
                  return sel ? `${sel.matricula}${sel.marca ? ` · ${sel.marca}` : ''}` : '';
                })()}
                onChange={v => { const mat = v.split(' · ')[0]; const item = listaVehiculos.find(x => x.matricula === mat); setSelectedId(item?.id ?? ''); }}
                onCreateNew={() => toast({ title: "Valor no persistible", description: "Crea este registro desde su módulo correspondiente." })}
                placeholder="Seleccionar vehículo"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Tipo *</label>
              <SelectWithOther
                options={tiposOpciones}
                value={form.tipo}
                onChange={v => set('tipo', v)}
                onCreateNew={v => set('tipo', v)}
                placeholder="Seleccionar tipo"
              />
            </div>
            <div>
              <label className={LABEL}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={INPUT} />
            </div>
          </div>
          <AudioInput label="DESCRIPCIÓN" value={form.descripcion} onChange={v => set('descripcion', v)} rows={3} placeholder="Trabajo realizado, observaciones…" />
          <div>
            <label className={LABEL}>Taller / Proveedor</label>
            <SelectWithOther options={catTalleres.opciones} value={form.proveedor} onChange={v => set('proveedor', v)} onCreateNew={v => { catTalleres.addOpcion(v); set('proveedor', v); }} placeholder="Seleccionar taller" />
          </div>
          <div>
            <label className={LABEL}>Coste (€)</label>
            <input type="number" min="0" step="0.01" value={form.coste_euros} onChange={e => set('coste_euros', e.target.value)} placeholder="0.00" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Foto 1 — Albarán / Trabajo</label>
            <PhotoAttachment value={foto1Preview} onChange={setFoto1} />
          </div>
          <div>
            <label className={LABEL}>Foto 2 — ITV / Factura</label>
            <PhotoAttachment value={foto2Preview} onChange={setFoto2} />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={isPending}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40">
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
});
