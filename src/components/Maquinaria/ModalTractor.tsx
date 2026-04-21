import React, { useState } from 'react'
import { Tractor, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  useAddTractor,
  useUpdateTractor,
  type Tractor as TractorType,
} from '@/hooks/useMaquinaria'
import { useUbicaciones } from '@/hooks/useInventario'
import { uploadImage } from '@/utils/uploadImage'
import { useCatalogoLocal } from '@/hooks/useCatalogoLocal'
import { AudioInput, PhotoAttachment } from '@/components/base'
import {
  ESTADOS_OPERATIVO,
  ESTADO_OP_LABEL,
  MARCAS_TRACTOR_BASE,
} from './maquinariaConstants'
import { BaseInput, BaseSelect, FieldLabel, SWO } from './MaquinariaFormPrimitives'

export const ModalTractor = React.memo(function ModalTractor({
  tractor,
  onClose,
}: {
  tractor?: TractorType
  onClose: () => void
}) {
  const { user } = useAuth()
  const addMut = useAddTractor()
  const updateMut = useUpdateTractor()
  const { data: ubicaciones = [] } = useUbicaciones()

  const [form, setForm] = useState({
    matricula: tractor?.matricula ?? '',
    marca: tractor?.marca ?? '',
    modelo: tractor?.modelo ?? '',
    anio: tractor?.anio ? String(tractor.anio) : '',
    horas_motor: tractor?.horas_motor != null ? String(tractor.horas_motor) : '',
    ficha_tecnica: tractor?.ficha_tecnica ?? '',
    notas: tractor?.notas ?? '',
    fecha_proxima_itv: tractor?.fecha_proxima_itv ?? '',
    fecha_proxima_revision: tractor?.fecha_proxima_revision ?? '',
    horas_proximo_mantenimiento:
      tractor?.horas_proximo_mantenimiento != null ? String(tractor.horas_proximo_mantenimiento) : '',
    gps_info: tractor?.gps_info ?? '',
    estado_operativo: tractor?.estado_operativo ?? 'disponible',
    ubicacion_id: '',
  })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(tractor?.foto_url ?? null)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  function handleFoto(file: File | null) {
    setFotoFile(file)
    setFotoPreview(file ? URL.createObjectURL(file) : null)
  }

  const catMarcas = useCatalogoLocal('maquinaria_marcas_tractor', MARCAS_TRACTOR_BASE)
  const marcasExistentes = catMarcas.opciones

  async function handleSubmit() {
    if (!form.matricula.trim()) return
    setSaving(true)
    try {
      let foto_url = tractor?.foto_url ?? null
      if (fotoFile) {
        foto_url = await uploadImage(fotoFile, 'parcel-images', `maquinaria/tractores/${Date.now()}`)
      }

      const payload = {
        matricula: form.matricula.toUpperCase(),
        marca: form.marca || null,
        modelo: form.modelo || null,
        anio: form.anio ? Number(form.anio) : null,
        horas_motor: form.horas_motor ? Number(form.horas_motor) : null,
        ficha_tecnica: form.ficha_tecnica || null,
        activo: true,
        foto_url,
        notas: form.notas || null,
        created_by: user?.email ?? 'sistema',
        fecha_proxima_itv: form.fecha_proxima_itv || null,
        fecha_proxima_revision: form.fecha_proxima_revision || null,
        horas_proximo_mantenimiento: form.horas_proximo_mantenimiento
          ? Number(form.horas_proximo_mantenimiento)
          : null,
        gps_info: form.gps_info || null,
        estado_operativo: form.estado_operativo || 'disponible',
        codigo_interno: tractor?.codigo_interno ?? null,
      }

      if (tractor) {
        await updateMut.mutateAsync({ id: tractor.id, ...payload })
      } else {
        await addMut.mutateAsync({ ...payload, ubicacion_id: form.ubicacion_id || null })
      }
      onClose()
    } finally {
      setSaving(false)
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
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
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
                onCreateNew={v => {
                  catMarcas.addOpcion(v)
                  set('marca', v)
                }}
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
                type="number"
                min={1990}
                max={2030}
                value={form.anio}
                onChange={e => set('anio', e.target.value)}
                placeholder="2018"
              />
            </div>
            <div>
              <FieldLabel>Horas motor</FieldLabel>
              <BaseInput
                type="number"
                min={0}
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
                <option key={s} value={s}>
                  {ESTADO_OP_LABEL[s] ?? s}
                </option>
              ))}
            </BaseSelect>
          </div>

          {!tractor && (
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
                type="number"
                min={0}
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
            disabled={!form.matricula || saving}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
})
