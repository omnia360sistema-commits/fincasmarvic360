import type { Tables } from '@/integrations/supabase/types'
import { ESTADOS_PARCELA } from '@/constants/estadosParcela'
import { formatHora } from '@/utils/dateFormat'
import { loadPdfImage } from '@/utils/pdfUtils'
import { generarPDFCorporativo } from '@/utils/parteDiarioPdfCorporativo'
import {
  buildEntradasOrdenadas,
  computeInicioJornada,
  collectZonasTrabajo,
  collectNombresPersonal,
  esIncidenciaPartePersonal,
  estadoPartePersonalRow,
  prioridadPlanningDesdeNotas,
  formatFechaEjecutiva,
} from '@/utils/parteDiarioHelpers'
import { fetchIncidenciasTrabajosDelDia, fetchPlanningManana } from '@/utils/parteDiarioPdfData'

/** Campos usados al volcar incidencias de trabajos al PDF */
type IncidenciaTrabajoPdfRow = {
  created_at?: string | null
  titulo?: string | null
  descripcion?: string | null
  estado?: string | null
  finca?: string | null
  parcel_id?: string | null
  urgente?: boolean | null
  notas_resolucion?: string | null
  foto_url?: string | null
}

export type ParteDiarioPdfDeps = {
  parteId: string | null
  fecha: string
  firmaNombre: string
  parte: Tables<'partes_diarios'> | null | undefined
  estadosFinca: Tables<'parte_estado_finca'>[]
  trabajos: Tables<'parte_trabajo'>[]
  personales: Tables<'parte_personal'>[]
  residuos: Tables<'parte_residuos_vegetales'>[]
  setGenPdf: (v: boolean) => void
}

export async function generarParteCompleto(d: ParteDiarioPdfDeps): Promise<void> {
  const { parteId, fecha, firmaNombre, parte, estadosFinca, trabajos, personales, residuos, setGenPdf } = d
  if (!parteId) return
  setGenPdf(true)
  try {
    const logoData = await loadPdfImage(`${window.location.origin}/MARVIC_logo.png`)
    const pdf = generarPDFCorporativo(
      'PARTE DIARIO',
      'Informe integral de la jornada',
      fecha,
      logoData,
      firmaNombre,
    )
    const entradas = buildEntradasOrdenadas(estadosFinca, trabajos, personales, residuos)
    const responsable = parte?.responsable ?? firmaNombre
    pdf.addResumenDosColumnas([
      { label: 'Responsable', value: responsable },
      { label: 'Inicio jornada', value: computeInicioJornada(entradas) },
      { label: 'Zonas de trabajo', value: collectZonasTrabajo(entradas) },
      { label: 'Personal implicado', value: collectNombresPersonal(entradas) },
    ])

    if (entradas.length === 0) {
      pdf.addMutedParagraph('Sin entradas registradas para este día.')
    }

    for (const entrada of entradas) {
      if (entrada.tipo === 'A') {
        const e = entrada.data
        pdf.addSectionHeader('A', 'ESTADO FINCA / PARCELA', formatHora(e.created_at))
        pdf.resetPairStripe()
        pdf.addKeyValueRow('Finca', e.finca)
        pdf.addKeyValueRow('Parcela / Sector', e.parcel_id)
        pdf.addKeyValueRow('Estado', ESTADOS_PARCELA.find(s => s.value === e.estado)?.label ?? e.estado ?? null)
        pdf.addKeyValueRow('Número de operarios', e.num_operarios?.toString())
        pdf.addKeyValueRow('Nombres operarios', e.nombres_operarios)
        pdf.addKeyValueRow('Notas', e.notas)
        await pdf.addPhoto120(e.foto_url, 'Fotografía del estado (1)')
        await pdf.addPhoto120(e.foto_url_2, 'Fotografía del estado (2)')
      } else if (entrada.tipo === 'B') {
        const e = entrada.data
        const rangoHora = e.hora_inicio
          ? `${formatHora(e.hora_inicio)} → ${formatHora(e.hora_fin)}`
          : formatHora(e.created_at)
        pdf.addSectionHeader('B', 'TRABAJO EN CURSO', rangoHora)
        pdf.resetPairStripe()
        pdf.addKeyValueRow('Tipo de trabajo', e.tipo_trabajo)
        pdf.addKeyValueRow('Finca', e.finca)
        pdf.addKeyValueRow('Ámbito', e.ambito === 'finca_completa' ? 'Finca completa' : 'Parcelas concretas')
        if (e.parcelas?.length) pdf.addKeyValueRow('Parcelas', e.parcelas.join(', '))
        pdf.addKeyValueRow('Número de operarios', e.num_operarios?.toString())
        pdf.addKeyValueRow('Nombres operarios', e.nombres_operarios)
        if (e.hora_inicio) pdf.addKeyValueRow('Hora inicio', formatHora(e.hora_inicio))
        if (e.hora_fin) pdf.addKeyValueRow('Hora fin', formatHora(e.hora_fin))
        pdf.addKeyValueRow('Notas', e.notas)
        await pdf.addPhoto120(e.foto_url, 'Fotografía del trabajo (1)')
        await pdf.addPhoto120(e.foto_url_2, 'Fotografía del trabajo (2)')
      } else if (entrada.tipo === 'C') {
        const e = entrada.data
        pdf.addSectionHeader('C', `PARTE PERSONAL — ${firmaNombre.toUpperCase()}`, formatHora(e.fecha_hora))
        pdf.resetPairStripe()
        pdf.addKeyValueRow('Texto', e.texto)
        pdf.addKeyValueRow('Con quién', e.con_quien)
        pdf.addKeyValueRow('Dónde', e.donde)
        await pdf.addPhoto120(e.foto_url, 'Fotografía — parte personal')
      } else if (entrada.tipo === 'D') {
        const e = entrada.data
        pdf.addSectionHeader(
          'D',
          'RESIDUOS VEGETALES',
          e.hora_salida_nave ? `${formatHora(e.hora_salida_nave)}` : '',
        )
        pdf.resetPairStripe()
        pdf.addKeyValueRow('Conductor', e.nombre_conductor)
        pdf.addKeyValueRow('Hora salida nave', formatHora(e.hora_salida_nave))
        pdf.addKeyValueRow('Ganadero / Destino', e.nombre_ganadero)
        pdf.addKeyValueRow('Hora llegada ganadero', formatHora(e.hora_llegada_ganadero))
        pdf.addKeyValueRow('Hora regreso nave', formatHora(e.hora_regreso_nave))
        pdf.addKeyValueRow('Notas descarga', e.notas_descarga)
        await pdf.addPhoto120(e.foto_url, 'Fotografía — residuos vegetales')
      }
    }

    pdf.finalize(`Parte_Diario_${fecha}.pdf`)
  } finally {
    setGenPdf(false)
  }
}

