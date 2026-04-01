import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Truck, Users, Plus, X, FileText,
  MapPin, Clock, Fuel, Gauge, Calendar,
  Wrench, ChevronRight, Navigation, Camera, Phone,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  useCamiones, useAddCamion, useUpdateCamion,
  useViajes, useAddViaje,
  useMantenimientoCamion, useAddMantenimientoCamion,
  useKPIsLogistica,
  Camion, Viaje, MantenimientoCamion,
} from '../hooks/useLogistica';
import { usePersonal, Personal } from '../hooks/usePersonal';
import { uploadImage, buildStoragePath } from '../utils/uploadImage';
import {
  generarPDFCorporativoBase,
  pdfCorporateSection,
  pdfCorporateTable,
  PDF_COLORS,
  PDF_MARGIN,
} from '../utils/pdfUtils';
import { FINCAS_NOMBRES as FINCAS } from '../constants/farms';

// ── Constantes ────────────────────────────────────────────────

const INPUT = 'w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-400/50 focus:outline-none';

const DESTINOS_PRESET = [
  'Nave Collados+Brazo Virgen',
  'Cabezal La Barda',
  'Nave Polígono La Barda',
  'Nave La Concepción',
  'Nave Lonsordo',
  'Semillero',
  'Oficina',
  'Almería',
  'Murcia',
  'Valencia',
];

const TRABAJO_MAP: Record<string, string[]> = {
  'Transporte cosecha':  ['Cítricos', 'Hortalizas', 'Leguminosas', 'Otro'],
  'Transporte material': ['Plástico/Acolchado', 'Cinta de riego', 'Abono', 'Fitosanitarios', 'Otro'],
  'Residuos':            ['Restos vegetales', 'Plástico usado', 'Cinta usada', 'Envases'],
  'Personal':            ['Operarios', 'Maquinaria', 'Técnicos'],
  'Mantenimiento finca': ['Riego', 'Infraestructura', 'Preparación terreno'],
  'Otro': [],
};

const TIPOS_MANT = ['itv', 'revision', 'averia', 'aceite', 'filtros', 'neumaticos', 'frenos', 'otro'];

type TabType = 'camiones' | 'conductores';

// ── Helpers ───────────────────────────────────────────────────

function calcHoras(salida: string, llegada: string): number | null {
  if (!salida || !llegada) return null;
  const d = (new Date(llegada).getTime() - new Date(salida).getTime()) / 3600000;
  return d > 0 ? +d.toFixed(2) : null;
}

function calcEficiencia(km: string, litros: string): string | null {
  const k = parseFloat(km);
  const l = parseFloat(litros);
  if (k > 0 && l > 0) return (k / l).toFixed(1);
  return null;
}

