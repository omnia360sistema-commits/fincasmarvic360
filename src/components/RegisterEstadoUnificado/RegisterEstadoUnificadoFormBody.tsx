import type { Dispatch, RefObject, SetStateAction } from 'react'
import { Camera, ChevronDown, ChevronUp, Droplet } from 'lucide-react'
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms'
import { ESTADOS_PARCELA as ESTADOS } from '@/constants/estadosParcela'
import SelectWithOther from '@/components/base/SelectWithOther'
import AudioInput from '@/components/base/AudioInput'
import { TEXTURAS, FUENTES_AGUA } from '@/components/RegisterEstadoUnificado/registerEstadoUnificadoHelpers'
import type { Tables } from '@/integrations/supabase/types'

const IN_CLS =
  'w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#6d9b7d]/50 transition-colors'

type ParcelaRow = { parcel_id: string; parcel_number: string | number }
type ZonaRiego = { id: string; nombre_zona: string }
type CatalogoCultivo = Tables<'cultivos_catalogo'>

export type RegisterEstadoUnificadoFormBodyProps = {
  propParcelId?: string
  propFarmName?: string
  propParcelName?: string
  selFinca: string
  setSelFinca: (v: string) => void
  selParcelId: string
  setSelParcelId: (v: string) => void
  parcelas: ParcelaRow[]
  estado: string
  setEstado: (v: string) => void
  observaciones: string
  setObservaciones: (v: string) => void
  cultivo: string
  setCultivo: (v: string) => void
  catalogo: CatalogoCultivo[]
  cultivoObj: CatalogoCultivo | null
  cosechaEstimada: string
  fechaPlantacion: string
  setFechaPlantacion: (v: string) => void
  variedad: string
  setVariedad: (v: string) => void
  cosechaCultivo: string
  setCosechaCultivo: (v: string) => void
  cosechaKg: string
  setCosechaKg: (v: string) => void
  cosechaFecha: string
  setCosechaFecha: (v: string) => void
  showRiego: boolean
  setShowRiego: Dispatch<SetStateAction<boolean>>
  riegoZona: string
  setRiegoZona: (v: string) => void
  riegoFechaInicio: string
  setRiegoFechaInicio: (v: string) => void
  riegoFechaFin: string
  setRiegoFechaFin: (v: string) => void
  riegoLitros: string
  setRiegoLitros: (v: string) => void
  riegoPresion: string
  setRiegoPresion: (v: string) => void
  riegoOrigen: string
  setRiegoOrigen: (v: string) => void
  riegoNotas: string
  setRiegoNotas: (v: string) => void
  zonasRiego: ZonaRiego[]
  showSuelo: boolean
  setShowSuelo: Dispatch<SetStateAction<boolean>>
  suelo: Record<string, string>
  setSu: (k: string, v: string) => void
  showAgua: boolean
  setShowAgua: Dispatch<SetStateAction<boolean>>
  agua: Record<string, string>
  setAg: (k: string, v: string) => void
  showSensor: boolean
  setShowSensor: Dispatch<SetStateAction<boolean>>
  sensor: Record<string, string>
  setSen: (k: string, v: string) => void
  foto: File | null
  setFoto: (f: File | null) => void
  fileRef: RefObject<HTMLInputElement | null>
  saving: boolean
  activeParcelId: string
  onClose: () => void
  onSubmit: () => void
}

