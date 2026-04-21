import React, { useState } from 'react';
import {
  useAddPersonal,
  useUpdatePersonal,
  Personal,
  CategoriaPersonal,
  CATEGORIA_LABELS,
  CATEGORIA_COLORS,
} from '../../hooks/usePersonal';
import { SelectWithOther, AudioInput, PhotoAttachment } from '@/components/base';
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal';
import { toast } from '@/hooks/use-toast';
import { uploadImage } from '../../utils/uploadImage';
import { FINCAS_NOMBRES } from '../../constants/farms';
import { LICENCIAS_OPCIONES, CARNET_OPCIONES } from './personalConstants';

export function ModalPersonal({
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

  const [nombre,          setNombre]          = useState(initial?.nombre           ?? '');
  const [dni,             setDni]             = useState(initial?.dni              ?? '');
  const [telefono,        setTelefono]        = useState(initial?.telefono         ?? '');
  const [fechaAlta,       setFechaAlta]       = useState(initial?.fecha_alta       ?? new Date().toISOString().slice(0, 10));
  const [activo,          setActivo]          = useState(initial?.activo           ?? true);
  const [notas,           setNotas]           = useState(initial?.notas            ?? '');
  const [fotoUrl,         setFotoUrl]         = useState<string | null>(initial?.foto_url ?? null);
  const [fotoFile,        setFotoFile]        = useState<File | null>(null);
  const [fincaAsignada,   setFincaAsignada]   = useState(initial?.finca_asignada   ?? '');
  const [licencias,       setLicencias]       = useState(initial?.licencias        ?? '');
  const [carnetTipo,      setCarnetTipo]      = useState(initial?.carnet_tipo      ?? '');
  const [carnetCaducidad, setCarnetCaducidad] = useState(initial?.carnet_caducidad ?? '');
  const [tacografo,       setTacografo]       = useState(initial?.tacografo        ?? false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const catLicencias = useCatalogoLocal('personal_licencias', LICENCIAS_OPCIONES);
  const catCarnets   = useCatalogoLocal('personal_carnets',   CARNET_OPCIONES);

  const color = CATEGORIA_COLORS[categoria];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      let foto_url = fotoUrl;
      if (fotoFile) {
        const ext  = fotoFile.name.split('.').pop() ?? 'jpg';
        const path = `personal/${Date.now()}.${ext}`;
        foto_url   = await uploadImage(fotoFile, 'parcel-images', path);
      }
      const payload = {
        nombre:           nombre.trim(),
        dni:              dni || null,
        telefono:         telefono || null,
        fecha_alta:       fechaAlta || null,
        activo,
        notas:            notas || null,
        foto_url,
        finca_asignada:   fincaAsignada || null,
        licencias:        licencias || null,
        carnet_tipo:      carnetTipo || null,
        carnet_caducidad: carnetCaducidad || null,
        tacografo:        tacografo,
      };
      if (initial) {
        await updateMut.mutateAsync({ id: initial.id, ...payload });
      } else {
        await addMut.mutateAsync({ ...payload, categoria });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl my-4">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">
              {initial ? 'Editar' : 'Nuevo'} — {CATEGORIA_LABELS[categoria]}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">x</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <p className="text-red-400 text-xs">{error}</p>}

          {initial?.codigo_interno && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Codigo interno</p>
              <p className="text-white font-mono text-sm">{initial.codigo_interno}</p>
            </div>
          )}

          <hr className="border-white/5" />

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
              <label className="text-slate-400 text-xs block mb-1">Telefono</label>
              <input
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                value={telefono} onChange={e => setTelefono(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Fecha de alta</label>
            <input
              type="date"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              value={fechaAlta} onChange={e => setFechaAlta(e.target.value)}
            />
          </div>

          <PhotoAttachment
            label="Foto"
            value={fotoFile ? URL.createObjectURL(fotoFile) : fotoUrl}
            onChange={f => { setFotoFile(f); if (!f) setFotoUrl(null); }}
          />

          <AudioInput
            label="Notas"
            value={notas}
            onChange={setNotas}
            rows={2}
            placeholder="Observaciones..."
          />

          {categoria === 'encargado' && (
            <>
              <hr className="border-white/5" />
              <SelectWithOther
                label="Finca asignada"
                options={FINCAS_NOMBRES}
                value={fincaAsignada}
                onChange={setFincaAsignada}
                onCreateNew={() => toast({ title: 'Fincas fijas', description: 'Las fincas se gestionan desde el GeoJSON principal.' })}
                placeholder="Seleccionar finca..."
              />
            </>
          )}

          {categoria === 'conductor_maquinaria' && (
            <>
              <hr className="border-white/5" />
              <SelectWithOther
                label="Licencias"
                options={catLicencias.opciones}
                value={licencias}
                onChange={setLicencias}
                onCreateNew={v => { catLicencias.addOpcion(v); setLicencias(v); }}
                placeholder="Tipo de licencia..."
              />
            </>
          )}

          {categoria === 'conductor_camion' && (
            <>
              <hr className="border-white/5" />
              <SelectWithOther
                label="Tipo de carnet"
                options={catCarnets.opciones}
                value={carnetTipo}
                onChange={setCarnetTipo}
                onCreateNew={v => { catCarnets.addOpcion(v); setCarnetTipo(v); }}
                placeholder="Seleccionar carnet..."
              />
              <div>
                <label className="text-slate-400 text-xs block mb-1">Caducidad carnet</label>
                <input
                  type="date"
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  value={carnetCaducidad} onChange={e => setCarnetCaducidad(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="tacografo-chk" checked={tacografo}
                  onChange={e => setTacografo(e.target.checked)}
                  className="accent-violet-400"
                />
                <label htmlFor="tacografo-chk" className="text-slate-300 text-sm">
                  Tiene tacografo digital
                </label>
              </div>
            </>
          )}

          <hr className="border-white/5" />

          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="activo-chk" checked={activo}
              onChange={e => setActivo(e.target.checked)}
              className="accent-green-500"
            />
            <label htmlFor="activo-chk" className="text-slate-300 text-sm">Activo</label>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-slate-400 text-sm hover:bg-slate-800">
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
