import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, Tractor, Users, UserCheck,
  AlertTriangle, Plus, X, FileText, Camera,
  CheckCircle2, Clock, MapPin, ClipboardList, Briefcase,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  useRegistrosTrabajos, useAddTrabajoRegistro,
  useIncidencias, useAddIncidencia, useUpdateIncidencia,
  useKPIsTrabajos,
  TipoBloque, TrabajoRegistro, TrabajoIncidencia,
} from '../hooks/useTrabajos';
import { useParcelas, useAddPlanting, useAddHarvest } from '../hooks/useParcelData';
import { usePersonal, usePersonalExterno } from '../hooks/usePersonal';
import { useTractores, useAperos, useAddUsoMaquinaria } from '../hooks/useMaquinaria';
import { useCamiones, useAddViaje } from '../hooks/useLogistica';
import jsPDF from 'jspdf';
import { FINCAS_NOMBRES as FINCAS } from '../constants/farms';
import { TIPOS_TRABAJO } from '../constants/tiposTrabajo';
import { uploadImage, buildStoragePath } from '../utils/uploadImage';
import { formatHora, formatFechaCorta, formatFechaCompleta } from '../utils/dateFormat';

// ── Constantes ───────────────────────────────────────────────

const BLOQUES: { id: TipoBloque; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: 'maquinaria_agricola', label: 'Maquinaria Agrícola', icon: Tractor,   color: '#fb923c', desc: 'Tractores, aperos y labores mecánicas' },
  { id: 'logistica',           label: 'Logística',           icon: Truck,     color: '#a78bfa', desc: 'Transporte, rutas y entregas' },
  { id: 'mano_obra_interna',   label: 'Mano Obra Interna',   icon: Users,     color: '#34d399', desc: 'Personal propio de Marvic' },
  { id: 'mano_obra_externa',   label: 'Mano Obra Externa',   icon: UserCheck, color: '#60a5fa', desc: 'Subcontratas y cuadrillas externas' },
];

const TIPOS_PLANTACION = new Set(['Plantación', 'Trasplante', 'Siembra']);
const TIPOS_COSECHA    = new Set(['Cosecha', 'Recolección']);

const INPUT = 'w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none';

function calcHoras(inicio: string, fin: string): number | null {
  if (!inicio || !fin) return null;
  const diff = (new Date(fin).getTime() - new Date(inicio).getTime()) / 3600000;
  return diff > 0 ? +diff.toFixed(2) : null;
}

// ── Modal registro ────────────────────────────────────────────

interface ModalRegistroProps { tipoBloque: TipoBloque; onClose: () => void }