export function RegisterEstadoUnificadoFormBody(p: RegisterEstadoUnificadoFormBodyProps) {
  return (
    <div className="space-y-5">

      {!p.propParcelId ? (
        <div className="space-y-3">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Finca</p>
            <select
              value={p.selFinca}
              onChange={e => {
                p.setSelFinca(e.target.value)
                p.setSelParcelId('')
              }}
              className={IN_CLS}
            >
              <option value="">— Seleccionar finca —</option>
              {FINCAS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          {p.selFinca && p.parcelas.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Parcela / Sector</p>
              <select
                value={p.selParcelId}
                onChange={e => p.setSelParcelId(e.target.value)}
                className={IN_CLS}
              >
                <option value="">— Seleccionar parcela —</option>
                {p.parcelas.map(par => (
                  <option key={par.parcel_id} value={par.parcel_id}>{par.parcel_number}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-800/50 border border-[#6d9b7d]/20 px-3 py-2">
          <p className="text-[9px] text-slate-500 uppercase tracking-wider">{p.propFarmName}</p>
          <p className="text-sm font-black text-[#6d9b7d]">{p.propParcelName ?? p.propParcelId}</p>
        </div>
      )}

      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">Estado *</p>
        <div className="grid grid-cols-3 gap-2">
          {ESTADOS.map(e => (
            <button
              key={e.value}
              type="button"
              onClick={() => p.setEstado(e.value)}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                p.estado === e.value
                  ? 'bg-[#6d9b7d] text-slate-900'
                  : 'bg-slate-800/60 border border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {(p.estado === 'plantada' || p.estado === 'en_produccion') && (
        <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 space-y-3">
          <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.25em]">Datos de plantación</p>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Cultivo *</p>
            <select value={p.cultivo} onChange={e => p.setCultivo(e.target.value)} className={IN_CLS}>
              <option value="">— Seleccionar cultivo —</option>
              {p.catalogo.map(c => (
                <option key={c.nombre_interno} value={c.nombre_interno}>{c.nombre_display}</option>
              ))}
            </select>
          </div>
          {p.cultivoObj && (
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-800/40 border border-white/5 p-2.5">
              <div>
                <p className="text-[9px] text-slate-500 uppercase">Ciclo</p>
                <p className="text-xs font-bold text-white">{p.cultivoObj.ciclo_dias} días</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase">Cosecha est.</p>
                <p className="text-xs font-bold text-white">{p.cosechaEstimada || '—'}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Fecha plantación</p>
              <input type="date" value={p.fechaPlantacion} onChange={e => p.setFechaPlantacion(e.target.value)} className={IN_CLS} />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Variedad</p>
              <input type="text" value={p.variedad} onChange={e => p.setVariedad(e.target.value)} placeholder="Ej: Ironman F1" className={IN_CLS} />
            </div>
          </div>
        </div>
      )}

      {p.estado === 'cosechada' && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 space-y-3">
          <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.25em]">Datos de cosecha</p>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Cultivo cosechado *</p>
            <select value={p.cosechaCultivo} onChange={e => p.setCosechaCultivo(e.target.value)} className={IN_CLS}>
              <option value="">— Seleccionar cultivo —</option>
              {p.catalogo.map(c => (
                <option key={c.nombre_interno} value={c.nombre_interno}>{c.nombre_display}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Kg producidos</p>
              <input type="number" min="0" value={p.cosechaKg} onChange={e => p.setCosechaKg(e.target.value)} placeholder="0" className={IN_CLS} />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Fecha cosecha</p>
              <input type="date" value={p.cosechaFecha} onChange={e => p.setCosechaFecha(e.target.value)} className={IN_CLS} />
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Observaciones</p>
        <textarea
          rows={2}
          value={p.observaciones}
          onChange={e => p.setObservaciones(e.target.value)}
          placeholder="Estado visual, incidencias..."
          className={`${IN_CLS} resize-none`}
        />
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => p.setShowRiego(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2"><Droplet className="w-3.5 h-3.5" /> Riego del día</span>
          {p.showRiego ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>
        {p.showRiego && (
          <div className="p-4 space-y-4 bg-slate-900/50">
            <SelectWithOther
              label="Zona de riego *"
              options={p.zonasRiego.map(z => z.nombre_zona)}
              value={p.riegoZona}
              onChange={p.setRiegoZona}
              onCreateNew={p.setRiegoZona}
              placeholder="Ej: Sector Norte"
            />
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Inicio *</p><input type="datetime-local" value={p.riegoFechaInicio} onChange={e => p.setRiegoFechaInicio(e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Fin</p><input type="datetime-local" value={p.riegoFechaFin} onChange={e => p.setRiegoFechaFin(e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Litros</p><input type="number" placeholder="0" value={p.riegoLitros} onChange={e => p.setRiegoLitros(e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Presión (bar)</p><input type="number" step="0.1" placeholder="0.0" value={p.riegoPresion} onChange={e => p.setRiegoPresion(e.target.value)} className={IN_CLS} /></div>
            </div>
            <SelectWithOther
              label="Origen del agua"
              options={['Pozo', 'Balsa', 'Red municipal', 'Río', 'Otro']}
              value={p.riegoOrigen}
              onChange={p.setRiegoOrigen}
              onCreateNew={p.setRiegoOrigen}
              placeholder="Seleccionar..."
            />
            <div className="pt-2">
              <AudioInput
                label="Notas de riego"
                value={p.riegoNotas}
                onChange={p.setRiegoNotas}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => p.setShowSuelo(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">📊 Análisis de suelo</span>
          {p.showSuelo ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>
        {p.showSuelo && (
          <div className="p-4 space-y-3 bg-slate-900/50">
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Hanna HI9814 + Kit LaMotte</p>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[9px] text-slate-500 mb-1">pH *</p><input type="number" step="0.1" placeholder="7.2" value={p.suelo.ph} onChange={e => p.setSu('ph', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">EC (mS/cm)</p><input type="number" step="0.01" placeholder="1.25" value={p.suelo.conductividad_ec} onChange={e => p.setSu('conductividad_ec', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">Salinidad (ppm)</p><input type="number" step="1" placeholder="800" value={p.suelo.salinidad_ppm} onChange={e => p.setSu('salinidad_ppm', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">Temp. suelo (°C)</p><input type="number" step="0.1" placeholder="18.5" value={p.suelo.temperatura_suelo} onChange={e => p.setSu('temperatura_suelo', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">N (ppm)</p><input type="number" step="1" placeholder="45" value={p.suelo.nitrogeno_ppm} onChange={e => p.setSu('nitrogeno_ppm', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">P (ppm)</p><input type="number" step="1" placeholder="30" value={p.suelo.fosforo_ppm} onChange={e => p.setSu('fosforo_ppm', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">K (ppm)</p><input type="number" step="1" placeholder="180" value={p.suelo.potasio_ppm} onChange={e => p.setSu('potasio_ppm', e.target.value)} className={IN_CLS} /></div>
              <div>
                <p className="text-[9px] text-slate-500 mb-1">Textura</p>
                <select value={p.suelo.textura} onChange={e => p.setSu('textura', e.target.value)} className={IN_CLS}>
                  <option value="">—</option>
                  {TEXTURAS.map(t => (
                    <option key={t} value={t.toLowerCase()}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => p.setShowAgua(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">💧 Análisis de agua</span>
          {p.showAgua ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>
        {p.showAgua && (
          <div className="p-4 space-y-3 bg-slate-900/50">
            <div>
              <p className="text-[9px] text-slate-500 mb-1">Fuente de agua *</p>
              <select value={p.agua.fuente} onChange={e => p.setAg('fuente', e.target.value)} className={IN_CLS}>
                <option value="">— Seleccionar —</option>
                {FUENTES_AGUA.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><p className="text-[9px] text-slate-500 mb-1">pH</p><input type="number" step="0.1" placeholder="7.0" value={p.agua.ph} onChange={e => p.setAg('ph', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">EC (mS/cm)</p><input type="number" step="0.01" placeholder="0.8" value={p.agua.conductividad_ec} onChange={e => p.setAg('conductividad_ec', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">Salinidad</p><input type="number" step="1" placeholder="500" value={p.agua.salinidad_ppm} onChange={e => p.setAg('salinidad_ppm', e.target.value)} className={IN_CLS} /></div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => p.setShowSensor(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">🌿 Sensor NDVI / SPAD</span>
          {p.showSensor ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>
        {p.showSensor && (
          <div className="p-4 space-y-3 bg-slate-900/50">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[9px] text-slate-500 mb-1">Índice salud (0-1)</p><input type="number" step="0.01" min="0" max="1" placeholder="0.75" value={p.sensor.indice_salud} onChange={e => p.setSen('indice_salud', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">Nivel estrés (0-1)</p><input type="number" step="0.01" min="0" max="1" placeholder="0.2" value={p.sensor.nivel_estres} onChange={e => p.setSen('nivel_estres', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">Clorofila (SPAD)</p><input type="number" step="0.1" placeholder="42.5" value={p.sensor.clorofila} onChange={e => p.setSen('clorofila', e.target.value)} className={IN_CLS} /></div>
              <div><p className="text-[9px] text-slate-500 mb-1">NDVI (0-1)</p><input type="number" step="0.01" min="0" max="1" placeholder="0.65" value={p.sensor.ndvi} onChange={e => p.setSen('ndvi', e.target.value)} className={IN_CLS} /></div>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">
          Foto <span className="text-amber-500/70">(recomendada)</span>
        </p>
        {p.foto ? (
          <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-white/10">
            <img src={URL.createObjectURL(p.foto)} alt="preview" className="w-16 h-16 object-cover rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{p.foto.name}</p>
              <p className="text-[10px] text-slate-500">{(p.foto.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={() => p.setFoto(null)} className="text-slate-500 hover:text-red-400 transition-colors text-lg">×</button>
          </div>
        ) : (
          <label className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-dashed border-white/20 cursor-pointer hover:border-[#6d9b7d]/40 transition-colors">
            <Camera className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-400">Tomar foto o seleccionar</span>
            <input
              ref={p.fileRef}
              type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) p.setFoto(f)
              }}
            />
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={p.onClose}
          className="flex-1 py-2.5 rounded-lg border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:border-white/20 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={p.onSubmit}
          disabled={p.saving || !p.activeParcelId || !p.estado}
          className="flex-1 py-2.5 rounded-lg bg-[#6d9b7d]/20 border border-[#6d9b7d]/40 text-[11px] font-black uppercase tracking-widest text-[#6d9b7d] hover:bg-[#6d9b7d]/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {p.saving && <span className="w-3.5 h-3.5 border-2 border-[#6d9b7d]/30 border-t-[#6d9b7d] rounded-full animate-spin" />}
          {p.saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

    </div>
  )
}
