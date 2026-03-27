import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ArrowLeft, Plus, Phone, CreditCard, QrCode,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  FileText, Building2, UserCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import {
  usePersonal, useAddPersonal, useUpdatePersonal,
  usePersonalExterno, useAddPersonalExterno, useUpdatePersonalExterno,
  useKPIsPersonal,
  Personal, PersonalExterno,
  CATEGORIA_LABELS, CATEGORIA_COLORS,
  TIPO_EXTERNO_LABELS,
  CategoriaPersonal, TipoExterno,
} from '../hooks/usePersonal';
import { uploadImage } from '../utils/uploadImage';

// ── Tipos de tab ──────────────────────────────────────────────────────────────

type TabType = 'operario_campo' | 'encargado' | 'conductor_maquinaria' | 'conductor_camion' | 'externo';

const TABS: { id: TabType; label: string; color: string }[] = [
  { id: 'operario_campo',       label: 'Operarios campo',  color: '#22c55e' },
  { id: 'encargado',            label: 'Encargados',        color: '#38bdf8' },
  { id: 'conductor_maquinaria', label: 'Maquinaria',        color: '#fb923c' },
  { id: 'conductor_camion',     label: 'Camión',            color: '#a78bfa' },
  { id: 'externo',              label: 'M.O. Externa',      color: '#f472b6' },
];

// ── Modal Personal Fijo ───────────────────────────────────────────────────────

