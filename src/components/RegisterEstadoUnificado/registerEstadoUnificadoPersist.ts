import { supabase } from '@/integrations/supabase/client'
import { num, uploadFoto } from '@/components/RegisterEstadoUnificado/registerEstadoUnificadoHelpers'

type ZonaRiegoRow = { id: string; nombre_zona: string }

type CultivoMarco = {
  marco_std_entre_lineas_cm: number | null
  marco_std_entre_plantas_cm: number | null
} | null

type MutateAsync<T> = { mutateAsync: (v: T) => Promise<unknown> }

export type EstadoUnificadoPersistInput = {
  activeParcelId: string
  activeFinca: string
  estado: string
  observaciones: string
  foto: File | null
  cultivo: string
  variedad: string
  fechaPlantacion: string
  cultivoObj: CultivoMarco
  cosechaEstimada: string
  cosechaCultivo: string
  cosechaKg: string
  cosechaFecha: string
  showRiego: boolean
  riegoZona: string
  riegoFechaInicio: string
  riegoFechaFin: string
  riegoLitros: string
  riegoPresion: string
  riegoOrigen: string
  riegoNotas: string
  zonasRiego: ZonaRiegoRow[]
  showSuelo: boolean
  suelo: Record<string, string>
  showAgua: boolean
  agua: Record<string, string>
  showSensor: boolean
  sensor: Record<string, string>
  mutPlanting: MutateAsync<Record<string, unknown>>
  mutHarvest: MutateAsync<Record<string, unknown>>
  mutSuelo: MutateAsync<Record<string, unknown>>
  mutSensor: MutateAsync<Record<string, unknown>>
  mutAgua: MutateAsync<Record<string, unknown>>
  mutAddZona: MutateAsync<{ parcel_id: string; nombre_zona: string }>
  mutAddRiego: MutateAsync<Record<string, unknown>>
}

/** Persiste estado parcela y bloques opcionales; devuelve avisos parciales sin lanzar por fallos internos. */
export async function persistEstadoUnificado(input: EstadoUnificadoPersistInput): Promise<{ warnings: string[] }> {
  const warnings: string[] = []
  const {
    activeParcelId,
    activeFinca,
    estado,
    observaciones,
    foto,
    cultivo,
    variedad,
    fechaPlantacion,
    cultivoObj,
    cosechaEstimada,
    cosechaCultivo,
    cosechaKg,
    cosechaFecha,
    showRiego,
    riegoZona,
    riegoFechaInicio,
    riegoFechaFin,
    riegoLitros,
    riegoPresion,
    riegoOrigen,
    riegoNotas,
    zonasRiego,
    showSuelo,
    suelo,
    showAgua,
    agua,
    showSensor,
    sensor,
    mutPlanting,
    mutHarvest,
    mutSuelo,
    mutSensor,
    mutAgua,
    mutAddZona,
    mutAddRiego,
  } = input

  const foto_url = foto ? await uploadFoto(foto, activeParcelId) : null
  if (foto && !foto_url) warnings.push('foto')

  const { error: errEstado } = await supabase
    .from('registros_estado_parcela')
    .insert({ parcel_id: activeParcelId, estado, observaciones: observaciones || null, foto_url })
  if (errEstado) warnings.push('estado')

  await supabase.from('parcels').update({ status: estado }).eq('parcel_id', activeParcelId)

  if ((estado === 'plantada' || estado === 'en_produccion') && cultivo) {
    try {
      await mutPlanting.mutateAsync({
        parcel_id: activeParcelId,
        date: fechaPlantacion,
        crop: cultivo,
        variedad: variedad || null,
        lote_semilla: null,
        proveedor_semilla: null,
        sistema_riego: 'goteo',
        num_plantas_real: null,
        marco_cm_entre_lineas: cultivoObj?.marco_std_entre_lineas_cm ?? null,
        marco_cm_entre_plantas: cultivoObj?.marco_std_entre_plantas_cm ?? null,
        fecha_cosecha_estimada: cosechaEstimada || null,
        notes: null,
      })
    } catch {
      warnings.push('plantación')
    }
  }

  if (estado === 'cosechada' && cosechaCultivo) {
    try {
      await mutHarvest.mutateAsync({
        parcel_id: activeParcelId,
        date: cosechaFecha,
        crop: cosechaCultivo,
        production_kg: cosechaKg ? parseFloat(cosechaKg) : null,
      })
    } catch {
      warnings.push('cosecha')
    }
  }

  if (showSuelo && suelo.ph) {
    try {
      await mutSuelo.mutateAsync({
        parcel_id: activeParcelId,
        ph: num(suelo.ph),
        conductividad_ec: num(suelo.conductividad_ec),
        salinidad_ppm: num(suelo.salinidad_ppm),
        temperatura_suelo: num(suelo.temperatura_suelo),
        materia_organica: num(suelo.materia_organica),
        sodio_ppm: num(suelo.sodio_ppm),
        nitrogeno_ppm: num(suelo.nitrogeno_ppm),
        fosforo_ppm: num(suelo.fosforo_ppm),
        potasio_ppm: num(suelo.potasio_ppm),
        textura: suelo.textura ?? undefined,
        herramienta: 'Hanna HI9814 + LaMotte',
      })
    } catch {
      warnings.push('análisis suelo')
    }
  }

  if (showAgua && agua.fuente && activeFinca) {
    try {
      await mutAgua.mutateAsync({
        finca: activeFinca,
        fuente: agua.fuente,
        ph: num(agua.ph),
        conductividad_ec: num(agua.conductividad_ec),
        salinidad_ppm: num(agua.salinidad_ppm),
      })
    } catch {
      warnings.push('análisis agua')
    }
  }

  if (showRiego && riegoZona && riegoFechaInicio) {
    try {
      let zonaId: string | null = null
      const existingZona = zonasRiego.find(z => z.nombre_zona === riegoZona)
      if (existingZona) {
        zonaId = existingZona.id
      } else {
        const newZona = await mutAddZona.mutateAsync({
          parcel_id: activeParcelId,
          nombre_zona: riegoZona,
        })
        zonaId = (newZona as { id: string }).id
      }

      const inicio = new Date(riegoFechaInicio)
      const fechaStr = inicio.toISOString().slice(0, 10)
      let duracion_minutos: number | null = null
      if (riegoFechaFin) {
        const ms = new Date(riegoFechaFin).getTime() - inicio.getTime()
        if (ms > 0) duracion_minutos = Math.round(ms / 60000)
      }
      const litros = num(riegoLitros)
      const volumen_m3 = litros != null && litros > 0 ? litros / 1000 : null
      const notasRiego = [riegoNotas, riegoOrigen ? `Origen: ${riegoOrigen}` : ''].filter(Boolean).join(' · ') || null

      await mutAddRiego.mutateAsync({
        zona_id: zonaId,
        fecha: fechaStr,
        volumen_m3,
        duracion_minutos,
        presion_bar: num(riegoPresion),
        notas: notasRiego,
      })
    } catch {
      warnings.push('riego')
    }
  }

  if (showSensor && (sensor.indice_salud || sensor.ndvi || sensor.clorofila)) {
    try {
      await mutSensor.mutateAsync({
        parcel_id: activeParcelId,
        indice_salud: num(sensor.indice_salud),
        nivel_estres: num(sensor.nivel_estres),
        clorofila: num(sensor.clorofila),
        ndvi: num(sensor.ndvi),
      })
    } catch {
      warnings.push('sensor')
    }
  }

  return { warnings }
}