export async function generarSoloIncidencias(d: ParteDiarioPdfDeps): Promise<void> {
  const { parteId, fecha, firmaNombre, personales, setGenPdf } = d
  if (!parteId) return
  setGenPdf(true)
  try {
    const logoData = await loadPdfImage(`${window.location.origin}/MARVIC_logo.png`)
    const pdf = generarPDFCorporativo(
      'INCIDENCIAS DE JORNADA',
      'Consolidado de incidencias del día',
      fecha,
      logoData,
      firmaNombre,
    )
    const incidenciasPersonal = personales.filter(p => esIncidenciaPartePersonal(p.texto))
    const incTrab = await fetchIncidenciasTrabajosDelDia(fecha)

    if (incidenciasPersonal.length === 0 && incTrab.length === 0) {
      pdf.addMutedParagraph('Sin incidencias registradas para esta jornada.')
    }

    for (const e of incidenciasPersonal) {
      pdf.addSectionHeader('C', 'PARTE PERSONAL — INCIDENCIA', formatHora(e.fecha_hora))
      pdf.resetPairStripe()
      pdf.addKeyValueRow('Texto', e.texto)
      pdf.addKeyValueRow('Con quién', e.con_quien)
      pdf.addKeyValueRow('Dónde', e.donde)
      await pdf.addPhoto120(e.foto_url, 'Evidencia fotográfica')
    }

    for (const raw of incTrab) {
      const inc = raw as IncidenciaTrabajoPdfRow
      const hora = inc.created_at ? formatHora(inc.created_at) : ''
      pdf.addSectionHeader('I', 'INCIDENCIA TRABAJOS', hora)
      pdf.resetPairStripe()
      pdf.addKeyValueRow('Título', inc.titulo)
      pdf.addKeyValueRow('Descripción', inc.descripcion)
      pdf.addKeyValueRow('Estado', inc.estado)
      pdf.addKeyValueRow('Finca', inc.finca)
      pdf.addKeyValueRow('Parcela', inc.parcel_id)
      pdf.addKeyValueRow('Urgente', inc.urgente ? 'Sí' : 'No')
      pdf.addKeyValueRow('Notas resolución', inc.notas_resolucion)
      await pdf.addPhoto120(inc.foto_url ?? null, 'Fotografía incidencia')
    }

    pdf.finalize(`Incidencias_${fecha}.pdf`)
  } finally {
    setGenPdf(false)
  }
}

