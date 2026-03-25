import { useState } from 'react'
import { useInsertAnalisisAgua } from '@/hooks/useParcelData'
import { CheckCircle2, Droplets } from 'lucide-react'

interface Props {
  finca: string
  onClose: () => void
}

const FUENTES_AGUA = [
  'Pozo propio',
  'Balsa de riego',
  'Canal de riego',
  'Red municipal',
  'Rio',
  'Otra',
]

const HERRAMIENTAS = [
  'Hanna HI9814',
  'Hanna HI98130',
  'Laboratorio externo',
  'Otro',
]

export default function RegisterAnalisisAguaForm({ finca, onClose }: Props) {
  const { mutateAsync, isPending } = useInsertAnalisisAgua()
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [form, setForm] = useState({
    fuente:           '',
    fuente_manual:    '',
    ph:               '',
    conductividad_ec: '',
    salinidad_ppm:    '',
    temperatura:      '',
    sodio_ppm:        '',
    cloruros_ppm:     '',
    nitratos_ppm:     '',
    dureza_total:     '',
    operario:         '',
    herramienta:      'Hanna HI9814',
    observaciones:    '',
  })

  const set = (k: keyof typeof form, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const num = (v: string) => v === '' ? undefined : parseFloat(v)

  const handleSubmit = async () => {
    setError(null)
    if (!form.fuente && !form.fuente_manual) {
      setError('Indica la fuente de agua analizada')
      return
    }
    if (!form.ph && !form.conductividad_ec) {
      setError('Introduce al menos pH o conductividad EC')
      return
    }
    try {
      await mutateAsync({
        finca,
        fuente:           form.fuente_manual || form.fuente,
        ph:               num(form.ph),
        conductividad_ec: num(form.conductividad_ec),
        salinidad_ppm:    num(form.salinidad_ppm),
        temperatura:      num(form.temperatura),
        sodio_ppm:        num(form.sodio_ppm),
        cloruros_ppm:     num(form.cloruros_ppm),
        nitratos_ppm:     num(form.nitratos_ppm),
        dureza_total:     num(form.dureza_total),
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

      {/* CABECERA */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <Droplets className="w-4 h-4 text-[#38bdf8]" />
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">
          Finca: {finca}
        </span>
      </div>

      {/* FUENTE Y HERRAMIENTA */}
      <Section label="Identificación">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fuente de agua *">
            <select
              value={form.fuente}
              onChange={e => set('fuente', e.target.value)}
              className={inputClass}
            >
              <option value="">— Seleccionar —</option>
              {FUENTES_AGUA.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Field>
          {form.fuente === 'Otra' && (
            <Field label="Especificar fuente">
              <input
                type="text"
                placeholder="Descripcion de la fuente"
                value={form.fuente_manual}
                onChange={e => set('fuente_manual', e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Herramienta">
            <select
              value={form.herramienta}
              onChange={e => set('herramienta', e.target.value)}
              className={inputClass}
            >
              {HERRAMIENTAS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </Field>
          <Field label="Operario">
            <input
              type="text"
              placeholder="Nombre del tecnico"
              value={form.operario}
              onChange={e => set('operario', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* PARAMETROS BASICOS HANNA */}
      <Section label="Parametros basicos — Hanna HI9814">
        <div className="grid grid-cols-2 gap-3">
          <Field label="pH *">
            <input
              type="number" step="0.1" min="0" max="14"
              placeholder="ej. 7.4"
              value={form.ph}
              onChange={e => set('ph', e.target.value)}
              className={inputClass}
            />
            <p className="text-[9px] text-slate-600 mt-1">Optimo riego: 6.5 - 7.5</p>
          </Field>
          <Field label="Conductividad EC (mS/cm)">
            <input
              type="number" step="0.01" min="0"
              placeholder="ej. 0.85"
              value={form.conductividad_ec}
              onChange={e => set('conductividad_ec', e.target.value)}
              className={inputClass}
            />
            <p className="text-[9px] text-slate-600 mt-1">{"<1.5 optimo · >3.0 problemas"}</p>
          </Field>
          <Field label="Salinidad (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 550"
              value={form.salinidad_ppm}
              onChange={e => set('salinidad_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Temperatura agua (C)">
            <input
              type="number" step="0.1"
              placeholder="ej. 18.5"
              value={form.temperatura}
              onChange={e => set('temperatura', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* SEMAFORO EC */}
      {form.conductividad_ec && (
        <div className={`rounded-lg px-4 py-3 border ${
          parseFloat(form.conductividad_ec) < 1.5
            ? 'bg-green-500/10 border-green-500/30'
            : parseFloat(form.conductividad_ec) < 3.0
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            Calidad del agua para riego
          </p>
          <p className={`text-[12px] font-bold ${
            parseFloat(form.conductividad_ec) < 1.5
              ? 'text-green-400'
              : parseFloat(form.conductividad_ec) < 3.0
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}>
            {parseFloat(form.conductividad_ec) < 1.5
              ? 'Agua optima para riego de hortalizas'
              : parseFloat(form.conductividad_ec) < 3.0
              ? 'Agua aceptable — vigilar acumulacion de sales'
              : 'Conductividad alta — riesgo de dano por salinidad'}
          </p>
        </div>
      )}

      {/* PARAMETROS AVANZADOS */}
      <Section label="Parametros quimicos avanzados">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sodio (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 80"
              value={form.sodio_ppm}
              onChange={e => set('sodio_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Cloruros (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 150"
              value={form.cloruros_ppm}
              onChange={e => set('cloruros_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Nitratos (ppm)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 25"
              value={form.nitratos_ppm}
              onChange={e => set('nitratos_ppm', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Dureza total (ppm CaCO3)">
            <input
              type="number" step="1" min="0"
              placeholder="ej. 320"
              value={form.dureza_total}
              onChange={e => set('dureza_total', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* OBSERVACIONES */}
      <Section label="Observaciones">
        <textarea
          rows={3}
          placeholder="Color, olor, turbidez, condiciones del punto de muestreo..."
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
          {isPending ? 'Guardando...' : 'Guardar Analisis'}
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