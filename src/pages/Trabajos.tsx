import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, Tractor, Users, UserCheck,
  AlertTriangle, Plus, X, ChevronDown, ChevronUp,
  FileText, Download, Camera, CheckCircle2,
  Clock, MapPin, ClipboardList,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  useRegistrosTrabajos, useAddTrabajoRegistro,
  useIncidencias, useAddIncidencia, useUpdateIncidencia,
  useKPIsTrabajos,
  TipoBloque, TrabajoRegistro, TrabajoIncidencia,
} from '../hooks/useTrabajos';
import { useParcelas } from '../hooks/useParcelData';
import { usePersonal } from '../hooks/usePersonal';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

// ── Constantes ───────────────────────────────────────────────
const FINCAS = [
  'LA CONCEPCION', 'LONSORDO', 'FINCA COLLADOS',
  'FINCA BRAZO DE LA VIRGEN', 'FINCA LA BARDA',
  'FINCA LA NUEVA', 'FINCA MAYORAZGO',
];

const BLOQUES: { id: TipoBloque; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: 'logistica',          label: 'Logística',            icon: Truck,      color: '#a78bfa', desc: 'Transporte, rutas y entregas' },
  { id: 'maquinaria_agricola',label: 'Maquinaria Agrícola',  icon: Tractor,    color: '#fb923c', desc: 'Tractores, aperos y labores mecánicas' },
  { id: 'mano_obra_interna',  label: 'Mano de Obra Interna', icon: Users,      color: '#34d399', desc: 'Personal propio de Marvic' },
  { id: 'mano_obra_externa',  label: 'Mano de Obra Externa', icon: UserCheck,  color: '#60a5fa', desc: 'Subcontratas y cuadrillas externas' },
];

const TIPOS_TRABAJO = [
  'Plantación', 'Cosecha', 'Poda', 'Deshierbe', 'Riego', 'Abonado',
  'Tratamiento fitosanitario', 'Preparación suelo', 'Labores tractor',
  'Acolchado', 'Desbrozado', 'Siembra', 'Colocación plástico',
  'Retirada plástico', 'Transporte', 'Mantenimiento', 'Inspección', 'Otro',
];

// ── Modal registro de trabajo ────────────────────────────────
interface ModalRegistroProps {
  tipoBloque: TipoBloque;
  onClose:    () => void;
}

