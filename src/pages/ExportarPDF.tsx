import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, FileText, Download, Loader2,
  Tractor, Truck, Wrench, User, Leaf, ClipboardList, Check,
  BarChart3, Droplets, ShieldCheck, Sprout, Trash2
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { initPdf, PDF_COLORS, pdfCorporateSection, pdfCorporateTable, PDF_MARGIN } from '@/utils/pdfUtils'
import { formatFechaLarga } from '@/utils/dateFormat'
import { FINCAS_NOMBRES as FINCAS } from '@/constants/farms'

// ── Módulos seleccionables ────────────────────────────────────────────────────

interface ModuloExport {
  id:     string
  label:  string
  icon:   React.ElementType
  color:  [number, number, number]
}

const MODULOS: ModuloExport[] = [
  { id: 'parte_diario', label: 'Parte Diario',  icon: ClipboardList, color: PDF_COLORS.green   },
  { id: 'trabajos',     label: 'Trabajos',       icon: Wrench,        color: PDF_COLORS.amber   },
  { id: 'maquinaria',   label: 'Maquinaria',     icon: Tractor,       color: PDF_COLORS.orange  },
  { id: 'logistica',    label: 'Logística',       icon: Truck,         color: PDF_COLORS.violet  },
  { id: 'personal',     label: 'Personal',        icon: User,          color: PDF_COLORS.fuchsia },
  { id: 'campo',        label: 'Campo / Parcelas',icon: Leaf,          color: PDF_COLORS.green   },
]

// ── Carga de datos por módulo ─────────────────────────────────────────────────

async function cargarDatosPartes(desde: string, hasta: string) {
  const { data: partes } = await supabase
    .from('partes_diarios')
    .select('id, fecha, responsable, notas_generales')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha')
  if (!partes?.length) return []

  const ids = partes.map(p => p.id)
  const [estRes, trabRes, persRes, resRes] = await Promise.all([
    supabase.from('parte_estado_finca').select('*').in('parte_id', ids).order('created_at'),
    supabase.from('parte_trabajo').select('*').in('parte_id', ids).order('hora_inicio'),
    supabase.from('parte_personal').select('*').in('parte_id', ids).order('fecha_hora'),
    supabase.from('parte_residuos_vegetales').select('*').in('parte_id', ids).order('hora_salida_nave'),
  ])

  return partes.map(p => ({
    parte: p,
    estados:   (estRes.data  ?? []).filter(e => e.parte_id === p.id),
    trabajos:  (trabRes.data ?? []).filter(t => t.parte_id === p.id),
    personales:(persRes.data ?? []).filter(x => x.parte_id === p.id),
    residuos:  (resRes.data  ?? []).filter(r => r.parte_id === p.id),
  }))
}

async function cargarTrabajos(desde: string, hasta: string) {
  const [regRes, incRes] = await Promise.all([
    supabase.from('trabajos_registro').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha').limit(500),
    supabase.from('trabajos_incidencias').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha').limit(200),
  ])
  return { registros: regRes.data ?? [], incidencias: incRes.data ?? [] }
}

async function cargarMaquinaria(desde: string, hasta: string) {
  const [usoRes, mantRes] = await Promise.all([
    (supabase as any).from('maquinaria_uso').select('*, maquinaria_tractores(matricula, marca)').gte('fecha', desde).lte('fecha', hasta).order('fecha').limit(300),
    supabase.from('maquinaria_mantenimiento').select('*, maquinaria_tractores(matricula)').gte('fecha', desde).lte('fecha', hasta).order('fecha').limit(200),
  ])
  return { usos: usoRes.data ?? [], mantenimientos: mantRes.data ?? [] }
}

async function cargarLogistica(desde: string, hasta: string) {
  const [viajesRes, mantRes] = await Promise.all([
    supabase.from('logistica_viajes').select('*').gte('hora_salida', desde).lte('hora_salida', hasta + 'T23:59:59').order('hora_salida').limit(300),
    supabase.from('logistica_mantenimiento').select('*, camiones(matricula)').gte('fecha', desde).lte('fecha', hasta).order('fecha').limit(100),
  ])
  return { viajes: viajesRes.data ?? [], mantenimientos: mantRes.data ?? [] }
}

