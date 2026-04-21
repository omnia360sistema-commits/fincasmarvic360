import React, { useState } from 'react'
import { Wrench, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  useAddMantenimientoTractor,
  useTiposMantenimientoMaquinaria,
  useAddTipoMantenimientoMaquinaria,
  type Tractor as TractorType,
} from '@/hooks/useMaquinaria'
import { uploadImage } from '@/utils/uploadImage'
import { AudioInput, PhotoAttachment } from '@/components/base'
import { BaseInput, BaseSelect, FieldLabel, SWO } from './MaquinariaFormPrimitives'

export const ModalMantenimiento = React.memo(function ModalMantenimiento({
  tractorId,
  horasActuales,
  tractores,
  onClose,
}: {
  tractorId?: string
  horasActuales?: number | null
  tractores: TractorType[]
  onClose: () => void
}) {
  const { user } = useAuth()
  const addMut = useAddMantenimientoTractor()
  const { data: tiposMantenimiento = [] } = useTiposMantenimientoMaquinaria()
  const addTipoMantenimiento = useAddTipoMantenimientoMaquinaria()

  const [form, setForm] = useState({
    tractor_id: tractorId ?? '',
    tipo: '',
    fecha: new Date().toISOString().slice(0, 10),
    horas_motor_al_momento: horasActuales != null ? String(horasActuales) : '',
    descripcion: '',
    coste_euros: '',
    proveedor: '',
  })
  const [foto1File, setFoto1File] = useState<File | null>(null)
  const [foto1Preview, setFoto1Preview] = useState<string | null>(null)
  const [foto2File, setFoto2File] = useState<File | null>(null)
  const [foto2Preview, setFoto2Preview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleCreateTipo(nombre: string) {
    await addTipoMantenimiento.mutateAsync(nombre)
  }

  function handleFoto1(file: File | null) {
    setFoto1File(file)
    setFoto1Preview(file ? URL.createObjectURL(file) : null)
  }

  function handleFoto2(file: File | null) {
    setFoto2File(file)
    setFoto2Preview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit() {
    if (!form.tractor_id || !form.tipo) return
    setSaving(true)
    try {
      const ts = Date.now()
      const foto_url = foto1File
        ? await uploadImage(foto1File, 'parcel-images', `mantenimiento-tractor/${form.tractor_id}_${ts}_1`)
        : null
      const foto_url_2 = foto2File
        ? await uploadImage(foto2File, 'parcel-images', `mantenimiento-tractor/${form.tractor_id}_${ts}_2`)
        : null
      await addMut.mutateAsync({
        tractor_id: form.tractor_id,
        tipo: form.tipo,
        descripcion: form.descripcion || null,
        fecha: form.fecha,
        horas_motor_al_momento: form.horas_motor_al_momento ? Number(form.horas_motor_al_momento) : null,
        coste_euros: form.coste_euros ? Number(form.coste_euros) : null,
        proveedor: form.proveedor || null,
        foto_url,
        foto_url_2,
        created_by: user?.email ?? 'sistema',
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
          <Wrench className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Mantenimiento tractor</p>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          {!tractorId && (
            <div>
              <FieldLabel>Tractor *</FieldLabel>
              <BaseSelect value={form.tractor_id} onChange={e => set('tractor_id', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {tractores.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.codigo_interno ? `${t.codigo_interno} · ` : ''}
                    {t.matricula}
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
              onCreateNew={v => { void handleCreateTipo(v) }}
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
                type="number"
                min={0}
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
                type="number"
                min={0}
                step={0.01}
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
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { void handleSubmit() }}
            disabled={!form.tractor_id || !form.tipo || saving}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
})
