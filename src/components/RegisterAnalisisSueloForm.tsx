import { useState } from 'react'
import { useInsertAnalisisSuelo } from '@/hooks/useParcelData'
import { CheckCircle2, FlaskConical } from 'lucide-react'

interface Props {
  parcelId: string
  parcelNombre?: string
  onClose: () => void
}

const TEXTURAS = [
  'Arcilloso',
  'Franco arcilloso',
  'Franco',
  'Franco arenoso',
  'Arenoso',
  'Limoso',
  'Franco limoso',
]

export default function RegisterAnalisisSueloForm({ parcelId, parcelNombre, onClose }: Props) {
  const { mutateAsync, isPending } = useInsertAnalisisSuelo()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    ph:                 '',
    conductividad_ec:   '',
    salinidad_ppm:      '',
    temperatura_suelo:  '',
    materia_organica:   '',
    sodio_ppm:          '',
    nitrogeno_ppm:      '',
    fosforo_ppm:        '',
    potasio_ppm:        '',
    textura:            '',
    profundidad_cm:     '20',
    num_muestras:       '3',
    operario:           '',
    herramienta:        'Hanna HI9814 + LaMotte',
    observaciones:      '',
  })

  const set = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const num = (v: string) => v === '' ? undefined : parseFloat(v)
  const int = (v: string) => v === '' ? undefined : parseInt(v)

  const handleSubmit = async () => {
    setError(null)
    if (!form.ph) { setError('El pH es obligatorio'); return }
    try {
      await mutateAsync({
        parcel_id:        parcelId,
        ph:               num(form.ph),
        conductividad_ec: num(form.conductividad_ec),
        salinidad_ppm:    num(form.salinidad_ppm),
        temperatura_suelo: num(form.temperatura_suelo),
        materia_organica: num(form.materia_organica),
        sodio_ppm:        num(form.sodio_ppm),
        nitrogeno_ppm:    num(form.nitrogeno_ppm),
        fosforo_ppm:      num(form.fosforo_ppm),
        potasio_ppm:      num(form.potasio_ppm),
        textura:          form.textura || undefined,
        profundidad_cm:   int(form.profundidad_cm),
        num_muestras:     int(form.num_muestras),
        operario:         form.operario || undefined,
        herramienta:      form.herramienta || undefined,
        observaciones:    form.observaciones || undefined,
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
      <p className="text-sm font-black text-green-400 uppercase tracking-widest">Análisis guardado</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* CABECERA INFO */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <FlaskConical className="w-4 h-4 text-[#38bdf8]" />
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
          Herramienta: {form.herramienta}
        </span>
      </div>

      {/* BLOQUE 1 — PARÁMETROS BÁSICOS HANNA HI9814 */}
      <Section label="Parámetros básicos — Hanna HI9814">
        <div className="grid grid-cols-2 gap-3">
          <Field label="pH *" required>
            <input
              type="number" step="0.1" min="0" max="14"
              placeholder="ej. 7.2"
              value={form.ph}
              onChange={e => set('ph', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Conductividad EC (mS/cm)">
            <input
              type="number" step="0.01" min="0"
              placeholder="ej. 1.25"
              value={form.conductividad_ec}
              onChange={e => set('conductividad_ec', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Salinidad (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 800"
              value={form.salinidad_ppm}
              onChange={e => set('salinidad_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Temperatura suelo (°C)">
            <input
              type="number" step="0.1"
              placeholder="ej. 18.5"
              value={form.temperatura_suelo}
              onChange={e => set('temperatura_suelo', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Materia orgánica (%)">
            <input
              type="number" step="0.1" min="0" max="100"
              placeholder="ej. 2.3"
              value={form.materia_organica}
              onChange={e => set('materia_organica', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Sodio (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 120"
              value={form.sodio_ppm}
              onChange={e => set('sodio_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* BLOQUE 2 — NPK — LAMOTTE */}
      <Section label="NPK — Kit LaMotte">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Nitrógeno N (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 45"
              value={form.nitrogeno_ppm}
              onChange={e => set('nitrogeno_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Fósforo P (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 30"
              value={form.fosforo_ppm}
              onChange={e => set('fosforo_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Potasio K (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 180"
              value={form.potasio_ppm}
              onChange={e => set('potasio_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* BLOQUE 3 — CARACTERÍSTICAS FÍSICAS */}
      <Section label="Características físicas">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Textura del suelo">
            <select
              value={form.textura}
              onChange={e => set('textura', e.target.value)}
              className={inputClass}
            >
              <option value="">— Seleccionar —</option>
              {TEXTURAS.map(t => (
                <option key={t} value={t.toLowerCase()}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Profundidad muestra (cm)">
            <input
              type="number" step="5" min="5" max="100"
              value={form.profundidad_cm}
              onChange={e => set('profundidad_cm', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Número de muestras">
            <input
              type="number" step="1" min="1" max="20"
              value={form.num_muestras}
              onChange={e => set('num_muestras', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Operario">
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
          placeholder="Estado visual del suelo, condiciones del día, incidencias..."
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
          {isPending ? 'Guardando...' : 'Guardar Análisis'}
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

function Field({ label, children, required }: {
  label: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div>
      <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </p>
      {children}
    </div>
  )
}