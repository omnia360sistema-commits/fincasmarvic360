import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Tractor, Wrench, Plus, X,
  MapPin, Clock, Fuel, ChevronRight,
  Calendar, Activity, Navigation, UserCheck, Camera,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  useTractores, useTractoresEnInventario, useAperosEnInventario,
  useAddTractor, useUpdateTractor,
  useAperos, useAddApero,
  useUsosMaquinaria, useAddUsoMaquinaria,
  useMantenimientoTractor, useAddMantenimientoTractor,
  useKPIsMaquinaria,
  Tractor as TractorType, Apero, UsoMaquinaria, MantenimientoTractor,
} from '../hooks/useMaquinaria';
import { usePersonal, Personal } from '../hooks/usePersonal';
import { supabase } from '../integrations/supabase/client';
import { uploadImage } from '../utils/uploadImage';
import {
  generarPDFCorporativoBase,
  pdfCorporateSection,
  pdfCorporateTable,
  PDF_COLORS,
  PDF_MARGIN,
} from '../utils/pdfUtils';
import { FINCAS_NOMBRES as FINCAS } from '../constants/farms';
import { TIPOS_TRABAJO as TIPOS_TRABAJO_GLOBAL } from '../constants/tiposTrabajo';

// ── Constantes ────────────────────────────────────────────────

type TabType = 'tractores' | 'aperos' | 'uso';

function fmtFechaCorta(f: string | null): string {
  if (!f) return '—';
  try {
    return new Date(f).toLocaleDateString('es-ES');
  } catch {
    return '—';
  }
}

function matriculaTractor(list: TractorType[], id: string | null): string {
  if (!id) return '—';
  return list.find(t => t.id === id)?.matricula ?? '—';
}

function tipoApero(list: Apero[], id: string | null): string {
  if (!id) return '—';
  return list.find(a => a.id === id)?.tipo ?? '—';
}

function estadoTractorTexto(t: TractorType): string {
  if (!t.activo) return 'Inactivo';
  const hoy = new Date();
  const proxItv = t.fecha_proxima_itv ? new Date(t.fecha_proxima_itv) : null;
  if (proxItv && proxItv < hoy) return 'Activo · ITV vencida';
  if (proxItv) {
    const d = Math.ceil((proxItv.getTime() - hoy.getTime()) / 86400000);
    if (d >= 0 && d < 30) return `Activo · ITV en ${d}d`;
  }
  return 'Activo';
}

function nombreOperarioUso(u: UsoMaquinaria, personal: Personal[]): string {
  if (u.personal_id) return personal.find(p => p.id === u.personal_id)?.nombre ?? '—';
  return u.tractorista?.trim() ? u.tractorista : '—';
}