function ModalRegistro({ tipoBloque, onClose }: ModalRegistroProps) {
  const bloque   = BLOQUES.find(b => b.id === tipoBloque)!;
  const addMut   = useAddTrabajoRegistro();
  const { data: personal = [] }  = usePersonal();
  const [finca, setFinca]        = useState('');
  const [parcelId, setParcelId]  = useState('');
  const [tipoTrabajo, setTipoTrabajo] = useState('');
  const [horaInicio, setHoraInicio]   = useState(new Date().toISOString().slice(0, 16));
  const [horaFin, setHoraFin]         = useState('');
  const [nombresSelec, setNombresSelec] = useState<string[]>([]);
  const [nombreLibre, setNombreLibre]  = useState('');
  const [notas, setNotas]             = useState('');
  const [foto, setFoto]               = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: parcelas = [] } = useParcelas(finca || undefined);

  const addNombrePersonal = (nombre: string) => {
    if (nombre && !nombresSelec.includes(nombre)) {
      setNombresSelec(p => [...p, nombre]);
    }
  };
  const addNombreLibre = () => {
    if (nombreLibre.trim() && !nombresSelec.includes(nombreLibre.trim())) {
      setNombresSelec(p => [...p, nombreLibre.trim()]);
      setNombreLibre('');
    }
  };
  const removeNombre = (n: string) => setNombresSelec(p => p.filter(x => x !== n));

  const handleSubmit = async () => {
    if (!tipoTrabajo.trim()) return;
    setUploading(true);
    try {
      let foto_url: string | null = null;
      if (foto) {
        const ext  = foto.name.split('.').pop() ?? 'jpg';
        const path = `trabajos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('parcel-images')
          .upload(path, foto, { upsert: true });
        if (!upErr) {
          foto_url = supabase.storage.from('parcel-images').getPublicUrl(path).data.publicUrl;
        }
      }
      const nombresStr = nombresSelec.join(', ') || null;
      await addMut.mutateAsync({
        tipo_bloque:       tipoBloque,
        fecha:             new Date().toISOString().slice(0, 10),
        hora_inicio:       horaInicio || null,
        hora_fin:          horaFin    || null,
        finca:             finca      || null,
        parcel_id:         parcelId   || null,
        tipo_trabajo:      tipoTrabajo,
        num_operarios:     nombresSelec.length || null,
        nombres_operarios: nombresStr,
        foto_url,
        notas:             notas || null,
        created_by:        'JuanPe',
      });
      onClose();
    } finally {
      setUploading(false);
    }
  };

  const IconComp = bloque.icon;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10" style={{ borderLeftColor: bloque.color, borderLeftWidth: 3 }}>
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
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">

          {/* Tipo de trabajo */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Tipo de trabajo *
            </label>
            <select
              value={tipoTrabajo}
              onChange={e => setTipoTrabajo(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
            >
              <option value="">Seleccionar…</option>
              {TIPOS_TRABAJO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Finca + Parcela */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca</label>
            <select
              value={finca}
              onChange={e => { setFinca(e.target.value); setParcelId(''); }}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
            >
              <option value="">— Todas / No aplica —</option>
              {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {finca && parcelas.length > 0 && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Parcela / Sector</label>
              <select
                value={parcelId}
                onChange={e => setParcelId(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
              >
                <option value="">— Finca completa —</option>
                {parcelas.map(p => <option key={p.parcel_id} value={p.parcel_id}>{p.parcel_number}</option>)}
              </select>
            </div>
          )}

          {/* Hora inicio / fin */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hora inicio</label>
              <input
                type="datetime-local"
                value={horaInicio}
                onChange={e => setHoraInicio(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hora fin</label>
              <input
                type="datetime-local"
                value={horaFin}
                onChange={e => setHoraFin(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Operarios */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Operarios ({nombresSelec.length})
            </label>
            {/* Selector desde Personal */}
            <select
              value=""
              onChange={e => { addNombrePersonal(e.target.value); e.target.value = ''; }}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none mb-2"
            >
              <option value="">+ Añadir desde Personal…</option>
              {personal.filter(p => p.activo).map(p => (
                <option key={p.id} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>
            {/* Campo libre */}
            <div className="flex gap-2">
              <input
                type="text"
                value={nombreLibre}
                onChange={e => setNombreLibre(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNombreLibre()}
                placeholder="Nombre manual…"
                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={addNombreLibre}
                className="px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-700 text-white hover:bg-slate-600 transition-colors"
              >+</button>
            </div>
            {/* Lista nombres */}
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

          {/* Notas */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              placeholder="Observaciones…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-[#38bdf8]/50 focus:outline-none"
            />
          </div>

          {/* Foto obligatoria */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Foto <span style={{ color: bloque.color }}>*</span>
            </label>
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
                <span className="text-[10px] text-slate-400">Tomar foto o seleccionar</span>
                <input
                  ref={fileRef}
                  type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFoto(f); }}
                />
              </label>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!tipoTrabajo || !foto || uploading || addMut.isPending}
            className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
            style={{ backgroundColor: bloque.color, color: '#000' }}
          >
            {(uploading || addMut.isPending) ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal incidencia ─────────────────────────────────────────
function ModalIncidencia({ onClose }: { onClose: () => void }) {
  const addMut = useAddIncidencia();
  const [form, setForm] = useState({
    urgente: false, titulo: '', descripcion: '', finca: '',
  });
  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.titulo.trim()) return;
    await addMut.mutateAsync({
      urgente:          form.urgente,
      titulo:           form.titulo,
      descripcion:      form.descripcion || null,
      finca:            form.finca || null,
      parcel_id:        null,
      estado:           'abierta',
      foto_url:         null,
      fecha:            new Date().toISOString().slice(0, 10),
      fecha_resolucion: null,
      notas_resolucion: null,
      created_by:       'JuanPe',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Nueva incidencia</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3">
          {/* Urgente toggle */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-slate-800/50">
            <button
              onClick={() => set('urgente', !form.urgente)}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.urgente ? 'bg-red-500' : 'bg-slate-600'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.urgente ? 'left-5' : 'left-0.5'}`} />
            </button>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-wider">
                {form.urgente ? 'URGENTE' : 'No urgente'}
              </p>
              <p className="text-[9px] text-slate-500">
                {form.urgente ? 'Requiere atención inmediata' : 'Se puede resolver en próximos días'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => set('titulo', e.target.value)}
              placeholder="Descripción breve del problema…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca</label>
            <select
              value={form.finca}
              onChange={e => set('finca', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#38bdf8]/50 focus:outline-none"
            >
              <option value="">— Sin finca específica —</option>
              {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              rows={3}
              placeholder="Detalle adicional…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-[#38bdf8]/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.titulo || addMut.isPending}
            className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[10px] font-black text-black uppercase tracking-widest transition-colors disabled:opacity-40"
          >
            {addMut.isPending ? 'Guardando…' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta registro ──────────────────────────────────────────
function TarjetaRegistro({ r }: { r: TrabajoRegistro }) {
  const bloque = BLOQUES.find(b => b.id === r.tipo_bloque);
  return (
    <div className="p-3 rounded-lg border border-white/10 bg-slate-800/40 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold text-white leading-tight">{r.tipo_trabajo}</p>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
          {new Date(r.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {r.finca && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <MapPin className="w-2.5 h-2.5" />{r.finca}
          </span>
        )}
        {(r.hora_inicio || r.hora_fin) && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Clock className="w-2.5 h-2.5" />
            {r.hora_inicio ? new Date(r.hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
            {' → '}
            {r.hora_fin ? new Date(r.hora_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
          </span>
        )}
        {r.num_operarios != null && r.num_operarios > 0 && (
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Users className="w-2.5 h-2.5" />{r.num_operarios} op.
          </span>
        )}
      </div>
      {r.notas && <p className="text-[9px] text-slate-500 italic">{r.notas}</p>}
      {bloque && (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: bloque.color + '18' }}>
          <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: bloque.color }}>
            {bloque.label}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta incidencia ────────────────────────────────────────
function TarjetaIncidencia({ inc }: { inc: TrabajoIncidencia }) {
  const updateMut = useUpdateIncidencia();
  const [open, setOpen] = useState(false);

  const colorEstado = inc.estado === 'resuelta' ? '#34d399' : inc.urgente ? '#ef4444' : '#f59e0b';

  return (
    <div className={`p-3 rounded-lg border bg-slate-800/40 space-y-1.5 ${
      inc.urgente && inc.estado !== 'resuelta' ? 'border-red-500/40' : 'border-white/10'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {inc.urgente && inc.estado !== 'resuelta' && (
            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
          )}
          <p className="text-[11px] font-bold text-white leading-tight">{inc.titulo}</p>
        </div>
        <span
          className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
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

      {inc.estado !== 'resuelta' && (
        <div className="flex gap-2 pt-1">
          {inc.estado === 'abierta' && (
            <button
              onClick={() => updateMut.mutate({ id: inc.id, estado: 'en_proceso' })}
              className="text-[9px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest"
            >
              En proceso
            </button>
          )}
          <button
            onClick={() => updateMut.mutate({ id: inc.id, estado: 'resuelta', fecha_resolucion: new Date().toISOString().slice(0, 10) })}
            className="text-[9px] font-black text-green-400 hover:text-green-300 uppercase tracking-widest"
          >
            Resolver
          </button>
        </div>
      )}
    </div>
  );
}

// ── Generación PDF ────────────────────────────────────────────
async function generarPDF(registros: TrabajoRegistro[], incidencias: TrabajoIncidencia[]) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const W    = doc.internal.pageSize.getWidth();
  let y      = 20;

  const checkPage = (need = 10) => {
    if (y + need > 280) { doc.addPage(); y = 20; }
  };
  const writeLine = (text: string, size = 9, bold = false, color: [number, number, number] = [255, 255, 255]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    doc.text(text, 14, y);
    y += size * 0.45;
  };
  const separator = () => {
    checkPage(6);
    doc.setDrawColor(56, 189, 248);
    doc.setLineWidth(0.2);
    doc.line(14, y, W - 14, y);
    y += 4;
  };

  // Fondo oscuro
  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');

  // Cabecera
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(10, 8, W - 20, 20, 2, 2, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248);
  doc.text('AGRÍCOLA MARVIC', 16, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Informe de Trabajos', 16, 23);
  doc.text(new Date().toLocaleDateString('es-ES'), W - 40, 23);
  y = 36;

  // Resumen incidencias
  const abiertas  = incidencias.filter(i => i.estado !== 'resuelta').length;
  const urgentes  = incidencias.filter(i => i.urgente && i.estado !== 'resuelta').length;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(10, y, W - 20, 14, 2, 2, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.setTextColor(248, 113, 113);
  doc.text(`Incidencias abiertas: ${abiertas}  |  Urgentes: ${urgentes}  |  Total registros: ${registros.length}`, 16, y + 9);
  y += 20;

  // Registros por bloque
  const porBloque: Record<TipoBloque, TrabajoRegistro[]> = {
    logistica: [], maquinaria_agricola: [], mano_obra_interna: [], mano_obra_externa: [],
  };
  registros.forEach(r => porBloque[r.tipo_bloque].push(r));

  for (const bloque of BLOQUES) {
    const lista = porBloque[bloque.id];
    if (!lista.length) continue;

    checkPage(14);
    const rgb = bloque.color;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(56, 189, 248);
    doc.text(bloque.label.toUpperCase(), 14, y);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${lista.length} registros`, W - 40, y);
    y += 6;
    separator();

    for (const r of lista) {
      checkPage(16);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(r.tipo_trabajo, 14, y);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(new Date(r.fecha).toLocaleDateString('es-ES'), W - 40, y);
      y += 5;
      const detalles = [
        r.finca && `Finca: ${r.finca}`,
        r.num_operarios && `${r.num_operarios} operarios`,
        r.nombres_operarios && r.nombres_operarios,
        r.hora_inicio && `Inicio: ${new Date(r.hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        r.hora_fin && `Fin: ${new Date(r.hora_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
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

  // Incidencias
  if (incidencias.length) {
    checkPage(14);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(56, 189, 248);
    doc.text('INCIDENCIAS', 14, y);
    y += 6; separator();

    for (const inc of incidencias) {
      checkPage(14);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.setTextColor(inc.urgente ? 239 : 255, inc.urgente ? 68 : 255, inc.urgente ? 68 : 255);
      doc.text((inc.urgente ? '[URGENTE] ' : '') + inc.titulo, 14, y);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
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
  const navigate        = useNavigate();
  const { theme }       = useTheme();
  const isDark          = theme === 'dark';

  const [activeBloque, setActiveBloque] = useState<TipoBloque | null>(null);
  const [modalRegistro, setModalRegistro] = useState<TipoBloque | null>(null);
  const [modalIncidencia, setModalIncidencia] = useState(false);
  const [tabIncidencias, setTabIncidencias] = useState(false);

  const { data: kpis }        = useKPIsTrabajos();
  const { data: incidencias } = useIncidencias();
  const { data: registros }   = useRegistrosTrabajos(activeBloque ?? undefined);

  const incAbiertas = (incidencias ?? []).filter(i => i.estado !== 'resuelta').length;
  const incUrgentes = (incidencias ?? []).filter(i => i.urgente && i.estado !== 'resuelta').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white flex flex-col">

      {/* ── HEADER ───────────────────────────────────── */}
      <header className="w-full bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 px-4 py-2 flex items-center gap-3 z-50">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-[#38bdf8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <span className="text-slate-200 dark:text-slate-700">|</span>
        <Briefcase className="w-4 h-4 text-amber-400" />
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-white">Trabajos</span>

        <div className="ml-auto flex items-center gap-2">
          {incUrgentes > 0 && (
            <button
              onClick={() => setTabIncidencias(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" />
              {incUrgentes} urgente{incUrgentes > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={() => generarPDF(registros ?? [], incidencias ?? [])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/10 text-[#38bdf8] text-[9px] font-black uppercase tracking-widest transition-colors"
          >
            <FileText className="w-3 h-3" />
            PDF
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Registros', value: kpis?.totalRegistros ?? 0, color: '#f59e0b' },
            { label: 'Incidencias abiertas', value: incAbiertas, color: incAbiertas > 0 ? '#ef4444' : '#34d399' },
            { label: 'Urgentes', value: incUrgentes, color: incUrgentes > 0 ? '#ef4444' : '#64748b' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-1">
          <button
            onClick={() => setTabIncidencias(false)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
              !tabIncidencias
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" />
            Registros
          </button>
          <button
            onClick={() => setTabIncidencias(true)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors relative ${
              tabIncidencias
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
            Incidencias
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
                const Icon = b.icon;
                const activo = activeBloque === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setActiveBloque(activo ? null : b.id)}
                    className={`relative group p-4 rounded-xl border text-left transition-all ${
                      activo
                        ? 'border-opacity-60 shadow-lg'
                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                    style={activo ? { backgroundColor: b.color + '15', borderColor: b.color + '60' } : {}}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: b.color + '20' }}>
                      <Icon className="w-4 h-4" style={{ color: b.color }} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-800 dark:text-white leading-tight">{b.label}</p>
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5">{b.desc}</p>
                    <button
                      onClick={e => { e.stopPropagation(); setModalRegistro(b.id); }}
                      className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-colors hover:opacity-80"
                      style={{ color: b.color }}
                    >
                      <Plus className="w-3 h-3" />
                      Añadir
                    </button>
                  </button>
                );
              })}
            </div>

            {/* Botón nueva incidencia */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={() => setModalIncidencia(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Registrar incidencia
              </button>
              {activeBloque && (
                <button
                  onClick={() => setActiveBloque(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                  Ver todos
                </button>
              )}
            </div>

            {/* Lista registros */}
            <div className="space-y-2">
              {(registros ?? []).length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600">
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
            {/* Lista incidencias */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {(incidencias ?? []).length} incidencias
              </p>
              <button
                onClick={() => setModalIncidencia(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Nueva
              </button>
            </div>
            <div className="space-y-2">
              {(incidencias ?? []).length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600">
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

      {/* Modales */}
      {modalRegistro && (
        <ModalRegistro tipoBloque={modalRegistro} onClose={() => setModalRegistro(null)} />
      )}
      {modalIncidencia && (
        <ModalIncidencia onClose={() => setModalIncidencia(false)} />
      )}
    </div>
  );
}