function ModalPersonal({
  onClose,
  initial,
  categoria,
}: {
  onClose: () => void;
  initial?: Personal;
  categoria: CategoriaPersonal;
}) {
  const addMut    = useAddPersonal();
  const updateMut = useUpdatePersonal();

  const [nombre,   setNombre]   = useState(initial?.nombre   ?? '');
  const [dni,      setDni]      = useState(initial?.dni      ?? '');
  const [telefono, setTelefono] = useState(initial?.telefono ?? '');
  const [activo,   setActivo]   = useState(initial?.activo   ?? true);
  const [notas,    setNotas]    = useState(initial?.notas    ?? '');
  const [fotoUrl,  setFotoUrl]  = useState(initial?.foto_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `personal/${Date.now()}.${ext}`;
    const url  = await uploadImage(file, 'parcel-images', path);
    if (!url) { setError('Error subiendo foto'); setUploading(false); return; }
    setFotoUrl(url);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (initial) {
        await updateMut.mutateAsync({
          id: initial.id, nombre, dni: dni || null,
          telefono: telefono || null, activo,
          notas: notas || null, foto_url: fotoUrl || null,
        });
      } else {
        await addMut.mutateAsync({
          nombre, dni: dni || null, telefono: telefono || null,
          categoria, activo, notas: notas || null,
          foto_url: fotoUrl || null,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const accentColor = CATEGORIA_COLORS[categoria];
  const label       = CATEGORIA_LABELS[categoria];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <h2 className="text-white font-bold text-sm">
              {initial ? 'Editar' : 'Nuevo'} — {label}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div>
            <label className="text-slate-400 text-xs block mb-1">Nombre completo *</label>
            <input
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              value={nombre} onChange={e => setNombre(e.target.value)} required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1">DNI / NIE</label>
              <input
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                value={dni} onChange={e => setDni(e.target.value)}
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Teléfono</label>
              <input
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                value={telefono} onChange={e => setTelefono(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Notas</label>
            <textarea
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none"
              rows={2} value={notas} onChange={e => setNotas(e.target.value)}
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Foto</label>
            {fotoUrl && (
              <img src={fotoUrl} alt="foto" className="w-16 h-16 object-cover rounded-lg mb-2" />
            )}
            <input type="file" accept="image/*" onChange={handleFoto}
              className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-700 file:text-white"
            />
            {uploading && <p className="text-slate-400 text-xs mt-1">Subiendo…</p>}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="activo-pers" checked={activo}
              onChange={e => setActivo(e.target.checked)}
              className="accent-green-500"
            />
            <label htmlFor="activo-pers" className="text-slate-300 text-sm">Activo</label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-sm hover:bg-slate-800">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50"
              style={{ backgroundColor: accentColor }}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Personal Externo ────────────────────────────────────────────────────

function ModalExterno({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial?: PersonalExterno;
}) {
  const addMut    = useAddPersonalExterno();
  const updateMut = useUpdatePersonalExterno();

  const [empresa,  setEmpresa]  = useState(initial?.nombre_empresa    ?? '');
  const [nif,      setNif]      = useState(initial?.nif               ?? '');
  const [telefono, setTelefono] = useState(initial?.telefono_contacto ?? '');
  const [tipo,     setTipo]     = useState<TipoExterno>(initial?.tipo ?? 'jornal_servicio');
  const [activo,   setActivo]   = useState(initial?.activo            ?? true);
  const [notas,    setNotas]    = useState(initial?.notas             ?? '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa.trim()) { setError('El nombre de empresa es obligatorio'); return; }
    setSaving(true);
    try {
      if (initial) {
        await updateMut.mutateAsync({
          id: initial.id, nombre_empresa: empresa,
          nif: nif || null, telefono_contacto: telefono || null,
          tipo, activo, notas: notas || null,
        });
      } else {
        await addMut.mutateAsync({
          nombre_empresa: empresa, nif: nif || null,
          telefono_contacto: telefono || null,
          tipo, activo, notas: notas || null,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f472b6]" />
            <h2 className="text-white font-bold text-sm">
              {initial ? 'Editar' : 'Nueva'} empresa externa
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div>
            <label className="text-slate-400 text-xs block mb-1">Nombre empresa / autónomo *</label>
            <input
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              value={empresa} onChange={e => setEmpresa(e.target.value)} required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1">NIF / CIF</label>
              <input
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                value={nif} onChange={e => setNif(e.target.value)}
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Teléfono contacto</label>
              <input
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                value={telefono} onChange={e => setTelefono(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Tipo de contratación</label>
            <select
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              value={tipo} onChange={e => setTipo(e.target.value as TipoExterno)}
            >
              <option value="destajo">A destajo</option>
              <option value="jornal_servicio">A jornal / servicio</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Notas</label>
            <textarea
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none"
              rows={2} value={notas} onChange={e => setNotas(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="activo-ext" checked={activo}
              onChange={e => setActivo(e.target.checked)}
              className="accent-pink-500"
            />
            <label htmlFor="activo-ext" className="text-slate-300 text-sm">Activo</label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-sm hover:bg-slate-800">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-[#f472b6] text-white text-sm font-bold disabled:opacity-50">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tarjeta Personal Fijo ─────────────────────────────────────────────────────

function TarjetaPersonal({
  p,
  onEdit,
}: {
  p: Personal;
  onEdit: (p: Personal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = CATEGORIA_COLORS[p.categoria];

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded(x => !x)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {p.foto_url
            ? <img src={p.foto_url} alt={p.nombre} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + '22' }}>
                <Users className="w-4 h-4" style={{ color }} />
              </div>
            )
          }
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{p.nombre}</p>
            {p.telefono && (
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" />{p.telefono}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {p.activo
            ? <CheckCircle2 className="w-4 h-4 text-green-400" />
            : <XCircle      className="w-4 h-4 text-red-400" />
          }
          {expanded
            ? <ChevronUp   className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-2">
          {p.dni && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>{p.dni}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <QrCode className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono truncate">{p.qr_code.slice(0, 20)}…</span>
          </div>
          {p.notas && (
            <p className="text-xs text-slate-400 italic">{p.notas}</p>
          )}
          <button
            onClick={() => onEdit(p)}
            className="mt-1 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-slate-800"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta Empresa Externa ───────────────────────────────────────────────────

function TarjetaExterno({
  p,
  onEdit,
}: {
  p: PersonalExterno;
  onEdit: (p: PersonalExterno) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded(x => !x)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f472b6]/10">
            <Building2 className="w-4 h-4 text-[#f472b6]" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{p.nombre_empresa}</p>
            <p className="text-slate-400 text-xs">{TIPO_EXTERNO_LABELS[p.tipo]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {p.activo
            ? <CheckCircle2 className="w-4 h-4 text-green-400" />
            : <XCircle      className="w-4 h-4 text-red-400" />
          }
          {expanded
            ? <ChevronUp   className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-2">
          {p.nif && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>{p.nif}</span>
            </div>
          )}
          {p.telefono_contacto && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{p.telefono_contacto}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <QrCode className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono truncate">{p.qr_code.slice(0, 20)}…</span>
          </div>
          {p.notas && (
            <p className="text-xs text-slate-400 italic">{p.notas}</p>
          )}
          <button
            onClick={() => onEdit(p)}
            className="mt-1 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-slate-800"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Personal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabType>('operario_campo');

  const { data: todoPersonal = [] } = usePersonal();
  const { data: externos = [] }     = usePersonalExterno();
  const { data: kpis }              = useKPIsPersonal();

  const [modalCat,  setModalCat]  = useState<CategoriaPersonal | null>(null);
  const [editFijo,  setEditFijo]  = useState<Personal | null>(null);
  const [editExt,   setEditExt]   = useState<PersonalExterno | null>(null);
  const [newExterno, setNewExterno] = useState(false);

  // Filtro según tab activo
  const listaFija = tab !== 'externo'
    ? todoPersonal.filter(p => p.categoria === tab)
    : [];
  const listaExt  = tab === 'externo' ? externos : [];

  const activeTab = TABS.find(t => t.id === tab)!;

  function generarPDF() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    let y = 20;

    const writeLine = (text: string, size = 9, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(text, 15, y);
      y += size * 0.5 + 2;
    };
    const separator = () => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setDrawColor(200, 200, 200);
      doc.line(15, y, W - 15, y);
      y += 4;
    };

    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, W, 14, 'F');
    doc.setTextColor(255, 255, 255);
    writeLine('AGRÍCOLA MARVIC — LISTADO DE PERSONAL', 11, true);
    doc.setTextColor(0, 0, 0);
    writeLine(new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), 9);
    y += 4;

    const CATS: CategoriaPersonal[] = ['operario_campo', 'encargado', 'conductor_maquinaria', 'conductor_camion'];
    for (const cat of CATS) {
      const lista = todoPersonal.filter(p => p.categoria === cat);
      if (lista.length === 0) continue;
      separator();
      writeLine(CATEGORIA_LABELS[cat].toUpperCase(), 10, true);
      y += 1;
      for (const p of lista) {
        writeLine(
          `${p.activo ? '●' : '○'}  ${p.nombre}${p.dni ? `  ·  DNI: ${p.dni}` : ''}${p.telefono ? `  ·  Tel: ${p.telefono}` : ''}`,
          8,
        );
      }
      y += 2;
    }

    if (externos.length > 0) {
      separator();
      writeLine('MANO DE OBRA EXTERNA', 10, true);
      y += 1;
      for (const e of externos) {
        writeLine(
          `${e.activo ? '●' : '○'}  ${e.nombre_empresa}  ·  ${TIPO_EXTERNO_LABELS[e.tipo]}${e.nif ? `  ·  NIF: ${e.nif}` : ''}${e.telefono_contacto ? `  ·  Tel: ${e.telefono_contacto}` : ''}`,
          8,
        );
      }
    }

    doc.save(`Personal_MARVIC_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e879f9]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#e879f9]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">PERSONAL</p>
              <p className="text-slate-500 text-[10px]">Gestión de personal de la explotación</p>
            </div>
          </div>
        </div>
        <button onClick={generarPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs">
          <FileText className="w-3.5 h-3.5" />
          PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3">
        {[
          { label: 'Total',     value: kpis?.total   ?? '…', color: '#e879f9' },
          { label: 'Fijos',     value: kpis?.activos ?? '…', color: '#22c55e' },
          { label: 'Externos',  value: kpis?.externos ?? '…', color: '#f472b6' },
          { label: 'Conductores', value: (
            (kpis?.porCategoria?.['conductor_maquinaria'] ?? 0) +
            (kpis?.porCategoria?.['conductor_camion']     ?? 0)
          ), color: '#a78bfa' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-900/60 border border-white/10 rounded-lg px-2 py-2 text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{label}</p>
            <p className="text-lg font-black mt-0.5" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
            style={tab === t.id
              ? { backgroundColor: t.color + '22', color: t.color, border: `1px solid ${t.color}55` }
              : { backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid transparent' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Botón nuevo + lista */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" style={{ color: activeTab.color }} />
            <span className="text-white text-sm font-semibold">{activeTab.label}</span>
            <span className="text-slate-500 text-xs">
              ({tab === 'externo' ? listaExt.length : listaFija.length})
            </span>
          </div>
          <button
            onClick={() => {
              if (tab === 'externo') setNewExterno(true);
              else setModalCat(tab as CategoriaPersonal);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
            style={{ backgroundColor: activeTab.color }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo
          </button>
        </div>

        {tab !== 'externo' && (
          listaFija.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">Sin registros en esta categoría</p>
            : <div className="space-y-2">
                {listaFija.map(p => (
                  <TarjetaPersonal key={p.id} p={p} onEdit={setEditFijo} />
                ))}
              </div>
        )}

        {tab === 'externo' && (
          listaExt.length === 0
            ? <p className="text-slate-500 text-sm text-center py-8">Sin empresas externas registradas</p>
            : <div className="space-y-2">
                {listaExt.map(p => (
                  <TarjetaExterno key={p.id} p={p} onEdit={setEditExt} />
                ))}
              </div>
        )}
      </div>

      {/* Modales */}
      {modalCat && (
        <ModalPersonal
          categoria={modalCat}
          onClose={() => setModalCat(null)}
        />
      )}
      {editFijo && (
        <ModalPersonal
          categoria={editFijo.categoria}
          initial={editFijo}
          onClose={() => setEditFijo(null)}
        />
      )}
      {(newExterno || editExt) && (
        <ModalExterno
          initial={editExt ?? undefined}
          onClose={() => { setNewExterno(false); setEditExt(null); }}
        />
      )}
    </div>
  );
}
