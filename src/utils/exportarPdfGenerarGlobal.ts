import { initPdf, PDF_COLORS, pdfCorporateSection, pdfCorporateTable } from '@/utils/pdfUtils'
import { formatFechaLarga } from '@/utils/dateFormat'
import { exportarPdfModuloLabel } from '@/components/ExportarPDF/exportarPdfConstants'
import {
  cargarCampo,
  cargarDatosPartes,
  cargarLogistica,
  cargarMaquinaria,
  cargarPersonal,
  cargarTrabajos,
} from '@/utils/exportarPdfDataLoaders'

export async function generarPDFGlobal(desde: string, hasta: string, modulosSeleccionados: Set<string>) {
  const { doc, ctx } = await initPdf(PDF_COLORS.accent)

  const rangoLabel = `${new Date(desde).toLocaleDateString('es-ES')} — ${new Date(hasta).toLocaleDateString('es-ES')}`

  ctx.addPageHeader('INFORME GLOBAL', rangoLabel)
  ctx.writeLabel(`Módulos incluidos: ${[...modulosSeleccionados].map(exportarPdfModuloLabel).join(', ')}`, 8)
  ctx.writeLabel(`Generado: ${new Date().toLocaleString('es-ES')}`, 8)
  ctx.separator()

  if (modulosSeleccionados.has('parte_diario')) {
    const partesDatos = await cargarDatosPartes(desde, hasta)
    if (partesDatos.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('PARTE DIARIO', 11)
      ctx.separator()

      for (const { parte, estados, trabajos, personales, residuos } of partesDatos) {
        ctx.checkPage(14)
        ctx.entryHeader('FECHA', formatFechaLarga(parte.fecha), '')
        const total = estados.length + trabajos.length + personales.length + residuos.length
        ctx.writeLine('Entradas', String(total))
        if (parte.notas_generales) ctx.writeLine('Notas', parte.notas_generales)

        for (const e of estados) {
          ctx.checkPage(10)
          ctx.writeLine('A · Estado', `${e.finca}${e.parcel_id ? ` · ${e.parcel_id}` : ''} — ${e.estado ?? ''}`)
          if (e.num_operarios) ctx.writeLine('Operarios', String(e.num_operarios))
        }
        for (const t of trabajos) {
          ctx.checkPage(10)
          ctx.writeLine('B · Trabajo', `${t.tipo_trabajo ?? ''} — ${t.finca ?? ''}`)
          if (t.num_operarios) ctx.writeLine('Operarios', String(t.num_operarios))
        }
        for (const p of personales) {
          ctx.checkPage(8)
          ctx.writeLine('C · Personal', p.texto ?? '')
        }
        for (const r of residuos) {
          ctx.checkPage(8)
          ctx.writeLine('D · Residuos', `${r.nombre_conductor ?? ''} → ${r.nombre_ganadero ?? ''}`)
        }
        ctx.separator()
      }
    }
  }

  if (modulosSeleccionados.has('trabajos')) {
    const { registros, incidencias } = await cargarTrabajos(desde, hasta)
    if (registros.length + incidencias.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('TRABAJOS', 11)
      ctx.separator()

      ctx.kpiRow([
        { label: 'Registros', value: registros.length },
        { label: 'Incidencias', value: incidencias.length },
      ])

      for (const r of registros) {
        ctx.checkPage(10)
        ctx.writeLine(r.fecha, `${r.tipo_trabajo ?? r.tipo_bloque} — ${r.finca ?? ''}`)
        if (r.num_operarios) ctx.writeLine('Operarios', String(r.num_operarios))
      }
      ctx.separator()

      for (const inc of incidencias) {
        ctx.checkPage(10)
        ctx.writeLine(inc.urgente ? '⚠ URGENTE' : 'Incidencia', `${inc.titulo} — ${inc.estado}`)
        if (inc.finca) ctx.writeLine('Finca', inc.finca)
      }
      ctx.separator()
    }
  }

  if (modulosSeleccionados.has('maquinaria')) {
    const { usos, mantenimientos } = await cargarMaquinaria(desde, hasta)
    if (usos.length + mantenimientos.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('MAQUINARIA', 11)
      ctx.separator()

      const totalH = usos.reduce((s, u) => s + (u.horas_trabajadas ?? 0), 0)
      const totalL = usos.reduce((s, u) => s + (u.gasolina_litros ?? 0), 0)
      ctx.kpiRow([
        { label: 'Usos', value: usos.length },
        { label: 'Horas', value: totalH.toFixed(1) },
        { label: 'Gasoil (L)', value: totalL.toFixed(1) },
        { label: 'Mant.', value: mantenimientos.length },
      ])

      for (const u of usos) {
        ctx.checkPage(8)
        const mat = u.maquinaria_tractores?.matricula ?? '—'
        ctx.writeLine(u.fecha, `${u.tipo_trabajo ?? 'Uso'} · ${mat} · ${u.tractorista ?? ''}`)
        if (u.horas_trabajadas) ctx.writeLine('Horas', String(u.horas_trabajadas))
      }
      ctx.separator()
    }
  }

  if (modulosSeleccionados.has('logistica')) {
    const { viajes, mantenimientos } = await cargarLogistica(desde, hasta)
    if (viajes.length + mantenimientos.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('LOGÍSTICA', 11)
      ctx.separator()

      const totalKm = viajes.reduce((s: number, v: { km_recorridos?: number | null }) => s + (v.km_recorridos ?? 0), 0)
      ctx.kpiRow([
        { label: 'Viajes', value: viajes.length },
        { label: 'Km total', value: totalKm.toFixed(0) },
        { label: 'Mant.', value: mantenimientos.length },
      ])

      for (const v of viajes) {
        ctx.checkPage(8)
        const fecha = v.hora_salida ? v.hora_salida.slice(0, 10) : '—'
        ctx.writeLine(fecha, `${v.trabajo_realizado ?? 'Viaje'} → ${v.destino ?? ''}`)
        if (v.km_recorridos) ctx.writeLine('Km', String(v.km_recorridos))
      }
      ctx.separator()
    }
  }

  if (modulosSeleccionados.has('personal')) {
    const { personal, externos } = await cargarPersonal(desde, hasta)
    if (personal.length + externos.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('PERSONAL (Altas en el periodo)', 11)
      ctx.separator()

      ctx.kpiRow([
        { label: 'Nuevos Internos', value: personal.length },
        { label: 'Nuevos Externos', value: externos.length },
      ])

      if (personal.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Personal Interno')
        pdfCorporateTable(
          ctx,
          ['FECHA ALTA', 'NOMBRE', 'DNI/NIF', 'CATEGORÍA', 'TELÉFONO'],
          [25, 45, 25, 45, 30],
          personal.map(p => [
            p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : '—',
            p.nombre,
            p.dni ?? '—',
            p.categoria.replace(/_/g, ' ').toUpperCase(),
            p.telefono ?? '—',
          ]),
        )
      }

      if (externos.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Personal Externo')
        pdfCorporateTable(
          ctx,
          ['FECHA REGISTRO', 'EMPRESA / NOMBRE', 'NIF', 'TIPO', 'TELÉFONO'],
          [30, 50, 25, 35, 30],
          externos.map(e => [
            e.created_at ? new Date(e.created_at).toLocaleDateString('es-ES') : '—',
            e.nombre_empresa,
            e.nif ?? '—',
            e.tipo.replace(/_/g, ' ').toUpperCase(),
            e.telefono_contacto ?? '—',
          ]),
        )
      }
      ctx.separator()
    }
  }

  if (modulosSeleccionados.has('campo')) {
    const { estados, plantaciones, cosechas } = await cargarCampo(desde, hasta)
    if (estados.length + plantaciones.length + cosechas.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('CAMPO / PARCELAS', 11)
      ctx.separator()

      ctx.kpiRow([
        { label: 'Reg. Estados', value: estados.length },
        { label: 'Plantaciones', value: plantaciones.length },
        { label: 'Cosechas', value: cosechas.length },
      ])

      if (estados.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Estados de Parcela')
        pdfCorporateTable(ctx, ['FECHA', 'PARCELA', 'ESTADO', 'OBSERVACIONES'], [25, 30, 30, 85], estados.map(e => [
          e.fecha ? new Date(e.fecha).toLocaleDateString('es-ES') : '—',
          e.parcel_id ?? '—',
          (e.estado ?? '—').toUpperCase(),
          e.observaciones ?? '—',
        ]))
      }

      if (plantaciones.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Plantaciones')
        pdfCorporateTable(ctx, ['FECHA', 'PARCELA', 'CULTIVO', 'VARIEDAD', 'COSECHA EST.'], [25, 30, 40, 40, 35], plantaciones.map(p => [
          p.date ? new Date(p.date).toLocaleDateString('es-ES') : '—',
          p.parcel_id ?? '—',
          p.crop,
          p.variedad ?? '—',
          p.fecha_cosecha_estimada ? new Date(p.fecha_cosecha_estimada).toLocaleDateString('es-ES') : '—',
        ]))
      }

      if (cosechas.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Cosechas')
        pdfCorporateTable(ctx, ['FECHA', 'PARCELA', 'CULTIVO', 'PRODUCCIÓN (KG)'], [25, 35, 50, 40], cosechas.map(c => [
          c.date ? new Date(c.date).toLocaleDateString('es-ES') : '—',
          c.parcel_id ?? '—',
          c.crop,
          c.production_kg ? c.production_kg.toLocaleString() : '—',
        ]))
      }
      ctx.separator()
    }
  }

  ctx.footer()
  doc.save(`Informe_Global_Marvic_${desde}_${hasta}.pdf`)
}
