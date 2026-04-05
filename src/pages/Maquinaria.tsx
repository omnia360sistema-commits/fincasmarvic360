import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Tractor, Wrench, Plus, X,
  MapPin, Clock, Fuel, ChevronRight,
  Calendar, Activity, Navigation,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  useTractores, useTractoresEnInventario, useAperosEnInventario,
  useAddTractor, useUpdateTractor, useDeleteTractor,
  useAperos, useAddApero, useDeleteApero,
  useUsosMaquinaria, useAddUsoMaquinaria,
  useMantenimientoTractor, useAddMantenimientoTractor,
  useKPIsMaquinaria,
  useTiposTrabajoMaquinaria, useAddTipoTrabajoMaquinaria,
  Tractor as TractorType, Apero, UsoMaquinaria, MantenimientoTractor,
} from '../hooks/useMaquinaria';
import { usePersonal, Personal } from '../hooks/usePersonal';
import { useUbicaciones } from '../hooks/useInventario';
import { uploadImage } from '../utils/uploadImage';
import {
  generarPDFCorporativoBase,
  pdfCorporateSection,
  pdfCorporateTable,
  PDF_COLORS,
  PDF_MARGIN,
} from '../utils/pdfUtils';
import { FINCAS_NOMBRES as FINCAS } from '../constants/farms';
import { SelectWithOther, AudioInput, PhotoAttachment, RecordActions } from '../components/base';
import { supabase } from '../integrations/supabase/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRecorridoDia, useAddPosicion } from '../hooks/useGPS';
import { toast } from '../hooks/use-toast';

// ── Constantes ────────────────────────────────────────────────

type TabType = 'tractores' | 'aperos' | 'uso' | 'gps';

const ESTADOS_OPERATIVO = ['disponible', 'en_uso', 'mantenimiento', 'baja'] as const;
const ESTADOS_APERO     = ['disponible', 'asignado', 'en_reparacion', 'baja'] as const;

const ESTADO_OP_BADGE: Record<string, string> = {
  disponible:    'border-green-500  text-green-400',
  en_uso:        'border-blue-500   text-blue-400',
  mantenimiento: 'border-amber-500  text-amber-400',
  baja:          'border-red-500    text-red-400',
};

const ESTADO_OP_LABEL: Record<string, string> = {
  disponible:    'Disponible',
  en_uso:        'En uso',
  mantenimiento: 'Mantenimiento',
  baja:          'Baja',
};

const TIPOS_APERO_BASE = [
  'Arado', 'Cultivador', 'Fresadora', 'Subsolador', 'Rodillo',
  'Sembradora', 'Abonadora', 'Pulverizador', 'Segadora',
  'Remolque', 'Pala cargadora', 'Retroexcavadora',
];

const MARCAS_TRACTOR_BASE = ['John Deere', 'Fendt', 'New Holland', 'Case IH', 'Kubota', 'Massey Ferguson'];

function fmtFechaCorta(f: string | null): string {
  if (!f) return '—';
  try { return new Date(f).toLocaleDateString('es-ES'); } catch { return '—'; }
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

// ── Etiqueta label compacta ───────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
      {children}
    </label>
  );
}

// ── Input base reutilizable ───────────────────────────────────
function BaseInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none ${props.className ?? ''}`}
    />
  );
}

// ── Select base reutilizable ──────────────────────────────────
function BaseSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  const { children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-orange-400/50 focus:outline-none ${props.className ?? ''}`}
    >
      {children}
    </select>
  );
}

// ── Wrapper SelectWithOther con estilo propio ─────────────────
// SelectWithOther usa clases propias; lo envolvemos para coherencia visual
function SWO({
  options, value, onChange, onCreateNew, placeholder,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  onCreateNew: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <SelectWithOther
      options={options}
      value={value}
      onChange={onChange}
      onCreateNew={onCreateNew}
      placeholder={placeholder ?? 'Seleccionar...'}
    />
  );
}