async function cargarPersonal(desde: string, hasta: string) {
  const [persRes, extRes] = await Promise.all([
    supabase.from('personal').select('*').gte('created_at', desde).lte('created_at', hasta + 'T23:59:59').order('created_at'),
    supabase.from('personal_externo').select('*').gte('created_at', desde).lte('created_at', hasta + 'T23:59:59').order('created_at')
  ])
  return { personal: persRes.data ?? [], externos: extRes.data ?? [] }
}

async function cargarCampo(desde: string, hasta: string) {
  const [estRes, planRes, harvRes] = await Promise.all([
    supabase.from('registros_estado_parcela').select('*').gte('fecha', desde).lte('fecha', hasta).order('fecha'),
    supabase.from('plantings').select('*').gte('date', desde).lte('date', hasta).order('date'),
    supabase.from('harvests').select('*').gte('date', desde).lte('date', hasta).order('date')
  ])
  return { estados: estRes.data ?? [], plantaciones: planRes.data ?? [], cosechas: harvRes.data ?? [] }
}

// ── Generador PDF ─────────────────────────────────────────────────────────────

async function generarPDFGlobal(
  desde: string,
  hasta: string,
  modulosSeleccionados: Set<string>
) {
  const { doc, ctx } = await initPdf(PDF_COLORS.accent)

  const rangoLabel = `${new Date(desde).toLocaleDateString('es-ES')} — ${new Date(hasta).toLocaleDateString('es-ES')}`

  // Portada
  ctx.addPageHeader('INFORME GLOBAL', rangoLabel)
  ctx.writeLabel(`Módulos incluidos: ${[...modulosSeleccionados].map(id => MODULOS.find(m => m.id === id)?.label ?? id).join(', ')}`, 8)
  ctx.writeLabel(`Generado: ${new Date().toLocaleString('es-ES')}`, 8)
  ctx.separator()

  // ── PARTE DIARIO ──
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

  // ── TRABAJOS ──
  if (modulosSeleccionados.has('trabajos')) {
    const { registros, incidencias } = await cargarTrabajos(desde, hasta)
    if (registros.length + incidencias.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('TRABAJOS', 11)
      ctx.separator()

      ctx.kpiRow([
        { label: 'Registros',   value: registros.length   },
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

  // ── MAQUINARIA ──
  if (modulosSeleccionados.has('maquinaria')) {
    const { usos, mantenimientos } = await cargarMaquinaria(desde, hasta)
    if (usos.length + mantenimientos.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('MAQUINARIA', 11)
      ctx.separator()

      const totalH = usos.reduce((s: number, u: { horas_trabajadas?: number | null }) => s + (u.horas_trabajadas ?? 0), 0)
      const totalL = usos.reduce((s: number, u: { gasolina_litros?: number | null }) => s + (u.gasolina_litros ?? 0), 0)
      ctx.kpiRow([
        { label: 'Usos',        value: usos.length        },
        { label: 'Horas',       value: totalH.toFixed(1)  },
        { label: 'Gasoil (L)',  value: totalL.toFixed(1)  },
        { label: 'Mant.',       value: mantenimientos.length },
      ])

      for (const u of usos) {
        ctx.checkPage(8)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mat = (u as any).maquinaria_tractores?.matricula ?? '—'
        ctx.writeLine(u.fecha, `${u.tipo_trabajo ?? 'Uso'} · ${mat} · ${u.tractorista ?? ''}`)
        if (u.horas_trabajadas) ctx.writeLine('Horas', String(u.horas_trabajadas))
      }
      ctx.separator()
    }
  }

  // ── LOGÍSTICA ──
  if (modulosSeleccionados.has('logistica')) {
    const { viajes, mantenimientos } = await cargarLogistica(desde, hasta)
    if (viajes.length + mantenimientos.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('LOGÍSTICA', 11)
      ctx.separator()

      const totalKm = viajes.reduce((s: number, v: { km_recorridos?: number | null }) => s + (v.km_recorridos ?? 0), 0)
      ctx.kpiRow([
        { label: 'Viajes',    value: viajes.length       },
        { label: 'Km total',  value: totalKm.toFixed(0)  },
        { label: 'Mant.',     value: mantenimientos.length },
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

  // ── PERSONAL ──
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
        pdfCorporateTable(ctx,
          ['FECHA ALTA', 'NOMBRE', 'DNI/NIF', 'CATEGORÍA', 'TELÉFONO'],
          [25, 45, 25, 45, 30],
          personal.map(p => [
            p.fecha_alta ? new Date(p.fecha_alta).toLocaleDateString('es-ES') : (p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : '—'),
            p.nombre, p.dni ?? '—', p.categoria.replace(/_/g, ' ').toUpperCase(), p.telefono ?? '—'
          ])
        )
      }

      if (externos.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Personal Externo')
        pdfCorporateTable(ctx,
          ['FECHA REGISTRO', 'EMPRESA / NOMBRE', 'NIF', 'TIPO', 'TELÉFONO'],
          [30, 50, 25, 35, 30],
          externos.map(e => [
            e.created_at ? new Date(e.created_at).toLocaleDateString('es-ES') : '—',
            e.nombre_empresa, e.nif ?? '—', e.tipo.replace(/_/g, ' ').toUpperCase(), e.telefono_contacto ?? '—'
          ])
        )
      }
      ctx.separator()
    }
  }

  // ── CAMPO / PARCELAS ──
  if (modulosSeleccionados.has('campo')) {
    const { estados, plantaciones, cosechas } = await cargarCampo(desde, hasta)
    if (estados.length + plantaciones.length + cosechas.length > 0) {
      ctx.checkPage(12)
      ctx.writeLabel('CAMPO / PARCELAS', 11)
      ctx.separator()

      ctx.kpiRow([
        { label: 'Reg. Estados', value: estados.length },
        { label: 'Plantaciones', value: plantaciones.length },
        { label: 'Cosechas',     value: cosechas.length },
      ])

      if (estados.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Estados de Parcela')
        pdfCorporateTable(ctx, ['FECHA', 'PARCELA', 'ESTADO', 'OBSERVACIONES'], [25, 30, 30, 85],
          estados.map(e => [e.fecha ? new Date(e.fecha).toLocaleDateString('es-ES') : '—', e.parcel_id ?? '—', (e.estado ?? '—').toUpperCase(), e.observaciones ?? '—'])
        )
      }

      if (plantaciones.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Plantaciones')
        pdfCorporateTable(ctx, ['FECHA', 'PARCELA', 'CULTIVO', 'VARIEDAD', 'COSECHA EST.'], [25, 30, 40, 40, 35],
          plantaciones.map(p => [p.date ? new Date(p.date).toLocaleDateString('es-ES') : '—', p.parcel_id ?? '—', p.crop, p.variedad ?? '—', p.fecha_cosecha_estimada ? new Date(p.fecha_cosecha_estimada).toLocaleDateString('es-ES') : '—'])
        )
      }

      if (cosechas.length > 0) {
        ctx.checkPage(10)
        pdfCorporateSection(ctx, 'Cosechas')
        pdfCorporateTable(ctx, ['FECHA', 'PARCELA', 'CULTIVO', 'PRODUCCIÓN (KG)'], [25, 35, 50, 40],
          cosechas.map(c => [c.date ? new Date(c.date).toLocaleDateString('es-ES') : '—', c.parcel_id ?? '—', c.crop, c.production_kg ? c.production_kg.toLocaleString() : '—'])
        )
      }
      ctx.separator()
    }
  }

  ctx.footer()
  doc.save(`Informe_Global_Marvic_${desde}_${hasta}.pdf`)
}

// ── Generadores Agronómicos ───────────────────────────────────────────────────

async function generarPDFAgronomico(tipo: string, desde: string, hasta: string, fincaFiltro: string) {
  const { doc, ctx } = await initPdf(PDF_COLORS.green)
  const rangoLabel = `${new Date(desde).toLocaleDateString('es-ES')} — ${new Date(hasta).toLocaleDateString('es-ES')}`
  const titulo = tipo === 'suelo' ? 'ANÁLISIS DE SUELO' :
                 tipo === 'produccion' ? 'PRODUCCIÓN Y COSECHA' :
                 tipo === 'certificacion' ? 'CERTIFICACIÓN ECOLÓGICA' :
                 tipo === 'residuos' ? 'RESIDUOS Y PLÁSTICOS' : 'EFICIENCIA HÍDRICA'
                 
  ctx.addPageHeader(titulo, rangoLabel)
  ctx.writeLabel(`Finca: ${fincaFiltro || 'Todas las fincas'}`, 9)
  ctx.separator()

  // 1. Obtener parcelas (con filtro de finca si aplica)
  let qParcels = supabase.from('parcels').select('parcel_id, parcel_number, farm')
  if (fincaFiltro) qParcels = qParcels.eq('farm', fincaFiltro)
  const { data: parcels } = await qParcels
  const parcelMap = new Map(parcels?.map(p => [p.parcel_id, p]) || [])
  const parcelIds = Array.from(parcelMap.keys())

  if (parcelIds.length === 0) {
    ctx.writeLabel('No hay parcelas para la finca seleccionada.')
    ctx.footer(); doc.save(`${titulo}_${desde}.pdf`); return
  }

  if (tipo === 'suelo') {
    const { data: analisis } = await supabase.from('analisis_suelo').select('*').in('parcel_id', parcelIds).gte('fecha', desde).lte('fecha', hasta).order('fecha', { ascending: true })
    if (!analisis?.length) { ctx.writeLabel('Sin registros de análisis de suelo en este período.'); ctx.footer(); doc.save(`Suelo.pdf`); return }
    
    pdfCorporateSection(ctx, 'Histórico de Análisis')
    pdfCorporateTable(ctx, 
      ['PARCELA', 'FECHA', 'pH', 'EC', 'N', 'P', 'K', 'MO%'], 
      [35, 25, 15, 15, 15, 15, 15, 15],
      analisis.map(a => [
        parcelMap.get(a.parcel_id!)?.parcel_number || a.parcel_id || '—',
        a.fecha ? new Date(a.fecha).toLocaleDateString('es-ES') : '—',
        a.ph?.toString() || '-', a.conductividad_ec?.toString() || '-',
        a.nitrogeno_ppm?.toString() || '-', a.fosforo_ppm?.toString() || '-',
        a.potasio_ppm?.toString() || '-', a.materia_organica?.toString() || '-'
      ])
    )
    ctx.separator()

    // Agrupar por parcela para gráficos de evolución
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
        
        doc.setDrawColor(34, 197, 94) // verde
        doc.setLineWidth(0.5)
        for(let i=0; i<phValues.length - 1; i++) {
            const x1 = PDF_MARGIN + i*stepX
            const y1 = startY + 20 - ((phValues[i] - min) / range) * 20
            const x2 = PDF_MARGIN + (i+1)*stepX
            const y2 = startY + 20 - ((phValues[i+1] - min) / range) * 20
            doc.line(x1, y1, x2, y2)
            doc.circle(x1, y1, 1, 'FD')
            if (i === phValues.length - 2) doc.circle(x2, y2, 1, 'FD')
        }
        doc.setFontSize(7)
        doc.text(`Min: ${Math.min(...phValues).toFixed(1)} | Max: ${Math.max(...phValues).toFixed(1)}`, PDF_MARGIN, startY + 28)
        ctx.y += 35
      }
    }
  }
  else if (tipo === 'produccion') {
    const { data: harvests } = await supabase.from('harvests').select('*, plantings(variedad)').in('parcel_id', parcelIds).gte('date', desde).lte('date', hasta).order('date', { ascending: false })
    const { data: tickets } = await supabase.from('tickets_pesaje').select('harvest_id, destino').in('harvest_id', (harvests || []).map(h => h.id))
    const ticketMap = new Map(tickets?.map(t => [t.harvest_id, t.destino]) || [])
    
    if (!harvests?.length) { ctx.writeLabel('Sin cosechas en este período.'); ctx.footer(); doc.save(`Produccion.pdf`); return }
    const totalKg = harvests.reduce((acc, h) => acc + (h.production_kg || 0), 0)
    ctx.kpiRow([{ label: 'Total Cosechado', value: `${totalKg.toLocaleString()} Kg` }])
    ctx.separator()

    pdfCorporateTable(ctx,
      ['PARCELA', 'CULTIVO', 'VARIEDAD', 'FECHA', 'KG', 'DESTINO'],
      [30, 30, 25, 25, 20, 40],
      harvests.map(h => [
        parcelMap.get(h.parcel_id)?.parcel_number || h.parcel_id,
        h.crop, (h as any).plantings?.variedad || '—',
        h.date ? new Date(h.date).toLocaleDateString('es-ES') : '—',
        h.production_kg?.toLocaleString() || '0',
        ticketMap.get(h.id) || '—'
      ])
    )
  }
  else if (tipo === 'certificacion') {
    const { data: certs } = await supabase.from('certificaciones_parcela').select('*').in('parcel_id', parcelIds).order('fecha_fin', { ascending: true })
    if (!certs?.length) { ctx.writeLabel('Sin certificaciones.'); ctx.footer(); doc.save(`Certificaciones.pdf`); return }
    pdfCorporateTable(ctx,
      ['PARCELA', 'ENTIDAD', 'ESTADO', 'VENCIMIENTO'],
      [40, 50, 40, 40],
      certs.map(c => {
        const estadoText = c.estado !== 'vigente' ? `${c.estado.toUpperCase()} ⚠` : 'Vigente'
        return [
          parcelMap.get(c.parcel_id)?.parcel_number || c.parcel_id,
          c.entidad_certificadora, estadoText,
          c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString('es-ES') : '—'
        ]
      })
    )
  }
  else if (tipo === 'residuos') {
    const { data: res } = await supabase.from('residuos_operacion').select('*').in('parcel_id', parcelIds).gte('created_at', `${desde}T00:00:00`).lte('created_at', `${hasta}T23:59:59`)
    if (!res?.length) { ctx.writeLabel('Sin residuos.'); ctx.footer(); doc.save(`Residuos.pdf`); return }
    pdfCorporateTable(ctx, ['PARCELA', 'TIPO', 'INSTALADO', 'RETIRADO', 'PENDIENTE'], [35, 45, 30, 30, 30],
      res.map(r => [
        parcelMap.get(r.parcel_id)?.parcel_number || r.parcel_id, r.tipo_residuo.replace(/_/g, ' '),
        `${r.kg_instalados || 0} kg`, `${r.kg_retirados || 0} kg`, `${Math.max(0, (r.kg_instalados || 0) - (r.kg_retirados || 0))} kg ⚠`
      ])
    )
  }
  else if (tipo === 'hidrica') {
    const [rRiego, rCosecha] = await Promise.all([
      supabase.from('registros_riego').select('parcel_id, litros_aplicados').in('parcel_id', parcelIds).gte('fecha_inicio', `${desde}T00:00:00`).lte('fecha_inicio', `${hasta}T23:59:59`),
      supabase.from('harvests').select('parcel_id, production_kg').in('parcel_id', parcelIds).gte('date', desde).lte('date', hasta)
    ])
    const litrosMap = new Map<string, number>(); const kgMap = new Map<string, number>()
    rRiego.data?.forEach(r => { if(r.parcel_id) litrosMap.set(r.parcel_id, (litrosMap.get(r.parcel_id)||0) + (r.litros_aplicados||0)) })
    rCosecha.data?.forEach(r => { kgMap.set(r.parcel_id, (kgMap.get(r.parcel_id)||0) + (r.production_kg||0)) })
    
    const filas: string[][] = []
    let totalL = 0; let totalKg = 0;
    parcelIds.forEach(pid => {
      const l = litrosMap.get(pid) || 0; const k = kgMap.get(pid) || 0
      if (l > 0 || k > 0) {
        totalL += l; totalKg += k;
        filas.push([parcelMap.get(pid)?.parcel_number || pid, `${l.toLocaleString()} L`, `${k.toLocaleString()} Kg`, k > 0 ? `${(l/k).toFixed(2)} L/Kg` : '—'])
      }
    })
    
    ctx.kpiRow([{ label: 'Litros Totales', value: totalL.toLocaleString() }, { label: 'Eficiencia Global', value: totalKg > 0 ? `${(totalL/totalKg).toFixed(2)} L/Kg` : '—' }])
    ctx.separator()
    if (!filas.length) ctx.writeLabel('Sin datos de riego/cosecha en el período.')
    else pdfCorporateTable(ctx, ['PARCELA', 'LITROS RIEGO', 'KG COSECHA', 'RATIO (L/Kg)'], [50, 40, 40, 40], filas)
  }

  ctx.footer()
  doc.save(`Informe_${titulo.replace(/ /g, '_')}_${desde}.pdf`)
}

// ── Componente ────────────────────────────────────────────────────────────────

const HOY   = new Date().toISOString().split('T')[0]
const HACE30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

export default function ExportarPDF() {
  const navigate = useNavigate()

  const [tab,       setTab]       = useState<'global' | 'agronomico'>('global')
  const [desde,     setDesde]     = useState(HACE30)
  const [hasta,     setHasta]     = useState(HOY)
  const [modulos,   setModulos]   = useState<Set<string>>(new Set(['parte_diario', 'trabajos']))
  const [generando, setGenerando] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  
  const [fincaAgro, setFincaAgro] = useState('')
  const [tipoAgro,  setTipoAgro]  = useState('suelo')

  // Conteo rápido de registros para el rango
  const { data: preview } = useQuery({
    queryKey: ['export_preview', desde, hasta],
    queryFn: async () => {
      const [p, t, m, l, pers1, pers2, c1, c2, c3] = await Promise.all([
        supabase.from('partes_diarios').select('id', { count: 'exact', head: true }).gte('fecha', desde).lte('fecha', hasta),
        supabase.from('trabajos_registro').select('id', { count: 'exact', head: true }).gte('fecha', desde).lte('fecha', hasta),
        (supabase as any).from('maquinaria_uso').select('id', { count: 'exact', head: true }).gte('fecha', desde).lte('fecha', hasta),
        supabase.from('logistica_viajes').select('id', { count: 'exact', head: true }).gte('hora_salida', desde).lte('hora_salida', hasta + 'T23:59:59'),
        supabase.from('personal').select('id', { count: 'exact', head: true }).gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
        supabase.from('personal_externo').select('id', { count: 'exact', head: true }).gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
        supabase.from('registros_estado_parcela').select('id', { count: 'exact', head: true }).gte('fecha', desde).lte('fecha', hasta),
        supabase.from('plantings').select('id', { count: 'exact', head: true }).gte('date', desde).lte('date', hasta),
        supabase.from('harvests').select('id', { count: 'exact', head: true }).gte('date', desde).lte('date', hasta),
      ])
      return {
        parte_diario: p.count ?? 0,
        trabajos:     t.count ?? 0,
        maquinaria:   m.count ?? 0,
        logistica:    l.count ?? 0,
        personal:     (pers1.count ?? 0) + (pers2.count ?? 0),
        campo:        (c1.count ?? 0) + (c2.count ?? 0) + (c3.count ?? 0),
      }
    },
    staleTime: 30000,
  })

  const toggleModulo = (id: string) => {
    setModulos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else              next.add(id)
      return next
    })
  }

  const handleGenerar = async () => {
    if (modulos.size === 0) { setError('Selecciona al menos un módulo'); return }
    setError(null)
    setGenerando(true)
    try {
      if (tab === 'global') {
        await generarPDFGlobal(desde, hasta, modulos)
      } else {
        await generarPDFAgronomico(tipoAgro, desde, hasta, fincaAgro)
      }
    } catch (e) {
      setError('Error al generar el PDF. Inténtalo de nuevo.')
      console.error(e)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">

      {/* CABECERA */}
      <header className="bg-slate-900/80 border-b border-white/10 pl-14 pr-4 py-2.5 flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <FileText className="w-4 h-4 text-[#38bdf8]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#38bdf8]">Exportar PDF Global</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl w-full mx-auto space-y-5">

        {/* Pestañas UI */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/10">
          <button onClick={() => setTab('global')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${tab === 'global' ? 'bg-[#38bdf8] text-slate-900' : 'text-slate-400 hover:text-white'}`}>
            Global / Módulos
          </button>
          <button onClick={() => setTab('agronomico')} className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${tab === 'agronomico' ? 'bg-green-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}>
            Reportes Agronómicos
          </button>
        </div>

        {/* Rango de fechas */}
        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rango de fechas</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8]/50 outline-none" />
            </div>
          </div>
        </div>

        {tab === 'global' && (
          <>
            {/* Selección de módulos */}
            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Módulos a incluir</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {MODULOS.map(m => {
                  const seleccionado = modulos.has(m.id)
                  const count = preview?.[m.id as keyof typeof preview] ?? null
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleModulo(m.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        seleccionado ? 'border-[#38bdf8]/40 bg-[#38bdf8]/5' : 'border-white/10 bg-slate-900/40 hover:border-white/20'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
                        <m.icon className="w-4 h-4" style={{ color: `rgb(${m.color.join(',')})` }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white">{m.label}</p>
                        {count !== null && <p className="text-[9px] text-slate-500">{count} registros en el período</p>}
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${seleccionado ? 'border-[#38bdf8] bg-[#38bdf8]' : 'border-slate-600'}`}>
                        {seleccionado && <Check className="w-3 h-3 text-[#020617]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4">
              <p className="text-[10px] text-slate-500">
                El PDF incluirá todos los registros de los módulos seleccionados en el rango de fechas indicado,
                ordenados cronológicamente.
              </p>
            </div>
          </>
        )}

        {tab === 'agronomico' && (
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Finca (Opcional)</label>
              <select value={fincaAgro} onChange={e => setFincaAgro(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                <option value="">Todas las fincas</option>
                {FINCAS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipo de Reporte</label>
              <select value={tipoAgro} onChange={e => setTipoAgro(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500/50 outline-none">
                <option value="suelo">📊 Análisis de Suelo (pH, EC, NPK)</option>
                <option value="produccion">🚜 Producción y Cosecha</option>
                <option value="certificacion">🛡️ Certificación Ecológica</option>
                <option value="residuos">♻️ Residuos y Plásticos</option>
                <option value="hidrica">💧 Eficiencia Hídrica (L/Kg)</option>
              </select>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Botón generar */}
        <button
          onClick={handleGenerar}
          disabled={generando || (tab === 'global' && modulos.size === 0)}
          className={`w-full py-3.5 rounded-xl text-[#020617] font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${tab === 'agronomico' ? 'bg-green-500 hover:bg-green-400' : 'bg-[#38bdf8] hover:bg-sky-300'}`}
        >
          {generando
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando PDF…</>
            : <><Download className="w-4 h-4" /> Descargar PDF Global</>
          }
        </button>

      </main>

      <footer className="bg-slate-900/80 border-t border-white/10 px-4 py-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Marvic 360 · Exportar PDF · {tab === 'global' ? `${modulos.size} módulo(s)` : 'Reporte Agronómico'}
        </span>
      </footer>
    </div>
  )
}
