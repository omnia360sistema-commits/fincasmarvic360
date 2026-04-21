import React from 'react'
import {
  FlaskConical,
  Sprout,
  Wrench,
  Droplets,
  Activity,
  Wheat,
  Package,
  Truck,
  CalendarClock,
  AlertCircle,
} from 'lucide-react'
import { horasTrabajoLabel } from '@/utils/horasTrabajo'
import type { DbRow, TrazabilidadTimelineMissingFlags } from '@/components/Trazabilidad/trazabilidadTypes'

export function getTrazabilidadTimelineIcon(type: string) {
  switch (type) {
    case 'suelo':
      return <FlaskConical className="w-4 h-4 text-emerald-400" />
    case 'plantacion':
      return <Sprout className="w-4 h-4 text-green-400" />
    case 'trabajo':
      return <Wrench className="w-4 h-4 text-amber-400" />
    case 'riego':
      return <Droplets className="w-4 h-4 text-emerald-500" />
    case 'sensor':
      return <Activity className="w-4 h-4 text-purple-400" />
    case 'cosecha':
      return <Wheat className="w-4 h-4 text-yellow-400" />
    case 'palot':
      return <Package className="w-4 h-4 text-emerald-400" />
    case 'movimiento':
      return <Truck className="w-4 h-4 text-indigo-400" />
    default:
      return <CalendarClock className="w-4 h-4 text-slate-400" />
  }
}

export function renderTrazabilidadTimelineEventInfo(ev: { type: string; data: DbRow }) {
  const e = ev.data
  switch (ev.type) {
    case 'suelo':
      return (
        <>
          <span className="font-bold text-slate-300">Análisis:</span> pH {e.ph ?? '-'} | EC {e.conductividad_ec ?? '-'}
        </>
      )
    case 'plantacion':
      return (
        <>
          <span className="font-bold text-slate-300">Plantación:</span> {e.crop ?? '—'} ({e.variedad || 'Sin variedad'})
        </>
      )
    case 'trabajo': {
      const tipo = e.work_type ?? e.tipo_trabajo ?? '—'
      const horas = horasTrabajoLabel({
        hours_worked: e.hours_worked,
        horas_calculadas: e.horas_calculadas,
        hora_entrada: e.hora_entrada,
        hora_salida: e.hora_salida,
      })
      return (
        <>
          <span className="font-bold text-slate-300">Trabajo:</span> {tipo} |{' '}
          {e.cuadrillas?.nombre || e.nombres_operarios || '-'} | {horas}
        </>
      )
    }
    case 'riego': {
      const m3 = Number(e.volumen_m3) || 0
      return (
        <>
          <span className="font-bold text-slate-300">Riego:</span>{' '}
          {m3 > 0 ? `${Math.round(m3 * 1000).toLocaleString()} L (~${m3.toFixed(2)} m³)` : 'Sin volumen'}
        </>
      )
    }
    case 'sensor':
      return (
        <>
          <span className="font-bold text-slate-300">Sensor:</span> NDVI {e.ndvi ?? '-'} | SPAD {e.clorofila ?? '-'}
        </>
      )
    case 'cosecha':
      return (
        <>
          <span className="font-bold text-slate-300">Cosecha:</span> {e.production_kg || 0} kg
        </>
      )
    case 'palot': {
      const codigo = e.numero_palot ?? ''
      return (
        <>
          <span className="font-bold text-slate-300">Palot creado:</span> Nº {codigo ? codigo.split('-')[0] : '—'} |{' '}
          {e.peso_kg || 0} kg
        </>
      )
    }
    case 'movimiento': {
      const tipoMov = (e.tipo_movimiento ?? e.tipo ?? '').replace(/_/g, ' ')
      return (
        <>
          <span className="font-bold text-slate-300">Movimiento:</span> {tipoMov} | {e.camiones?.matricula || '-'}
        </>
      )
    }
    default:
      return null
  }
}

export function TrazabilidadTimelineMissingBadges({ missingFlags }: { missingFlags: TrazabilidadTimelineMissingFlags }) {
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {missingFlags.suelo && (
        <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Sin Análisis Suelo
        </span>
      )}
      {missingFlags.plantacion && (
        <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Sin Plantación
        </span>
      )}
      {missingFlags.cosecha && (
        <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Sin Cosecha
        </span>
      )}
      {missingFlags.palot && (
        <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Sin Palots
        </span>
      )}
    </div>
  )
}
