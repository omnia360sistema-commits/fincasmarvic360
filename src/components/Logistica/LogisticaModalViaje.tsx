import React, { useState, useMemo } from 'react';
import { Clock, MapPin, Truck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAddViaje, useUpdateViaje, type Camion, type VehiculoEmpresa, type Viaje } from '@/hooks/useLogistica';
import type { Personal } from '@/hooks/usePersonal';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import { toast } from '@/hooks/use-toast';
import { uploadImage, buildStoragePath } from '@/utils/uploadImage';
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms';
import {
  INPUT,
  LABEL,
  DESTINOS_PRESET,
  calcHoras,
  fmtDatetime,
  matriculaVehiculo,
  nombreDe,
} from './logisticaModalShared';

export const ModalViaje = React.memo(function ModalViaje({
  initial, camiones, vehiculos, conductores, tiposTrabajo, onAddTipoTrabajo, onClose,
}: {
  initial?: Viaje;
  camiones: Camion[];
  vehiculos: VehiculoEmpresa[];
  conductores: Personal[];
  tiposTrabajo: { id: string; nombre: string }[];
  onAddTipoTrabajo: (nombre: string) => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const addMut = useAddViaje();
  const updMut = useUpdateViaje();
  const isEdit = !!initial;

  const catDestinos = useCatalogoLocal('logistica_destinos', [...FINCAS, ...DESTINOS_PRESET]);
  const destinos = catDestinos.opciones;

  const [form, setForm] = useState({
    personal_id:           initial?.personal_id ?? '',
    camion_id:             initial?.camion_id ?? '',
    finca:                 initial?.finca ?? '',
    destino:               initial?.destino ?? '',
    trabajo_realizado:     initial?.trabajo_realizado ?? '',
    ruta:                  initial?.ruta ?? '',
    hora_salida:           initial?.hora_salida ? initial.hora_salida.slice(0, 16) : new Date().toISOString().slice(0, 16),
    hora_llegada:          initial?.hora_llegada ? initial.hora_llegada.slice(0, 16) : '',
    gasto_gasolina_litros: String(initial?.gasto_gasolina_litros ?? ''),
    gasto_gasolina_euros:  String(initial?.gasto_gasolina_euros ?? ''),
    km_recorridos:         String(initial?.km_recorridos ?? ''),
    notas:                 initial?.notas ?? '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const horas = useMemo(() => calcHoras(form.hora_salida, form.hora_llegada), [form.hora_salida, form.hora_llegada]);
  const todos = [...camiones, ...vehiculos];

  const handleSubmit = async () => {
    const payload = {
      conductor_id:          null,
      personal_id:           form.personal_id || null,
      camion_id:             form.camion_id || null,
      finca:                 form.finca || null,
      destino:               form.destino || null,
      trabajo_realizado:     form.trabajo_realizado || null,
      ruta:                  form.ruta || null,
      hora_salida:           form.hora_salida || null,
      hora_llegada:          form.hora_llegada || null,
      gasto_gasolina_litros: form.gasto_gasolina_litros ? Number(form.gasto_gasolina_litros) : null,
      gasto_gasolina_euros:  form.gasto_gasolina_euros  ? Number(form.gasto_gasolina_euros)  : null,
      km_recorridos:         form.km_recorridos         ? Number(form.km_recorridos)          : null,
      notas:                 form.notas || null,
      created_by:            user?.email ?? 'sistema',
    };
    if (isEdit && initial) {
      await updMut.mutateAsync({ id: initial.id, ...payload });
    } else {
      await addMut.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = addMut.isPending || updMut.isPending;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <MapPin className="w-5 h-5 text-purple-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {isEdit ? 'Editar viaje' : 'Registrar viaje'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Conductor</label>
              <SelectWithOther
                options={conductores.map(c => c.nombre)}
                value={conductores.find(c => c.id === form.personal_id)?.nombre ?? ''}
                onChange={v => { const c = conductores.find(x => x.nombre === v); set('personal_id', c?.id ?? ''); }}
                onCreateNew={() => toast({ title: "Valor no persistible", description: "Crea este registro desde su módulo correspondiente." })}
                placeholder="Sin conductor"
              />
            </div>
            <div>
              <label className={LABEL}>Vehículo</label>
              <SelectWithOther
                options={todos.map(v => v.matricula + (v.marca ? ' · ' + v.marca : ''))}
                value={todos.find(v => v.id === form.camion_id) ? (todos.find(v => v.id === form.camion_id)!.matricula + ((todos.find(v => v.id === form.camion_id) as Camion)?.marca ? ' · ' + (todos.find(v => v.id === form.camion_id) as Camion)?.marca : '')) : ''}
                onChange={v => { const mat = v.split(' · ')[0]; const item = todos.find(x => x.matricula === mat); set('camion_id', item?.id ?? ''); }}
                onCreateNew={() => toast({ title: "Valor no persistible", description: "Crea este registro desde su módulo correspondiente." })}
                placeholder="Sin vehículo"
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Tipo de trabajo</label>
            <SelectWithOther
              options={tiposTrabajo.map(t => t.nombre)}
              value={form.trabajo_realizado}
              onChange={v => set('trabajo_realizado', v)}
              onCreateNew={v => { onAddTipoTrabajo(v); set('trabajo_realizado', v); }}
              placeholder="Seleccionar tipo"
            />
          </div>
          <div>
            <label className={LABEL}>Finca origen</label>
            <SelectWithOther
              options={FINCAS}
              value={form.finca}
              onChange={v => set('finca', v)}
              onCreateNew={v => set('finca', v)}
              placeholder="Sin finca específica"
            />
          </div>
          <div>
            <label className={LABEL}>Destino</label>
            <SelectWithOther
              options={destinos}
              value={form.destino}
              onChange={v => set('destino', v)}
              onCreateNew={v => { catDestinos.addOpcion(v); set('destino', v); }}
              placeholder="Seleccionar destino"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Salida</label>
              <input type="datetime-local" value={form.hora_salida} onChange={e => set('hora_salida', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Llegada</label>
              <input type="datetime-local" value={form.hora_llegada} onChange={e => set('hora_llegada', e.target.value)} className={INPUT} />
            </div>
          </div>
          {horas != null && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-black text-purple-400">{horas}h de viaje</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={LABEL}>Litros</label>
              <input type="number" min="0" step="0.1" value={form.gasto_gasolina_litros} onChange={e => set('gasto_gasolina_litros', e.target.value)} placeholder="0.0" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Euros (€)</label>
              <input type="number" min="0" step="0.01" value={form.gasto_gasolina_euros} onChange={e => set('gasto_gasolina_euros', e.target.value)} placeholder="0.00" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Km</label>
              <input type="number" min="0" value={form.km_recorridos} onChange={e => set('km_recorridos', e.target.value)} placeholder="0" className={INPUT} />
            </div>
          </div>
          <AudioInput label="RUTA / DESCRIPCIÓN" value={form.ruta} onChange={v => set('ruta', v)} rows={2} placeholder="Itinerario, observaciones…" />
          <div>
            <label className={LABEL}>GPS futuro</label>
            <input type="text" value="Datos GPS — próximamente" disabled className={INPUT + ' opacity-40 cursor-not-allowed'} />
          </div>
          <AudioInput label="NOTAS" value={form.notas} onChange={v => set('notas', v)} rows={2} placeholder="Observaciones adicionales…" />
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
