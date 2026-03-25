import { useState } from 'react'
import { useInsertLecturaSensor } from '@/hooks/useParcelData'
import { CheckCircle2, Leaf } from 'lucide-react'

interface Props {
  parcelId: string
  parcelNombre?: string
  onClose: () => void
}

const HERRAMIENTAS = [
  'SPAD-502 Plus (Konica Minolta)',
  'Apogee NDVI Sensor',
  'CID Bio-Science CI-710',
  'Otro',
]

const CULTIVOS_COMUNES = [
  'brocoli', 'coliflor', 'romanesco', 'col', 'lechuga', 'apio'
]

export default function RegisterLecturaSensorForm({ parcelId, parcelNombre, onClose }: Props) {
  const { mutateAsync, isPending } = useInsertLecturaSensor()
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [form, setForm] = useState({
    indice_salud:       '',
    nivel_estres:       '',
    clorofila:          '',
    ndvi:               '',
    cultivo:            '',
    cultivo_manual:     '',
    num_plantas_medidas:'5',
    operario:           '',
    herramienta:        'SPAD-502 Plus (Konica Minolta)',
    observaciones:      '',
  })

  const set = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const num = (v: string) => v === '' ? undefined : parseFloat(v)
  const int = (v: string) => v === '' ? undefined : parseInt(v)

  const handleSubmit = async () => {
    setError(null)
    if (!form.indice_salud && !form.ndvi && !form.clorofila) {
      setError('Introduce al menos un valor: índice de salud, NDVI o clorofila')
      return
    }
    try {
      await mutateAsync({
        parcel_id:          parcelId,
        indice_salud:       num(form.indice_salud),
        nivel_estres:       num(form.nivel_estres),
        clorofila:          num(form.clorofila),
        ndvi:               num(form.ndvi),
        cultivo:            form.cultivo_manual || form.cultivo || undefined,
        num_plantas_medidas: int(form.num_plantas_medidas),
        operario:           form.operario || undefined,
        herramienta:        form.herramienta || undefined,
        observaciones:      form.observaciones || undefined,
      })
      setSaved(true)
      setTimeout(onClose, 2000)
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar')
    }
  }

  if (saved) return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <CheckCircle2 className="w-10 h-10 text-green-400" />
      <p className="text-sm font-black text-green-400 uppercase tracking-widest">Lectura guardada</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* CABECERA */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <Leaf className="w-4 h-4 text-[#38bdf8]" />
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
          Sensor: {form.herramienta}
        </span>
      </div>

      {/* HERRAMIENTA */}
      <Section label="Herramienta de medición">
        <select
          value={form.herramienta}
          onChange={e => set('herramienta', e.target.value)}
          className={inputClass}
        >
          {HERRAMIENTAS.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </Section>

      {/* LECTURAS PRINCIPALES */}
      <Section label="Lecturas del sensor">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Índice de salud (0-100)">
            <input
              type="number" step="0.1" min="0" max="100"
              placeholder="ej. 72.5"
              value={form.indice_salud}
              onChange={e => set('indice_salud', e.target.value)}
              className={inputClass}
            />
            <p className="text-[9px] text-slate-600 mt-1">0 = muerta · 100 = óptima</p>
          </Field>
          <Field label="Nivel de estrés (0-100)">
            <input
              type="number" step="0.1" min="0" max="100"
              placeholder="ej. 15.0"
              value={form.nivel_estres}
              onChange={e => set('nivel_estres', e.target.value)}
              className={inputClass}
            />
            <p className="text-[9px] text-slate-600 mt-1">0 = sin estrés · 100 = crítico</p>
          </Field>
          <Field label="Clorofila SPAD (unidades)">
            <input
              type="number" step="0.1" min="0" max="100"
              placeholder="ej. 45.2"
              value={form.clorofila}
              onChange={e => set('clorofila', e.target.value)}
              className={inputClass}
            />
            <p className="text-[9px] text-slate-600 mt-1">Indica nivel de nitrógeno</p>
          </Field>
          <Field label="NDVI (0.00 a 1.00)">
            <input
              type="number" step="0.001" min="-1" max="1"
              placeholder="ej. 0.720"
              value={form.ndvi}
              onChange={e => set('ndvi', e.target.value)}
              className={inputClass}
            />
            <p className="text-[9px] text-slate-600 mt-1">{"<0.3 estrés · >0.6 saludable"}</p>
          </Field>
        </div>
      </Section>

      {/* SEMAFORO VISUAL */}
      {(form.ndvi || form.indice_salud) && (
        <div className={`rounded-lg px-4 py-3 border ${
          (() => {
            const v = parseFloat(form.ndvi || form.indice_salud)
            const isNdvi = !!form.ndvi
            if (isNdvi) {
              if (v >= 0.6) return 'bg-green-500/10 border-green-500/30'
              if (v >= 0.3) return 'bg-yellow-500/10 border-yellow-500/30'
              return 'bg-red-500/10 border-red-500/30'
            } else {
              if (v >= 70) return 'bg-green-500/10 border-green-500/30'
              if (v >= 40) return 'bg-yellow-500/10 border-yellow-500/30'
              return 'bg-red-500/10 border-red-500/30'
            }
          })()
        }`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Interpretación automática
          </p>
          <p className={`text-[12px] font-bold ${
            (() => {
              const v = parseFloat(form.ndvi || form.indice_salud)
              const isNdvi = !!form.ndvi
              if (isNdvi) {
                if (v >= 0.6) return 'text-green-400'
                if (v >= 0.3) return 'text-yellow-400'
                return 'text-red-400'
              } else {
                if (v >= 70) return 'text-green-400'
                if (v >= 40) return 'text-yellow-400'
                return 'text-red-400'
              }
            })()
          }`}>
            {(() => {
              const v = parseFloat(form.ndvi || form.indice_salud)
              const isNdvi = !!form.ndvi
              if (isNdvi) {
                if (v >= 0.6) return 'Cultivo saludable — sin intervención necesaria'
                if (v >= 0.3) return 'Estrés moderado — revisar riego y nutrición'
                return 'Estrés severo — intervención urgente'
              } else {
                if (v >= 70) return 'Planta en buen estado'
                if (v >= 40) return 'Estado medio — vigilar evolución'
                return 'Estado crítico — revisar nutrición y riego'
              }
            })()}
          </p>
        </div>
      )}

      {/* CULTIVO Y CONTEXTO */}
      <Section label="Contexto de la medición">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cultivo medido">
            <select
              value={form.cultivo}
              onChange={e => set('cultivo', e.target.value)}
              className={inputClass}
            >
              <option value="">— Seleccionar —</option>
              {CULTIVOS_COMUNES.map(c => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
              <option value="otro">Otro</option>
            </select>
          </Field>
          {form.cultivo === 'otro' && (
            <Field label="Especificar cultivo">
              <input
                type="text"
                placeholder="Nombre del cultivo"
                value={form.cultivo_manual}
                onChange={e => set('cultivo_manual', e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Plantas medidas">
            <input
              type="number" step="1" min="1" max="50"
              value={form.num_plantas_medidas}
              onChange={e => set('num_plantas_medidas', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Operario técnico">
            <input
              type="text"
              placeholder="Nombre del técnico"
              value={form.operario}
              onChange={e => set('operario', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* OBSERVACIONES */}
      <Section label="Observaciones">
        <textarea
          rows={3}
          placeholder="Estado visual de las plantas, síntomas detectados, condiciones del día..."
          value={form.observaciones}
          onChange={e => set('observaciones', e.target.value)}
          className={`${inputClass} resize-none w-full`}
        />
      </Section>

      {/* ERROR */}
      {error && (
        <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* BOTONES */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:border-white/20 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[11px] font-black uppercase tracking-widest text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar Lectura'}
        </button>
      </div>

    </div>
  )
}

// ── AUXILIARES ────────────────────────────────────────
const inputClass = `
  w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2
  text-[12px] text-white placeholder-slate-600
  focus:outline-none focus:border-[#38bdf8]/50
  transition-colors
`

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">{label}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      {children}
    </div>
  )
}