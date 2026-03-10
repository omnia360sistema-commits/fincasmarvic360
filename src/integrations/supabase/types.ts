export type TipoRiego = 'goteo' | 'tradicional' | 'aspersion' | 'ninguno'
export type EstadoParcela = 'activa' | 'plantada' | 'preparacion' | 'cosechada' | 'vacia' | 'baja'
export type TipoSuelo = 'arcilloso' | 'franco' | 'arenoso' | 'limoso' | 'franco_arcilloso'
export type TipoResiduo = 'plastico_acolchado' | 'cinta_riego' | 'rafia' | 'envase_fitosanitario' | 'otro'
export type EstadoCertificacion = 'vigente' | 'suspendida' | 'en_tramite' | 'caducada'

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.1" }
  public: {
    Tables: {
      cultivos_catalogo: {
        Row: {
          id: string
          nombre_interno: string
          nombre_display: string
          ciclo_dias: number
          rendimiento_kg_ha: number | null
          marco_std_entre_lineas_cm: number | null
          marco_std_entre_plantas_cm: number | null
          kg_plastico_por_ha: number | null
          m_cinta_riego_por_ha: number | null
          es_ecologico: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre_interno: string
          nombre_display: string
          ciclo_dias: number
          rendimiento_kg_ha?: number | null
          marco_std_entre_lineas_cm?: number | null
          marco_std_entre_plantas_cm?: number | null
          kg_plastico_por_ha?: number | null
          m_cinta_riego_por_ha?: number | null
          es_ecologico?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre_interno?: string
          nombre_display?: string
          ciclo_dias?: number
          rendimiento_kg_ha?: number | null
          marco_std_entre_lineas_cm?: number | null
          marco_std_entre_plantas_cm?: number | null
          kg_plastico_por_ha?: number | null
          m_cinta_riego_por_ha?: number | null
          es_ecologico?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      cuadrillas: {
        Row: {
          id: string
          nombre: string
          empresa: string | null
          nif: string | null
          responsable: string | null
          telefono: string | null
          activa: boolean
          qr_code: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          empresa?: string | null
          nif?: string | null
          responsable?: string | null
          telefono?: string | null
          activa?: boolean
          qr_code?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          empresa?: string | null
          nif?: string | null
          responsable?: string | null
          telefono?: string | null
          activa?: boolean
          qr_code?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      camiones: {
        Row: {
          id: string
          matricula: string
          empresa_transporte: string | null
          tipo: 'propio' | 'contratado' | null
          capacidad_kg: number | null
          activo: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          matricula: string
          empresa_transporte?: string | null
          tipo?: 'propio' | 'contratado' | null
          capacidad_kg?: number | null
          activo?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          matricula?: string
          empresa_transporte?: string | null
          tipo?: 'propio' | 'contratado' | null
          capacidad_kg?: number | null
          activo?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      parcels: {
        Row: {
          parcel_id: string
          farm: string
          parcel_number: string | null
          code: string | null
          area_hectares: number | null
          irrigation_type: string | null
          irrigation_type_v2: TipoRiego | null
          status: string | null
          tipo_suelo: TipoSuelo | null
          ph_suelo: number | null
          materia_organica_pct: number | null
          ultima_analisis_suelo: string | null
          created_at: string | null
        }
        Insert: {
          parcel_id: string
          farm: string
          parcel_number?: string | null
          code?: string | null
          area_hectares?: number | null
          irrigation_type?: string | null
          irrigation_type_v2?: TipoRiego | null
          status?: string | null
          tipo_suelo?: TipoSuelo | null
          ph_suelo?: number | null
          materia_organica_pct?: number | null
          ultima_analisis_suelo?: string | null
          created_at?: string | null
        }
        Update: {
          parcel_id?: string
          farm?: string
          parcel_number?: string | null
          code?: string | null
          area_hectares?: number | null
          irrigation_type?: string | null
          irrigation_type_v2?: TipoRiego | null
          status?: string | null
          tipo_suelo?: TipoSuelo | null
          ph_suelo?: number | null
          materia_organica_pct?: number | null
          ultima_analisis_suelo?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      plantings: {
        Row: {
          id: string
          parcel_id: string
          date: string
          crop: string
          variedad: string | null
          marco_cm_entre_lineas: number | null
          marco_cm_entre_plantas: number | null
          num_plantas_real: number | null
          lote_semilla: string | null
          proveedor_semilla: string | null
          fecha_cosecha_estimada: string | null
          sistema_riego: TipoRiego | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          parcel_id: string
          date: string
          crop: string
          variedad?: string | null
          marco_cm_entre_lineas?: number | null
          marco_cm_entre_plantas?: number | null
          num_plantas_real?: number | null
          lote_semilla?: string | null
          proveedor_semilla?: string | null
          fecha_cosecha_estimada?: string | null
          sistema_riego?: TipoRiego | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          parcel_id?: string
          date?: string
          crop?: string
          variedad?: string | null
          marco_cm_entre_lineas?: number | null
          marco_cm_entre_plantas?: number | null
          num_plantas_real?: number | null
          lote_semilla?: string | null
          proveedor_semilla?: string | null
          fecha_cosecha_estimada?: string | null
          sistema_riego?: TipoRiego | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantings_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          }
        ]
      }
      work_records: {
        Row: {
          id: string
          parcel_id: string
          date: string
          work_type: string
          workers: number | null
          hours: number | null
          description: string | null
          cuadrilla_id: string | null
          hora_entrada: string | null
          hora_salida: string | null
          qr_scan_timestamp: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          parcel_id: string
          date: string
          work_type: string
          workers?: number | null
          hours?: number | null
          description?: string | null
          cuadrilla_id?: string | null
          hora_entrada?: string | null
          hora_salida?: string | null
          qr_scan_timestamp?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          parcel_id?: string
          date?: string
          work_type?: string
          workers?: number | null
          hours?: number | null
          description?: string | null
          cuadrilla_id?: string | null
          hora_entrada?: string | null
          hora_salida?: string | null
          qr_scan_timestamp?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_records_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          }
        ]
      }
      work_records_cuadrillas: {
        Row: {
          id: string
          work_record_id: string
          cuadrilla_id: string
          num_trabajadores: number
          hora_entrada: string | null
          hora_salida: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          work_record_id: string
          cuadrilla_id: string
          num_trabajadores?: number
          hora_entrada?: string | null
          hora_salida?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          work_record_id?: string
          cuadrilla_id?: string
          num_trabajadores?: number
          hora_entrada?: string | null
          hora_salida?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_records_cuadrillas_work_record_id_fkey"
            columns: ["work_record_id"]
            isOneToOne: false
            referencedRelation: "work_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_records_cuadrillas_cuadrilla_id_fkey"
            columns: ["cuadrilla_id"]
            isOneToOne: false
            referencedRelation: "cuadrillas"
            referencedColumns: ["id"]
          }
        ]
      }
      residuos_operacion: {
        Row: {
          id: string
          parcel_id: string
          operacion_id: string | null
          tipo_residuo: TipoResiduo
          kg_instalados: number | null
          kg_retirados: number | null
          proveedor: string | null
          lote_material: string | null
          gestor_residuos: string | null
          fecha_instalacion: string | null
          fecha_retirada: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          parcel_id: string
          operacion_id?: string | null
          tipo_residuo: TipoResiduo
          kg_instalados?: number | null
          kg_retirados?: number | null
          proveedor?: string | null
          lote_material?: string | null
          gestor_residuos?: string | null
          fecha_instalacion?: string | null
          fecha_retirada?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          parcel_id?: string
          operacion_id?: string | null
          tipo_residuo?: TipoResiduo
          kg_instalados?: number | null
          kg_retirados?: number | null
          proveedor?: string | null
          lote_material?: string | null
          gestor_residuos?: string | null
          fecha_instalacion?: string | null
          fecha_retirada?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residuos_operacion_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          }
        ]
      }
      tickets_pesaje: {
        Row: {
          id: string
          harvest_id: string
          camion_id: string | null
          matricula_manual: string | null
          destino: string
          peso_bruto_kg: number
          peso_tara_kg: number
          peso_neto_kg: number
          conductor: string | null
          hora_salida: string | null
          numero_albaran: string | null
          observaciones: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          harvest_id: string
          camion_id?: string | null
          matricula_manual?: string | null
          destino: string
          peso_bruto_kg: number
          peso_tara_kg?: number
          conductor?: string | null
          hora_salida?: string | null
          numero_albaran?: string | null
          observaciones?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          harvest_id?: string
          camion_id?: string | null
          matricula_manual?: string | null
          destino?: string
          peso_bruto_kg?: number
          peso_tara_kg?: number
          conductor?: string | null
          hora_salida?: string | null
          numero_albaran?: string | null
          observaciones?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_pesaje_harvest_id_fkey"
            columns: ["harvest_id"]
            isOneToOne: false
            referencedRelation: "harvests"
            referencedColumns: ["id"]
          }
        ]
      }
      harvests: {
        Row: {
          id: string
          parcel_id: string
          date: string
          crop: string
          production_kg: number | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          parcel_id: string
          date: string
          crop: string
          production_kg?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          parcel_id?: string
          date?: string
          crop?: string
          production_kg?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "harvests_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          }
        ]
      }
      certificaciones_parcela: {
        Row: {
          id: string
          parcel_id: string
          entidad_certificadora: string
          numero_expediente: string | null
          campana: string
          fecha_inicio: string
          fecha_fin: string | null
          estado: EstadoCertificacion
          observaciones: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          parcel_id: string
          entidad_certificadora: string
          numero_expediente?: string | null
          campana: string
          fecha_inicio: string
          fecha_fin?: string | null
          estado?: EstadoCertificacion
          observaciones?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          parcel_id?: string
          entidad_certificadora?: string
          numero_expediente?: string | null
          campana?: string
          fecha_inicio?: string
          fecha_fin?: string | null
          estado?: EstadoCertificacion
          observaciones?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificaciones_parcela_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      tipo_riego: TipoRiego
      estado_parcela: EstadoParcela
      tipo_suelo: TipoSuelo
      tipo_residuo: TipoResiduo
      estado_certificacion: EstadoCertificacion
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      tipo_riego: ['goteo', 'tradicional', 'aspersion', 'ninguno'],
      estado_parcela: ['activa', 'plantada', 'preparacion', 'cosechada', 'vacia', 'baja'],
      tipo_suelo: ['arcilloso', 'franco', 'arenoso', 'limoso', 'franco_arcilloso'],
      tipo_residuo: ['plastico_acolchado', 'cinta_riego', 'rafia', 'envase_fitosanitario', 'otro'],
      estado_certificacion: ['vigente', 'suspendida', 'en_tramite', 'caducada'],
    },
  },
} as const