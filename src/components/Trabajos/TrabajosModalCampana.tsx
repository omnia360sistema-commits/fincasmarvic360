import React, { useState, useEffect } from 'react';
import { Leaf, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAddPlanificacionCampana, useUpdatePlanificacionCampana } from '@/hooks/useTrabajos';
import type { EstadoCampana, PlanificacionCampana } from '@/hooks/useTrabajos';
import { useParcelas, useCropCatalog } from '@/hooks/useParcelData';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { SelectWithOther, AudioInput } from '@/components/base';
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms';
import { INPUT } from './trabajosPiecesShared';

// ── Modal Campaña ─────────────────────────────────────────────
export const ModalCampana = React.memo(function ModalCampana({ editData, onClose }: { editData?: PlanificacionCampana | null; onClose: () => void }) {
  const isEdit = !!editData;
  const { user } = useAuth();
  const currentUser = user?.email || 'sistema';
  const [finca,      setFinca]      = useState(editData?.finca ?? '');
  const [parcelId,   setParcelId]   = useState(editData?.parcel_id ?? '');
  const [cultivo,    setCultivo]    = useState(editData?.cultivo ?? '');
  const [fPlantacion,setFPlantacion] = useState(editData?.fecha_prevista_plantacion ?? '');
  const [fCosecha,   setFCosecha]   = useState(editData?.fecha_estimada_cosecha ?? '');
  const [recursos,   setRecursos]   = useState(editData?.recursos_estimados ?? '');
  const [observaciones, setObservaciones] = useState(editData?.observaciones ?? '');
  const [estado,     setEstado]     = useState<EstadoCampana>(editData?.estado ?? 'planificado');
  const [saving,     setSaving]     = useState(false);

  const { data: parcelas = [] } = useParcelas(finca || undefined);
  const { data: cultivos  = [] } = useCropCatalog();
  const addMut    = useAddPlanificacionCampana();
  const updateMut = useUpdatePlanificacionCampana();

  // Auto-calcular fecha cosecha desde ciclo_dias del cultivo
  useEffect(() => {
    if (!fPlantacion || !cultivo) return;
    const cat = cultivos.find(c => c.nombre_interno === cultivo || c.nombre_display === cultivo);
    if (cat?.ciclo_dias && !fCosecha) {
      const d = new Date(fPlantacion + 'T12:00:00');
      d.setDate(d.getDate() + cat.ciclo_dias);
      setFCosecha(d.toISOString().slice(0, 10));
    }
  }, [fPlantacion, cultivo, cultivos, fCosecha]);
  const handleSubmit = async () => {
    if (!finca.trim() || !cultivo.trim()) return;
    setSaving(true);
    try {
      const payload = {
        finca,
        parcel_id:                parcelId || null,
        cultivo,
        fecha_prevista_plantacion: fPlantacion || null,
        fecha_estimada_cosecha:   fCosecha || null,
        recursos_estimados:       recursos || null,
        observaciones:            observaciones || null,
        estado,
        created_by:               currentUser,
      };
      if (isEdit) await updateMut.mutateAsync({ id: editData!.id, ...payload });
      else await addMut.mutateAsync(payload);
      onClose();
    } finally { setSaving(false); }
  };

  const catCultivos = useCatalogoLocal('trabajos_cultivos', cultivos.map(c => c.nombre_display));
  const cultivosOpciones = catCultivos.opciones;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <Leaf className="w-4 h-4 text-green-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {isEdit ? 'Editar campaña' : 'Nueva planificación campaña'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca *</label>
            <SelectWithOther value={finca} onChange={v => { setFinca(v); setParcelId(''); }} onCreateNew={setFinca} options={FINCAS} placeholder="Seleccionar finca…" />
          </div>
          {finca && parcelas.length > 0 && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Parcela</label>
              <SelectWithOther value={parcelId} onChange={setParcelId} onCreateNew={setParcelId} options={parcelas.map(p => p.parcel_id)} placeholder="Finca completa" />
            </div>
          )}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cultivo *</label>
            <SelectWithOther value={cultivo} onChange={setCultivo} onCreateNew={v => { catCultivos.addOpcion(v); setCultivo(v); }} options={cultivosOpciones} placeholder="Seleccionar cultivo…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Plantación prevista</label>
              <input type="date" value={fPlantacion} onChange={e => setFPlantacion(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cosecha estimada</label>
              <input type="date" value={fCosecha} onChange={e => setFCosecha(e.target.value)} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Recursos estimados</label>
            <AudioInput value={recursos} onChange={setRecursos} rows={2} placeholder="Personal, maquinaria…" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Observaciones</label>
            <AudioInput value={observaciones} onChange={setObservaciones} rows={2} placeholder="Notas adicionales…" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value as EstadoCampana)} className={INPUT}>
              <option value="planificado">Planificado</option>
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={!finca.trim() || !cultivo.trim() || saving}
            className="flex-1 py-2 rounded-lg bg-green-500 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-40"
          >{saving ? 'Guardando…' : isEdit ? 'Actualizar' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  );
});
