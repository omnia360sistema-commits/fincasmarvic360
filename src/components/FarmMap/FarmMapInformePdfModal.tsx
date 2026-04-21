import React from 'react'
import { X, FileText, AlertCircle } from 'lucide-react'
import type { ParcelFeature } from '@/types/farm'
import type { InformeFincaTipo, InformeTipoDato } from '@/components/FarmMap/farmMapConstants'

type Props = {
  open: boolean
  onClose: () => void
  decodedFarm: string
  parcels: ParcelFeature[]
  informeFincaTipo: InformeFincaTipo
  setInformeFincaTipo: (t: InformeFincaTipo) => void
  informeSector: string
  setInformeSector: (s: string) => void
  informeTipoDato: InformeTipoDato
  setInformeTipoDato: (t: InformeTipoDato) => void
  informeFechaInicio: string
  setInformeFechaInicio: (s: string) => void
  informeFechaFin: string
  setInformeFechaFin: (s: string) => void
  informeError: string | null
  generandoInforme: boolean
  onGenerar: () => void
}

export function FarmMapInformePdfModal({
  open,
  onClose,
  decodedFarm,
  parcels,
  informeFincaTipo,
  setInformeFincaTipo,
  informeSector,
  setInformeSector,
  informeTipoDato,
  setInformeTipoDato,
  informeFechaInicio,
  setInformeFechaInicio,
  informeFechaFin,
  setInformeFechaFin,
  informeError,
  generandoInforme,
  onGenerar,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} role="presentation" />
      <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[85vh]">

        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-black text-[#6d9b7d] uppercase tracking-[0.3em]">Informe PDF</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{decodedFarm}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ml-4 shrink-0"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-white/10 shrink-0">
          {([
            { id: 'sector' as const, label: 'Por Sector' },
            { id: 'tipo' as const, label: 'Por Tipo' },
            { id: 'estado' as const, label: 'Estado Finca' },
          ]).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setInformeFincaTipo(id)}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                informeFincaTipo === id
                  ? 'border-[#6d9b7d] text-[#6d9b7d]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {informeFincaTipo === 'sector' && (
            <>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Todo lo registrado en un sector: trabajos, plantaciones, cosechas y tickets.
              </p>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Sector <span className="text-red-400">*</span>
                </label>
                <select
                  value={informeSector}
                  onChange={e => setInformeSector(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#6d9b7d]/50"
                >
                  <option value="">Seleccionar sector…</option>
                  {parcels.map(p => (
                    <option key={p.properties.parcel_id} value={p.properties.parcel_id}>
                      {p.properties.parcela}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha inicio</label>
                <input type="date" value={informeFechaInicio} onChange={e => setInformeFechaInicio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#6d9b7d]/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha fin</label>
                <input type="date" value={informeFechaFin} onChange={e => setInformeFechaFin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#6d9b7d]/50" />
              </div>
            </>
          )}

          {informeFincaTipo === 'tipo' && (
            <>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Todos los registros de un tipo en toda la finca, agrupados por sector.
              </p>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tipo de dato</label>
                <select
                  value={informeTipoDato}
                  onChange={e => setInformeTipoDato(e.target.value as InformeTipoDato)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#6d9b7d]/50"
                >
                  <option value="trabajos">Trabajos</option>
                  <option value="plantaciones">Plantaciones</option>
                  <option value="cosechas">Cosechas</option>
                  <option value="tickets">Tickets de Pesaje</option>
                  <option value="residuos">Residuos</option>
                  <option value="certificaciones">Certificaciones</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha inicio</label>
                <input type="date" value={informeFechaInicio} onChange={e => setInformeFechaInicio(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#6d9b7d]/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha fin</label>
                <input type="date" value={informeFechaFin} onChange={e => setInformeFechaFin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#6d9b7d]/50" />
              </div>
            </>
          )}

          {informeFincaTipo === 'estado' && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Estado actual de todos los sectores de la finca: último cultivo plantado, última cosecha y certificación vigente. Sin filtro de fechas.
            </p>
          )}

          {informeError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">{informeError}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={onGenerar}
            disabled={generandoInforme || (informeFincaTipo === 'sector' && !informeSector)}
            className="w-full py-2.5 rounded-lg bg-[#6d9b7d]/20 border border-[#6d9b7d]/40 hover:bg-[#6d9b7d]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-[11px] font-black uppercase tracking-widest text-[#6d9b7d] flex items-center justify-center gap-2"
          >
            {generandoInforme ? (
              <>
                <div className="w-4 h-4 border-2 border-[#6d9b7d] border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generar PDF
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
