import { generarPDFCorporativoBase } from '@/utils/pdfUtils'
import { horasTrabajoLabel } from '@/utils/horasTrabajo'
import type { TrazabilidadTimelineEvent } from '@/components/Trazabilidad/trazabilidadTypes'

export async function trazabilidadGenerarPdfTimeline(params: {
  timelineData: TrazabilidadTimelineEvent[]
  timelineParcela: string
  timelineFinca: string
  firmaPdf: string
  setGenerandoPDF: (v: boolean) => void
}): Promise<void> {
  const { timelineData, timelineParcela, timelineFinca, firmaPdf, setGenerandoPDF } = params
  setGenerandoPDF(true)
  try {
    await generarPDFCorporativoBase({
      titulo: `Trazabilidad Completa — ${timelineParcela}`,
      subtitulo: `Finca: ${timelineFinca}`,
      fecha: new Date(),
      filename: `Trazabilidad_${timelineParcela}_${new Date().toISOString().slice(0, 10)}.pdf`,
      firmaNombre: firmaPdf,
      bloques: [
        async ctx => {
          ctx.writeLabel('RESUMEN DE TRAZABILIDAD', 11)
          ctx.separator()
          const evs = [...timelineData].sort((a, b) => a.date.getTime() - b.date.getTime())
          if (evs.length === 0) {
            ctx.writeLine('Sin eventos', 'No hay registros para esta parcela.')
            return
          }
          for (const ev of evs) {
            ctx.checkPage(12)
            const dStr = ev.date.toLocaleDateString('es-ES')
            const e = ev.data
            const label = ev.type.toUpperCase()
            let detail = ''

            if (ev.type === 'suelo') {
              detail = `pH: ${e.ph ?? '-'} | EC: ${e.conductividad_ec ?? '-'} | MO: ${e.materia_organica ?? '-'}%`
            } else if (ev.type === 'plantacion') {
              detail = `Cultivo: ${e.crop ?? '—'} | Variedad: ${e.variedad || 'N/D'}`
            } else if (ev.type === 'trabajo') {
              const tipo = e.work_type ?? e.tipo_trabajo ?? '—'
              const horas = horasTrabajoLabel({
                hours_worked: e.hours_worked,
                horas_calculadas: e.horas_calculadas,
                hora_entrada: e.hora_entrada,
                hora_salida: e.hora_salida,
              })
              detail = `${tipo} | ${e.cuadrillas?.nombre || e.nombres_operarios || 'Sin operarios'} | ${horas}`
            } else if (ev.type === 'riego') {
              const m3 = Number(e.volumen_m3) || 0
              detail =
                m3 > 0 ? `${Math.round(m3 * 1000).toLocaleString()} L (~${m3.toFixed(2)} m³)` : 'Sin volumen registrado'
            } else if (ev.type === 'sensor') {
              detail = `NDVI: ${e.ndvi ?? '-'} | SPAD: ${e.clorofila ?? '-'}`
            } else if (ev.type === 'cosecha') {
              detail = `${e.production_kg || 0} kg recolectados`
            } else if (ev.type === 'palot') {
              const codigo = e.numero_palot ?? ''
              detail = `Nº: ${codigo ? codigo.split('-')[0] : '—'} | Peso: ${e.peso_kg || 0} kg`
            } else if (ev.type === 'movimiento') {
              const tipoMov = (e.tipo_movimiento ?? e.tipo ?? '').replace(/_/g, ' ')
              detail = `${tipoMov} | Vehículo: ${e.camiones?.matricula || 'N/D'}`
            }

            ctx.entryHeader(label[0] || 'E', label, dStr)
            ctx.writeLine('Detalle', detail)
          }
        },
      ],
    })
  } catch (e) {
    console.error(e)
  } finally {
    setGenerandoPDF(false)
  }
}