// ── Modal Tractor ─────────────────────────────────────────────
function ModalTractor({
  tractor,
  onClose,
}: {
  tractor?: TractorType;
  onClose: () => void;
}) {
  const addMut    = useAddTractor();
  const updateMut = useUpdateTractor();
  const { data: ubicaciones = [] } = useUbicaciones();

  const [form, setForm] = useState({
    matricula:                   tractor?.matricula ?? '',
    marca:                       tractor?.marca ?? '',
    modelo:                      tractor?.modelo ?? '',
    anio:                        tractor?.anio ? String(tractor.anio) : '',
    horas_motor:                 tractor?.horas_motor != null ? String(tractor.horas_motor) : '',
    ficha_tecnica:               tractor?.ficha_tecnica ?? '',
    notas:                       tractor?.notas ?? '',
    fecha_proxima_itv:           tractor?.fecha_proxima_itv ?? '',
    fecha_proxima_revision:      tractor?.fecha_proxima_revision ?? '',
    horas_proximo_mantenimiento: tractor?.horas_proximo_mantenimiento != null ? String(tractor.horas_proximo_mantenimiento) : '',
    gps_info:                    tractor?.gps_info ?? '',
    estado_operativo:            tractor?.estado_operativo ?? 'disponible',
    ubicacion_id:                '',
  });
  const [fotoFile, setFotoFile]     = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(tractor?.foto_url ?? null);
  const [saving, setSaving]         = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  function handleFoto(file: File | null) {
    setFotoFile(file);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  }

  const marcasExistentes = MARCAS_TRACTOR_BASE;

  async function handleSubmit() {
    if (!form.matricula.trim()) return;
    setSaving(true);
    try {
      let foto_url = tractor?.foto_url ?? null;
      if (fotoFile) {
        foto_url = await uploadImage(fotoFile, 'parcel-images', `maquinaria/tractores/${Date.now()}`);
      }

      const payload = {
        matricula:                   form.matricula.toUpperCase(),
        marca:                       form.marca || null,
        modelo:                      form.modelo || null,
        anio:                        form.anio ? Number(form.anio) : null,
        horas_motor:                 form.horas_motor ? Number(form.horas_motor) : null,
        ficha_tecnica:               form.ficha_tecnica || null,
        activo:                      true,
        foto_url,
        notas:                       form.notas || null,
        created_by:                  'JuanPe',
        fecha_proxima_itv:           form.fecha_proxima_itv || null,
        fecha_proxima_revision:      form.fecha_proxima_revision || null,
        horas_proximo_mantenimiento: form.horas_proximo_mantenimiento ? Number(form.horas_proximo_mantenimiento) : null,
        gps_info:                    form.gps_info || null,
        estado_operativo:            form.estado_operativo || 'disponible',
        codigo_interno:              tractor?.codigo_interno ?? null,
      };

      if (tractor) {
        await updateMut.mutateAsync({ id: tractor.id, ...payload });
      } else {
        await addMut.mutateAsync({ ...payload, ubicacion_id: form.ubicacion_id || null });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Tractor className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {tractor ? 'Editar tractor' : 'Nuevo tractor'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Código interno (readonly) */}
          <div>
            <FieldLabel>Código interno</FieldLabel>
            <BaseInput
              value={tractor?.codigo_interno ?? 'Se asignará automáticamente'}
              readOnly
              className="text-slate-500 cursor-default"
            />
          </div>

          <div>
            <FieldLabel>Matrícula *</FieldLabel>
            <BaseInput
              type="text"
              value={form.matricula}
              onChange={e => set('matricula', e.target.value)}
              placeholder="M-1234-AB"
              className="uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Marca</FieldLabel>
              <SWO
                options={marcasExistentes}
                value={form.marca}
                onChange={v => set('marca', v)}
                onCreateNew={v => set('marca', v)}
                placeholder="Seleccionar marca..."
              />
            </div>
            <div>
              <FieldLabel>Modelo</FieldLabel>
              <BaseInput
                type="text"
                value={form.modelo}
                onChange={e => set('modelo', e.target.value)}
                placeholder="6R 150…"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Año</FieldLabel>
              <BaseInput
                type="number" min="1990" max="2030"
                value={form.anio}
                onChange={e => set('anio', e.target.value)}
                placeholder="2018"
              />
            </div>
            <div>
              <FieldLabel>Horas motor</FieldLabel>
              <BaseInput
                type="number" min="0"
                value={form.horas_motor}
                onChange={e => set('horas_motor', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Estado operativo</FieldLabel>
            <BaseSelect value={form.estado_operativo} onChange={e => set('estado_operativo', e.target.value)}>
              {ESTADOS_OPERATIVO.map(s => (
                <option key={s} value={s}>{ESTADO_OP_LABEL[s] ?? s}</option>
              ))}
            </BaseSelect>
          </div>

          {!tractor && (
            <div>
              <FieldLabel>Ubicación en inventario</FieldLabel>
              <BaseSelect value={form.ubicacion_id} onChange={e => set('ubicacion_id', e.target.value)}>
                <option value="">— Sin asignar —</option>
                {ubicaciones.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </BaseSelect>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Próxima ITV</FieldLabel>
              <BaseInput
                type="date"
                value={form.fecha_proxima_itv}
                onChange={e => set('fecha_proxima_itv', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Próxima revisión</FieldLabel>
              <BaseInput
                type="date"
                value={form.fecha_proxima_revision}
                onChange={e => set('fecha_proxima_revision', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Horas próx. mantenimiento</FieldLabel>
              <BaseInput
                type="number" min="0"
                value={form.horas_proximo_mantenimiento}
                onChange={e => set('horas_proximo_mantenimiento', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <FieldLabel>GPS (info manual)</FieldLabel>
              <BaseInput
                type="text"
                value={form.gps_info}
                onChange={e => set('gps_info', e.target.value)}
                placeholder="Dispositivo, app…"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Ficha técnica</FieldLabel>
            <AudioInput
              value={form.ficha_tecnica}
              onChange={v => set('ficha_tecnica', v)}
              placeholder="Potencia CV, configuración, accesorios…"
              rows={2}
            />
          </div>

          <div>
            <FieldLabel>Notas</FieldLabel>
            <AudioInput
              value={form.notas}
              onChange={v => set('notas', v)}
              rows={2}
            />
          </div>

          <div>
            <FieldLabel>Foto</FieldLabel>
            <PhotoAttachment
              value={fotoPreview}
              onChange={handleFoto}
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.matricula || saving}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Apero ───────────────────────────────────────────────
function ModalApero({
  apero,
  tractores,
  onClose,
}: {
  apero?: Apero;
  tractores: TractorType[];
  onClose: () => void;
}) {
  const addMut    = useAddApero();
  const { data: ubicaciones = [] } = useUbicaciones();
  const { data: aperosExistentes = [] } = useAperos();

  const tiposExistentes = Array.from(
    new Set([...TIPOS_APERO_BASE, ...aperosExistentes.map(a => a.tipo)])
  ).sort();

  const [form, setForm] = useState({
    tipo:         apero?.tipo ?? '',
    descripcion:  apero?.descripcion ?? '',
    tractor_id:   apero?.tractor_id ?? '',
    ubicacion_id: '',
    estado:       apero?.estado ?? 'disponible',
    notas:        apero?.notas ?? '',
  });
  const [fotoFile, setFotoFile]       = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(apero?.foto_url ?? null);
  const [saving, setSaving]           = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  function handleFoto(file: File | null) {
    setFotoFile(file);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit() {
    if (!form.tipo.trim()) return;
    setSaving(true);
    try {
      let foto_url = apero?.foto_url ?? null;
      if (fotoFile) {
        foto_url = await uploadImage(fotoFile, 'parcel-images', `maquinaria/aperos/${Date.now()}`);
      }
      await addMut.mutateAsync({
        tipo:           form.tipo,
        descripcion:    form.descripcion || null,
        tractor_id:     form.tractor_id || null,
        activo:         true,
        foto_url,
        notas:          form.notas || null,
        estado:         form.estado || 'disponible',
        codigo_interno: apero?.codigo_interno ?? null,
        created_by:     'JuanPe',
        ubicacion_id:   form.ubicacion_id || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Wrench className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">
            {apero ? 'Editar apero' : 'Nuevo apero'}
          </p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div>
            <FieldLabel>Código interno</FieldLabel>
            <BaseInput
              value={apero?.codigo_interno ?? 'Se asignará automáticamente'}
              readOnly
              className="text-slate-500 cursor-default"
            />
          </div>

          <div>
            <FieldLabel>Tipo *</FieldLabel>
            <SWO
              options={tiposExistentes}
              value={form.tipo}
              onChange={v => set('tipo', v)}
              onCreateNew={v => set('tipo', v)}
              placeholder="Seleccionar tipo..."
            />
          </div>

          <div>
            <FieldLabel>Descripción</FieldLabel>
            <AudioInput
              value={form.descripcion}
              onChange={v => set('descripcion', v)}
              placeholder="Modelo, características, estado…"
              rows={2}
            />
          </div>

          <div>
            <FieldLabel>Tractor asignado</FieldLabel>
            <BaseSelect value={form.tractor_id} onChange={e => set('tractor_id', e.target.value)}>
              <option value="">— Sin asignar —</option>
              {tractores.filter(t => t.activo).map(t => (
                <option key={t.id} value={t.id}>
                  {t.codigo_interno ? `${t.codigo_interno} · ` : ''}{t.matricula}{t.marca ? ` · ${t.marca}` : ''}
                </option>
              ))}
            </BaseSelect>
          </div>

          <div>
            <FieldLabel>Ubicación en inventario</FieldLabel>
            <BaseSelect value={form.ubicacion_id} onChange={e => set('ubicacion_id', e.target.value)}>
              <option value="">— Sin asignar —</option>
              {ubicaciones.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </BaseSelect>
          </div>

          <div>
            <FieldLabel>Estado</FieldLabel>
            <BaseSelect value={form.estado} onChange={e => set('estado', e.target.value)}>
              <option value="disponible">Disponible</option>
              <option value="asignado">Asignado</option>
              <option value="en_reparacion">En reparación</option>
              <option value="baja">Baja</option>
            </BaseSelect>
          </div>

          <div>
            <FieldLabel>Notas</FieldLabel>
            <AudioInput
              value={form.notas}
              onChange={v => set('notas', v)}
              rows={2}
            />
          </div>

          <div>
            <FieldLabel>Foto</FieldLabel>
            <PhotoAttachment value={fotoPreview} onChange={handleFoto} />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.tipo || saving}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Registro Uso ────────────────────────────────────────
function ModalUso({
  tractores,
  aperos,
  personal,
  onClose,
}: {
  tractores: TractorType[];
  aperos:    Apero[];
  personal:  Personal[];
  onClose:   () => void;
}) {
  const addMut           = useAddUsoMaquinaria();
  const { data: tiposDB = [] } = useTiposTrabajoMaquinaria();
  const addTipoMut       = useAddTipoTrabajoMaquinaria();

  const hoy = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    tractor_id:      '',
    apero_id:        '',
    personal_id:     '',
    finca:           '',
    tipo_trabajo:    '',
    fecha:           hoy,
    hora_inicio:     '',
    hora_fin:        '',
    gasolina_litros: '',
    notas:           '',
  });
  const [fotoFile, setFotoFile]       = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  function handleFoto(file: File | null) {
    setFotoFile(file);
    setFotoPreview(file ? URL.createObjectURL(file) : null);
  }

  const horasCalculadas: number | null = (() => {
    if (!form.hora_inicio || !form.hora_fin) return null;
    const [h1, m1] = form.hora_inicio.split(':').map(Number);
    const [h2, m2] = form.hora_fin.split(':').map(Number);
    const diff = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    return diff > 0 ? Math.round(diff * 10) / 10 : null;
  })();

  const aperosDelTractor = form.tractor_id
    ? aperos.filter(a => a.tractor_id === form.tractor_id)
    : aperos;

  const tiposOpciones = tiposDB.map(t => t.nombre);

  async function handleSubmit() {
    if (!form.personal_id || !fotoFile) return;
    setSaving(true);
    try {
      const foto_url = await uploadImage(fotoFile, 'parcel-images', `maquinaria_uso/${Date.now()}`);
      const personalSel = personal.find(p => p.id === form.personal_id);
      await addMut.mutateAsync({
        tractor_id:       form.tractor_id || null,
        apero_id:         form.apero_id || null,
        tractorista:      personalSel?.nombre ?? null,
        personal_id:      form.personal_id || null,
        finca:            form.finca || null,
        parcel_id:        null,
        tipo_trabajo:     form.tipo_trabajo || null,
        fecha:            form.fecha,
        hora_inicio:      form.hora_inicio ? `${form.fecha}T${form.hora_inicio}` : null,
        hora_fin:         form.hora_fin    ? `${form.fecha}T${form.hora_fin}`    : null,
        horas_trabajadas: horasCalculadas,
        gasolina_litros:  form.gasolina_litros ? Number(form.gasolina_litros) : null,
        foto_url,
        notas:            form.notas || null,
        created_by:       'JuanPe',
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Activity className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Registro de uso</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Tractor</FieldLabel>
              <BaseSelect
                value={form.tractor_id}
                onChange={e => { set('tractor_id', e.target.value); set('apero_id', ''); }}
              >
                <option value="">— Ninguno —</option>
                {tractores.filter(t => t.activo).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.codigo_interno ? `${t.codigo_interno} · ` : ''}{t.matricula}
                  </option>
                ))}
              </BaseSelect>
            </div>
            <div>
              <FieldLabel>Apero</FieldLabel>
              <BaseSelect value={form.apero_id} onChange={e => set('apero_id', e.target.value)}>
                <option value="">— Ninguno —</option>
                {aperosDelTractor.filter(a => a.activo).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.codigo_interno ? `${a.codigo_interno} · ` : ''}{a.tipo}
                  </option>
                ))}
              </BaseSelect>
            </div>
          </div>

          <div>
            <FieldLabel>Tractorista *</FieldLabel>
            <BaseSelect value={form.personal_id} onChange={e => set('personal_id', e.target.value)}>
              <option value="">— Seleccionar tractorista —</option>
              {personal.filter(p => p.activo).map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </BaseSelect>
          </div>

          <div>
            <FieldLabel>Finca</FieldLabel>
            <SWO
              options={FINCAS}
              value={form.finca}
              onChange={v => set('finca', v)}
              onCreateNew={v => set('finca', v)}
              placeholder="Seleccionar finca..."
            />
          </div>

          <div>
            <FieldLabel>Tipo de trabajo</FieldLabel>
            <SWO
              options={tiposOpciones}
              value={form.tipo_trabajo}
              onChange={v => set('tipo_trabajo', v)}
              onCreateNew={v => { addTipoMut.mutate(v); set('tipo_trabajo', v); }}
              placeholder="Seleccionar tipo..."
            />
          </div>

          <div>
            <FieldLabel>Fecha</FieldLabel>
            <BaseInput
              type="date"
              value={form.fecha}
              onChange={e => set('fecha', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Hora inicio</FieldLabel>
              <BaseInput
                type="time"
                value={form.hora_inicio}
                onChange={e => set('hora_inicio', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Hora fin</FieldLabel>
              <BaseInput
                type="time"
                value={form.hora_fin}
                onChange={e => set('hora_fin', e.target.value)}
              />
            </div>
          </div>

          {horasCalculadas !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="text-[10px] font-black text-orange-300">
                {horasCalculadas}h calculadas
              </span>
            </div>
          )}

          <div>
            <FieldLabel>Gasoil (litros)</FieldLabel>
            <BaseInput
              type="number" min="0" step="0.1"
              value={form.gasolina_litros}
              onChange={e => set('gasolina_litros', e.target.value)}
              placeholder="0.0"
            />
          </div>

          <div>
            <FieldLabel>Notas</FieldLabel>
            <AudioInput value={form.notas} onChange={v => set('notas', v)} rows={2} />
          </div>

          <div>
            <FieldLabel>Foto *</FieldLabel>
            <PhotoAttachment value={fotoPreview} onChange={handleFoto} />
            {!fotoFile && (
              <p className="text-[8px] text-amber-500/80 mt-1">La foto es obligatoria.</p>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.personal_id || !fotoFile || saving}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Mantenimiento ───────────────────────────────────────
function ModalMantenimiento({
  tractorId,
  horasActuales,
  tractores,
  onClose,
}: {
  tractorId?:     string;
  horasActuales?: number | null;
  tractores:      TractorType[];
  onClose:        () => void;
}) {
  const addMut = useAddMantenimientoTractor();

  const [form, setForm] = useState({
    tractor_id:             tractorId ?? '',
    tipo:                   '',
    fecha:                  new Date().toISOString().slice(0, 10),
    horas_motor_al_momento: horasActuales != null ? String(horasActuales) : '',
    descripcion:            '',
    coste_euros:            '',
    proveedor:              '',
  });
  const [foto1File, setFoto1File]         = useState<File | null>(null);
  const [foto1Preview, setFoto1Preview]   = useState<string | null>(null);
  const [foto2File, setFoto2File]         = useState<File | null>(null);
  const [foto2Preview, setFoto2Preview]   = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);
  const [tiposMantenimiento, setTiposMantenimiento] = useState<string[]>([]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    supabase
      .from('catalogo_tipos_mantenimiento')
      .select('nombre')
      .eq('modulo', 'maquinaria')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => {
        if (data) setTiposMantenimiento(data.map(d => d.nombre));
      });
  }, []);

  async function handleCreateTipo(nombre: string) {
    await supabase.from('catalogo_tipos_mantenimiento').insert({ nombre, modulo: 'maquinaria', activo: true });
    setTiposMantenimiento(prev => [...prev, nombre].sort());
  }

  function handleFoto1(file: File | null) {
    setFoto1File(file);
    setFoto1Preview(file ? URL.createObjectURL(file) : null);
  }

  function handleFoto2(file: File | null) {
    setFoto2File(file);
    setFoto2Preview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit() {
    if (!form.tractor_id || !form.tipo) return;
    setSaving(true);
    try {
      const ts = Date.now();
      const foto_url   = foto1File ? await uploadImage(foto1File, 'parcel-images', `mantenimiento-tractor/${form.tractor_id}_${ts}_1`) : null;
      const foto_url_2 = foto2File ? await uploadImage(foto2File, 'parcel-images', `mantenimiento-tractor/${form.tractor_id}_${ts}_2`) : null;
      await addMut.mutateAsync({
        tractor_id:             form.tractor_id,
        tipo:                   form.tipo,
        descripcion:            form.descripcion || null,
        fecha:                  form.fecha,
        horas_motor_al_momento: form.horas_motor_al_momento ? Number(form.horas_motor_al_momento) : null,
        coste_euros:            form.coste_euros ? Number(form.coste_euros) : null,
        proveedor:              form.proveedor || null,
        foto_url,
        foto_url_2,
        created_by:             'JuanPe',
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Wrench className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Mantenimiento tractor</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {!tractorId && (
            <div>
              <FieldLabel>Tractor *</FieldLabel>
              <BaseSelect value={form.tractor_id} onChange={e => set('tractor_id', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {tractores.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.codigo_interno ? `${t.codigo_interno} · ` : ''}{t.matricula}
                  </option>
                ))}
              </BaseSelect>
            </div>
          )}

          <div>
            <FieldLabel>Tipo *</FieldLabel>
            <SWO
              options={tiposMantenimiento}
              value={form.tipo}
              onChange={v => set('tipo', v)}
              onCreateNew={handleCreateTipo}
              placeholder="Seleccionar tipo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Fecha</FieldLabel>
              <BaseInput type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Horas motor al momento</FieldLabel>
              <BaseInput
                type="number" min="0"
                value={form.horas_motor_al_momento}
                onChange={e => set('horas_motor_al_momento', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Descripción / qué se hizo</FieldLabel>
            <AudioInput value={form.descripcion} onChange={v => set('descripcion', v)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Coste (€)</FieldLabel>
              <BaseInput
                type="number" min="0" step="0.01"
                value={form.coste_euros}
                onChange={e => set('coste_euros', e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Proveedor / taller</FieldLabel>
              <BaseInput
                type="text"
                value={form.proveedor}
                onChange={e => set('proveedor', e.target.value)}
                placeholder="Nombre taller…"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Foto 1 (albarán / trabajo)</FieldLabel>
            <PhotoAttachment value={foto1Preview} onChange={handleFoto1} />
          </div>

          <div>
            <FieldLabel>Foto 2 (ITV / factura)</FieldLabel>
            <PhotoAttachment value={foto2Preview} onChange={handleFoto2} />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.tractor_id || !form.tipo || saving}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta Tractor ───────────────────────────────────────────
function TarjetaTractor({
  tractor,
  aperos,
  usos,
  mantenimientos,
  onEdit,
  onDelete,
}: {
  tractor:        TractorType;
  aperos:         Apero[];
  usos:           UsoMaquinaria[];
  mantenimientos: MantenimientoTractor[];
  onEdit:         () => void;
  onDelete:       () => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [modalMant, setModalMant] = useState(false);

  const misAperos = aperos.filter(a => a.tractor_id === tractor.id);
  const misUsos   = usos.filter(u => u.tractor_id === tractor.id);
  const misMant   = mantenimientos.filter(m => m.tractor_id === tractor.id);
  const totalH    = misUsos.reduce((s, u) => s + (u.horas_trabajadas ?? 0), 0);
  const totalL    = misUsos.reduce((s, u) => s + (u.gasolina_litros ?? 0), 0);

  const itvDiff = tractor.fecha_proxima_itv
    ? (new Date(tractor.fecha_proxima_itv).getTime() - Date.now()) / 86400000
    : null;
  const itvClase = itvDiff !== null
    ? (itvDiff < 0 ? 'text-red-400' : itvDiff < 30 ? 'text-amber-400' : 'text-slate-400')
    : 'text-slate-400';

  const estadoOp = tractor.estado_operativo ?? 'disponible';

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
            {tractor.codigo_interno && (
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{tractor.codigo_interno}</span>
            )}
            <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase">{tractor.matricula}</p>
            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${ESTADO_OP_BADGE[estadoOp] ?? 'border-slate-500 text-slate-400'}`}>
              {ESTADO_OP_LABEL[estadoOp] ?? estadoOp}
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
            {tractor.fecha_proxima_itv && (
              <span className={`text-[9px] flex items-center gap-0.5 ${itvClase}`}>
                <Calendar className="w-2.5 h-2.5" />ITV {new Date(tractor.fecha_proxima_itv).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronRight className="w-4 h-4 text-slate-400 rotate-90 transition-transform shrink-0" />
          : <ChevronRight className="w-4 h-4 text-slate-400 transition-transform shrink-0" />
        }
      </div>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-white/10 p-4 space-y-4">
          {tractor.ficha_tecnica && (
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ficha técnica</p>
              <p className="text-[10px] text-slate-300">{tractor.ficha_tecnica}</p>
            </div>
          )}

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

          {misAperos.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Aperos asignados</p>
              <div className="flex flex-wrap gap-1.5">
                {misAperos.map(a => (
                  <span key={a.id} className="text-[9px] font-black px-2 py-1 rounded-lg bg-orange-500/10 text-orange-300 border border-orange-500/20">
                    {a.codigo_interno ? `${a.codigo_interno} · ` : ''}{a.tipo}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Ultimos usos ({totalH.toFixed(1)}h · {totalL.toFixed(1)}L)
            </p>
            {misUsos.length === 0 ? (
              <p className="text-[10px] text-slate-600">Sin usos registrados</p>
            ) : (
              <div className="space-y-1.5">
                {misUsos.slice(0, 5).map(u => (
                  <div key={u.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-700 dark:text-white">
                        {u.tipo_trabajo ?? 'Uso'}
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mantenimientos</p>
              <button
                onClick={e => { e.stopPropagation(); setModalMant(true); }}
                className="flex items-center gap-1 text-[9px] font-black text-orange-400 hover:text-orange-300 uppercase tracking-widest"
              >
                <Plus className="w-3 h-3" />Añadir
              </button>
            </div>
            {misMant.length === 0 ? (
              <p className="text-[10px] text-slate-600">Sin mantenimientos</p>
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

          <hr className="border-white/5" />
          <RecordActions
            onEdit={onEdit}
            onDelete={onDelete}
            confirmMessage={`¿Eliminar el tractor ${tractor.matricula}? Esta acción no se puede deshacer.`}
          />
        </div>
      )}

      {modalMant && (
        <ModalMantenimiento
          tractorId={tractor.id}
          horasActuales={tractor.horas_motor}
          tractores={[tractor]}
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

  const [tab, setTab]                   = useState<TabType>('tractores');
  const [modalTractor, setModalTractor] = useState(false);
  const [editTractor, setEditTractor]   = useState<TractorType | undefined>();
  const [modalApero, setModalApero]     = useState(false);
  const [modalUso, setModalUso]         = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [pdfMenuOpen, setPdfMenuOpen]   = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);

  const { data: kpis }                       = useKPIsMaquinaria();
  const { data: tractores = [] }             = useTractores();
  const { data: tractoresInv = [] }          = useTractoresEnInventario();
  const { data: aperos = [] }                = useAperos();
  const { data: aperosInv = [] }             = useAperosEnInventario();
  const { data: usos = [] }                  = useUsosMaquinaria();
  const { data: mants = [] }                 = useMantenimientoTractor();
  const { data: personalTractoristas = [] }  = usePersonal('conductor_maquinaria');

  // ── GPS State ──
  const [gpsTractorId, setGpsTractorId] = useState<string>('');
  const [gpsFecha, setGpsFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const { data: gpsRecorrido = [], isLoading: isLoadingGps } = useRecorridoDia(gpsTractorId, gpsFecha);
  const mutAddPosicion = useAddPosicion();
  const gpsMapRef = useRef<L.Map | null>(null);
  const gpsMapContainerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const stopsLayerRef = useRef<L.LayerGroup | null>(null);

  const deleteTractorMut = useDeleteTractor();
  const deleteAperoMut   = useDeleteApero();

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

  // ── Generadores PDF (intactos) ──────────────────────────────

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
            ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin tractores registrados.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
          }
          pdfCorporateTable(ctx,
            ['COD.', 'MATRICULA', 'MARCA', 'MODELO', 'HORAS', 'ESTADO'],
            [18, 26, 28, 32, 20, 58],
            tractores.map(t => [
              t.codigo_interno ?? '—', t.matricula,
              t.marca ?? '—', t.modelo ?? '—',
              t.horas_motor != null ? String(t.horas_motor) : '—',
              estadoTractorTexto(t),
            ]),
          );
        },
        ctx => {
          pdfCorporateSection(ctx, 'Aperos');
          if (aperos.length === 0) {
            ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin aperos registrados.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
          }
          pdfCorporateTable(ctx,
            ['COD.', 'TIPO', 'DESCRIPCION', 'TRACTOR', 'ESTADO'],
            [16, 34, 64, 36, 32],
            aperos.map(a => [
              a.codigo_interno ?? '—', a.tipo,
              a.descripcion ?? '—', matriculaTractor(tractores, a.tractor_id),
              a.estado ?? (a.activo ? 'Disponible' : 'Baja'),
            ]),
          );
        },
        ctx => {
          pdfCorporateSection(ctx, 'Uso de maquinaria');
          if (usos.length === 0) {
            ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin registros de uso.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
          }
          const ordenados = [...usos].sort((a, b) => a.fecha.localeCompare(b.fecha));
          pdfCorporateTable(ctx,
            ['FECHA', 'TRACTOR', 'APERO', 'OPERARIO', 'FINCA', 'HORAS'],
            [26, 28, 36, 44, 30, 18],
            ordenados.map(u => [
              fmtFechaCorta(u.fecha), matriculaTractor(tractores, u.tractor_id),
              tipoApero(aperos, u.apero_id), nombreOperarioUso(u, personalTractoristas),
              u.finca ?? '—', u.horas_trabajadas != null ? String(u.horas_trabajadas) : '—',
            ]),
          );
        },
        ctx => {
          pdfCorporateSection(ctx, 'Mantenimientos');
          if (mants.length === 0) {
            ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
            ctx.doc.text('Sin mantenimientos registrados.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
          }
          pdfCorporateTable(ctx,
            ['FECHA', 'TRACTOR', 'TIPO', 'COSTE EUR', 'PROVEEDOR'],
            [28, 28, 32, 22, 72],
            mants.map(m => [
              fmtFechaCorta(m.fecha), matriculaTractor(tractores, m.tractor_id),
              m.tipo, m.coste_euros != null ? m.coste_euros.toFixed(2) : '—', m.proveedor ?? '—',
            ]),
          );
        },
      ],
    });
  }

  async function generarEstadoTractores() {
    const ref = new Date();
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA — TRACTORES', subtitulo: 'Estado de tractores',
      fecha: ref, filename: `Maquinaria_Tractores_${ref.toISOString().slice(0, 10)}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [ctx => {
        pdfCorporateSection(ctx, 'Estado de tractores');
        if (tractores.length === 0) {
          ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
          ctx.doc.text('Sin tractores registrados.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
        }
        pdfCorporateTable(ctx,
          ['COD.', 'MATRICULA', 'MARCA', 'MODELO', 'HORAS', 'ESTADO'],
          [18, 26, 28, 32, 20, 58],
          tractores.map(t => [
            t.codigo_interno ?? '—', t.matricula, t.marca ?? '—', t.modelo ?? '—',
            t.horas_motor != null ? String(t.horas_motor) : '—', estadoTractorTexto(t),
          ]),
        );
      }],
    });
  }

  async function generarAperosPDF() {
    const ref = new Date();
    const activos = aperos.filter(a => a.activo);
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA — APEROS', subtitulo: 'Aperos activos',
      fecha: ref, filename: `Maquinaria_Aperos_${ref.toISOString().slice(0, 10)}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [ctx => {
        pdfCorporateSection(ctx, 'Aperos activos');
        if (activos.length === 0) {
          ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
          ctx.doc.text('Sin aperos activos.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
        }
        pdfCorporateTable(ctx,
          ['COD.', 'TIPO', 'DESCRIPCION', 'TRACTOR', 'ESTADO'],
          [16, 34, 64, 36, 32],
          activos.map(a => [
            a.codigo_interno ?? '—', a.tipo, a.descripcion ?? '—',
            matriculaTractor(tractores, a.tractor_id), a.estado ?? 'Disponible',
          ]),
        );
      }],
    });
  }

  async function generarUsoMaquinaria() {
    const ref = new Date();
    const ordenados = [...usos].sort((a, b) => a.fecha.localeCompare(b.fecha));
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA — USO', subtitulo: 'Registros de uso',
      fecha: ref, filename: `Maquinaria_Uso_${ref.toISOString().slice(0, 10)}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [ctx => {
        pdfCorporateSection(ctx, 'Uso de maquinaria');
        if (ordenados.length === 0) {
          ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
          ctx.doc.text('Sin registros de uso.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
        }
        pdfCorporateTable(ctx,
          ['FECHA', 'TRACTOR', 'APERO', 'OPERARIO', 'FINCA', 'HORAS'],
          [26, 28, 36, 44, 30, 18],
          ordenados.map(u => [
            fmtFechaCorta(u.fecha), matriculaTractor(tractores, u.tractor_id),
            tipoApero(aperos, u.apero_id), nombreOperarioUso(u, personalTractoristas),
            u.finca ?? '—', u.horas_trabajadas != null ? String(u.horas_trabajadas) : '—',
          ]),
        );
      }],
    });
  }

  async function generarMantenimientosMaquinaria() {
    const ref = new Date();
    await generarPDFCorporativoBase({
      titulo: 'MAQUINARIA — MANTENIMIENTO', subtitulo: 'Intervenciones en tractores',
      fecha: ref, filename: `Maquinaria_Mantenimientos_${ref.toISOString().slice(0, 10)}.pdf`,
      accentColor: PDF_COLORS.orange,
      bloques: [ctx => {
        pdfCorporateSection(ctx, 'Mantenimientos');
        if (mants.length === 0) {
          ctx.checkPage(8); ctx.doc.setFontSize(9); ctx.doc.setTextColor(100, 116, 139);
          ctx.doc.text('Sin mantenimientos registrados.', PDF_MARGIN, ctx.y); ctx.y += 6; return;
        }
        pdfCorporateTable(ctx,
          ['FECHA', 'TRACTOR', 'TIPO', 'COSTE EUR', 'PROVEEDOR'],
          [28, 28, 32, 22, 72],
          mants.map(m => [
            fmtFechaCorta(m.fecha), matriculaTractor(tractores, m.tractor_id),
            m.tipo, m.coste_euros != null ? m.coste_euros.toFixed(2) : '—', m.proveedor ?? '—',
          ]),
        );
      }],
    });
  }

  async function onElegirPdf(op: 1 | 2 | 3 | 4 | 5) {
    setPdfMenuOpen(false);
    setGenerandoPdf(true);
    try {
      if (op === 1) await generarMaquinariaCompleta();
      else if (op === 2) await generarEstadoTractores();
      else if (op === 3) await generarAperosPDF();
      else if (op === 4) await generarUsoMaquinaria();
      else await generarMantenimientosMaquinaria();
    } finally {
      setGenerandoPdf(false);
    }
  }

  // ── Lógica Mapa GPS ───────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'gps' || !gpsMapContainerRef.current) return;
    
    if (!gpsMapRef.current) {
      gpsMapRef.current = L.map(gpsMapContainerRef.current).setView([38.2, -0.9], 12);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(gpsMapRef.current);
      stopsLayerRef.current = L.layerGroup().addTo(gpsMapRef.current);
    }
    
    const map = gpsMapRef.current;
    
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    if (stopsLayerRef.current) stopsLayerRef.current.clearLayers();

    if (gpsRecorrido.length > 0) {
      const latlngs = gpsRecorrido.map(p => [p.latitud, p.longitud] as [number, number]);
      polylineRef.current = L.polyline(latlngs, { color: '#fb923c', weight: 4 }).addTo(map);
      
      // Calcular paradas (>5 min quietos)
      let currentStop: any = null;
      for (let i = 1; i < gpsRecorrido.length; i++) {
        const prev = gpsRecorrido[i-1];
        const curr = gpsRecorrido[i];
        const isStopped = (curr.velocidad_kmh || 0) < 1;
        
        if (isStopped) {
          if (!currentStop) {
            currentStop = { start: prev.timestamp, lat: curr.latitud, lng: curr.longitud, duration: 0 };
          }
          currentStop.duration += new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
        } else {
          if (currentStop && currentStop.duration > 5 * 60 * 1000) { // 5 min
            L.circleMarker([currentStop.lat, currentStop.lng], {
              radius: 6, fillColor: '#ef4444', color: '#fff', weight: 2, fillOpacity: 1
            })
            .bindTooltip(`Parada: ${Math.round(currentStop.duration / 60000)} min<br/>Hora: ${new Date(currentStop.start).toLocaleTimeString()}`)
            .addTo(stopsLayerRef.current!);
          }
          currentStop = null;
        }
      }
      
      // Añadir marcador de inicio y fin
      const start = gpsRecorrido[0];
      const end = gpsRecorrido[gpsRecorrido.length - 1];
      
      const htmlStart = `<div style="background:#22c55e;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>`;
      const htmlEnd = `<div style="background:#fb923c;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>`;
      
      L.marker([start.latitud, start.longitud], { icon: L.divIcon({ html: htmlStart, className: '' }) })
        .bindTooltip('Inicio ' + new Date(start.timestamp).toLocaleTimeString()).addTo(stopsLayerRef.current!);
        
      L.marker([end.latitud, end.longitud], { icon: L.divIcon({ html: htmlEnd, className: '' }) })
        .bindTooltip('Fin ' + new Date(end.timestamp).toLocaleTimeString()).addTo(stopsLayerRef.current!);

      map.fitBounds(polylineRef.current.getBounds(), { padding: [30, 30] });
    }
  }, [tab, gpsRecorrido]);

  // ── Render ──────────────────────────────────────────────────

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
              {generandoPdf && (
                <span className="w-3 h-3 border-2 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin" />
              )}
              PDF {pdfMenuOpen ? '▲' : '▼'}
            </button>
            {pdfMenuOpen && (
              <div className={`absolute right-0 top-full z-[70] mt-1 min-w-[240px] rounded-lg border shadow-lg py-1 ${
                isDark ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-black/40' : 'border-slate-200 bg-white text-slate-800 shadow-slate-400/20'
              }`}>
                {([
                  { k: 1, label: 'Informe completo maquinaria' },
                  { k: 2, label: 'Estado de tractores' },
                  { k: 3, label: 'Aperos activos' },
                  { k: 4, label: 'Uso de maquinaria' },
                  { k: 5, label: 'Mantenimientos' },
                ] as const).map(({ k, label }) => (
                  <button
                    key={k} type="button" disabled={generandoPdf}
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
            { label: 'Tractores',  value: kpis?.tractoresActivos ?? 0, color: '#fb923c' },
            { label: 'Aperos',     value: kpis?.aperosActivos ?? 0,    color: '#fb923c' },
            { label: 'H. totales', value: kpis?.totalHoras ?? '0',     color: '#34d399' },
            { label: 'Gasoil (L)', value: kpis?.totalGasolina ?? '0',  color: '#60a5fa' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl p-1">
          {([
            { id: 'tractores' as TabType, label: 'Tractores',    icon: Tractor  },
            { id: 'aperos'    as TabType, label: 'Aperos',       icon: Wrench   },
            { id: 'uso'       as TabType, label: 'Registros uso', icon: Activity },
            { id: 'gps'       as TabType, label: 'GPS / Recorridos', icon: Navigation },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                tab === t.id
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <t.icon className="w-3.5 h-3.5 inline mr-1.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB TRACTORES */}
        {tab === 'tractores' && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {tractores.length} tractor{tractores.length !== 1 ? 'es' : ''}
              </p>
              <button onClick={() => { setEditTractor(undefined); setModalTractor(true); }}
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
                tractores.map(t => (
                  <TarjetaTractor
                    key={t.id}
                    tractor={t}
                    aperos={aperos}
                    usos={usos}
                    mantenimientos={mants}
                    onEdit={() => { setEditTractor(t); setModalTractor(true); }}
                    onDelete={() => deleteTractorMut.mutate(t.id)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* TAB APEROS */}
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
                  const estadoA = a.estado ?? (a.activo ? 'disponible' : 'baja');
                  return (
                    <div key={a.id} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="w-4 h-4 text-orange-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          {a.codigo_interno && (
                            <span className="text-[8px] font-black text-slate-500 mr-1">{a.codigo_interno}</span>
                          )}
                          <p className="text-[11px] font-black text-slate-900 dark:text-white inline">{a.tipo}</p>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${ESTADO_OP_BADGE[estadoA] ?? 'border-slate-500 text-slate-400'}`}>
                          {ESTADO_OP_LABEL[estadoA] ?? estadoA}
                        </span>
                      </div>
                      {a.descripcion && <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-1">{a.descripcion}</p>}
                      {tractor && (
                        <p className="text-[9px] text-orange-300 flex items-center gap-1 mb-2">
                          <Tractor className="w-3 h-3" />
                          {tractor.codigo_interno ? `${tractor.codigo_interno} · ` : ''}{tractor.matricula}
                        </p>
                      )}
                      <RecordActions
                        onEdit={() => {}}
                        onDelete={() => deleteAperoMut.mutate(a.id)}
                        confirmMessage={`¿Eliminar el apero ${a.tipo}?`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB REGISTROS USO */}
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
                  const operario = personalTractoristas.find(p => p.id === u.personal_id);
                  return (
                    <div key={u.id} className="p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-white">
                          {u.tipo_trabajo ?? 'Uso'}
                        </p>
                        <span className="text-[8px] text-slate-400 shrink-0">
                          {new Date(u.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {tractor && (
                          <span className="text-[9px] text-orange-300 flex items-center gap-0.5">
                            <Tractor className="w-2.5 h-2.5" />
                            {tractor.codigo_interno ? `${tractor.codigo_interno} · ` : ''}{tractor.matricula}
                          </span>
                        )}
                        {apero && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Wrench className="w-2.5 h-2.5" />{apero.tipo}
                          </span>
                        )}
                        {operario && (
                          <span className="text-[9px] text-slate-400">{operario.nombre}</span>
                        )}
                        {u.finca && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />{u.finca}
                          </span>
                        )}
                        {u.horas_trabajadas && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{u.horas_trabajadas}h
                          </span>
                        )}
                        {u.gasolina_litros && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Fuel className="w-2.5 h-2.5" />{u.gasolina_litros}L
                          </span>
                        )}
                      </div>
                      {u.notas && <p className="text-[9px] text-slate-500 italic mt-1">{u.notas}</p>}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB GPS / RECORRIDOS */}
        {tab === 'gps' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#fb923c]" />
              <div className="flex-1">
                <FieldLabel>Tractor a monitorear</FieldLabel>
                <BaseSelect value={gpsTractorId} onChange={e => setGpsTractorId(e.target.value)}>
                  <option value="">— Seleccionar tractor —</option>
                  {tractores.map(t => <option key={t.id} value={t.id}>{t.matricula} {t.marca ? `(${t.marca})` : ''}</option>)}
                </BaseSelect>
              </div>
              <div className="w-full sm:w-48">
                <FieldLabel>Fecha</FieldLabel>
                <BaseInput type="date" value={gpsFecha} onChange={e => setGpsFecha(e.target.value)} />
              </div>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-3">
              <Activity className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-400">Infraestructura Telemetría GPS</p>
                <p className="text-[10px] text-orange-300/80 mt-1">
                  Hardware Teltonika FMC920 pendiente de instalación física. 
                  Los recorridos mostrados pueden alimentarse manualmente o vía Edge Function API desde el proveedor.
                </p>
              </div>
              {gpsTractorId && gpsFecha === new Date().toISOString().slice(0, 10) && (
                <button
                  onClick={() => mutAddPosicion.mutate({
                    vehicle_id: gpsTractorId,
                    vehicle_tipo: 'tractor',
                    latitud: 38.2 + (Math.random() * 0.05),
                    longitud: -0.9 + (Math.random() * 0.05),
                    velocidad_kmh: Math.floor(Math.random() * 25)
                  })}
                  className="ml-auto shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  Simular Ping
                </button>
              )}
            </div>

            {isLoadingGps ? (
              <div className="h-[500px] bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center">
                <span className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !gpsTractorId ? (
              <div className="h-[500px] bg-slate-900/50 rounded-xl border border-white/5 flex flex-col items-center justify-center text-slate-500">
                <Navigation className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-bold">Selecciona un tractor para ver su recorrido</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[500px]">
                <div className="lg:col-span-3 rounded-xl overflow-hidden border border-white/10 z-0 bg-slate-900">
                  <div ref={gpsMapContainerRef} className="w-full h-full" />
                </div>
                <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex flex-col">
                  <h3 className="text-[11px] font-black text-[#fb923c] uppercase tracking-widest mb-4">Resumen del Día</h3>
                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Puntos Registrados</p>
                      <p className="text-lg font-black text-white">{gpsRecorrido.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Primera Lectura</p>
                      <p className="text-sm font-bold text-slate-300">{gpsRecorrido.length > 0 ? new Date(gpsRecorrido[0].timestamp).toLocaleTimeString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Última Lectura</p>
                      <p className="text-sm font-bold text-slate-300">{gpsRecorrido.length > 0 ? new Date(gpsRecorrido[gpsRecorrido.length - 1].timestamp).toLocaleTimeString() : '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {modalTractor && (
        <ModalTractor
          tractor={editTractor}
          onClose={() => { setModalTractor(false); setEditTractor(undefined); }}
        />
      )}
      {modalApero && (
        <ModalApero tractores={tractores} onClose={() => setModalApero(false)} />
      )}
      {modalUso && (
        <ModalUso
          tractores={tractoresInv.length > 0 ? tractoresInv : tractores}
          aperos={aperosInv.length > 0 ? aperosInv : aperos}
          personal={personalTractoristas}
          onClose={() => setModalUso(false)}
        />
      )}
    </div>
  );
}
