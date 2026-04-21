import type { Database, Json } from '../integrations/supabase/types';

// ── Tipos locales ────────────────────────────────────────────
export type TipoBloque =
  | 'logistica'
  | 'maquinaria_agricola'
  | 'mano_obra_interna'
  | 'mano_obra_externa';

const TIPO_BLOQUE_VALUES: readonly TipoBloque[] = [
  'logistica',
  'maquinaria_agricola',
  'mano_obra_interna',
  'mano_obra_externa',
];

/** Normaliza texto de BD a la unión usada en la app; valores desconocidos → fallback seguro. */
export function normalizeTipoBloque(raw: string | null | undefined): TipoBloque {
  if (raw != null && (TIPO_BLOQUE_VALUES as readonly string[]).includes(raw)) {
    return raw as TipoBloque;
  }
  return 'maquinaria_agricola';
}

export type EstadoIncidencia = 'abierta' | 'en_proceso' | 'resuelta';
export type EstadoPlanificacion = 'borrador' | 'confirmado' | 'ejecutado' | 'pendiente' | 'cancelado';
export type Prioridad = 'alta' | 'media' | 'baja';
export type EstadoCampana = 'planificado' | 'en_curso' | 'completado' | 'cancelado';

export interface TrabajoRegistro {
  id:                    string;
  tipo_bloque:           TipoBloque;
  fecha:                 string;
  hora_inicio:           string | null;
  hora_fin:              string | null;
  finca:                 string | null;
  parcel_id:             string | null;
  tipo_trabajo:          string;
  num_operarios:         number | null;
  nombres_operarios:     string | null;
  foto_url:              string | null;
  notas:                 string | null;
  created_at:            string;
  created_by:            string | null;
  // Campos planificación
  estado_planificacion:  EstadoPlanificacion | null;
  prioridad:             Prioridad | null;
  fecha_planificada:     string | null;
  fecha_original:        string | null;
  recursos_personal:     string[] | null;
  tractor_id:            string | null;
  apero_id:              string | null;
  materiales_previstos:  Json | null;
}

export type TrabajoRegistroDbRow = Database['public']['Tables']['trabajos_registro']['Row'] & {
  maquinaria_tractores?: { matricula: string | null; marca: string | null } | null;
  maquinaria_aperos?: { tipo: string | null; descripcion: string | null } | null;
};

/** Fila de planificación del día: dominio de app + joins de maquinaria (solo lectura UI). */
export type TrabajoRegistroPlanificado = TrabajoRegistro & {
  maquinaria_tractores?: { matricula: string | null; marca: string | null } | null;
  maquinaria_aperos?: { tipo: string | null; descripcion: string | null } | null;
};

export function toTrabajoRegistroPlanificado(row: TrabajoRegistroDbRow): TrabajoRegistroPlanificado {
  return {
    id: row.id,
    tipo_bloque: normalizeTipoBloque(row.tipo_bloque),
    fecha: row.fecha ?? '',
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    finca: row.finca,
    parcel_id: row.parcel_id,
    tipo_trabajo: row.tipo_trabajo,
    num_operarios: row.num_operarios,
    nombres_operarios: row.nombres_operarios,
    foto_url: row.foto_url,
    notas: row.notas,
    created_at: row.created_at ?? new Date().toISOString(),
    created_by: row.created_by,
    estado_planificacion: row.estado_planificacion as EstadoPlanificacion | null,
    prioridad: row.prioridad as Prioridad | null,
    fecha_planificada: row.fecha_planificada,
    fecha_original: row.fecha_original,
    recursos_personal: row.recursos_personal,
    tractor_id: row.tractor_id,
    apero_id: row.apero_id,
    materiales_previstos: row.materiales_previstos,
    maquinaria_tractores: row.maquinaria_tractores ?? null,
    maquinaria_aperos: row.maquinaria_aperos ?? null,
  };
}

export interface TrabajoIncidencia {
  id:               string;
  urgente:          boolean;
  titulo:           string;
  descripcion:      string | null;
  finca:            string | null;
  parcel_id:        string | null;
  estado:           EstadoIncidencia;
  foto_url:         string | null;
  fecha:            string;
  fecha_resolucion: string | null;
  notas_resolucion: string | null;
  created_at:       string;
  created_by:       string | null;
}

export interface PlanificacionCampana {
  id:                       string;
  finca:                    string;
  parcel_id:                string | null;
  cultivo:                  string;
  fecha_prevista_plantacion: string | null;
  fecha_estimada_cosecha:   string | null;
  recursos_estimados:       string | null;
  observaciones:            string | null;
  estado:                   EstadoCampana;
  created_at:               string;
  created_by:               string | null;
}

export interface CierreJornada {
  id:                  string;
  fecha:               string;
  parte_diario_id:     string | null;
  trabajos_ejecutados: number | null;
  trabajos_pendientes: number | null;
  trabajos_arrastrados: number | null;
  notas:               string | null;
  cerrado_at:          string;
  cerrado_by:          string | null;
}
