import { supabase } from '@/integrations/supabase/client'
import { initPdf, PDF_COLORS, pdfCorporateSection, pdfCorporateTable, PDF_MARGIN } from '@/utils/pdfUtils'
import { matchHarvestsToPlantings } from '@/utils/harvestPlantingMatch'

export async function generarPDFAgronomico(tipo: string, desde: string, hasta: string, fincaFiltro: string) {
  const { doc, ctx } = await initPdf(PDF_COLORS.green)
  const rangoLabel = `${new Date(desde).toLocaleDateString('es-ES')} — ${new Date(hasta).toLocaleDateString('es-ES')}`
  const titulo =
    tipo === 'suelo'
      ? 'ANÁLISIS DE SUELO'
      : tipo === 'produccion'
        ? 'PRODUCCIÓN Y COSECHA'
        : tipo === 'certificacion'
          ? 'CERTIFICACIÓN ECOLÓGICA'
          : tipo === 'residuos'
            ? 'RESIDUOS Y PLÁSTICOS'
            : 'EFICIENCIA HÍDRICA'

  ctx.addPageHeader(titulo, rangoLabel)
  ctx.writeLabel(`Finca: ${fincaFiltro || 'Todas las fincas'}`, 9)
  ctx.separator()

  let qParcels = supabase.from('parcels').select('parcel_id, parcel_number, farm')
  if (fincaFiltro) qParcels = qParcels.eq('farm', fincaFiltro)
  const { data: parcels } = await qParcels
  const parcelMap = new Map(parcels?.map(p => [p.parcel_id, p]) || [])
  const parcelIds = Array.from(parcelMap.keys())

  if (parcelIds.length === 0) {
    ctx.writeLabel('No hay parcelas para la finca seleccionada.')
    ctx.footer()
    doc.save(`${titulo}_${desde}.pdf`)
    return
  }

  if (tipo === 'suelo') {
    const { data: analisis } = await supabase
      .from('analisis_suelo')
      .select('*')
      .in('parcel_id', parcelIds)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true })
    if (!analisis?.length) {
      ctx.writeLabel('Sin registros de análisis de suelo en este período.')
      ctx.footer()
      doc.save(`Suelo.pdf`)
      return
    }

    pdfCorporateSection(ctx, 'Histórico de Análisis')
    pdfCorporateTable(ctx, ['PARCELA', 'FECHA', 'pH', 'EC', 'N', 'P', 'K', 'MO%'], [35, 25, 15, 15, 15, 15, 15, 15], analisis.map(a => [
      parcelMap.get(a.parcel_id!)?.parcel_number || a.parcel_id || '—',
      a.fecha ? new Date(a.fecha).toLocaleDateString('es-ES') : '—',
      a.ph?.toString() || '-',
      a.conductividad_ec?.toString() || '-',
      a.nitrogeno_ppm?.toString() || '-',
      a.fosforo_ppm?.toString() || '-',
      a.potasio_ppm?.toString() || '-',
      a.materia_organica?.toString() || '-',
    ]))
    ctx.separator()

    const porParcela = new Map<string, typeof analisis>()
    for (const a of analisis) {
      if (!a.parcel_id || !a.ph) continue
      if (!porParcela.has(a.parcel_id)) porParcela.set(a.parcel_id, [])
      porParcela.get(a.parcel_id)!.push(a)
    }

    for (const [pid, records] of porParcela.entries()) {
      if (records.length > 1) {
        ctx.checkPage(40)
        ctx.writeLabel(`Evolución pH — Sector ${parcelMap.get(pid)?.parcel_number || pid}`, 10)
        const startY = ctx.y + 2
        const phValues = records.map(r => r.ph!)
        const min = Math.min(...phValues) - 0.5
        const max = Math.max(...phValues) + 0.5
        const range = max - min || 1
        const stepX = 120 / (phValues.length - 1)

        doc.setDrawColor(34, 197, 94)
        doc.setLineWidth(0.5)
        for (let i = 0; i < phValues.length - 1; i++) {
          const x1 = PDF_MARGIN + i * stepX
          const y1 = startY + 20 - ((phValues[i] - min) / range) * 20
          const x2 = PDF_MARGIN + (i + 1) * stepX
          const y2 = startY + 20 - ((phValues[i + 1] - min) / range) * 20
          doc.line(x1, y1, x2, y2)
          doc.circle(x1, y1, 1, 'FD')
          if (i === phValues.length - 2) doc.circle(x2, y2, 1, 'FD')
        }
        doc.setFontSize(7)
        doc.text(`Min: ${Math.min(...phValues).toFixed(1)} | Max: ${Math.max(...phValues).toFixed(1)}`, PDF_MARGIN, startY + 28)
        ctx.y += 35
      }
    }
  } else if (tipo === 'produccion') {
    const { data: rawHarvests } = await supabase
      .from('harvests')
      .select('*')
      .in('parcel_id', parcelIds)
      .order('date', { ascending: false })
    const { data: plantingsData } = await supabase.from('plantings').select('parcel_id, crop, variedad, date').in('parcel_id', parcelIds)
    const harvests = matchHarvestsToPlantings(rawHarvests || [], plantingsData || [])
    const { data: tickets } = await supabase
      .from('tickets_pesaje')
      .select('harvest_id, destino')
      .in('harvest_id', harvests.map(h => h.id))
    const ticketMap = new Map(tickets?.map(t => [t.harvest_id, t.destino]) || [])

    if (!harvests.length) {
      ctx.writeLabel('Sin cosechas en este período.')
      ctx.footer()
      doc.save(`Produccion.pdf`)
      return
    }
    const totalKg = harvests.reduce((acc, h) => acc + (h.production_kg || 0), 0)
    ctx.kpiRow([{ label: 'Total Cosechado', value: `${totalKg.toLocaleString()} Kg` }])
    ctx.separator()

    pdfCorporateTable(ctx, ['PARCELA', 'CULTIVO', 'VARIEDAD', 'FECHA', 'KG', 'DESTINO'], [30, 30, 25, 25, 20, 40], harvests.map(h => [
      parcelMap.get(h.parcel_id)?.parcel_number || h.parcel_id,
      h.crop,
      h.variedad || '—',
      h.date ? new Date(h.date).toLocaleDateString('es-ES') : '—',
      h.production_kg?.toLocaleString() || '0',
      ticketMap.get(h.id) || '—',
    ]))
  } else if (tipo === 'certificacion') {
    const { data: certs } = await supabase
      .from('certificaciones_parcela')
      .select('*')
      .in('parcel_id', parcelIds)
      .order('fecha_fin', { ascending: true })
    if (!certs?.length) {
      ctx.writeLabel('Sin certificaciones.')
      ctx.footer()
      doc.save(`Certificaciones.pdf`)
      return
    }
    pdfCorporateTable(ctx, ['PARCELA', 'ENTIDAD', 'ESTADO', 'VENCIMIENTO'], [40, 50, 40, 40], certs.map(c => {
      const estadoText = c.estado !== 'vigente' ? `${c.estado.toUpperCase()} ⚠` : 'Vigente'
      return [
        parcelMap.get(c.parcel_id)?.parcel_number || c.parcel_id,
        c.entidad_certificadora,
        estadoText,
        c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString('es-ES') : '—',
      ]
    }))
  } else if (tipo === 'residuos') {
    const { data: res } = await supabase
      .from('residuos_operacion')
      .select('*')
      .in('parcel_id', parcelIds)
      .gte('created_at', `${desde}T00:00:00`)
      .lte('created_at', `${hasta}T23:59:59`)
    if (!res?.length) {
      ctx.writeLabel('Sin residuos.')
      ctx.footer()
      doc.save(`Residuos.pdf`)
      return
    }
    pdfCorporateTable(ctx, ['PARCELA', 'TIPO', 'INSTALADO', 'RETIRADO', 'PENDIENTE'], [35, 45, 30, 30, 30], res.map(r => [
      parcelMap.get(r.parcel_id)?.parcel_number || r.parcel_id,
      r.tipo_residuo.replace(/_/g, ' '),
      `${r.kg_instalados || 0} kg`,
      `${r.kg_retirados || 0} kg`,
      `${Math.max(0, (r.kg_instalados || 0) - (r.kg_retirados || 0))} kg ⚠`,
    ]))
  } else if (tipo === 'hidrica') {
    const { data: zonasRiego } = await supabase.from('sistema_riego_zonas').select('id, parcel_id').in('parcel_id', parcelIds)
    const zonaToParcel = new Map((zonasRiego ?? []).map(z => [z.id, z.parcel_id]))
    const zonaIds = [...zonaToParcel.keys()]

    const { data: cosechaRows } = await supabase
      .from('harvests')
      .select('parcel_id, production_kg')
      .in('parcel_id', parcelIds)
      .gte('date', desde)
      .lte('date', hasta)

    let registrosRiegoRows: { zona_id: string | null; volumen_m3: number | null; fecha: string | null }[] = []
    if (zonaIds.length > 0) {
      const { data } = await supabase
        .from('registros_riego')
        .select('zona_id, volumen_m3, fecha')
        .in('zona_id', zonaIds)
        .gte('fecha', desde)
        .lte('fecha', hasta)
      registrosRiegoRows = data ?? []
    }

    const litrosMap = new Map<string, number>()
    const kgMap = new Map<string, number>()
    registrosRiegoRows.forEach(r => {
      const pid = r.zona_id ? zonaToParcel.get(r.zona_id) : null
      if (!pid) return
      const m3 = Number(r.volumen_m3) || 0
      const litros = m3 * 1000
      litrosMap.set(pid, (litrosMap.get(pid) || 0) + litros)
    })
    cosechaRows?.forEach(r => {
      if (!r.parcel_id) return
      kgMap.set(r.parcel_id, (kgMap.get(r.parcel_id) || 0) + (r.production_kg || 0))
    })

    const filas: string[][] = []
    let totalL = 0
    let totalKg = 0
    parcelIds.forEach(pid => {
      const l = litrosMap.get(pid) || 0
      const k = kgMap.get(pid) || 0
      if (l > 0 || k > 0) {
        totalL += l
        totalKg += k
        filas.push([
          parcelMap.get(pid)?.parcel_number || pid,
          `${l.toLocaleString()} L`,
          `${k.toLocaleString()} Kg`,
          k > 0 ? `${(l / k).toFixed(2)} L/Kg` : '—',
        ])
      }
    })

    ctx.kpiRow([
      { label: 'Litros Totales', value: totalL.toLocaleString() },
      { label: 'Eficiencia Global', value: totalKg > 0 ? `${(totalL / totalKg).toFixed(2)} L/Kg` : '—' },
    ])
    ctx.separator()
    if (!filas.length) ctx.writeLabel('Sin datos de riego/cosecha en el período.')
    else pdfCorporateTable(ctx, ['PARCELA', 'LITROS RIEGO', 'KG COSECHA', 'RATIO (L/Kg)'], [50, 40, 40, 40], filas)
  }

  ctx.footer()
  doc.save(`Informe_${titulo.replace(/ /g, '_')}_${desde}.pdf`)
}