// ── Modal Nuevo Tractor ───────────────────────────────────────
function ModalTractor({ onClose }: { onClose: () => void }) {
  const addMut = useAddTractor();
  const [form, setForm] = useState({
    matricula: '', marca: '', modelo: '', anio: '',
    horas_motor: '', ficha_tecnica: '', notas: '',
    fecha_proxima_itv: '', fecha_proxima_revision: '',
    horas_proximo_mantenimiento: '', gps_info: '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.matricula.trim()) return;
    await addMut.mutateAsync({
      matricula:                   form.matricula.toUpperCase(),
      marca:                       form.marca || null,
      modelo:                      form.modelo || null,
      anio:                        form.anio ? Number(form.anio) : null,
      horas_motor:                 form.horas_motor ? Number(form.horas_motor) : null,
      ficha_tecnica:               form.ficha_tecnica || null,
      activo:                      true,
      foto_url:                    null,
      notas:                       form.notas || null,
      created_by:                  'JuanPe',
      fecha_proxima_itv:           form.fecha_proxima_itv || null,
      fecha_proxima_revision:      form.fecha_proxima_revision || null,
      horas_proximo_mantenimiento: form.horas_proximo_mantenimiento ? Number(form.horas_proximo_mantenimiento) : null,
      gps_info:                    form.gps_info || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Tractor className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Nuevo tractor</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Matrícula *</label>
            <input type="text" value={form.matricula} onChange={e => set('matricula', e.target.value)}
              placeholder="M-1234-AB" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Marca</label>
              <input type="text" value={form.marca} onChange={e => set('marca', e.target.value)}
                placeholder="John Deere, Fendt…" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Modelo</label>
              <input type="text" value={form.modelo} onChange={e => set('modelo', e.target.value)}
                placeholder="6R 150…" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Año</label>
              <input type="number" min="1990" max="2030" value={form.anio} onChange={e => set('anio', e.target.value)}
                placeholder="2018" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Horas motor</label>
              <input type="number" min="0" value={form.horas_motor} onChange={e => set('horas_motor', e.target.value)}
                placeholder="0" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Próxima ITV</label>
              <input type="date" value={form.fecha_proxima_itv} onChange={e => set('fecha_proxima_itv', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Próxima revisión</label>
              <input type="date" value={form.fecha_proxima_revision} onChange={e => set('fecha_proxima_revision', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Horas próx. mant.</label>
              <input type="number" min="0" value={form.horas_proximo_mantenimiento} onChange={e => set('horas_proximo_mantenimiento', e.target.value)}
                placeholder="0" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">GPS (info manual)</label>
              <input type="text" value={form.gps_info} onChange={e => set('gps_info', e.target.value)}
                placeholder="Dispositivo, app…" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ficha técnica / observaciones</label>
            <textarea value={form.ficha_tecnica} onChange={e => set('ficha_tecnica', e.target.value)} rows={3}
              placeholder="Potencia CV, configuración, accesorios instalados…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-orange-400/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-orange-400/50 focus:outline-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.matricula || addMut.isPending}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-[10px] font-black text-black uppercase tracking-widest disabled:opacity-40 transition-colors">
            {addMut.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Nuevo Apero (tractor asignado = solo si está en inventario) ──
function ModalApero({ tractores, onClose }: { tractores: TractorType[]; onClose: () => void }) {
  const addMut = useAddApero();
  const [form, setForm] = useState({ tipo: '', tipo_libre: '', descripcion: '', tractor_id: '', notas: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const TIPOS_APERO = [
    'Arado', 'Cultivador', 'Fresadora', 'Subsolador', 'Rodillo',
    'Sembradora', 'Abonadora', 'Pulverizador', 'Segadora',
    'Remolque', 'Pala cargadora', 'Retroexcavadora', 'Otro',
  ];

  const tipoFinal = form.tipo === 'Otro' ? (form.tipo_libre.trim() || 'Otro') : form.tipo;

  const handleSubmit = async () => {
    if (!form.tipo.trim()) return;
    await addMut.mutateAsync({
      tipo:        tipoFinal,
      descripcion: form.descripcion || null,
      tractor_id:  form.tractor_id ?? null,
      activo:      true,
      foto_url:    null,
      notas:       form.notas || null,
      created_by:  'JuanPe',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Wrench className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Nuevo apero</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo *</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none">
              <option value="">Seleccionar…</option>
              {TIPOS_APERO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {form.tipo === 'Otro' && (
              <input type="text" value={form.tipo_libre} onChange={e => set('tipo_libre', e.target.value)}
                placeholder="Nombre del apero…"
                className="mt-1.5 w-full bg-slate-800 border border-orange-500/30 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            )}
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tractor asignado</label>
            <select value={form.tractor_id} onChange={e => set('tractor_id', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none">
              <option value="">— Sin asignar —</option>
              {tractores.filter(t => t.activo).map(t => <option key={t.id} value={t.id}>{t.matricula}{t.marca ? ` · ${t.marca}` : ''}</option>)}
            </select>
            {tractores.length === 0 && (
              <p className="text-[8px] text-amber-500/90 mt-1">Da de alta el tractor en una ubicación de Inventario.</p>
            )}
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              placeholder="Modelo, características, estado…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-orange-400/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-orange-400/50 focus:outline-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.tipo || addMut.isPending}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-[10px] font-black text-black uppercase tracking-widest disabled:opacity-40 transition-colors">
            {addMut.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Registro Uso ────────────────────────────────────────
function ModalUso({ tractores, aperos, personal, onClose }: {
  /** Solo tractores dados de alta en inventario (vista v_tractores_en_inventario). */
  tractores: TractorType[];
  /** Solo maquinaria_aperos enlazados a inventario (v_maquinaria_aperos_en_inventario). */
  aperos:    Apero[];
  personal:  Personal[];
  onClose:   () => void;
}) {
  const addMut = useAddUsoMaquinaria();
  const [form, setForm] = useState({
    tractor_id: '', apero_id: '', personal_id: '',
    finca: '', tipo_trabajo: '',
    hora_inicio: new Date().toISOString().slice(0, 16),
    hora_fin: '', gasolina_litros: '', notas: '',
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const TIPOS_TRABAJO = TIPOS_TRABAJO_GLOBAL;

  // Calcular horas automáticamente
  const horasCalculadas: number | null = (() => {
    if (!form.hora_inicio || !form.hora_fin) return null;
    const diff = (new Date(form.hora_fin).getTime() - new Date(form.hora_inicio).getTime()) / 3600000;
    return diff > 0 ? Math.round(diff * 10) / 10 : null;
  })();

  const personalSeleccionado = personal.find(p => p.id === form.personal_id);
  const nombreTractorista    = personalSeleccionado?.nombre ?? '';

  const handleSubmit = async () => {
    if (!form.personal_id || !foto) return;
    setUploading(true);
    try {
      const ts = Date.now();
      const ext = foto.name.split('.').pop() ?? 'jpg';
      const foto_url = await uploadImage(foto, 'parcel-images', `maquinaria_uso/${ts}.${ext}`);
      await addMut.mutateAsync({
        tractor_id:       form.tractor_id || null,
        apero_id:         form.apero_id || null,
        tractorista:      personalSeleccionado?.nombre ?? null,
        personal_id:      form.personal_id || null,
        finca:            form.finca || null,
        parcel_id:        null,
        tipo_trabajo:     form.tipo_trabajo || null,
        fecha:            new Date().toISOString().slice(0, 10),
        hora_inicio:      form.hora_inicio || null,
        hora_fin:         form.hora_fin || null,
        horas_trabajadas: horasCalculadas,
        gasolina_litros:  form.gasolina_litros ? Number(form.gasolina_litros) : null,
        foto_url,
        notas:            form.notas || null,
        created_by:       'JuanPe',
      });
      onClose();
    } finally {
      setUploading(false);
    }
  };

  const aperosDelTractor = form.tractor_id
    ? aperos.filter(a => a.tractor_id === form.tractor_id)
    : aperos;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Activity className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Registro de uso</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <p className="text-[8px] text-slate-500 uppercase tracking-widest leading-relaxed">
            Equipo disponible según inventario (ubicaciones). Si falta algo, asígnalo en Inventario primero.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tractor</label>
              <select value={form.tractor_id} onChange={e => { set('tractor_id', e.target.value); set('apero_id', ''); }}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none">
                <option value="">— Ninguno —</option>
                {tractores.filter(t => t.activo).map(t => <option key={t.id} value={t.id}>{t.matricula}</option>)}
              </select>
              {tractores.length === 0 && (
                <p className="text-[8px] text-amber-500/90 mt-1">Sin tractores en inventario.</p>
              )}
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Apero</label>
              <select value={form.apero_id} onChange={e => set('apero_id', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none">
                <option value="">— Ninguno —</option>
                {aperosDelTractor.filter(a => a.activo).map(a => <option key={a.id} value={a.id}>{a.tipo}</option>)}
              </select>
              {aperos.length === 0 && (
                <p className="text-[8px] text-amber-500/90 mt-1">Sin aperos (módulo) en inventario.</p>
              )}
            </div>
          </div>
          {/* Tractorista selector (desde módulo Personal) */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tractorista *</label>
            <select value={form.personal_id} onChange={e => set('personal_id', e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none">
              <option value="">— Seleccionar tractorista —</option>
              {personal.filter(p => p.activo).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca</label>
              <select value={form.finca} onChange={e => set('finca', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none">
                <option value="">— Ninguna —</option>
                {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo trabajo</label>
              <select value={form.tipo_trabajo} onChange={e => set('tipo_trabajo', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none">
                <option value="">— Ninguno —</option>
                {TIPOS_TRABAJO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Inicio</label>
              <input type="datetime-local" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fin</label>
              <input type="datetime-local" value={form.hora_fin} onChange={e => set('hora_fin', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
          </div>
          {/* Horas auto-calculadas */}
          {horasCalculadas !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="text-[10px] font-black text-orange-300">
                {horasCalculadas}h calculadas automáticamente
              </span>
            </div>
          )}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Gasoil (litros)</label>
            <input type="number" min="0" step="0.1" value={form.gasolina_litros} onChange={e => set('gasolina_litros', e.target.value)}
              placeholder="0.0" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-orange-400/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Foto *</label>
            <label className={`flex items-center gap-2 px-3 py-2.5 bg-slate-800 rounded-lg cursor-pointer transition-colors ${foto ? 'border border-orange-400/50' : 'border border-white/10 hover:border-orange-400/30'}`}>
              <Camera className={`w-4 h-4 shrink-0 ${foto ? 'text-orange-400' : 'text-slate-500'}`} />
              <span className="text-[11px] text-slate-400 truncate">
                {foto?.name ?? 'Capturar / Subir (obligatorio)'}
              </span>
              <input
                type="file" accept="image/*" capture="environment" className="sr-only"
                onChange={e => setFoto(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.personal_id || !foto || uploading || addMut.isPending}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-[10px] font-black text-black uppercase tracking-widest disabled:opacity-40 transition-colors">
            {(uploading || addMut.isPending) ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Mantenimiento Tractor ───────────────────────────────
function ModalMantenimientoTractor({ tractorId, horasActuales, onClose }: {
  tractorId:     string;
  horasActuales: number | null;
  onClose:       () => void;
}) {
  const addMut = useAddMantenimientoTractor();
  const [form, setForm] = useState({
    tipo: 'revision', descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
    horas_motor_al_momento: horasActuales ? String(horasActuales) : '',
    coste_euros: '', proveedor: '',
  });
  const [foto1, setFoto1] = useState<File | null>(null);
  const [foto2, setFoto2] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setUploading(true);
    const ts = Date.now();
    const fotoUrl1 = foto1 ? await uploadImage(foto1, 'parcel-images', `mantenimiento-tractor/${tractorId}_${ts}_1`) : null;
    const fotoUrl2 = foto2 ? await uploadImage(foto2, 'parcel-images', `mantenimiento-tractor/${tractorId}_${ts}_2`) : null;
    await addMut.mutateAsync({
      tractor_id:             tractorId,
      tipo:                   form.tipo,
      descripcion:            form.descripcion || null,
      fecha:                  form.fecha,
      horas_motor_al_momento: form.horas_motor_al_momento ? Number(form.horas_motor_al_momento) : null,
      coste_euros:            form.coste_euros ? Number(form.coste_euros) : null,
      proveedor:              form.proveedor || null,
      foto_url:               fotoUrl1,
      foto_url_2:             fotoUrl2,
      created_by:             'JuanPe',
    });
    setUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Wrench className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Mantenimiento tractor</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo *</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none">
                <option value="itv">ITV</option>
                <option value="revision">Revisión</option>
                <option value="averia">Avería</option>
                <option value="aceite">Cambio aceite</option>
                <option value="filtros">Filtros</option>
                <option value="neumaticos">Neumáticos</option>
                <option value="correas">Correas</option>
                <option value="hidraulico">Hidráulico</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-orange-400/50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Horas motor</label>
              <input type="number" min="0" value={form.horas_motor_al_momento} onChange={e => set('horas_motor_al_momento', e.target.value)}
                placeholder="0" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Coste €</label>
              <input type="number" min="0" step="0.01" value={form.coste_euros} onChange={e => set('coste_euros', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Proveedor</label>
              <input type="text" value={form.proveedor} onChange={e => set('proveedor', e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Foto 1 (albarán / trabajo)</label>
            <label className="flex items-center gap-2 cursor-pointer w-full bg-slate-800 border border-dashed border-white/20 hover:border-orange-400/50 rounded-lg px-3 py-2 transition-colors">
              <Wrench className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-[10px] text-slate-400 truncate">{foto1 ? foto1.name : 'Seleccionar foto…'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setFoto1(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Foto 2 (detalle / factura)</label>
            <label className="flex items-center gap-2 cursor-pointer w-full bg-slate-800 border border-dashed border-white/20 hover:border-orange-400/50 rounded-lg px-3 py-2 transition-colors">
              <Wrench className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-[10px] text-slate-400 truncate">{foto2 ? foto2.name : 'Seleccionar foto…'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setFoto2(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={addMut.isPending || uploading}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-[10px] font-black text-black uppercase tracking-widest disabled:opacity-40 transition-colors">
            {uploading || addMut.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta Tractor ───────────────────────────────────────────
function TarjetaTractor({ tractor, aperos, usos, mantenimientos }: {
  tractor:        TractorType;
  aperos:         Apero[];
  usos:           UsoMaquinaria[];
  mantenimientos: MantenimientoTractor[];
}) {
  const [expanded, setExpanded]   = useState(false);
  const [modalMant, setModalMant] = useState(false);

  const misAperos = aperos.filter(a => a.tractor_id === tractor.id);
  const misUsos   = usos.filter(u => u.tractor_id === tractor.id);
  const misMant   = mantenimientos.filter(m => m.tractor_id === tractor.id);
  const totalH    = misUsos.reduce((s, u) => s + (u.horas_trabajadas ?? 0), 0);
  const totalL    = misUsos.reduce((s, u) => s + (u.gasolina_litros ?? 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div
        className="p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
          <Tractor className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase">{tractor.matricula}</p>
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
              tractor.activo ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {tractor.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {[tractor.marca, tractor.modelo, tractor.anio].filter(Boolean).join(' · ')}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {tractor.horas_motor != null && (
              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />{tractor.horas_motor}h motor
              </span>
            )}
            {totalH > 0 && <span className="text-[9px] text-slate-400">{totalH.toFixed(1)}h trabajadas</span>}
            {misAperos.length > 0 && <span className="text-[9px] text-slate-400">{misAperos.length} apero{misAperos.length !== 1 ? 's' : ''}</span>}
            {tractor.fecha_proxima_itv && (() => {
              const diff = (new Date(tractor.fecha_proxima_itv).getTime() - Date.now()) / 86400000;
              return (
                <span className={`text-[9px] flex items-center gap-0.5 ${diff < 0 ? 'text-red-400' : diff < 30 ? 'text-amber-400' : 'text-slate-400'}`}>
                  <Calendar className="w-2.5 h-2.5" />ITV {new Date(tractor.fecha_proxima_itv).toLocaleDateString('es-ES')}
                </span>
              );
            })()}
          </div>
        </div>
        {expanded
          ? <ChevronRight className="w-4 h-4 text-slate-400 rotate-90 transition-transform" />
          : <ChevronRight className="w-4 h-4 text-slate-400 transition-transform" />
        }
      </div>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-white/10 p-4 space-y-4">
          {tractor.ficha_tecnica && (
            <div>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Ficha técnica</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-300">{tractor.ficha_tecnica}</p>
            </div>
          )}

          {/* Estado y alertas */}
          {(tractor.fecha_proxima_revision || tractor.horas_proximo_mantenimiento || tractor.gps_info) && (
            <div className="grid grid-cols-2 gap-2">
              {tractor.fecha_proxima_revision && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-200 dark:border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Próxima revisión</p>
                  <p className="text-[10px] font-bold text-white mt-0.5">
                    {new Date(tractor.fecha_proxima_revision).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              {tractor.horas_proximo_mantenimiento != null && (
                <div className={`bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border ${tractor.horas_motor != null && tractor.horas_motor >= tractor.horas_proximo_mantenimiento ? 'border-amber-500/40' : 'border-slate-200 dark:border-white/5'}`}>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Horas próx. mant.</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${tractor.horas_motor != null && tractor.horas_motor >= tractor.horas_proximo_mantenimiento ? 'text-amber-400' : 'text-white'}`}>
                    {tractor.horas_proximo_mantenimiento}h
                  </p>
                </div>
              )}
              {tractor.gps_info && (
                <div className="col-span-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-200 dark:border-white/5 flex items-center gap-2">
                  <Navigation className="w-3 h-3 text-orange-400 shrink-0" />
                  <p className="text-[9px] text-slate-300">{tractor.gps_info}</p>
                </div>
              )}
            </div>
          )}

          {/* Aperos asignados */}
          {misAperos.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Aperos asignados</p>
              <div className="flex flex-wrap gap-1.5">
                {misAperos.map(a => (
                  <span key={a.id} className="text-[9px] font-black px-2 py-1 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20">
                    {a.tipo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Últimos usos */}
          <div>
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Últimos usos ({totalH.toFixed(1)}h · {totalL.toFixed(1)}L)
            </p>
            {misUsos.length === 0 ? (
              <p className="text-[10px] text-slate-400 dark:text-slate-600">Sin usos registrados</p>
            ) : (
              <div className="space-y-1.5">
                {misUsos.slice(0, 5).map(u => (
                  <div key={u.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-700 dark:text-white flex items-center gap-1">
                        {u.foto_url && <Camera className="w-2.5 h-2.5 text-slate-500 shrink-0" />}
                        {u.tipo_trabajo ?? 'Uso'}{u.tractorista ? ` · ${u.tractorista}` : ''}
                      </p>
                      <span className="text-[8px] text-slate-400">{new Date(u.fecha).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {u.finca && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-2 h-2" />{u.finca}</span>}
                      {u.horas_trabajadas && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Clock className="w-2 h-2" />{u.horas_trabajadas}h</span>}
                      {u.gasolina_litros && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Fuel className="w-2 h-2" />{u.gasolina_litros}L</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mantenimientos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mantenimientos</p>
              <button onClick={() => setModalMant(true)} className="flex items-center gap-1 text-[9px] font-black text-orange-400 hover:text-orange-300 uppercase tracking-widest">
                <Plus className="w-3 h-3" />Añadir
              </button>
            </div>
            {misMant.length === 0 ? (
              <p className="text-[10px] text-slate-400 dark:text-slate-600">Sin mantenimientos</p>
            ) : (
              <div className="space-y-1">
                {misMant.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-[9px] font-black text-white uppercase">{m.tipo}</span>
                      {m.descripcion && <span className="text-[8px] text-slate-500 ml-2">{m.descripcion}</span>}
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-400">{new Date(m.fecha).toLocaleDateString('es-ES')}</p>
                      {m.horas_motor_al_momento && <p className="text-[8px] text-orange-300">{m.horas_motor_al_momento}h</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modalMant && (
        <ModalMantenimientoTractor
          tractorId={tractor.id}
          horasActuales={tractor.horas_motor}
          onClose={() => setModalMant(false)}
        />
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function Maquinaria() {
  const navigate  = useNavigate();
  const { theme } = useTheme();
  const isDark    = theme === 'dark';

  const [tab, setTab]             = useState<TabType>('tractores');
  const [modalTractor, setModalTractor] = useState(false);
  const [modalApero, setModalApero]     = useState(false);
  const [modalUso, setModalUso]         = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);

  const { data: kpis }                       = useKPIsMaquinaria();
  const { data: tractores = [] }             = useTractores();
  const { data: tractoresInv = [] }          = useTractoresEnInventario();
  const { data: aperos = [] }               = useAperos();
  const { data: aperosInv = [] }            = useAperosEnInventario();
  const { data: usos = [] }                 = useUsosMaquinaria();
  const { data: mants = [] }               = useMantenimientoTractor();
  const { data: personalTractoristas = [] } = usePersonal('conductor_maquinaria');

  useEffect(() => {
    if (!pdfMenuOpen) return;
    function onDown(ev: MouseEvent) {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(ev.target as Node)) {
        setPdfMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [pdfMenuOpen]);

  async function generarMaquinariaCompleta() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA',
      subtitulo: 'Informe completo de flota y operaciones',
      fecha: ref,
      filename: `Maquinaria_Completa_${fs}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Tractores');
          if (tractores.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin tractores registrados.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['MATRÍCULA', 'MARCA', 'MODELO', 'HORAS MOTOR', 'ITV', 'ESTADO'],
            [26, 28, 32, 24, 28, 44],
            tractores.map(t => [
              t.matricula,
              t.marca ?? '—',
              t.modelo ?? '—',
              t.horas_motor != null ? String(t.horas_motor) : '—',
              fmtFechaCorta(t.fecha_proxima_itv),
              estadoTractorTexto(t),
            ]),
          );
        },
        ctx => {
          pdfCorporateSection(ctx, 'Aperos');
          if (aperos.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin aperos registrados.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['TIPO', 'DESCRIPCIÓN', 'TRACTOR ASIGNADO', 'ESTADO'],
            [36, 70, 48, 28],
            aperos.map(a => [
              a.tipo,
              a.descripcion ?? '—',
              matriculaTractor(tractores, a.tractor_id),
              a.activo ? 'Activo' : 'Inactivo',
            ]),
          );
        },
        ctx => {
          pdfCorporateSection(ctx, 'Uso de maquinaria');
          if (usos.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin registros de uso.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          const ordenados = [...usos].sort((a, b) => a.fecha.localeCompare(b.fecha));
          pdfCorporateTable(
            ctx,
            ['FECHA', 'TRACTOR', 'APERO', 'OPERARIO', 'FINCA', 'HORAS'],
            [26, 28, 36, 44, 30, 18],
            ordenados.map(u => [
              fmtFechaCorta(u.fecha),
              matriculaTractor(tractores, u.tractor_id),
              tipoApero(aperos, u.apero_id),
              nombreOperarioUso(u, personalTractoristas),
              u.finca ?? '—',
              u.horas_trabajadas != null ? String(u.horas_trabajadas) : '—',
            ]),
          );
        },
        ctx => {
          pdfCorporateSection(ctx, 'Mantenimientos');
          if (mants.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin mantenimientos registrados.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['FECHA', 'TRACTOR', 'TIPO', 'COSTE €', 'PROVEEDOR'],
            [28, 28, 32, 22, 72],
            mants.map(m => [
              fmtFechaCorta(m.fecha),
              matriculaTractor(tractores, m.tractor_id),
              m.tipo,
              m.coste_euros != null ? m.coste_euros.toFixed(2) : '—',
              m.proveedor ?? '—',
            ]),
          );
        },
      ],
    });
  }

  async function generarEstadoTractores() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA — TRACTORES',
      subtitulo: 'Estado de tractores',
      fecha: ref,
      filename: `Maquinaria_Tractores_${fs}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Estado de tractores');
          if (tractores.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin tractores registrados.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['MATRÍCULA', 'MARCA', 'MODELO', 'HORAS MOTOR', 'ITV', 'ESTADO'],
            [26, 28, 32, 24, 28, 44],
            tractores.map(t => [
              t.matricula,
              t.marca ?? '—',
              t.modelo ?? '—',
              t.horas_motor != null ? String(t.horas_motor) : '—',
              fmtFechaCorta(t.fecha_proxima_itv),
              estadoTractorTexto(t),
            ]),
          );
        },
      ],
    });
  }

  async function generarAperos() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    const activos = aperos.filter(a => a.activo);
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA — APEROS',
      subtitulo: 'Aperos activos',
      fecha: ref,
      filename: `Maquinaria_Aperos_${fs}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Aperos activos');
          if (activos.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin aperos activos.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['TIPO', 'DESCRIPCIÓN', 'TRACTOR ASIGNADO', 'ESTADO'],
            [36, 70, 48, 28],
            activos.map(a => [
              a.tipo,
              a.descripcion ?? '—',
              matriculaTractor(tractores, a.tractor_id),
              'Activo',
            ]),
          );
        },
      ],
    });
  }

  async function generarUsoMaquinaria() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    const ordenados = [...usos].sort((a, b) => a.fecha.localeCompare(b.fecha));
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA — USO',
      subtitulo: 'Registros de uso',
      fecha: ref,
      filename: `Maquinaria_Uso_${fs}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Uso de maquinaria');
          if (ordenados.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin registros de uso.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['FECHA', 'TRACTOR', 'APERO', 'OPERARIO', 'FINCA', 'HORAS'],
            [26, 28, 36, 44, 30, 18],
            ordenados.map(u => [
              fmtFechaCorta(u.fecha),
              matriculaTractor(tractores, u.tractor_id),
              tipoApero(aperos, u.apero_id),
              nombreOperarioUso(u, personalTractoristas),
              u.finca ?? '—',
              u.horas_trabajadas != null ? String(u.horas_trabajadas) : '—',
            ]),
          );
        },
      ],
    });
  }

  async function generarMantenimientosMaquinaria() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA — MANTENIMIENTO',
      subtitulo: 'Intervenciones en tractores',
      fecha: ref,
      filename: `Maquinaria_Mantenimientos_${fs}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Mantenimientos');
          if (mants.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin mantenimientos registrados.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['FECHA', 'TRACTOR', 'TIPO', 'COSTE €', 'PROVEEDOR'],
            [28, 28, 32, 22, 72],
            mants.map(m => [
              fmtFechaCorta(m.fecha),
              matriculaTractor(tractores, m.tractor_id),
              m.tipo,
              m.coste_euros != null ? m.coste_euros.toFixed(2) : '—',
              m.proveedor ?? '—',
            ]),
          );
        },
      ],
    });
  }

  async function onElegirPdf(op: 1 | 2 | 3 | 4 | 5) {
    setPdfMenuOpen(false);
    setGenerandoPdf(true);
    try {
      if (op === 1) await generarMaquinariaCompleta();
      else if (op === 2) await generarEstadoTractores();
      else if (op === 3) await generarAperos();
      else if (op === 4) await generarUsoMaquinaria();
      else await generarMantenimientosMaquinaria();
    } finally {
      setGenerandoPdf(false);
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* HEADER */}
      <header className="w-full bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 pl-14 pr-4 py-2 flex items-center gap-3 z-50">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-slate-400 hover:text-[#38bdf8] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <span className="text-slate-200 dark:text-slate-700">|</span>
        <Tractor className="w-4 h-4 text-orange-400" />
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-white">Maquinaria</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setModalUso(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors"
          >
            <Plus className="w-3 h-3" />Uso
          </button>
          <div className="relative" ref={pdfMenuRef}>
            <button
              type="button"
              onClick={() => setPdfMenuOpen(o => !o)}
              disabled={generandoPdf}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/10 text-[#38bdf8] text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {generandoPdf
                ? <span className="w-3 h-3 border-2 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin" />
                : null}
              PDF {pdfMenuOpen ? '▲' : '▼'}
            </button>
            {pdfMenuOpen && (
              <div
                className={`absolute right-0 top-full z-[70] mt-1 min-w-[240px] rounded-lg border shadow-lg py-1 ${
                  isDark
                    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-black/40'
                    : 'border-slate-200 bg-white text-slate-800 shadow-slate-400/20'
                }`}
              >
                {[
                  { k: 1 as const, label: 'Informe completo maquinaria' },
                  { k: 2 as const, label: 'Estado de tractores' },
                  { k: 3 as const, label: 'Aperos activos' },
                  { k: 4 as const, label: 'Uso de maquinaria' },
                  { k: 5 as const, label: 'Mantenimientos' },
                ].map(({ k, label }) => (
                  <button
                    key={k}
                    type="button"
                    disabled={generandoPdf}
                    onClick={() => onElegirPdf(k)}
                    className={`w-full px-3 py-2.5 text-left text-xs font-medium transition-colors disabled:opacity-50 ${
                      isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-4xl mx-auto w-full">

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Tractores', value: kpis?.tractoresActivos ?? 0, color: '#fb923c' },
            { label: 'Aperos',    value: kpis?.aperosActivos ?? 0,    color: '#fb923c' },
            { label: 'H. totales', value: kpis?.totalHoras ?? '0',   color: '#34d399' },
            { label: 'Gasoil (L)', value: kpis?.totalGasolina ?? '0', color: '#60a5fa' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-1">
          {[
            { id: 'tractores' as TabType, label: 'Tractores', icon: Tractor },
            { id: 'aperos'    as TabType, label: 'Aperos',    icon: Wrench },
            { id: 'uso'       as TabType, label: 'Registros uso', icon: Activity },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                tab === t.id
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}>
              <t.icon className="w-3.5 h-3.5 inline mr-1.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'tractores' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {tractores.length} tractor{tractores.length !== 1 ? 'es' : ''}
              </p>
              <button onClick={() => setModalTractor(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors">
                <Plus className="w-3 h-3" />Nuevo
              </button>
            </div>
            <div className="space-y-3">
              {tractores.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                  <Tractor className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin tractores</p>
                </div>
              ) : (
                tractores.map(t => <TarjetaTractor key={t.id} tractor={t} aperos={aperos} usos={usos} mantenimientos={mants} />)
              )}
            </div>
          </>
        )}

        {tab === 'aperos' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {aperos.length} apero{aperos.length !== 1 ? 's' : ''}
              </p>
              <button onClick={() => setModalApero(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors">
                <Plus className="w-3 h-3" />Nuevo
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {aperos.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 dark:text-slate-600">
                  <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin aperos</p>
                </div>
              ) : (
                aperos.map(a => {
                  const tractor = tractores.find(t => t.id === a.tractor_id);
                  return (
                    <div key={a.id} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="w-4 h-4 text-orange-400 shrink-0" />
                        <p className="text-[11px] font-black text-slate-900 dark:text-white">{a.tipo}</p>
                        <span className={`ml-auto text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          a.activo ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>{a.activo ? 'Activo' : 'Inactivo'}</span>
                      </div>
                      {a.descripcion && <p className="text-[9px] text-slate-400 dark:text-slate-500">{a.descripcion}</p>}
                      {tractor && (
                        <p className="text-[9px] text-orange-300 mt-1 flex items-center gap-1">
                          <Tractor className="w-3 h-3" />{tractor.matricula}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {tab === 'uso' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {usos.length} registro{usos.length !== 1 ? 's' : ''}
              </p>
              <button onClick={() => setModalUso(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-widest hover:bg-orange-500/20 transition-colors">
                <Plus className="w-3 h-3" />Nuevo
              </button>
            </div>
            <div className="space-y-2">
              {usos.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin registros de uso</p>
                </div>
              ) : (
                usos.map(u => {
                  const tractor = tractores.find(t => t.id === u.tractor_id);
                  const apero   = aperos.find(a => a.id === u.apero_id);
                  return (
                    <div key={u.id} className="p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                          {u.foto_url && <Camera className="w-3 h-3 text-slate-500 shrink-0" />}
                          {u.tipo_trabajo ?? 'Uso'}{u.tractorista ? ` · ${u.tractorista}` : ''}
                        </p>
                        <span className="text-[8px] text-slate-400 shrink-0">
                          {new Date(u.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {tractor && <span className="text-[9px] text-orange-300 flex items-center gap-0.5"><Tractor className="w-2.5 h-2.5" />{tractor.matricula}</span>}
                        {apero && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Wrench className="w-2.5 h-2.5" />{apero.tipo}</span>}
                        {u.finca && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{u.finca}</span>}
                        {u.horas_trabajadas && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{u.horas_trabajadas}h</span>}
                        {u.gasolina_litros && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Fuel className="w-2.5 h-2.5" />{u.gasolina_litros}L</span>}
                      </div>
                      {u.notas && <p className="text-[9px] text-slate-500 italic mt-1">{u.notas}</p>}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {modalTractor && <ModalTractor onClose={() => setModalTractor(false)} />}
      {modalApero   && <ModalApero tractores={tractoresInv} onClose={() => setModalApero(false)} />}
      {modalUso     && <ModalUso tractores={tractoresInv} aperos={aperosInv} personal={personalTractoristas} onClose={() => setModalUso(false)} />}
    </div>
  );
}
