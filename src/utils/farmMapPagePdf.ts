import { supabase } from '@/integrations/supabase/client'
import { generarPDFCorporativoBase, PDF_COLORS } from '@/utils/pdfUtils'
import type { ParcelFeature } from '@/types/farm'
import type { InformeFincaTipo, InformeTipoDato } from '@/components/FarmMap/farmMapConstants'

export type FarmMapPdfCtx = {
  firmaPdf: string
  decodedFarm: string
  parcels: ParcelFeature[]
  informeFincaTipo: InformeFincaTipo
  informeSector: string
  informeTipoDato: InformeTipoDato
  informeFechaInicio: string
  informeFechaFin: string
}

export async function farmMapGenerarPDFFinca(ctx: FarmMapPdfCtx): Promise<void> {
  const {
    firmaPdf,
    decodedFarm,
    parcels,
    informeFincaTipo,
    informeSector,
    informeFechaInicio,
    informeFechaFin,
  } = ctx

  const sectorNombre = (pid: string) =>
    parcels.find(p => p.properties.parcel_id === pid)?.properties.parcela ?? pid

  await generarPDFCorporativoBase({
    titulo: 'INFORME DE FINCA',
    subtitulo: `Finca: ${decodedFarm} | Período: ${informeFechaInicio} a ${informeFechaFin}`,
    fecha: new Date(),
    filename: `Finca_${decodedFarm.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
    accentColor: PDF_COLORS.green,
    firmaNombre: firmaPdf,
    bloques: [
      async ctxB => {
        if (informeFincaTipo === 'sector') {
          ctxB.writeLine('Sector', sectorNombre(informeSector))
          ctxB.separator()

          const { data: trabajos } = await supabase
            .from('work_records')
            .select('*, cuadrillas(nombre)')
            .eq('parcel_id', informeSector)
            .gte('date', informeFechaInicio)
            .lte('date', informeFechaFin)
            .order('date', { ascending: false })
          ctxB.writeLabel('TRABAJOS', 11)
          if (!trabajos?.length) {
            ctxB.writeLine('Estado', 'Sin registros en el periodo.')
          } else {
            trabajos.forEach(r => {
              ctxB.writeLine(`Fecha: ${r.date ?? '—'}`, `Tipo: ${r.work_type ?? '—'}`)
              if (r.notas) ctxB.writeLine('Notas', r.notas)
              ctxB.separator()
            })
          }
        } else {
          ctxB.writeLine('Estado', 'Reporte consolidado de sectores')
        }
      },
    ],
  })
}