function mismoDiaCalendario(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtViajeHora(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function matriculaDe(camiones: Camion[], id: string | null): string {
  if (!id) return '—';
  return camiones.find(c => c.id === id)?.matricula ?? '—';
}

function nombreConductorDe(personal: Personal[], id: string | null): string {
  if (!id) return '—';
  return personal.find(p => p.id === id)?.nombre ?? '—';
}

function estadoCamionTexto(c: Camion): string {
  if (!c.activo) return 'Inactivo';
  const hoy = new Date();
  const proxItv = c.fecha_proxima_itv ? new Date(c.fecha_proxima_itv) : null;
  if (proxItv && proxItv < hoy) return 'Activo · ITV vencida';
  if (proxItv) {
    const d = Math.ceil((proxItv.getTime() - hoy.getTime()) / 86400000);
    if (d >= 0 && d < 30) return `Activo · ITV en ${d}d`;
  }
  return 'Activo';
}

function fmtFechaCorta(f: string | null): string {
  if (!f) return '—';
  try {
    return new Date(f).toLocaleDateString('es-ES');
  } catch {
    return '—';
  }
}

// ── Modal Nuevo Camión ────────────────────────────────────────

function ModalCamion({ onClose }: { onClose: () => void }) {
  const addMut = useAddCamion();
  const [form, setForm] = useState({
    matricula: '', marca: '', modelo: '', anio: '',
    fecha_itv: '', fecha_proxima_itv: '', fecha_proxima_revision: '',
    kilometros_actuales: '', km_proximo_mantenimiento: '',
    gps_info: '', notas_mantenimiento: '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.matricula.trim()) return;
    await addMut.mutateAsync({
      matricula:                form.matricula.toUpperCase().trim(),
      activo:                   true,
      marca:                    form.marca || null,
      modelo:                   form.modelo || null,
      anio:                     form.anio ? Number(form.anio) : null,
      fecha_itv:                form.fecha_itv || null,
      fecha_proxima_itv:        form.fecha_proxima_itv || null,
      fecha_proxima_revision:   form.fecha_proxima_revision || null,
      kilometros_actuales:      form.kilometros_actuales ? Number(form.kilometros_actuales) : null,
      km_proximo_mantenimiento: form.km_proximo_mantenimiento ? Number(form.km_proximo_mantenimiento) : null,
      gps_info:                 form.gps_info || null,
      notas_mantenimiento:      form.notas_mantenimiento || null,
      foto_url:                 null,
      created_by:               'JuanPe',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <Truck className="w-5 h-5 text-purple-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Nuevo camión</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Matrícula *</label>
            <input type="text" value={form.matricula} onChange={e => set('matricula', e.target.value)}
              placeholder="1234 ABC" className={INPUT + ' uppercase'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Marca</label>
              <input type="text" value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="MAN, Iveco…" className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Modelo</label>
              <input type="text" value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="TGM 15.290…" className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Año</label>
              <input type="number" min="1990" max="2030" value={form.anio} onChange={e => set('anio', e.target.value)} placeholder="2020" className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Km actuales</label>
              <input type="number" min="0" value={form.kilometros_actuales} onChange={e => set('kilometros_actuales', e.target.value)} placeholder="0" className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ITV actual</label>
              <input type="date" value={form.fecha_itv} onChange={e => set('fecha_itv', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Próxima ITV</label>
              <input type="date" value={form.fecha_proxima_itv} onChange={e => set('fecha_proxima_itv', e.target.value)} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Próxima revisión</label>
              <input type="date" value={form.fecha_proxima_revision} onChange={e => set('fecha_proxima_revision', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Km próx. mant.</label>
              <input type="number" min="0" value={form.km_proximo_mantenimiento} onChange={e => set('km_proximo_mantenimiento', e.target.value)} placeholder="0" className={INPUT} />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">GPS (referencia)</label>
            <input type="text" value={form.gps_info} onChange={e => set('gps_info', e.target.value)} placeholder="Nº dispositivo, app, observaciones…" className={INPUT} />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas mantenimiento</label>
            <textarea value={form.notas_mantenimiento} onChange={e => set('notas_mantenimiento', e.target.value)}
              rows={2} placeholder="Estado general, revisiones pendientes…"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-purple-400/50 focus:outline-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={!form.matricula || addMut.isPending}
            className="flex-1 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-40 transition-colors">
            {addMut.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Nuevo Viaje ─────────────────────────────────────────
// NOTA: logistica_viajes no tiene foto_url en BD. Pendiente ALTER TABLE.

function ModalViaje({ conductores, camiones, onClose }: {
  conductores: Personal[];
  camiones:    Camion[];
  onClose:     () => void;
}) {
  const addMut = useAddViaje();
  const [form, setForm] = useState({
    personal_id:  '',
    camion_id:    '',
    finca:        '',
    destino_tipo: '',
    destino_libre:'',
    trabajo_cat:  '',
    trabajo_sub:  '',
    trabajo_libre:'',
    ruta:         '',
    hora_salida:  new Date().toISOString().slice(0, 16),
    hora_llegada: '',
    gasto_gasolina_litros: '',
    gasto_gasolina_euros:  '',
    km_recorridos: '',
    notas: '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const destinoFinal = form.destino_tipo === 'Otro' ? form.destino_libre : form.destino_tipo;
  const subOpciones  = form.trabajo_cat ? (TRABAJO_MAP[form.trabajo_cat] ?? []) : [];
  const trabajoFinal = form.trabajo_cat === 'Otro'
    ? form.trabajo_libre
    : form.trabajo_sub
      ? `${form.trabajo_cat} · ${form.trabajo_sub}`
      : form.trabajo_cat;

  const horas = useMemo(() => calcHoras(form.hora_salida, form.hora_llegada), [form.hora_salida, form.hora_llegada]);
  const eficiencia = useMemo(() => calcEficiencia(form.km_recorridos, form.gasto_gasolina_litros), [form.km_recorridos, form.gasto_gasolina_litros]);

  const handleSubmit = async () => {
    await addMut.mutateAsync({
      conductor_id:          null,
      personal_id:           form.personal_id  || null,
      camion_id:             form.camion_id    || null,
      finca:                 form.finca        || null,
      destino:               destinoFinal      || null,
      trabajo_realizado:     trabajoFinal      || null,
      ruta:                  form.ruta         || null,
      hora_salida:           form.hora_salida  || null,
      hora_llegada:          form.hora_llegada || null,
      gasto_gasolina_litros: form.gasto_gasolina_litros ? Number(form.gasto_gasolina_litros) : null,
      gasto_gasolina_euros:  form.gasto_gasolina_euros  ? Number(form.gasto_gasolina_euros)  : null,
      km_recorridos:         form.km_recorridos          ? Number(form.km_recorridos)          : null,
      notas:                 form.notas || null,
      created_by:            'JuanPe',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <MapPin className="w-5 h-5 text-purple-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Registrar viaje</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">

          {/* Conductor + Camión */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Conductor</label>
              <select value={form.personal_id} onChange={e => set('personal_id', e.target.value)} className={INPUT}>
                <option value="">— Ninguno —</option>
                {conductores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Camión</label>
              <select value={form.camion_id} onChange={e => set('camion_id', e.target.value)} className={INPUT}>
                <option value="">— Ninguno —</option>
                {camiones.filter(c => c.activo).map(c => (
                  <option key={c.id} value={c.id}>{c.matricula}{c.marca ? ` · ${c.marca}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Finca origen */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca origen</label>
            <select value={form.finca} onChange={e => set('finca', e.target.value)} className={INPUT}>
              <option value="">— Sin finca específica —</option>
              {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Destino */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Destino</label>
            <select value={form.destino_tipo} onChange={e => set('destino_tipo', e.target.value)} className={INPUT}>
              <option value="">— Seleccionar —</option>
              {DESTINOS_PRESET.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="Otro">Otro (especificar)</option>
            </select>
            {form.destino_tipo === 'Otro' && (
              <input type="text" value={form.destino_libre} onChange={e => set('destino_libre', e.target.value)}
                placeholder="Destino libre…"
                className="mt-1.5 w-full bg-slate-800 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-400/50 focus:outline-none" />
            )}
          </div>

          {/* Tipo trabajo */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo de trabajo</label>
            <select value={form.trabajo_cat} onChange={e => { set('trabajo_cat', e.target.value); set('trabajo_sub', ''); set('trabajo_libre', ''); }} className={INPUT}>
              <option value="">— Seleccionar —</option>
              {Object.keys(TRABAJO_MAP).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.trabajo_cat && form.trabajo_cat !== 'Otro' && subOpciones.length > 0 && (
              <select value={form.trabajo_sub} onChange={e => set('trabajo_sub', e.target.value)}
                className="mt-1.5 w-full bg-slate-800 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-400/50 focus:outline-none">
                <option value="">— Sub-tipo —</option>
                {subOpciones.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            {form.trabajo_cat === 'Otro' && (
              <input type="text" value={form.trabajo_libre} onChange={e => set('trabajo_libre', e.target.value)}
                placeholder="Describir trabajo…"
                className="mt-1.5 w-full bg-slate-800 border border-purple-500/30 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-400/50 focus:outline-none" />
            )}
          </div>

          {/* Ruta */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ruta</label>
            <input type="text" value={form.ruta} onChange={e => set('ruta', e.target.value)}
              placeholder="Murcia → La Barda → Almería" className={INPUT} />
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Salida</label>
              <input type="datetime-local" value={form.hora_salida} onChange={e => set('hora_salida', e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Llegada</label>
              <input type="datetime-local" value={form.hora_llegada} onChange={e => set('hora_llegada', e.target.value)} className={INPUT} />
            </div>
          </div>

          {/* Duración calculada */}
          {horas != null && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/5 rounded-lg border border-purple-500/20">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-black text-purple-400">{horas}h de viaje</span>
            </div>
          )}

          {/* Gasoil + km */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Litros</label>
              <input type="number" min="0" step="0.1" value={form.gasto_gasolina_litros} onChange={e => set('gasto_gasolina_litros', e.target.value)} placeholder="0.0" className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Euros (€)</label>
              <input type="number" min="0" step="0.01" value={form.gasto_gasolina_euros} onChange={e => set('gasto_gasolina_euros', e.target.value)} placeholder="0.00" className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Km</label>
              <input type="number" min="0" value={form.km_recorridos} onChange={e => set('km_recorridos', e.target.value)} placeholder="0" className={INPUT} />
            </div>
          </div>

          {/* Eficiencia calculada */}
          {eficiencia && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#38bdf8]/5 rounded-lg border border-[#38bdf8]/20">
              <Fuel className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="text-[10px] font-black text-[#38bdf8]">{eficiencia} km/L</span>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-purple-400/50 focus:outline-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={addMut.isPending}
            className="flex-1 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-40 transition-colors">
            {addMut.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Mantenimiento ───────────────────────────────────────

function ModalMantenimientoCamion({ camionId, onClose }: { camionId: string; onClose: () => void }) {
  const addMut  = useAddMantenimientoCamion();
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    tipo: 'revision', descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
    coste_euros: '', proveedor: '',
  });
  const [foto1, setFoto1] = useState<File | null>(null);
  const [foto2, setFoto2] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setUploading(true);
    try {
      const fotoUrl1 = foto1 ? await uploadImage(foto1, 'parcel-images', buildStoragePath('mantenimiento-camion', foto1)) : null;
      const fotoUrl2 = foto2 ? await uploadImage(foto2, 'parcel-images', buildStoragePath('mantenimiento-camion', foto2)) : null;
      await addMut.mutateAsync({
        camion_id:   camionId,
        tipo:        form.tipo,
        descripcion: form.descripcion || null,
        fecha:       form.fecha,
        coste_euros: form.coste_euros ? Number(form.coste_euros) : null,
        proveedor:   form.proveedor   || null,
        foto_url:    fotoUrl1,
        foto_url_2:  fotoUrl2,
        created_by:  'JuanPe',
      });
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0">
          <Wrench className="w-5 h-5 text-purple-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Mantenimiento</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo *</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={INPUT}>
                {TIPOS_MANT.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={INPUT} />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={2}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white resize-none focus:border-purple-400/50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Coste (€)</label>
              <input type="number" min="0" step="0.01" value={form.coste_euros} onChange={e => set('coste_euros', e.target.value)} placeholder="0.00" className={INPUT} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Proveedor</label>
              <input type="text" value={form.proveedor} onChange={e => set('proveedor', e.target.value)} className={INPUT} />
            </div>
          </div>

          {/* Foto 1 */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Foto 1 (albarán / trabajo)</label>
            {foto1 ? (
              <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg border border-white/10">
                <img src={URL.createObjectURL(foto1)} alt="" className="w-10 h-10 object-cover rounded shrink-0" />
                <p className="flex-1 text-[10px] text-white truncate">{foto1.name}</p>
                <button type="button" onClick={() => setFoto1(null)} className="text-slate-500 hover:text-red-400">×</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-800 border border-dashed border-white/20 hover:border-purple-400/50 rounded-lg transition-colors">
                <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-[10px] text-slate-400">Seleccionar foto…</span>
                <input ref={fileRef1} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => setFoto1(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>

          {/* Foto 2 */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Foto 2 (detalle / factura)</label>
            {foto2 ? (
              <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg border border-white/10">
                <img src={URL.createObjectURL(foto2)} alt="" className="w-10 h-10 object-cover rounded shrink-0" />
                <p className="flex-1 text-[10px] text-white truncate">{foto2.name}</p>
                <button type="button" onClick={() => setFoto2(null)} className="text-slate-500 hover:text-red-400">×</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-800 border border-dashed border-white/20 hover:border-purple-400/50 rounded-lg transition-colors">
                <Camera className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-[10px] text-slate-400">Seleccionar foto…</span>
                <input ref={fileRef2} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => setFoto2(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-white/10 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={addMut.isPending || uploading}
            className="flex-1 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-40 transition-colors">
            {uploading || addMut.isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta Camión ────────────────────────────────────────────

function TarjetaCamion({ camion, personal, viajes, mantenimientos }: {
  camion:         Camion;
  personal:       Personal[];
  viajes:         Viaje[];
  mantenimientos: MantenimientoCamion[];
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [modalMant, setModalMant] = useState(false);

  const misViajes = viajes.filter(v => v.camion_id === camion.id);
  const misMant   = mantenimientos.filter(m => m.camion_id === camion.id);

  const hoy = new Date();
  const itvDate   = camion.fecha_itv         ? new Date(camion.fecha_itv)          : null;
  const proxItvDate = camion.fecha_proxima_itv ? new Date(camion.fecha_proxima_itv) : null;
  const proxRevDate = camion.fecha_proxima_revision ? new Date(camion.fecha_proxima_revision) : null;
  const itvVencida   = itvDate     ? itvDate < hoy   : false;
  const proxItvDias  = proxItvDate ? Math.ceil((proxItvDate.getTime() - hoy.getTime()) / 86400000) : null;
  const proxRevDias  = proxRevDate ? Math.ceil((proxRevDate.getTime() - hoy.getTime()) / 86400000) : null;
  const kmAlerta     = camion.km_proximo_mantenimiento != null && camion.kilometros_actuales != null
    ? camion.km_proximo_mantenimiento - camion.kilometros_actuales
    : null;

  const estadoColor = !camion.activo ? '#ef4444'
    : (itvVencida || proxItvDias !== null && proxItvDias < 0) ? '#ef4444'
    : (proxItvDias !== null && proxItvDias < 30) || (proxRevDias !== null && proxRevDias < 30) || (kmAlerta !== null && kmAlerta < 1000) ? '#f59e0b'
    : '#34d399';

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: estadoColor + '18' }}>
          <Truck className="w-5 h-5" style={{ color: estadoColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{camion.matricula}</p>
            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ color: estadoColor, backgroundColor: estadoColor + '18' }}>
              {camion.activo ? 'Activo' : 'Inactivo'}
            </span>
            {itvVencida && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">ITV VENCIDA</span>
            )}
            {!itvVencida && proxItvDias !== null && proxItvDias < 30 && proxItvDias >= 0 && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                ITV en {proxItvDias}d
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {[camion.marca, camion.modelo, camion.anio].filter(Boolean).join(' · ')}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[9px] text-slate-400">{misViajes.length} viajes</span>
            {camion.kilometros_actuales != null && (
              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                <Gauge className="w-2.5 h-2.5" />{camion.kilometros_actuales.toLocaleString('es-ES')} km
              </span>
            )}
            {camion.fecha_proxima_itv && (
              <span className={`text-[9px] flex items-center gap-0.5 ${proxItvDias !== null && proxItvDias < 0 ? 'text-red-400' : proxItvDias !== null && proxItvDias < 30 ? 'text-amber-400' : 'text-slate-400'}`}>
                <Calendar className="w-2.5 h-2.5" />
                ITV: {new Date(camion.fecha_proxima_itv).toLocaleDateString('es-ES')}
              </span>
            )}
            {kmAlerta !== null && (
              <span className={`text-[9px] flex items-center gap-0.5 ${kmAlerta < 0 ? 'text-red-400' : kmAlerta < 1000 ? 'text-amber-400' : 'text-slate-400'}`}>
                <Wrench className="w-2.5 h-2.5" />
                Mant. en {Math.abs(kmAlerta).toLocaleString('es-ES')} km
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-white/10 p-4 space-y-4">

          {/* Estado alertas */}
          {(camion.fecha_proxima_revision || camion.km_proximo_mantenimiento || camion.gps_info) && (
            <div className="grid grid-cols-2 gap-2">
              {camion.fecha_proxima_revision && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-200 dark:border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Próxima revisión</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${proxRevDias !== null && proxRevDias < 0 ? 'text-red-400' : proxRevDias !== null && proxRevDias < 30 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {new Date(camion.fecha_proxima_revision).toLocaleDateString('es-ES')}
                    {proxRevDias !== null && proxRevDias >= 0 && ` (${proxRevDias}d)`}
                  </p>
                </div>
              )}
              {camion.km_proximo_mantenimiento != null && (
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-200 dark:border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Km próx. mant.</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-0.5">
                    {camion.km_proximo_mantenimiento.toLocaleString('es-ES')} km
                  </p>
                </div>
              )}
              {camion.gps_info && (
                <div className="col-span-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-200 dark:border-white/5 flex items-center gap-2">
                  <Navigation className="w-3 h-3 text-purple-400 shrink-0" />
                  <p className="text-[9px] text-slate-300">{camion.gps_info}</p>
                </div>
              )}
            </div>
          )}

          {/* Últimos viajes */}
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Últimos viajes</p>
            {misViajes.length === 0 ? (
              <p className="text-[10px] text-slate-500">Sin viajes registrados</p>
            ) : (
              <div className="space-y-1.5">
                {misViajes.slice(0, 5).map(v => {
                  const conductor = personal.find(p => p.id === v.personal_id);
                  return (
                    <div key={v.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-900 dark:text-white">{v.trabajo_realizado ?? v.ruta ?? 'Viaje'}</p>
                        {v.hora_salida && (
                          <span className="text-[8px] text-slate-400">
                            {new Date(v.hora_salida).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {conductor && <span className="text-[9px] text-slate-400">{conductor.nombre}</span>}
                        {v.finca     && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-2 h-2" />{v.finca}</span>}
                        {v.destino   && <span className="text-[9px] text-slate-400">→ {v.destino}</span>}
                        {v.km_recorridos != null && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Gauge className="w-2 h-2" />{v.km_recorridos} km</span>}
                        {v.gasto_gasolina_litros != null && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Fuel className="w-2 h-2" />{v.gasto_gasolina_litros}L</span>}
                        {v.gasto_gasolina_euros  != null && <span className="text-[9px] text-purple-300">{v.gasto_gasolina_euros}€</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mantenimientos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mantenimientos ({misMant.length})</p>
              <button onClick={() => setModalMant(true)}
                className="flex items-center gap-1 text-[9px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest">
                <Plus className="w-3 h-3" />Añadir
              </button>
            </div>
            {misMant.length === 0 ? (
              <p className="text-[10px] text-slate-500">Sin mantenimientos</p>
            ) : (
              <div className="space-y-1">
                {misMant.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                    <div>
                      <span className="text-[9px] font-black text-white uppercase">{m.tipo}</span>
                      {m.descripcion && <span className="text-[8px] text-slate-500 ml-2">{m.descripcion}</span>}
                      {m.proveedor   && <span className="text-[8px] text-slate-600 ml-2">· {m.proveedor}</span>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[8px] text-slate-400">{new Date(m.fecha).toLocaleDateString('es-ES')}</p>
                      {m.coste_euros != null && <p className="text-[8px] text-purple-300 font-black">{m.coste_euros}€</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {camion.notas_mantenimiento && (
            <p className="text-[9px] text-slate-400 italic border-t border-white/10 pt-3">{camion.notas_mantenimiento}</p>
          )}
        </div>
      )}

      {modalMant && <ModalMantenimientoCamion camionId={camion.id} onClose={() => setModalMant(false)} />}
    </div>
  );
}

// ── Tarjeta Conductor (desde Personal) ───────────────────────

function TarjetaConductor({ conductor, viajes, camiones }: {
  conductor: Personal;
  viajes:    Viaje[];
  camiones:  Camion[];
}) {
  const [expanded, setExpanded] = useState(false);
  const misViajes = viajes.filter(v => v.personal_id === conductor.id);
  const totalKm   = misViajes.reduce((s, v) => s + (v.km_recorridos ?? 0), 0);
  const totalL    = misViajes.reduce((s, v) => s + (v.gasto_gasolina_litros ?? 0), 0);
  const totalEur  = misViajes.reduce((s, v) => s + (v.gasto_gasolina_euros ?? 0), 0);

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
          {conductor.foto_url
            ? <img src={conductor.foto_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
            : <Users className="w-5 h-5 text-purple-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-black text-slate-900 dark:text-white">{conductor.nombre}</p>
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${conductor.activo ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {conductor.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {conductor.telefono && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Phone className="w-2.5 h-2.5" />{conductor.telefono}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-[9px] text-slate-400">{misViajes.length} viajes</span>
            {totalKm  > 0 && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Gauge className="w-2.5 h-2.5" />{totalKm.toLocaleString('es-ES')} km</span>}
            {totalL   > 0 && <span className="text-[9px] text-slate-400 flex items-center gap-0.5"><Fuel className="w-2.5 h-2.5" />{totalL.toFixed(1)} L</span>}
            {totalEur > 0 && <span className="text-[9px] text-purple-300 font-black">{totalEur.toFixed(2)}€</span>}
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-white/10 p-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Historial de viajes</p>
          {misViajes.length === 0 ? (
            <p className="text-[10px] text-slate-500">Sin viajes registrados</p>
          ) : (
            <div className="space-y-1.5">
              {misViajes.slice(0, 8).map(v => {
                const camion = camiones.find(c => c.id === v.camion_id);
                return (
                  <div key={v.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-900 dark:text-white">{v.trabajo_realizado ?? v.ruta ?? 'Viaje'}</p>
                      {v.hora_salida && <span className="text-[8px] text-slate-400">{new Date(v.hora_salida).toLocaleDateString('es-ES')}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {camion && <span className="text-[9px] text-slate-400">{camion.matricula}</span>}
                      {v.finca   && <span className="text-[9px] text-slate-400">{v.finca}</span>}
                      {v.destino && <span className="text-[9px] text-slate-400">→ {v.destino}</span>}
                      {v.km_recorridos != null && <span className="text-[9px] text-slate-400">{v.km_recorridos} km</span>}
                      {v.gasto_gasolina_euros != null && <span className="text-[9px] text-purple-300">{v.gasto_gasolina_euros}€</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {conductor.notas && <p className="text-[9px] text-slate-400 italic mt-3 border-t border-white/10 pt-2">{conductor.notas}</p>}
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────

export default function Logistica() {
  const navigate  = useNavigate();
  const { theme } = useTheme();
  const isDark    = theme === 'dark';

  const [tab,         setTab]         = useState<TabType>('camiones');
  const [modalCamion, setModalCamion] = useState(false);
  const [modalViaje,  setModalViaje]  = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);

  const { data: kpis          = { totalCamiones: 0, camionesActivos: 0, totalConductores: 0, totalViajes: 0 } } = useKPIsLogistica();
  const { data: camiones      = [] } = useCamiones();
  const { data: personal      = [] } = usePersonal();
  const { data: viajes        = [] } = useViajes();
  const { data: mants         = [] } = useMantenimientoCamion();

  const conductores = personal.filter(p => p.activo && p.categoria === 'conductor_camion');

  const totalKmViajes = viajes.reduce((s, v) => s + (v.km_recorridos ?? 0), 0);
  const totalCosteMant = mants.reduce((s, m) => s + (m.coste_euros ?? 0), 0);
  const totalLitros = viajes.reduce((s, v) => s + (v.gasto_gasolina_litros ?? 0), 0);
  const totalEurComb = viajes.reduce((s, v) => s + (v.gasto_gasolina_euros ?? 0), 0);

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

  async function generarLogisticaCompleta() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    await generarPDFCorporativoBase({
      titulo: 'LOGÍSTICA',
      subtitulo: 'Informe completo de flota y operaciones',
      fecha: ref,
      filename: `Logistica_Completa_${fs}.pdf`,
      accentColor: PDF_COLORS.violet,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Camiones');
          pdfCorporateTable(
            ctx,
            ['MATRÍCULA', 'MARCA', 'MODELO', 'KM ACTUAL', 'PRÓX. ITV', 'ESTADO'],
            [28, 28, 32, 24, 28, 42],
            camiones.map(c => [
              c.matricula,
              c.marca ?? '—',
              c.modelo ?? '—',
              c.kilometros_actuales != null ? c.kilometros_actuales.toLocaleString('es-ES') : '—',
              fmtFechaCorta(c.fecha_proxima_itv),
              estadoCamionTexto(c),
            ]),
          );
        },
        ctx => {
          pdfCorporateSection(ctx, 'Viajes');
          if (viajes.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin viajes registrados.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['HORA SALIDA', 'HORA LLEGADA', 'CAMIÓN', 'CONDUCTOR', 'DESTINO', 'KM'],
            [30, 30, 22, 36, 44, 20],
            viajes.map(v => [
              fmtViajeHora(v.hora_salida),
              fmtViajeHora(v.hora_llegada),
              matriculaDe(camiones, v.camion_id),
              nombreConductorDe(personal, v.personal_id),
              v.destino ?? v.finca ?? '—',
              v.km_recorridos != null ? String(v.km_recorridos) : '—',
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
            ['FECHA', 'CAMIÓN', 'TIPO', 'DESCRIPCIÓN', 'COSTE €', 'PROVEEDOR'],
            [24, 24, 22, 52, 22, 38],
            mants.map(m => [
              fmtFechaCorta(m.fecha),
              matriculaDe(camiones, m.camion_id),
              m.tipo,
              m.descripcion ?? '—',
              m.coste_euros != null ? m.coste_euros.toFixed(2) : '—',
              m.proveedor ?? '—',
            ]),
          );
        },
      ],
    });
  }

  async function generarSoloViajes() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    const delDia = viajes.filter(
      v => v.hora_salida && mismoDiaCalendario(new Date(v.hora_salida), ref),
    );
    await generarPDFCorporativoBase({
      titulo: 'LOGÍSTICA — VIAJES',
      subtitulo: 'Movimientos del día',
      fecha: ref,
      filename: `Logistica_Viajes_${fs}.pdf`,
      accentColor: PDF_COLORS.violet,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Viajes del día');
          if (delDia.length === 0) {
            ctx.checkPage(8);
            ctx.doc.setFontSize(9);
            ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin viajes registrados para hoy.', PDF_MARGIN, ctx.y);
            ctx.y += 6;
            return;
          }
          pdfCorporateTable(
            ctx,
            ['HORA SALIDA', 'HORA LLEGADA', 'CAMIÓN', 'CONDUCTOR', 'DESTINO', 'KM'],
            [30, 30, 22, 36, 44, 20],
            delDia.map(v => [
              fmtViajeHora(v.hora_salida),
              fmtViajeHora(v.hora_llegada),
              matriculaDe(camiones, v.camion_id),
              nombreConductorDe(personal, v.personal_id),
              v.destino ?? v.finca ?? '—',
              v.km_recorridos != null ? String(v.km_recorridos) : '—',
            ]),
          );
        },
      ],
    });
  }

  async function generarEstadoCamiones() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    await generarPDFCorporativoBase({
      titulo: 'LOGÍSTICA — FLOTA',
      subtitulo: 'Estado de camiones',
      fecha: ref,
      filename: `Logistica_Camiones_${fs}.pdf`,
      accentColor: PDF_COLORS.violet,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Estado de camiones');
          pdfCorporateTable(
            ctx,
            ['MATRÍCULA', 'MARCA', 'MODELO', 'ITV', 'ESTADO'],
            [28, 32, 38, 32, 52],
            camiones.map(c => [
              c.matricula,
              c.marca ?? '—',
              c.modelo ?? '—',
              fmtFechaCorta(c.fecha_proxima_itv),
              estadoCamionTexto(c),
            ]),
          );
        },
      ],
    });
  }

  async function generarMantenimientos() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    await generarPDFCorporativoBase({
      titulo: 'LOGÍSTICA — MANTENIMIENTO',
      subtitulo: 'Historial de intervenciones',
      fecha: ref,
      filename: `Logistica_Mantenimientos_${fs}.pdf`,
      accentColor: PDF_COLORS.violet,
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
            ['FECHA', 'CAMIÓN', 'TIPO', 'COSTE €', 'PROVEEDOR'],
            [28, 28, 32, 24, 70],
            mants.map(m => [
              fmtFechaCorta(m.fecha),
              matriculaDe(camiones, m.camion_id),
              m.tipo,
              m.coste_euros != null ? m.coste_euros.toFixed(2) : '—',
              m.proveedor ?? '—',
            ]),
          );
        },
      ],
    });
  }

  async function generarResumenLogistica() {
    const ref = new Date();
    const fs = ref.toISOString().slice(0, 10);
    const activos = camiones.filter(c => c.activo).length;
    await generarPDFCorporativoBase({
      titulo: 'LOGÍSTICA — RESUMEN',
      subtitulo: 'Indicadores operativos',
      fecha: ref,
      filename: `Logistica_Resumen_${fs}.pdf`,
      accentColor: PDF_COLORS.violet,
      bloques: [
        ctx => {
          pdfCorporateSection(ctx, 'Resumen operativo');
          pdfCorporateTable(
            ctx,
            ['INDICADOR', 'VALOR'],
            [95, 87],
            [
              ['Total viajes', String(viajes.length)],
              ['Km recorridos (acumulado)', totalKmViajes.toLocaleString('es-ES')],
              ['Gasto combustible (litros)', totalLitros > 0 ? totalLitros.toFixed(1) : '—'],
              ['Gasto combustible (euros)', totalEurComb > 0 ? `${totalEurComb.toFixed(2)} €` : '—'],
              ['Camiones activos', String(activos)],
            ],
          );
        },
      ],
    });
  }

  async function onElegirPdf(op: 1 | 2 | 3 | 4 | 5) {
    setPdfMenuOpen(false);
    setGenerandoPdf(true);
    try {
      if (op === 1) await generarLogisticaCompleta();
      else if (op === 2) await generarSoloViajes();
      else if (op === 3) await generarEstadoCamiones();
      else if (op === 4) await generarMantenimientos();
      else await generarResumenLogistica();
    } finally {
      setGenerandoPdf(false);
    }
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'} flex flex-col`}>

      {/* HEADER */}
      <header className={`w-full ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/90 border-slate-200'} border-b pl-14 pr-4 py-2 flex items-center gap-3 z-50`}>
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-slate-400 hover:text-[#38bdf8] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Dashboard</span>
        </button>
        <span className="text-slate-600">|</span>
        <Truck className="w-4 h-4 text-purple-400" />
        <span className="text-[11px] font-black uppercase tracking-wider">Logística</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setModalViaje(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-colors">
            <Plus className="w-3 h-3" />Viaje
          </button>
          <div className="relative" ref={pdfMenuRef}>
            <button
              type="button"
              onClick={() => setPdfMenuOpen(o => !o)}
              disabled={generandoPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#38bdf8]/20 bg-[#38bdf8]/5 hover:bg-[#38bdf8]/10 text-[#38bdf8] text-[9px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {generandoPdf
                ? <span className="w-3 h-3 border-2 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin" />
                : <FileText className="w-3 h-3" />}
              PDF
              <ChevronDown className={`w-3 h-3 transition-transform ${pdfMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {pdfMenuOpen && (
              <div
                className={`absolute right-0 top-full z-[70] mt-1 min-w-[260px] rounded-lg border shadow-lg py-1 ${
                  isDark
                    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-black/40'
                    : 'border-slate-200 bg-white text-slate-800 shadow-slate-400/20'
                }`}
              >
                {[
                  { k: 1 as const, label: 'Informe completo logística' },
                  { k: 2 as const, label: 'Solo viajes del día' },
                  { k: 3 as const, label: 'Estado de camiones' },
                  { k: 4 as const, label: 'Mantenimientos' },
                  { k: 5 as const, label: 'Resumen operativo' },
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
        <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-4">
          {[
            { label: 'Camiones',      value: kpis.totalCamiones,    color: '#a78bfa' },
            { label: 'Activos',       value: kpis.camionesActivos,  color: '#34d399' },
            { label: 'Conductores',   value: kpis.totalConductores, color: '#a78bfa' },
            { label: 'Viajes',        value: kpis.totalViajes,      color: '#60a5fa' },
          ].map(kpi => (
            <div key={kpi.label} className={`${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-3 text-center`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* KPIs secundarios */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-3 flex items-center gap-3`}>
            <Gauge className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Km totales</p>
              <p className="text-[14px] font-black text-purple-300">{totalKmViajes.toLocaleString('es-ES')} km</p>
            </div>
          </div>
          <div className={`${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-3 flex items-center gap-3`}>
            <Wrench className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coste mantenimiento</p>
              <p className="text-[14px] font-black text-amber-300">{totalCosteMant.toFixed(2)}€</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className={`flex gap-1 mb-5 ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'} border rounded-xl p-1`}>
          {(['camiones', 'conductores'] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                tab === t ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:text-slate-300'
              }`}>
              {t === 'camiones'
                ? <><Truck className="w-3.5 h-3.5 inline mr-1.5" />Camiones</>
                : <><Users className="w-3.5 h-3.5 inline mr-1.5" />Conductores</>
              }
            </button>
          ))}
        </div>

        {/* ── TAB CAMIONES ── */}
        {tab === 'camiones' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {camiones.length} camión{camiones.length !== 1 ? 'es' : ''}
              </p>
              <button onClick={() => setModalCamion(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-colors">
                <Plus className="w-3 h-3" />Nuevo camión
              </button>
            </div>
            <div className="space-y-3">
              {camiones.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin camiones</p>
                </div>
              ) : (
                camiones.map(c => (
                  <TarjetaCamion key={c.id} camion={c} personal={personal} viajes={viajes} mantenimientos={mants} />
                ))
              )}
            </div>
          </>
        )}

        {/* ── TAB CONDUCTORES ── */}
        {tab === 'conductores' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {conductores.length} conductor{conductores.length !== 1 ? 'es' : ''} activos
              </p>
              <button onClick={() => navigate('/personal')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e879f9]/10 border border-[#e879f9]/20 text-[#e879f9] text-[9px] font-black uppercase tracking-widest hover:bg-[#e879f9]/20 transition-colors">
                <Users className="w-3 h-3" />Gestionar en Personal →
              </button>
            </div>
            <div className="space-y-3">
              {conductores.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin conductores</p>
                  <p className="text-[10px] mt-1">Añade conductores de camión en el módulo Personal</p>
                </div>
              ) : (
                conductores.map(c => (
                  <TarjetaConductor key={c.id} conductor={c} viajes={viajes} camiones={camiones} />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {modalCamion && <ModalCamion onClose={() => setModalCamion(false)} />}
      {modalViaje  && <ModalViaje conductores={conductores} camiones={camiones} onClose={() => setModalViaje(false)} />}
    </div>
  );
}
