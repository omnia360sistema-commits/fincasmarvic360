import React, { useState } from 'react'
import { Wrench, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAddApero, useAperos, type Apero, type Tractor as TractorType } from '@/hooks/useMaquinaria'
import { useUbicaciones } from '@/hooks/useInventario'
import { uploadImage } from '@/utils/uploadImage'
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal'
import { AudioInput, PhotoAttachment } from '@/components/base'
import { TIPOS_APERO_BASE } from './maquinariaConstants'
import { BaseInput, BaseSelect, FieldLabel, SWO } from './MaquinariaFormPrimitives'

export const ModalApero = React.memo(function ModalApero({
  apero,
  tractores,
  onClose,
}: {
  apero?: Apero
  tractores: TractorType[]
  onClose: () => void
}) {
  const { user } = useAuth()
  const addMut = useAddApero()
  const { data: ubicaciones = [] } = useUbicaciones()
  const { data: aperosExistentes = [] } = useAperos()

  const catTiposApero = useCatalogoLocal('maquinaria_tipos_apero', TIPOS_APERO_BASE)
  const tiposExistentes = Array.from(
    new Set([...catTiposApero.opciones, ...aperosExistentes.map(a => a.tipo)])
  ).sort()

  const [form, setForm] = useState({
    tipo: apero?.tipo ?? '',
    descripcion: apero?.descripcion ?? '',
    tractor_id: apero?.tractor_id ?? '',
    ubicacion_id: '',
    estado: apero?.estado ?? 'disponible',
    notas: apero?.notas ?? '',
  })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(apero?.foto_url ?? null)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  function handleFoto(file: File | null) {
    setFotoFile(file)
    setFotoPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit() {
    if (!form.tipo.trim()) return
    setSaving(true)
    try {
      let foto_url = apero?.foto_url ?? null
      if (fotoFile) {
        foto_url = await uploadImage(fotoFile, 'parcel-images', `maquinaria/aperos/${Date.now()}`)
      }
      await addMut.mutateAsync({
        tipo: form.tipo,
        descripcion: form.descripcion || null,
        tractor_id: form.tractor_id || null,
        activo: true,
        foto_url,
        notas: form.notas || null,
        estado: form.estado || 'disponible',
        codigo_interno: apero?.codigo_interno ?? null,
        created_by: user?.email ?? 'sistema',
        ubicacion_id: form.ubicacion_id || null,
      })
      onClose()
    } finally {
      setSaving(false)
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
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
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
              onCreateNew={v => {
                catTiposApero.addOpcion(v)
                set('tipo', v)
              }}
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
                  {t.codigo_interno ? `${t.codigo_interno} · ` : ''}
                  {t.matricula}
                  {t.marca ? ` · ${t.marca}` : ''}
                </option>
              ))}
            </BaseSelect>
          </div>

          <div>
            <FieldLabel>Ubicación en inventario</FieldLabel>
            <BaseSelect value={form.ubicacion_id} onChange={e => set('ubicacion_id', e.target.value)}>
              <option value="">— Sin asignar —</option>
              {ubicaciones.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
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
            <AudioInput value={form.notas} onChange={v => set('notas', v)} rows={2} />
          </div>

          <div>
            <FieldLabel>Foto</FieldLabel>
            <PhotoAttachment value={fotoPreview} onChange={handleFoto} />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { void handleSubmit() }}
            disabled={!form.tipo || saving}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
})
