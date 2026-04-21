import type { Database, TablesInsert } from '../integrations/supabase/types';

type LogisticaMantenimientoRow = Database['public']['Tables']['logistica_mantenimiento']['Row'];

// ── Tipos ─────────────────────────────────────────────────────

export interface Camion {
  id:                       string;
  matricula:                string;
  activo:                   boolean;
  marca:                    string | null;
  modelo:                   string | null;
  anio:                     number | null;
  fecha_itv:                string | null;
  notas_mantenimiento:      string | null;
  foto_url:                 string | null;
  created_by:               string | null;
  kilometros_actuales:      number | null;
  fecha_proxima_itv:        string | null;
  fecha_proxima_revision:   string | null;
  km_proximo_mantenimiento: number | null;
  gps_info:                 string | null;
  capacidad_kg:             number | null;
  empresa_transporte:       string | null;
  tipo:                     string | null;
  codigo_interno:           string | null;
  estado_operativo:         string | null;
}

export interface VehiculoEmpresa {
  id:                    string;
  codigo_interno:        string | null;
  matricula:             string;
  marca:                 string | null;
  modelo:                string | null;
  anio:                  number | null;
  tipo:                  string | null;
  conductor_habitual_id: string | null;
  km_actuales:           number | null;
  estado_operativo:      string | null;
  fecha_proxima_itv:     string | null;
  fecha_proxima_revision:string | null;
  foto_url:              string | null;
  notas:                 string | null;
  gps_info:              string | null;
  created_at:            string;
  created_by:            string | null;
}

export interface Viaje {
  id:                    string;
  conductor_id:          string | null; // legacy — solo lectura histórica
  personal_id:           string | null;
  camion_id:             string | null;
  finca:                 string | null;
  destino:               string | null;
  trabajo_realizado:     string | null;
  ruta:                  string | null;
  hora_salida:           string | null;
  hora_llegada:          string | null;
  gasto_gasolina_litros: number | null;
  gasto_gasolina_euros:  number | null;
  km_recorridos:         number | null;
  notas:                 string | null;
  created_at:            string;
  created_by:            string | null;
}

/** Fila de BD + joins opcionales para listados (sin lógica por `vehiculo_tipo`). */
export type MantenimientoCamion = LogisticaMantenimientoRow & {
  camiones?: { matricula: string | null } | null;
  vehiculos_empresa?: { matricula: string | null } | null;
};

export type MantenimientoCamionInsert = TablesInsert<'logistica_mantenimiento'>;

export interface Combustible {
  id:            string;
  vehiculo_tipo: string;
  vehiculo_id:   string;
  conductor_id:  string | null;
  fecha:         string | null;
  litros:        number | null;
  coste_total:   number | null;
  gasolinera:    string | null;
  foto_url:      string | null;
  notas:         string | null;
  created_at:    string;
  created_by:    string | null;
}

export interface LogisticaInventarioSync {
  id:           string;
  tipo:         string;
  vehiculo_id:  string;
  ubicacion_id: string;
  activo:       boolean;
  created_at:   string;
}

export interface TipoTrabajoLogistica {
  id:       string;
  nombre:   string;
  categoria:string;
  activo:   boolean;
}

