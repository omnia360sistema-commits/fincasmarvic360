import React, { useState } from 'react'
import { Activity, Clock, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  useAddUsoMaquinaria,
  useTiposTrabajoMaquinaria,
  useAddTipoTrabajoMaquinaria,
  type Apero,
  type Tractor as TractorType,
} from '@/hooks/useMaquinaria'
import type { Personal } from '@/hooks/usePersonal'
import { uploadImage } from '@/utils/uploadImage'
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms'
import { AudioInput, PhotoAttachment } from '@/components/base'
import { BaseInput, BaseSelect, FieldLabel, SWO } from './MaquinariaFormPrimitives'

export const ModalUso = React.memo(function ModalUso({
  tractores,
  aperos,
  personal,
  onClose,
}: {
  tractores: TractorType[]
  aperos: Apero[]
  personal: Personal[]
  onClose: () => void
}) {
  const { user } = useAuth()
  const addMut = useAddUsoMaquinaria()
  const { data: tiposDB = [] } = useTiposTrabajoMaquinaria()
  const addTipoMut = useAddTipoTrabajoMaquinaria()

  const hoy = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    tractor_id: '',
    apero_id: '',
    personal_id: '',
    finca: '',
    tipo_trabajo: '',
    fecha: hoy,
    hora_inicio: '',
    hora_fin: '',
    gasolina_litros: '',
    notas: '',
  })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  function handleFoto(file: File | null) {
    setFotoFile(file)
    setFotoPreview(file ? URL.createObjectURL(file) : null)
  }

  const horasCalculadas: number | null = (() => {
    if (!form.hora_inicio || !form.hora_fin) return null
    const [h1, m1] = form.hora_inicio.split(':').map(Number)
    const [h2, m2] = form.hora_fin.split(':').map(Number)
    const diff = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60
    return diff > 0 ? Math.round(diff * 10) / 10 : null
  })()

  const aperosDelTractor = form.tractor_id ? aperos.filter(a => a.tractor_id === form.tractor_id) : aperos

  const tiposOpciones = tiposDB.map(t => t.nombre)

  async function handleSubmit() {
    if (!form.personal_id) return
    setSaving(true)
    try {
      const foto_url = fotoFile
        ? await uploadImage(fotoFile, 'parcel-images', `maquinaria_uso/${Date.now()}`)
        : null
      const personalSel = personal.find(p => p.id === form.personal_id)
      await addMut.mutateAsync({
        tractor_id: form.tractor_id || null,
        apero_id: form.apero_id || null,
        tractorista: personalSel?.nombre ?? null,
        personal_id: form.personal_id || null,
        finca: form.finca || null,
        parcel_id: null,
        tipo_trabajo: form.tipo_trabajo || null,
        fecha: form.fecha,
        hora_inicio: form.hora_inicio ? `${form.fecha}T${form.hora_inicio}` : null,
        hora_fin: form.hora_fin ? `${form.fecha}T${form.hora_fin}` : null,
        horas_trabajadas: horasCalculadas,
        gasolina_litros: form.gasolina_litros ? Number(form.gasolina_litros) : null,
        foto_url,
        notas: form.notas || null,
        created_by: user?.email ?? 'sistema',
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
          <Activity className="w-5 h-5 text-orange-400" />
          <p className="flex-1 text-[11px] font-black text-white uppercase tracking-wider">Registro de uso</p>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Tractor</FieldLabel>
              <BaseSelect
                value={form.tractor_id}
                onChange={e => {
                  set('tractor_id', e.target.value)
                  set('apero_id', '')
                }}
              >
                <option value="">— Ninguno —</option>
                {tractores.filter(t => t.activo).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.codigo_interno ? `${t.codigo_interno} · ` : ''}
                    {t.matricula}
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
                    {a.codigo_interno ? `${a.codigo_interno} · ` : ''}
                    {a.tipo}
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
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
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
              onCreateNew={v => {
                addTipoMut.mutate(v)
                set('tipo_trabajo', v)
              }}
              placeholder="Seleccionar tipo..."
            />
          </div>

          <div>
            <FieldLabel>Fecha</FieldLabel>
            <BaseInput type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Hora inicio</FieldLabel>
              <BaseInput type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} />
            </div>
            <div>
              <FieldLabel>Hora fin</FieldLabel>
              <BaseInput type="time" value={form.hora_fin} onChange={e => set('hora_fin', e.target.value)} />
            </div>
          </div>

          {horasCalculadas !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="text-[10px] font-black text-orange-300">{horasCalculadas}h calculadas</span>
            </div>
          )}

          <div>
            <FieldLabel>Gasoil (litros)</FieldLabel>
            <BaseInput
              type="number"
              min={0}
              step={0.1}
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
            <FieldLabel>Foto (recomendada)</FieldLabel>
            <PhotoAttachment value={fotoPreview} onChange={handleFoto} />
            {!fotoFile && (
              <p className="text-[8px] text-amber-500/80 mt-1">Modo piloto: foto opcional, recomendada para trazabilidad.</p>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/10 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { void handleSubmit() }}
            disabled={!form.personal_id || saving}
            className="btn-primary flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
})