function ModalRegistro({ tipoBloque, onClose }: ModalRegistroProps) {
  const bloque  = BLOQUES.find(b => b.id === tipoBloque)!;
  const now     = new Date().toISOString().slice(0, 16);

  // Common
  const [finca, setFinca]               = useState('');
  const [parcelId, setParcelId]         = useState('');
  const [tipoTrabajo, setTipoTrabajo]   = useState('');
  const [horaInicio, setHoraInicio]     = useState(now);
  const [horaFin, setHoraFin]           = useState('');
  const [notas, setNotas]               = useState('');
  const [foto, setFoto]                 = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Maquinaria
  const [tractorId, setTractorId]   = useState('');
  const [aperoId, setAperoId]       = useState('');
  const [personalId, setPersonalId] = useState('');
  const [gasolinaL, setGasolinaL]   = useState('');

  // Logística extra
  const [camionId, setCamionId]         = useState('');
  const [destino, setDestino]           = useState('');
  const [kmRecorridos, setKmRecorridos] = useState('');

  // Operarios (mano interna / externa)
  const [nombresSelec, setNombresSelec] = useState<string[]>([]);
  const [nombreLibre, setNombreLibre]   = useState('');

  // Campo integration
  const [cultivo, setCultivo]         = useState('');
  const [variedad, setVariedad]       = useState('');
  const [produccionKg, setProduccionKg] = useState('');

  // Data
  const { data: personal  = [] } = usePersonal();
  const { data: persExt   = [] } = usePersonalExterno();
  const { data: tractores = [] } = useTractores();
  const { data: aperos    = [] } = useAperos(tractorId || undefined);
  const { data: camiones  = [] } = useCamiones();
  const { data: parcelas  = [] } = useParcelas(finca || undefined);

  // Mutations
  const addTrabajo  = useAddTrabajoRegistro();
  const addUso      = useAddUsoMaquinaria();
  const addViaje    = useAddViaje();
  const addPlanting = useAddPlanting();
  const addHarvest  = useAddHarvest();

  // Filtered personal
  const tractoristas = personal.filter(p => p.activo && p.categoria === 'conductor_maquinaria');
  const conductores  = personal.filter(p => p.activo && p.categoria === 'conductor_camion');
  const operarios    = personal.filter(p => p.activo && ['operario_campo', 'encargado'].includes(p.categoria));

  // Derived
  const horas         = useMemo(() => calcHoras(horaInicio, horaFin), [horaInicio, horaFin]);
  const esMaq         = tipoBloque === 'maquinaria_agricola';
  const esLog         = tipoBloque === 'logistica';
  const esInterna     = tipoBloque === 'mano_obra_interna';
  const esExterna     = tipoBloque === 'mano_obra_externa';
  const esPlantacion  = TIPOS_PLANTACION.has(tipoTrabajo);
  const esCosecha     = TIPOS_COSECHA.has(tipoTrabajo);

  const conductorNombre = personal.find(p => p.id === personalId)?.nombre ?? '';
  const numOpFinal  = (esMaq || esLog) ? (conductorNombre ? 1 : 0) : nombresSelec.length;
  const nombresStr  = (esMaq || esLog) ? (conductorNombre || null) : (nombresSelec.join(', ') || null);

  const addNombre = (n: string) => {
    if (n && !nombresSelec.includes(n)) setNombresSelec(p => [...p, n]);
  };
  const removeNombre = (n: string) => setNombresSelec(p => p.filter(x => x !== n));

  const handleSubmit = async () => {
    if (!tipoTrabajo || !foto) return;
    setUploading(true);
    try {
      const foto_url = await uploadImage(foto, 'parcel-images', buildStoragePath('trabajos', foto));
      const fecha    = new Date().toISOString().slice(0, 10);

      // 1 — trabajos_registro (siempre)
      await addTrabajo.mutateAsync({
        tipo_bloque:       tipoBloque,
        fecha,
        hora_inicio:       horaInicio || null,
        hora_fin:          horaFin    || null,
        finca:             finca      || null,
        parcel_id:         parcelId   || null,
        tipo_trabajo:      tipoTrabajo,
        num_operarios:     numOpFinal > 0 ? numOpFinal : null,
        nombres_operarios: nombresStr,
        foto_url,
        notas:             notas || null,
        created_by:        'JuanPe',
      });

      // 2 — maquinaria_uso (solo bloque maquinaria con tractor)
      if (esMaq && tractorId) {
        await addUso.mutateAsync({
          tractor_id:       tractorId  || null,
          apero_id:         aperoId    || null,
          tractorista:      conductorNombre,
          personal_id:      personalId || null,
          finca:            finca      || null,
          parcel_id:        parcelId   || null,
          tipo_trabajo:     tipoTrabajo || null,
          fecha,
          hora_inicio:      horaInicio || null,
          hora_fin:         horaFin    || null,
          horas_trabajadas: horas,
          gasolina_litros:  gasolinaL ? parseFloat(gasolinaL) : null,
          notas:            notas || null,
          created_by:       'JuanPe',
        });
      }

      // 3 — logistica_viajes (solo bloque logistica con camion)
      if (esLog && camionId) {
        await addViaje.mutateAsync({
          conductor_id:          null,
          personal_id:           personalId || null,
          camion_id:             camionId   || null,
          finca:                 finca      || null,
          destino:               destino    || null,
          trabajo_realizado:     tipoTrabajo,
          ruta:                  null,
          hora_salida:           horaInicio || null,
          hora_llegada:          horaFin    || null,
          gasto_gasolina_litros: null,
          gasto_gasolina_euros:  null,
          km_recorridos:         kmRecorridos ? parseFloat(kmRecorridos) : null,
          notas:                 notas || null,
          created_by:            'JuanPe',
        });
      }

      // 4 — plantings (si tipo = plantación y hay parcela y cultivo)
      if (parcelId && esPlantacion && cultivo.trim()) {
        await addPlanting.mutateAsync({
          parcel_id:   parcelId,
          crop:        cultivo.trim(),
          date:        fecha,
          variedad:    variedad || null,
          lote_semilla: null,
        });
      }

      // 5 — harvests (si tipo = cosecha y hay parcela y cultivo)
      if (parcelId && esCosecha && cultivo.trim()) {
        await addHarvest.mutateAsync({
          parcel_id:     parcelId,
          crop:          cultivo.trim(),
          date:          fecha,
          production_kg: produccionKg ? parseFloat(produccionKg) : null,
          price_kg:      null,
        });
      }

      onClose();
    } finally {
      setUploading(false);
    }
  };

  const IconComp = bloque.icon;
  const canSave  = !!tipoTrabajo && !!foto && !uploading && !addTrabajo.isPending;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0" style={{ borderLeftColor: bloque.color, borderLeftWidth: 3 }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: bloque.color + '20' }}>
            <IconComp className="w-4 h-4" style={{ color: bloque.color }} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black text-white uppercase tracking-wider">{bloque.label}</p>
            <p className="text-[9px] text-slate-500">Nuevo registro</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">

          {/* Tipo trabajo */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo de trabajo *</label>
            <select value={tipoTrabajo} onChange={e => setTipoTrabajo(e.target.value)} className={INPUT}>
              <option value="">Seleccionar…</option>
              {TIPOS_TRABAJO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Finca */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca</label>
            <select value={finca} onChange={e => { setFinca(e.target.value); setParcelId(''); }} className={INPUT}>
              <option value="">— Todas / No aplica —</option>
              {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Parcela (cascade) */}
          {finca && parcelas.length > 0 && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Parcela / Sector</label>
              <select value={parcelId} onChange={e => setParcelId(e.target.value)} className={INPUT}>
                <option value="">— Finca completa —</option>
                {parcelas.map(p => <option key={p.parcel_id} value={p.parcel_id}>{p.parcel_number}</option>)}
              </select>
            </div>
          )}

          {/* Hora inicio / fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hora inicio</label>
              <input type="datetime-local" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hora fin</label>
              <input type="datetime-local" value={horaFin} onChange={e => setHoraFin(e.target.value)} className={INPUT} />
            </div>
          </div>

          {/* Horas calculadas */}
          {horas != null && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#38bdf8]/5 rounded-lg border border-[#38bdf8]/20">
              <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="text-[10px] font-black text-[#38bdf8]">{horas}h trabajadas</span>
            </div>
          )}

          {/* ─── SECCIÓN MAQUINARIA ─── */}
          {esMaq && (
            <div className="space-y-3 pt-1">
              <p className="text-[9px] font-black text-orange-400/80 uppercase tracking-widest border-t border-white/5 pt-3">Maquinaria</p>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tractor</label>
                <select value={tractorId} onChange={e => { setTractorId(e.target.value); setAperoId(''); }} className={INPUT}>
                  <option value="">— Sin tractor —</option>
                  {tractores.filter(t => t.activo).map(t => (
                    <option key={t.id} value={t.id}>{t.matricula}{t.marca ? ` · ${t.marca}` : ''}</option>
                  ))}
                </select>
              </div>

              {tractorId && (
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Apero</label>
                  <select value={aperoId} onChange={e => setAperoId(e.target.value)} className={INPUT}>
                    <option value="">— Sin apero —</option>
                    {aperos.filter(a => a.activo).map(a => (
                      <option key={a.id} value={a.id}>{a.tipo}{a.descripcion ? ` · ${a.descripcion}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tractorista</label>
                <select value={personalId} onChange={e => setPersonalId(e.target.value)} className={INPUT}>
                  <option value="">— Sin asignar —</option>
                  {tractoristas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Gasolina (litros)</label>
                <input type="number" min="0" step="0.5" value={gasolinaL} onChange={e => setGasolinaL(e.target.value)} placeholder="0.0" className={INPUT} />
              </div>
            </div>
          )}

          {/* ─── SECCIÓN LOGÍSTICA ─── */}
          {esLog && (
            <div className="space-y-3 pt-1">
              <p className="text-[9px] font-black text-violet-400/80 uppercase tracking-widest border-t border-white/5 pt-3">Logística</p>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Camión</label>
                <select value={camionId} onChange={e => setCamionId(e.target.value)} className={INPUT}>
                  <option value="">— Sin camión —</option>
                  {camiones.filter(c => c.activo).map(c => (
                    <option key={c.id} value={c.id}>{c.matricula}{c.marca ? ` · ${c.marca}` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Conductor</label>
                <select value={personalId} onChange={e => setPersonalId(e.target.value)} className={INPUT}>
                  <option value="">— Sin asignar —</option>
                  {conductores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Destino</label>
                <input type="text" value={destino} onChange={e => setDestino(e.target.value)} placeholder="Almería, Mercamurcia…" className={INPUT} />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Km recorridos</label>
                <input type="number" min="0" step="1" value={kmRecorridos} onChange={e => setKmRecorridos(e.target.value)} placeholder="0" className={INPUT} />
              </div>
            </div>
          )}

          {/* ─── SECCIÓN OPERARIOS (interna / externa) ─── */}
          {(esInterna || esExterna) && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Operarios ({nombresSelec.length})
              </label>

              {esInterna && (
                <select value="" onChange={e => { addNombre(e.target.value); e.currentTarget.value = ''; }} className={INPUT + ' mb-2'}>
                  <option value="">+ Añadir desde Personal…</option>
                  {operarios.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
              )}

              {esExterna && (
                <select value="" onChange={e => { addNombre(e.target.value); e.currentTarget.value = ''; }} className={INPUT + ' mb-2'}>
                  <option value="">+ Añadir empresa externa…</option>
                  {persExt.filter(p => p.activo).map(p => <option key={p.id} value={p.nombre_empresa}>{p.nombre_empresa}</option>)}
                </select>
              )}

              <div className="flex gap-2">
                <input
                  type="text" value={nombreLibre}
                  onChange={e => setNombreLibre(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { addNombre(nombreLibre.trim()); setNombreLibre(''); } }}
                  placeholder="Nombre manual…"
                  className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
                />
                <button type="button" onClick={() => { addNombre(nombreLibre.trim()); setNombreLibre(''); }}
                  className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                >+</button>
              </div>

              {nombresSelec.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {nombresSelec.map(n => (
                    <span key={n} className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-full text-[10px] text-white">
                      {n}
                      <button type="button" onClick={() => removeNombre(n)} className="text-slate-400 hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── CAMPO INTEGRATION (plantación / cosecha) ─── */}
          {(esPlantacion || esCosecha) && parcelId && (
            <div className="space-y-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
              <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">
                {esPlantacion ? '🌱 Registro Campo — Plantación' : '🌾 Registro Campo — Cosecha'}
              </p>
              <p className="text-[8px] text-slate-500 -mt-1">Se guardará también en el módulo Campo</p>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cultivo *</label>
                <input type="text" value={cultivo} onChange={e => setCultivo(e.target.value)} placeholder="Brócoli, Lechuga…" className={INPUT} />
              </div>

              {esPlantacion && (
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Variedad</label>
                  <input type="text" value={variedad} onChange={e => setVariedad(e.target.value)} placeholder="Ironman, Dazzle…" className={INPUT} />
                </div>
              )}

              {esCosecha && (
                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Producción (kg)</label>
                  <input type="number" min="0" step="10" value={produccionKg} onChange={e => setProduccionKg(e.target.value)} placeholder="0" className={INPUT} />
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Observaciones…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-[#38bdf8]/50 focus:outline-none"
            />
          </div>

          {/* Foto obligatoria */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Foto <span style={{ color: bloque.color }}>*</span>
              {!foto && <span className="ml-2 text-red-400 normal-case font-normal">(obligatoria)</span>}
            </label>
            {foto ? (
              <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg border border-white/10">
                <img src={URL.createObjectURL(foto)} alt="preview" className="w-12 h-12 object-cover rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white truncate">{foto.name}</p>
                  <p className="text-[9px] text-slate-500">{(foto.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={() => setFoto(null)} className="text-slate-500 hover:text-red-400 transition-colors">×</button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-dashed border-red-500/30 cursor-pointer hover:border-red-500/50 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] text-slate-400">Tomar foto o seleccionar archivo</span>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFoto(f); }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
          >Cancelar</button>
          <button onClick={handleSubmit} disabled={!canSave}
            className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
            style={{ backgroundColor: bloque.color, color: '#000' }}
          >
            {(uploading || addTrabajo.isPending) ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal incidencia ──────────────────────────────────────────

function ModalIncidencia({ onClose }: { onClose: () => void }) {
  const addMut  = useAddIncidencia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ urgente: false, titulo: '', descripcion: '', finca: '' });
  const [foto, setFoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.titulo.trim()) return;
    setUploading(true);
    try {
      let foto_url: string | null = null;
      if (foto) foto_url = await uploadImage(foto, 'parcel-images', buildStoragePath('incidencias', foto));
      await addMut.mutateAsync({
        urgente:          form.urgente,
        titulo:           form.titulo,
        descripcion:      form.descripcion || null,
        finca:            form.finca || null,
        parcel_id:        null,
        estado:           'abierta',
        foto_url,
        fecha:            new Date().toISOString().slice(0, 10),
        fecha_resolucion: null,
        notas_resolucion: null,
        created_by:       'JuanPe',
      });
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Nueva incidencia</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Urgente toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-slate-800/50">
            <button onClick={() => set('urgente', !form.urgente)}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.urgente ? 'bg-red-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.urgente ? 'left-5' : 'left-0.5'}`} />
            </button>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-wider">{form.urgente ? 'URGENTE' : 'No urgente'}</p>
              <p className="text-[9px] text-slate-500">{form.urgente ? 'Requiere atención inmediata' : 'Se puede resolver en próximos días'}</p>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Título *</label>
            <input type="text" value={form.titulo} onChange={e => set('titulo', e.target.value)}
              placeholder="Descripción breve del problema…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca</label>
            <select value={form.finca} onChange={e => set('finca', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
            >
              <option value="">— Sin finca específica —</option>
              {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3}
              placeholder="Detalle adicional…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-[#38bdf8]/50 focus:outline-none"
            />
          </div>

          {/* Foto */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Foto</label>
            {foto ? (
              <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg border border-white/10">
                <img src={URL.createObjectURL(foto)} alt="preview" className="w-12 h-12 object-cover rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white truncate">{foto.name}</p>
                  <p className="text-[9px] text-slate-500">{(foto.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={() => setFoto(null)} className="text-slate-500 hover:text-red-400">×</button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg border border-dashed border-white/20 cursor-pointer hover:border-white/40 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] text-slate-400">Añadir foto (opcional)</span>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFoto(f); }}
                />
              </label>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
          >Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.titulo || uploading || addMut.isPending}
            className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[10px] font-black text-black uppercase tracking-widest transition-colors disabled:opacity-40"
          >
            {(uploading || addMut.isPending) ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta registro ──────────────────────────────────────────

function TarjetaRegistro({ r }: { r: TrabajoRegistro }) {
  const bloque = BLOQUES.find(b => b.id === r.tipo_bloque);
  const horas  = r.hora_inicio && r.hora_fin ? calcHoras(r.hora_inicio, r.hora_fin) : null;

  return (
    <div className="p-3 rounded-lg border border-white/10 bg-slate-800/40 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold text-white leading-tight">{r.tipo_trabajo}</p>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap shrink-0">
          {formatFechaCorta(r.fecha)}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {r.finca && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <MapPin className="w-2.5 h-2.5" />{r.finca}{r.parcel_id ? ` · ${r.parcel_id}` : ''}
          </span>
        )}
        {(r.hora_inicio || r.hora_fin) && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Clock className="w-2.5 h-2.5" />
            {formatHora(r.hora_inicio)}{' → '}{formatHora(r.hora_fin)}
            {horas != null && <span className="text-[#38bdf8] font-black ml-1">{horas}h</span>}
          </span>
        )}
        {r.num_operarios != null && r.num_operarios > 0 && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Users className="w-2.5 h-2.5" />{r.num_operarios} op.
            {r.nombres_operarios && <span className="text-slate-500"> ({r.nombres_operarios})</span>}
          </span>
        )}
      </div>

      {r.notas && <p className="text-[9px] text-slate-500 italic">{r.notas}</p>}

      {bloque && (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: bloque.color + '18' }}>
          <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: bloque.color }}>{bloque.label}</span>
        </div>
      )}

      {r.foto_url && (
        <img src={r.foto_url} alt="foto" className="w-full max-h-32 object-cover rounded-lg mt-1 opacity-80" />
      )}
    </div>
  );
}

// ── Tarjeta incidencia ────────────────────────────────────────

function TarjetaIncidencia({ inc }: { inc: TrabajoIncidencia }) {
  const updateMut = useUpdateIncidencia();
  const colorEstado = inc.estado === 'resuelta' ? '#34d399' : inc.urgente ? '#ef4444' : '#f59e0b';

  return (
    <div className={`p-3 rounded-lg border bg-slate-800/40 space-y-1.5 ${
      inc.urgente && inc.estado !== 'resuelta' ? 'border-red-500/40' : 'border-white/10'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {inc.urgente && inc.estado !== 'resuelta' && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
          <p className="text-[11px] font-bold text-white leading-tight">{inc.titulo}</p>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0"
          style={{ color: colorEstado, backgroundColor: colorEstado + '18' }}
        >
          {inc.estado}
        </span>
      </div>

      {inc.finca && (
        <span className="flex items-center gap-1 text-[9px] text-slate-400">
          <MapPin className="w-2.5 h-2.5" />{inc.finca}
        </span>
      )}
      {inc.descripcion && <p className="text-[9px] text-slate-400">{inc.descripcion}</p>}
      {inc.foto_url && <img src={inc.foto_url} alt="foto" className="w-full max-h-28 object-cover rounded-lg opacity-80" />}

      {inc.estado !== 'resuelta' && (
        <div className="flex gap-2 pt-1">
          {inc.estado === 'abierta' && (
            <button onClick={() => updateMut.mutate({ id: inc.id, estado: 'en_proceso' })}
              className="text-[9px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest"
            >En proceso</button>
          )}
          <button onClick={() => updateMut.mutate({ id: inc.id, estado: 'resuelta', fecha_resolucion: new Date().toISOString().slice(0, 10) })}
            className="text-[9px] font-black text-green-400 hover:text-green-300 uppercase tracking-widest"
          >Resolver</button>
        </div>
      )}
    </div>
  );
}

// ── Generación PDF ────────────────────────────────────────────

async function generarPDF(registros: TrabajoRegistro[], incidencias: TrabajoIncidencia[]) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W   = doc.internal.pageSize.getWidth();
  let y     = 20;

  const checkPage = (need = 10) => { if (y + need > 280) { doc.addPage(); y = 20; } };
  const writeLine = (text: string, size = 9, bold = false, color: [number, number, number] = [255, 255, 255]) => {
    doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...color);
    doc.text(text, 14, y); y += size * 0.45;
  };
  const separator = () => {
    checkPage(6); doc.setDrawColor(56, 189, 248); doc.setLineWidth(0.2); doc.line(14, y, W - 14, y); y += 4;
  };

  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(10, 8, W - 20, 20, 2, 2, 'F');
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(56, 189, 248);
  doc.text('AGRÍCOLA MARVIC', 16, 17);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
  doc.text('Informe de Trabajos', 16, 23);
  doc.text(formatFechaCompleta(new Date().toISOString()), W - 50, 23);
  y = 36;

  const abiertas = incidencias.filter(i => i.estado !== 'resuelta').length;
  const urgentes = incidencias.filter(i => i.urgente && i.estado !== 'resuelta').length;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(10, y, W - 20, 14, 2, 2, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(248, 113, 113);
  doc.text(`Incidencias abiertas: ${abiertas}  |  Urgentes: ${urgentes}  |  Total registros: ${registros.length}`, 16, y + 9);
  y += 20;

  const porBloque: Record<TipoBloque, TrabajoRegistro[]> = {
    logistica: [], maquinaria_agricola: [], mano_obra_interna: [], mano_obra_externa: [],
  };
  registros.forEach(r => porBloque[r.tipo_bloque].push(r));

  for (const bloque of BLOQUES) {
    const lista = porBloque[bloque.id];
    if (!lista.length) continue;

    checkPage(14);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(56, 189, 248);
    doc.text(bloque.label.toUpperCase(), 14, y);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    doc.text(`${lista.length} registros`, W - 40, y);
    y += 6; separator();

    for (const r of lista) {
      checkPage(18);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text(r.tipo_trabajo, 14, y);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(formatFechaCompleta(r.fecha), W - 50, y);
      y += 5;

      const horas = r.hora_inicio && r.hora_fin ? calcHoras(r.hora_inicio, r.hora_fin) : null;
      const detalles = [
        r.finca && `Finca: ${r.finca}`,
        r.num_operarios && `${r.num_operarios} operarios`,
        r.nombres_operarios,
        r.hora_inicio && `${formatHora(r.hora_inicio)} → ${formatHora(r.hora_fin)}`,
        horas && `${horas}h`,
      ].filter(Boolean).join('  ·  ');
      if (detalles) {
        doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
        doc.text(detalles, 14, y); y += 4;
      }
      if (r.notas) {
        doc.setFontSize(7); doc.setTextColor(71, 85, 105);
        const lines = doc.splitTextToSize(r.notas, W - 28) as string[];
        lines.forEach((l: string) => { checkPage(4); doc.text(l, 14, y); y += 3.5; });
      }
      y += 2;
    }
    y += 4;
  }

  if (incidencias.length) {
    checkPage(14);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(56, 189, 248);
    doc.text('INCIDENCIAS', 14, y);
    y += 6; separator();

    for (const inc of incidencias) {
      checkPage(14);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.setTextColor(inc.urgente ? 239 : 255, inc.urgente ? 68 : 255, inc.urgente ? 68 : 255);
      doc.text((inc.urgente ? '[URGENTE] ' : '') + inc.titulo, 14, y);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
      doc.text(inc.estado.toUpperCase(), W - 40, y);
      y += 5;
      if (inc.descripcion) {
        doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
        const lines = doc.splitTextToSize(inc.descripcion, W - 28) as string[];
        lines.forEach((l: string) => { checkPage(4); doc.text(l, 14, y); y += 3.5; });
      }
      y += 2;
    }
  }

  doc.save(`Trabajos_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Componente principal ──────────────────────────────────────

export default function Trabajos() {
  const navigate  = useNavigate();
  const { theme } = useTheme();
  const isDark    = theme === 'dark';

  const [activeBloque,    setActiveBloque]    = useState<TipoBloque | null>(null);
  const [modalRegistro,   setModalRegistro]   = useState<TipoBloque | null>(null);
  const [modalIncidencia, setModalIncidencia] = useState(false);
  const [tabIncidencias,  setTabIncidencias]  = useState(false);

  const { data: kpis }        = useKPIsTrabajos();
  const { data: incidencias } = useIncidencias();
  const { data: registros }   = useRegistrosTrabajos(activeBloque ?? undefined);

  const incAbiertas = (incidencias ?? []).filter(i => i.estado !== 'resuelta').length;
  const incUrgentes = (incidencias ?? []).filter(i => i.urgente && i.estado !== 'resuelta').length;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} flex flex-col`}>

      {/* HEADER */}
      <header className={`w-full ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/90 border-slate-200'} border-b px-4 py-2 flex items-center gap-3 z-50`}>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-slate-400 hover:text-[#38bdf8] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <span className="text-slate-600">|</span>
        <Briefcase className="w-4 h-4 text-amber-400" />
        <span className="text-[11px] font-black uppercase tracking-wider">Trabajos</span>

        <div className="ml-auto flex items-center gap-2">
          {incUrgentes > 0 && (
            <button onClick={() => setTabIncidencias(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" />
              {incUrgentes} urgente{incUrgentes > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => generarPDF(registros ?? [], incidencias ?? [])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/10 text-[#38bdf8] text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <FileText className="w-3 h-3" />PDF
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Registros',            value: kpis?.totalRegistros ?? 0,                        color: '#f59e0b' },
            { label: 'Incidencias abiertas', value: incAbiertas,                                       color: incAbiertas > 0 ? '#ef4444' : '#34d399' },
            { label: 'Urgentes',             value: incUrgentes,                                       color: incUrgentes > 0 ? '#ef4444' : '#64748b' },
          ].map(kpi => (
            <div key={kpi.label} className={`${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-3 text-center`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className={`flex gap-1 mb-5 ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-1`}>
          <button onClick={() => setTabIncidencias(false)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
              !tabIncidencias ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" />Registros
          </button>
          <button onClick={() => setTabIncidencias(true)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors relative ${
              tabIncidencias ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />Incidencias
            {incAbiertas > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[8px] font-black text-white">
                {incAbiertas}
              </span>
            )}
          </button>
        </div>

        {!tabIncidencias ? (
          <>
            {/* 4 BLOQUES */}
            <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-4">
              {BLOQUES.map(b => {
                const Icon  = b.icon;
                const activo = activeBloque === b.id;
                return (
                  <button key={b.id} onClick={() => setActiveBloque(activo ? null : b.id)}
                    className={`relative group p-4 rounded-xl border text-left transition-all ${
                      activo
                        ? 'shadow-lg'
                        : `${isDark ? 'bg-slate-900/50 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300'}`
                    }`}
                    style={activo ? { backgroundColor: b.color + '15', borderColor: b.color + '60' } : {}}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: b.color + '20' }}>
                      <Icon className="w-4 h-4" style={{ color: b.color }} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-wide leading-tight">{b.label}</p>
                    <p className="text-[8px] text-slate-400 mt-0.5">{b.desc}</p>
                    <button onClick={e => { e.stopPropagation(); setModalRegistro(b.id); }}
                      className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-colors hover:opacity-80"
                      style={{ color: b.color }}
                    >
                      <Plus className="w-3 h-3" />Añadir
                    </button>
                  </button>
                );
              })}
            </div>

            {/* Botones acción */}
            <div className="flex gap-3 mb-5">
              <button onClick={() => setModalIncidencia(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />Registrar incidencia
              </button>
              {activeBloque && (
                <button onClick={() => setActiveBloque(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />Ver todos
                </button>
              )}
            </div>

            {/* Lista registros */}
            <div className="space-y-2">
              {(registros ?? []).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin registros</p>
                  <p className="text-[10px] mt-1">Usa el botón Añadir en cada bloque</p>
                </div>
              ) : (
                (registros ?? []).map(r => <TarjetaRegistro key={r.id} r={r} />)
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {(incidencias ?? []).length} incidencias
              </p>
              <button onClick={() => setModalIncidencia(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" />Nueva
              </button>
            </div>
            <div className="space-y-2">
              {(incidencias ?? []).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin incidencias</p>
                </div>
              ) : (
                (incidencias ?? []).map(i => <TarjetaIncidencia key={i.id} inc={i} />)
              )}
            </div>
          </>
        )}
      </main>

      {modalRegistro   && <ModalRegistro   tipoBloque={modalRegistro} onClose={() => setModalRegistro(null)} />}
      {modalIncidencia && <ModalIncidencia onClose={() => setModalIncidencia(false)} />}
    </div>
  );
}
