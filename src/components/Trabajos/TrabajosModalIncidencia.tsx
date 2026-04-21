import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  useAddIncidencia,
  useUpdateIncidencia,
  useAddTrabajoPlanificado,
  type TrabajoIncidencia,
} from '@/hooks/useTrabajos';
import { useParcelas } from '@/hooks/useParcelData';
import { SelectWithOther, PhotoAttachment } from '@/components/base';
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms';
import { uploadImage, buildStoragePath } from '@/utils/uploadImage';
import { hoy, INPUT } from './trabajosPiecesShared';

// ── Modal Incidencia completo ─────────────────────────────────
export const ModalIncidencia = React.memo(function ModalIncidencia({ editData, onClose }: { editData?: TrabajoIncidencia | null; onClose: () => void }) {
  const isEdit = !!editData;
  const { user } = useAuth();
  const currentUser = user?.email || 'sistema';
  const [urgente,    setUrgente]    = useState(editData?.urgente ?? false);
  const [titulo,     setTitulo]     = useState(editData?.titulo ?? '');
  const [descripcion,setDescripcion] = useState(editData?.descripcion ?? '');
  const [finca,      setFinca]      = useState(editData?.finca ?? '');
  const [parcelId,   setParcelId]   = useState(editData?.parcel_id ?? '');
  const [estado,     setEstado]     = useState(editData?.estado ?? 'abierta');
  const [fResolucion,setFResolucion] = useState(editData?.fecha_resolucion ?? '');
  const [notasResol, setNotasResol] = useState(editData?.notas_resolucion ?? '');
  const [foto,       setFoto]       = useState<File | null>(null);
  const [saving,     setSaving]     = useState(false);

  const { data: parcelas = [] } = useParcelas(finca || undefined);
  const addMut    = useAddIncidencia();
  const updateMut = useUpdateIncidencia();
  const addPlan   = useAddTrabajoPlanificado();

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      let foto_url = editData?.foto_url ?? null;
      if (foto) foto_url = await uploadImage(foto, 'parcel-images', buildStoragePath('incidencias', foto));

      const payload = {
        urgente,
        titulo,
        descripcion: descripcion || null,
        finca:       finca || null,
        parcel_id:   parcelId || null,
        estado:      estado as 'abierta' | 'en_proceso' | 'resuelta',
        foto_url,
        fecha:       editData?.fecha ?? hoy(),
        fecha_resolucion: estado === 'resuelta' ? (fResolucion || hoy()) : null,
        notas_resolucion: estado === 'resuelta' ? (notasResol || null) : null,
        created_by:  currentUser,
      };

      if (isEdit) {
        await updateMut.mutateAsync({ id: editData!.id, ...payload });
      } else {
        await addMut.mutateAsync(payload);
        // Si urgente → crear trabajo planificado para mañana
        if (urgente) {
          await addPlan.mutateAsync({
            tipo_bloque:          'mano_obra_interna',
            fecha:                addDays(hoy(), 1),
            hora_inicio:          null,
            hora_fin:             null,
            finca:                finca || null,
            parcel_id:            parcelId || null,
            tipo_trabajo:         `Incidencia: ${titulo}`,
            num_operarios:        null,
            nombres_operarios:    null,
            foto_url:             null,
            notas:                descripcion || null,
            created_by:           currentUser,
            estado_planificacion: 'borrador',
            prioridad:            'alta',
            fecha_planificada:    addDays(hoy(), 1),
            fecha_original:       null,
            recursos_personal:    null,
            tractor_id:           null,
            apero_id:             null,
            materiales_previstos: null,
          });
        }
      }
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {isEdit ? 'Editar incidencia' : 'Nueva incidencia'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Toggle urgente */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-slate-800/50">
            <button onClick={() => setUrgente(p => !p)}
              className={`w-10 h-5 rounded-full relative transition-colors ${urgente ? 'bg-red-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${urgente ? 'left-5' : 'left-0.5'}`} />
            </button>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-wider">{urgente ? 'URGENTE' : 'No urgente'}</p>
              <p className="text-[9px] text-slate-500">{urgente ? 'Generará trabajo para mañana' : 'Se resuelve en próximos días'}</p>
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Título *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Descripción breve…" className={INPUT} />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Descripción</label>
            <AudioInput value={descripcion} onChange={setDescripcion} rows={3} placeholder="Detalle adicional…" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca</label>
            <SelectWithOther value={finca} onChange={v => { setFinca(v); setParcelId(''); }} onCreateNew={(newFinca) => setFinca(newFinca)} options={FINCAS} placeholder="Sin finca específica" />
          </div>
          {finca && parcelas.length > 0 && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Parcela</label>
              <SelectWithOther value={parcelId} onChange={setParcelId} onCreateNew={(newParcel) => setParcelId(newParcel)} options={parcelas.map(p => p.parcel_id)} placeholder="Finca completa" />
            </div>
          )}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value as 'abierta' | 'en_proceso' | 'resuelta')} className={INPUT}>
              <option value="abierta">Abierta</option>
              <option value="en_proceso">En proceso</option>
              <option value="resuelta">Resuelta</option>
            </select>
          </div>
          {estado === 'resuelta' && (
            <>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fecha resolución</label>
                <input type="date" value={fResolucion} onChange={e => setFResolucion(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas resolución</label>
                <AudioInput value={notasResol} onChange={setNotasResol} rows={2} placeholder="Cómo se resolvió…" />
              </div>
            </>
          )}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Foto <span className="text-amber-500/70">(recomendada)</span>
            </label>
            <PhotoAttachment value={foto ? URL.createObjectURL(foto) : editData?.foto_url} onChange={setFoto} />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={!titulo.trim() || saving}
            className="flex-1 py-2 rounded-lg bg-amber-500 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-40"
          >{saving ? 'Guardando…' : isEdit ? 'Actualizar' : 'Registrar'}</button>
        </div>
      </div>
    </div>
  );
});
