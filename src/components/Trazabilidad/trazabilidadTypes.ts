export interface DbRow {
  id: string
  fecha?: string
  created_at?: string
  date?: string
  fecha_inicio?: string
  timestamp?: string
  ph?: number
  conductividad_ec?: number
  materia_organica?: number
  crop?: string
  variedad?: string
  tipo_trabajo?: string
  work_type?: string
  cuadrillas?: { nombre?: string }
  nombres_operarios?: string
  hours_worked?: number | null
  horas_calculadas?: number | null
  hora_entrada?: string | null
  hora_salida?: string | null
  volumen_m3?: number | null
  tipo_movimiento?: string | null
  ndvi?: number
  clorofila?: number
  production_kg?: number
  numero_palot?: string
  peso_kg?: number
  tipo?: string
  camiones?: { matricula?: string }
}

export interface PalotRow {
  id: string
  numero_palot: string
  estado: string
  cultivo?: string | null
  lote?: string | null
  peso_kg?: number | null
  parcel_id?: string | null
  parcels?: { parcel_number?: string } | null
}

export type TrazabilidadTimelineEvent = {
  id: string
  type: string
  date: Date
  data: DbRow
}

export type TrazabilidadTimelineMissingFlags = {
  suelo: boolean | undefined
  plantacion: boolean | undefined
  cosecha: boolean | undefined
  palot: boolean | undefined
}
