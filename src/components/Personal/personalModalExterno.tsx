// ── Modal Personal Externo ────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  useAddPersonalExterno,
  useUpdatePersonalExterno,
  PersonalExterno,
  TipoExterno,
} from '../../hooks/usePersonal';
import { AudioInput } from '@/components/base';

export function ModalExterno({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial?: PersonalExterno;
}) {
  const addMut    = useAddPersonalExterno();
  const updateMut = useUpdatePersonalExterno();

  const [empresa,         setEmpresa]         = useState(initial?.nombre_empresa    ?? '');
  const [nif,             setNif]             = useState(initial?.nif               ?? '');
  const [telefono,        setTelefono]        = useState(initial?.telefono_contacto ?? '');
  const [tipo,            setTipo]            = useState<TipoExterno>(initial?.tipo ?? 'jornal_servicio');
  const [personaContacto, setPersonaContacto] = useState(initial?.persona_contacto  ?? '');
  const [activo,          setActivo]          = useState(initial?.activo            ?? true);
  const [notas,           setNotas]           = useState(initial?.notas             ?? '');
  const [trabajosRealiza, setTrabajosRealiza] = useState(initial?.trabajos_realiza  ?? '');
  const [presupuesto,     setPresupuesto]     = useState(initial?.presupuesto       ?? '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empresa.trim()) { setError('El nombre de empresa es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = {
        nombre_empresa:    empresa.trim(),
        nif:               nif || null,
        telefono_contacto: telefono || null,
        tipo,
        activo,
        notas:             notas || null,
        persona_contacto:  personaContacto || null,
        trabajos_realiza:  trabajosRealiza || null,
        presupuesto:       presupuesto || null,
      };
      if (initial) {
        await updateMut.mutateAsync({ id: initial.id, ...payload });
      } else {
        await addMut.mutateAsync(payload);
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
            <span className="w-2 h-2 rounded-full bg-[#f472b6]" />
            <h2 className="text-white font-bold text-sm uppercase tracking-wide">
              {initial ? 'Editar' : 'Nueva'} empresa externa
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
            <label className="text-slate-400 text-xs block mb-1">Nombre empresa / autonomo *</label>
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
              <label className="text-slate-400 text-xs block mb-1">Telefono</label>
              <input
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                value={telefono} onChange={e => setTelefono(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Persona de contacto</label>
            <input
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              value={personaContacto} onChange={e => setPersonaContacto(e.target.value)}
            />
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Tipo de contratacion</label>
            <select
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              value={tipo} onChange={e => setTipo(e.target.value as TipoExterno)}
            >
              <option value="destajo">A destajo</option>
              <option value="jornal_servicio">A jornal / servicio</option>
            </select>
          </div>

          <AudioInput
            label="Trabajos que realiza"
            value={trabajosRealiza}
            onChange={setTrabajosRealiza}
            rows={2}
            placeholder="Tipos de trabajo que realiza esta empresa..."
          />

          <AudioInput
            label="Presupuesto / tarifas"
            value={presupuesto}
            onChange={setPresupuesto}
            rows={2}
            placeholder="Tarifas o condiciones economicas..."
          />

          <AudioInput
            label="Notas"
            value={notas}
            onChange={setNotas}
            rows={2}
            placeholder="Observaciones..."
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="activo-ext" checked={activo}
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
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