export async function generarSoloResiduos(d: ParteDiarioPdfDeps): Promise<void> {
  const { parteId, fecha, firmaNombre, residuos, setGenPdf } = d
  if (!parteId) return
  setGenPdf(true)
  try {
    const logoData = await loadPdfImage(`${window.location.origin}/MARVIC_logo.png`)
    const pdf = generarPDFCorporativo(
      'RESIDUOS VEGETALES',
      'Registro de movimientos del día',
      fecha,
      logoData,
      firmaNombre,
    )
    if (residuos.length === 0) {
      pdf.addMutedParagraph('Sin registros de residuos vegetales para este día.')
    }
    for (const e of residuos) {
      pdf.addSectionHeader(
        'D',
        'RESIDUOS VEGETALES',
        e.hora_salida_nave ? `${formatHora(e.hora_salida_nave)}` : '',
      )
      pdf.resetPairStripe()
      pdf.addKeyValueRow('Conductor', e.nombre_conductor)
      pdf.addKeyValueRow('Hora salida nave', formatHora(e.hora_salida_nave))
      pdf.addKeyValueRow('Ganadero / Destino', e.nombre_ganadero)
      pdf.addKeyValueRow('Hora llegada ganadero', formatHora(e.hora_llegada_ganadero))
      pdf.addKeyValueRow('Hora regreso nave', formatHora(e.hora_regreso_nave))
      pdf.addKeyValueRow('Notas descarga', e.notas_descarga)
      await pdf.addPhoto120(e.foto_url, 'Fotografía — residuos vegetales')
    }
    pdf.finalize(`Residuos_${fecha}.pdf`)
  } finally {
    setGenPdf(false)
  }
}

export async function generarPartePersonal(d: ParteDiarioPdfDeps): Promise<void> {
  const { parteId, fecha, firmaNombre, personales, setGenPdf } = d
  if (!parteId) return
  setGenPdf(true)
  try {
    const logoData = await loadPdfImage(`${window.location.origin}/MARVIC_logo.png`)
    const pdf = generarPDFCorporativo(
      `PARTE PERSONAL — ${firmaNombre.toUpperCase()}`,
      'Registro cronológico de actividades',
      fecha,
      logoData,
      firmaNombre,
    )
    const ordenados = [...personales].sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
    if (ordenados.length === 0) {
      pdf.addMutedParagraph('Sin anotaciones en el parte personal para este día.')
    } else {
      pdf.addTablaPartePersonal(
        ordenados.map(p => ({
          hora: formatHora(p.fecha_hora),
          actividad: [p.texto, p.con_quien ? `Con: ${p.con_quien}` : '', p.donde ? `En: ${p.donde}` : '']
            .filter(Boolean)
            .join(' · '),
          estado: estadoPartePersonalRow(p.texto),
        })),
      )
      for (const p of ordenados) {
        if (p.foto_url) {
          pdf.checkPage(100)
          await pdf.addPhoto120(p.foto_url, `Foto — ${formatHora(p.fecha_hora)}`)
        }
      }
    }
    pdf.finalize(`Parte_Personal_${fecha}.pdf`)
  } finally {
    setGenPdf(false)
  }
}

export async function generarPlanning(d: ParteDiarioPdfDeps): Promise<void> {
  const { parteId, fecha, firmaNombre, setGenPdf } = d
  if (!parteId) return
  setGenPdf(true)
  try {
    const logoData = await loadPdfImage(`${window.location.origin}/MARVIC_logo.png`)
    const { manana, tareas } = await fetchPlanningManana(fecha)
    const pdf = generarPDFCorporativo(
      'PLANNING OPERATIVO',
      `Tareas previstas — ${formatFechaEjecutiva(manana)}`,
      manana,
      logoData,
      firmaNombre,
    )
    if (tareas.length === 0) {
      pdf.addMutedParagraph('Sin tareas planificadas para mañana.')
    } else {
      pdf.addTablaPlanning(
        tareas.map((t, i) => ({
          num: i + 1,
          tarea: [t.tipo_trabajo, t.finca, t.ambito === 'finca_completa' ? 'Finca completa' : (t.parcelas?.join(', ') ?? '')]
            .filter(Boolean)
            .join(' · '),
          responsable: t.nombres_operarios ?? '—',
          prioridad: prioridadPlanningDesdeNotas(t.notas),
        })),
      )
    }
    pdf.finalize(`Planning_${manana}.pdf`)
  } finally {
    setGenPdf(false)
  }
}

export async function ejecutarParteDiarioPdfOpcion(
  opcion: 1 | 2 | 3 | 4 | 5,
  deps: ParteDiarioPdfDeps,
): Promise<void> {
  if (opcion === 1) await generarParteCompleto(deps)
  else if (opcion === 2) await generarSoloIncidencias(deps)
  else if (opcion === 3) await generarSoloResiduos(deps)
  else if (opcion === 4) await generarPartePersonal(deps)
  else await generarPlanning(deps)
}
