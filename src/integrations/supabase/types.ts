export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_proposal_validations: {
        Row: {
          decided_at: string
          decided_by: string | null
          decision: Database["public"]["Enums"]["ai_validation_decision"]
          id: string
          note: string | null
          proposal_id: string
        }
        Insert: {
          decided_at?: string
          decided_by?: string | null
          decision: Database["public"]["Enums"]["ai_validation_decision"]
          id?: string
          note?: string | null
          proposal_id: string
        }
        Update: {
          decided_at?: string
          decided_by?: string | null
          decision?: Database["public"]["Enums"]["ai_validation_decision"]
          id?: string
          note?: string | null
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_proposal_validations_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "ai_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_proposals: {
        Row: {
          category: Database["public"]["Enums"]["ai_proposal_category"]
          created_at: string
          created_by: string | null
          executed_at: string | null
          execution_error: string | null
          hash: string | null
          id: string
          input_json: Json
          model: string | null
          output_json: Json
          proposal_reason: string | null
          proposal_version: number
          provider: string | null
          related_campaign: string | null
          related_parcel_id: string | null
          related_work_record_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["ai_proposal_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["ai_proposal_category"]
          created_at?: string
          created_by?: string | null
          executed_at?: string | null
          execution_error?: string | null
          hash?: string | null
          id?: string
          input_json?: Json
          model?: string | null
          output_json?: Json
          proposal_reason?: string | null
          proposal_version?: number
          provider?: string | null
          related_campaign?: string | null
          related_parcel_id?: string | null
          related_work_record_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["ai_proposal_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["ai_proposal_category"]
          created_at?: string
          created_by?: string | null
          executed_at?: string | null
          execution_error?: string | null
          hash?: string | null
          id?: string
          input_json?: Json
          model?: string | null
          output_json?: Json
          proposal_reason?: string | null
          proposal_version?: number
          provider?: string | null
          related_campaign?: string | null
          related_parcel_id?: string | null
          related_work_record_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["ai_proposal_status"]
          updated_at?: string
        }
        Relationships: []
      }
      analisis_agua: {
        Row: {
          cloruros_ppm: number | null
          conductividad_ec: number | null
          created_at: string | null
          dureza_total: number | null
          fecha: string | null
          finca: string
          fuente: string
          herramienta: string | null
          id: string
          nitratos_ppm: number | null
          observaciones: string | null
          operario: string | null
          ph: number | null
          salinidad_ppm: number | null
          sodio_ppm: number | null
          temperatura: number | null
        }
        Insert: {
          cloruros_ppm?: number | null
          conductividad_ec?: number | null
          created_at?: string | null
          dureza_total?: number | null
          fecha?: string | null
          finca: string
          fuente: string
          herramienta?: string | null
          id?: string
          nitratos_ppm?: number | null
          observaciones?: string | null
          operario?: string | null
          ph?: number | null
          salinidad_ppm?: number | null
          sodio_ppm?: number | null
          temperatura?: number | null
        }
        Update: {
          cloruros_ppm?: number | null
          conductividad_ec?: number | null
          created_at?: string | null
          dureza_total?: number | null
          fecha?: string | null
          finca?: string
          fuente?: string
          herramienta?: string | null
          id?: string
          nitratos_ppm?: number | null
          observaciones?: string | null
          operario?: string | null
          ph?: number | null
          salinidad_ppm?: number | null
          sodio_ppm?: number | null
          temperatura?: number | null
        }
        Relationships: []
      }
      analisis_suelo: {
        Row: {
          conductividad_ec: number | null
          fecha: string | null
          fosforo_ppm: number | null
          herramienta: string | null
          id: string
          informe_url: string | null
          materia_organica: number | null
          nitrogeno_ppm: number | null
          num_muestras: number | null
          observaciones: string | null
          operario: string | null
          parcel_id: string | null
          ph: number | null
          potasio_ppm: number | null
          profundidad_cm: number | null
          salinidad_ppm: number | null
          sodio_ppm: number | null
          temperatura_suelo: number | null
          textura: string | null
        }
        Insert: {
          conductividad_ec?: number | null
          fecha?: string | null
          fosforo_ppm?: number | null
          herramienta?: string | null
          id?: string
          informe_url?: string | null
          materia_organica?: number | null
          nitrogeno_ppm?: number | null
          num_muestras?: number | null
          observaciones?: string | null
          operario?: string | null
          parcel_id?: string | null
          ph?: number | null
          potasio_ppm?: number | null
          profundidad_cm?: number | null
          salinidad_ppm?: number | null
          sodio_ppm?: number | null
          temperatura_suelo?: number | null
          textura?: string | null
        }
        Update: {
          conductividad_ec?: number | null
          fecha?: string | null
          fosforo_ppm?: number | null
          herramienta?: string | null
          id?: string
          informe_url?: string | null
          materia_organica?: number | null
          nitrogeno_ppm?: number | null
          num_muestras?: number | null
          observaciones?: string | null
          operario?: string | null
          parcel_id?: string | null
          ph?: number | null
          potasio_ppm?: number | null
          profundidad_cm?: number | null
          salinidad_ppm?: number | null
          sodio_ppm?: number | null
          temperatura_suelo?: number | null
          textura?: string | null
        }
        Relationships: []
      }
      camiones: {
        Row: {
          activo: boolean | null
          capacidad_kg: number | null
          created_at: string | null
          empresa_transporte: string | null
          id: string
          matricula: string
          tipo: string | null
        }
        Insert: {
          activo?: boolean | null
          capacidad_kg?: number | null
          created_at?: string | null
          empresa_transporte?: string | null
          id?: string
          matricula: string
          tipo?: string | null
        }
        Update: {
          activo?: boolean | null
          capacidad_kg?: number | null
          created_at?: string | null
          empresa_transporte?: string | null
          id?: string
          matricula?: string
          tipo?: string | null
        }
        Relationships: []
      }
      certificaciones_parcela: {
        Row: {
          campana: string
          created_at: string | null
          entidad_certificadora: string
          estado: Database["public"]["Enums"]["estado_certificacion"]
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          numero_expediente: string | null
          observaciones: string | null
          parcel_id: string
        }
        Insert: {
          campana: string
          created_at?: string | null
          entidad_certificadora: string
          estado?: Database["public"]["Enums"]["estado_certificacion"]
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          numero_expediente?: string | null
          observaciones?: string | null
          parcel_id: string
        }
        Update: {
          campana?: string
          created_at?: string | null
          entidad_certificadora?: string
          estado?: Database["public"]["Enums"]["estado_certificacion"]
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          numero_expediente?: string | null
          observaciones?: string | null
          parcel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificaciones_parcela_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          },
        ]
      }
      cuadrillas: {
        Row: {
          activa: boolean | null
          created_at: string | null
          empresa: string | null
          id: string
          nif: string | null
          nombre: string
          qr_code: string | null
          responsable: string | null
          telefono: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          empresa?: string | null
          id?: string
          nif?: string | null
          nombre: string
          qr_code?: string | null
          responsable?: string | null
          telefono?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          empresa?: string | null
          id?: string
          nif?: string | null
          nombre?: string
          qr_code?: string | null
          responsable?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      cultivos_catalogo: {
        Row: {
          ciclo_dias: number
          created_at: string | null
          es_ecologico: boolean | null
          id: string
          kg_plastico_por_ha: number | null
          m_cinta_riego_por_ha: number | null
          marco_std_entre_lineas_cm: number | null
          marco_std_entre_plantas_cm: number | null
          nombre_display: string
          nombre_interno: string
          rendimiento_kg_ha: number | null
        }
        Insert: {
          ciclo_dias: number
          created_at?: string | null
          es_ecologico?: boolean | null
          id?: string
          kg_plastico_por_ha?: number | null
          m_cinta_riego_por_ha?: number | null
          marco_std_entre_lineas_cm?: number | null
          marco_std_entre_plantas_cm?: number | null
          nombre_display: string
          nombre_interno: string
          rendimiento_kg_ha?: number | null
        }
        Update: {
          ciclo_dias?: number
          created_at?: string | null
          es_ecologico?: boolean | null
          id?: string
          kg_plastico_por_ha?: number | null
          m_cinta_riego_por_ha?: number | null
          marco_std_entre_lineas_cm?: number | null
          marco_std_entre_plantas_cm?: number | null
          nombre_display?: string
          nombre_interno?: string
          rendimiento_kg_ha?: number | null
        }
        Relationships: []
      }
      fotos_campo: {
        Row: {
          descripcion: string | null
          fecha: string | null
          id: string
          parcel_id: string
          url_imagen: string | null
        }
        Insert: {
          descripcion?: string | null
          fecha?: string | null
          id?: string
          parcel_id: string
          url_imagen?: string | null
        }
        Update: {
          descripcion?: string | null
          fecha?: string | null
          id?: string
          parcel_id?: string
          url_imagen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fotos_campo_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          },
        ]
      }
      harvests: {
        Row: {
          created_at: string | null
          crop: string
          date: string
          harvest_cost: number | null
          id: string
          notes: string | null
          parcel_id: string
          price_kg: number | null
          production_kg: number | null
        }
        Insert: {
          created_at?: string | null
          crop: string
          date: string
          harvest_cost?: number | null
          id?: string
          notes?: string | null
          parcel_id: string
          price_kg?: number | null
          production_kg?: number | null
        }
        Update: {
          created_at?: string | null
          crop?: string
          date?: string
          harvest_cost?: number | null
          id?: string
          notes?: string | null
          parcel_id?: string
          price_kg?: number | null
          production_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "harvests_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          },
        ]
      }
      lecturas_sensor_planta: {
        Row: {
          clorofila: number | null
          cultivo: string | null
          fecha: string | null
          herramienta: string | null
          id: string
          indice_salud: number | null
          ndvi: number | null
          nivel_estres: number | null
          num_plantas_medidas: number | null
          observaciones: string | null
          operario: string | null
          parcel_id: string | null
        }
        Insert: {
          clorofila?: number | null
          cultivo?: string | null
          fecha?: string | null
          herramienta?: string | null
          id?: string
          indice_salud?: number | null
          ndvi?: number | null
          nivel_estres?: number | null
          num_plantas_medidas?: number | null
          observaciones?: string | null
          operario?: string | null
          parcel_id?: string | null
        }
        Update: {
          clorofila?: number | null
          cultivo?: string | null
          fecha?: string | null
          herramienta?: string | null
          id?: string
          indice_salud?: number | null
          ndvi?: number | null
          nivel_estres?: number | null
          num_plantas_medidas?: number | null
          observaciones?: string | null
          operario?: string | null
          parcel_id?: string | null
        }
        Relationships: []
      }
      parcel_photos: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          parcel_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          parcel_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          parcel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parcel_photos_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          },
        ]
      }
      parcel_production: {
        Row: {
          area_hectares: number | null
          crop: string | null
          estimated_cost: number | null
          estimated_drip_meters: number | null
          estimated_plastic_kg: number | null
          estimated_production_kg: number | null
          parcel_id: string
        }
        Insert: {
          area_hectares?: number | null
          crop?: string | null
          estimated_cost?: number | null
          estimated_drip_meters?: number | null
          estimated_plastic_kg?: number | null
          estimated_production_kg?: number | null
          parcel_id: string
        }
        Update: {
          area_hectares?: number | null
          crop?: string | null
          estimated_cost?: number | null
          estimated_drip_meters?: number | null
          estimated_plastic_kg?: number | null
          estimated_production_kg?: number | null
          parcel_id?: string
        }
        Relationships: []
      }
      parcels: {
        Row: {
          area_hectares: number | null
          code: string | null
          created_at: string | null
          farm: string
          irrigation_type: string | null
          irrigation_type_v2: Database["public"]["Enums"]["tipo_riego"] | null
          materia_organica_pct: number | null
          parcel_id: string
          parcel_number: string | null
          ph_suelo: number | null
          status: string | null
          tipo_suelo: Database["public"]["Enums"]["tipo_suelo"] | null
          ultima_analisis_suelo: string | null
        }
        Insert: {
          area_hectares?: number | null
          code?: string | null
          created_at?: string | null
          farm: string
          irrigation_type?: string | null
          irrigation_type_v2?: Database["public"]["Enums"]["tipo_riego"] | null
          materia_organica_pct?: number | null
          parcel_id: string
          parcel_number?: string | null
          ph_suelo?: number | null
          status?: string | null
          tipo_suelo?: Database["public"]["Enums"]["tipo_suelo"] | null
          ultima_analisis_suelo?: string | null
        }
        Update: {
          area_hectares?: number | null
          code?: string | null
          created_at?: string | null
          farm?: string
          irrigation_type?: string | null
          irrigation_type_v2?: Database["public"]["Enums"]["tipo_riego"] | null
          materia_organica_pct?: number | null
          parcel_id?: string
          parcel_number?: string | null
          ph_suelo?: number | null
          status?: string | null
          tipo_suelo?: Database["public"]["Enums"]["tipo_suelo"] | null
          ultima_analisis_suelo?: string | null
        }
        Relationships: []
      }
      plantings: {
        Row: {
          created_at: string | null
          crop: string
          date: string
          fecha_cosecha_estimada: string | null
          id: string
          lote_semilla: string | null
          marco_cm_entre_lineas: number | null
          marco_cm_entre_plantas: number | null
          notes: string | null
          num_plantas_real: number | null
          parcel_id: string
          proveedor_semilla: string | null
          sistema_riego: Database["public"]["Enums"]["tipo_riego"] | null
          variedad: string | null
        }
        Insert: {
          created_at?: string | null
          crop: string
          date: string
          fecha_cosecha_estimada?: string | null
          id?: string
          lote_semilla?: string | null
          marco_cm_entre_lineas?: number | null
          marco_cm_entre_plantas?: number | null
          notes?: string | null
          num_plantas_real?: number | null
          parcel_id: string
          proveedor_semilla?: string | null
          sistema_riego?: Database["public"]["Enums"]["tipo_riego"] | null
          variedad?: string | null
        }
        Update: {
          created_at?: string | null
          crop?: string
          date?: string
          fecha_cosecha_estimada?: string | null
          id?: string
          lote_semilla?: string | null
          marco_cm_entre_lineas?: number | null
          marco_cm_entre_plantas?: number | null
          notes?: string | null
          num_plantas_real?: number | null
          parcel_id?: string
          proveedor_semilla?: string | null
          sistema_riego?: Database["public"]["Enums"]["tipo_riego"] | null
          variedad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantings_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          },
        ]
      }
      registros_estado_parcela: {
        Row: {
          cultivo: string | null
          estado: string | null
          fecha: string | null
          id: string
          observaciones: string | null
          parcel_id: string
        }
        Insert: {
          cultivo?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          observaciones?: string | null
          parcel_id: string
        }
        Update: {
          cultivo?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          observaciones?: string | null
          parcel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_estado_parcela_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          },
        ]
      }
      residuos_operacion: {
        Row: {
          created_at: string | null
          fecha_instalacion: string | null
          fecha_retirada: string | null
          gestor_residuos: string | null
          id: string
          kg_instalados: number | null
          kg_retirados: number | null
          lote_material: string | null
          operacion_id: string | null
          parcel_id: string
          proveedor: string | null
          tipo_residuo: Database["public"]["Enums"]["tipo_residuo"]
        }
        Insert: {
          created_at?: string | null
          fecha_instalacion?: string | null
          fecha_retirada?: string | null
          gestor_residuos?: string | null
          id?: string
          kg_instalados?: number | null
          kg_retirados?: number | null
          lote_material?: string | null
          operacion_id?: string | null
          parcel_id: string
          proveedor?: string | null
          tipo_residuo: Database["public"]["Enums"]["tipo_residuo"]
        }
        Update: {
          created_at?: string | null
          fecha_instalacion?: string | null
          fecha_retirada?: string | null
          gestor_residuos?: string | null
          id?: string
          kg_instalados?: number | null
          kg_retirados?: number | null
          lote_material?: string | null
          operacion_id?: string | null
          parcel_id?: string
          proveedor?: string | null
          tipo_residuo?: Database["public"]["Enums"]["tipo_residuo"]
        }
        Relationships: [
          {
            foreignKeyName: "residuos_operacion_operacion_id_fkey"
            columns: ["operacion_id"]
            isOneToOne: false
            referencedRelation: "work_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residuos_operacion_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          },
        ]
      }
      tickets_pesaje: {
        Row: {
          camion_id: string | null
          conductor: string | null
          created_at: string | null
          destino: string
          harvest_id: string
          hora_salida: string | null
          id: string
          matricula_manual: string | null
          numero_albaran: string | null
          observaciones: string | null
          peso_bruto_kg: number
          peso_neto_kg: number | null
          peso_tara_kg: number
        }
        Insert: {
          camion_id?: string | null
          conductor?: string | null
          created_at?: string | null
          destino: string
          harvest_id: string
          hora_salida?: string | null
          id?: string
          matricula_manual?: string | null
          numero_albaran?: string | null
          observaciones?: string | null
          peso_bruto_kg: number
          peso_neto_kg?: number | null
          peso_tara_kg?: number
        }
        Update: {
          camion_id?: string | null
          conductor?: string | null
          created_at?: string | null
          destino?: string
          harvest_id?: string
          hora_salida?: string | null
          id?: string
          matricula_manual?: string | null
          numero_albaran?: string | null
          observaciones?: string | null
          peso_bruto_kg?: number
          peso_neto_kg?: number | null
          peso_tara_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "tickets_pesaje_camion_id_fkey"
            columns: ["camion_id"]
            isOneToOne: false
            referencedRelation: "camiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_pesaje_harvest_id_fkey"
            columns: ["harvest_id"]
            isOneToOne: false
            referencedRelation: "harvests"
            referencedColumns: ["id"]
          },
        ]
      }
      vuelos_dron: {
        Row: {
          fecha_vuelo: string | null
          id: string
          observaciones: string | null
          parcel_id: string | null
          url_imagen: string | null
        }
        Insert: {
          fecha_vuelo?: string | null
          id?: string
          observaciones?: string | null
          parcel_id?: string | null
          url_imagen?: string | null
        }
        Update: {
          fecha_vuelo?: string | null
          id?: string
          observaciones?: string | null
          parcel_id?: string | null
          url_imagen?: string | null
        }
        Relationships: []
      }
      work_records: {
        Row: {
          created_at: string | null
          cuadrilla_id: string | null
          date: string
          description: string | null
          hora_entrada: string | null
          hora_salida: string | null
          hours: number | null
          id: string
          parcel_id: string
          qr_scan_timestamp: string | null
          work_type: string
          workers: number | null
        }
        Insert: {
          created_at?: string | null
          cuadrilla_id?: string | null
          date: string
          description?: string | null
          hora_entrada?: string | null
          hora_salida?: string | null
          hours?: number | null
          id?: string
          parcel_id: string
          qr_scan_timestamp?: string | null
          work_type: string
          workers?: number | null
        }
        Update: {
          created_at?: string | null
          cuadrilla_id?: string | null
          date?: string
          description?: string | null
          hora_entrada?: string | null
          hora_salida?: string | null
          hours?: number | null
          id?: string
          parcel_id?: string
          qr_scan_timestamp?: string | null
          work_type?: string
          workers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_records_cuadrilla_id_fkey"
            columns: ["cuadrilla_id"]
            isOneToOne: false
            referencedRelation: "cuadrillas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_records_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["parcel_id"]
          },
        ]
      }
      work_records_cuadrillas: {
        Row: {
          created_at: string | null
          cuadrilla_id: string
          hora_entrada: string | null
          hora_salida: string | null
          id: string
          num_trabajadores: number
          work_record_id: string
        }
        Insert: {
          created_at?: string | null
          cuadrilla_id: string
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          num_trabajadores?: number
          work_record_id: string
        }
        Update: {
          created_at?: string | null
          cuadrilla_id?: string
          hora_entrada?: string | null
          hora_salida?: string | null
          id?: string
          num_trabajadores?: number
          work_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_records_cuadrillas_cuadrilla_id_fkey"
            columns: ["cuadrilla_id"]
            isOneToOne: false
            referencedRelation: "cuadrillas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_records_cuadrillas_work_record_id_fkey"
            columns: ["work_record_id"]
            isOneToOne: false
            referencedRelation: "work_records"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_categorias: {
        Row: {
          id:     string
          nombre: string
          slug:   string
          icono:  string
          orden:  number
        }
        Insert: {
          id?:    string
          nombre: string
          slug:   string
          icono:  string
          orden:  number
        }
        Update: {
          id?:     string
          nombre?: string
          slug?:   string
          icono?:  string
          orden?:  number
        }
        Relationships: []
      }
      inventario_ubicaciones: {
        Row: {
          id:          string
          nombre:      string
          descripcion: string | null
          foto_url:    string | null
          activa:      boolean
          orden:       number
        }
        Insert: {
          id?:          string
          nombre:       string
          descripcion?: string | null
          foto_url?:    string | null
          activa?:      boolean
          orden:        number
        }
        Update: {
          id?:          string
          nombre?:      string
          descripcion?: string | null
          foto_url?:    string | null
          activa?:      boolean
          orden?:       number
        }
        Relationships: []
      }
      inventario_registros: {
        Row: {
          id:           string
          ubicacion_id: string
          categoria_id: string
          cantidad:     number
          unidad:       string
          descripcion:  string | null
          foto_url:     string | null
          notas:        string | null
          created_at:   string
        }
        Insert: {
          id?:           string
          ubicacion_id:  string
          categoria_id:  string
          cantidad:      number
          unidad:        string
          descripcion?:  string | null
          foto_url?:     string | null
          notas?:        string | null
          created_at?:   string
        }
        Update: {
          id?:           string
          ubicacion_id?: string
          categoria_id?: string
          cantidad?:     number
          unidad?:       string
          descripcion?:  string | null
          foto_url?:     string | null
          notas?:        string | null
          created_at?:   string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_registros_ubicacion_id_fkey"
            columns: ["ubicacion_id"]
            isOneToOne: false
            referencedRelation: "inventario_ubicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_registros_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "inventario_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_informes: {
        Row: {
          id:           string
          tipo:         "mensual_auto" | "manual" | "comparativa"
          fecha_inicio: string
          fecha_fin:    string
          ubicacion_id: string | null
          categoria_id: string | null
          contenido:    Json
          generado_at:  string
        }
        Insert: {
          id?:           string
          tipo:          "mensual_auto" | "manual" | "comparativa"
          fecha_inicio:  string
          fecha_fin:     string
          ubicacion_id?: string | null
          categoria_id?: string | null
          contenido:     Json
          generado_at?:  string
        }
        Update: {
          id?:           string
          tipo?:         "mensual_auto" | "manual" | "comparativa"
          fecha_inicio?: string
          fecha_fin?:    string
          ubicacion_id?: string | null
          categoria_id?: string | null
          contenido?:    Json
          generado_at?:  string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_informes_ubicacion_id_fkey"
            columns: ["ubicacion_id"]
            isOneToOne: false
            referencedRelation: "inventario_ubicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_informes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "inventario_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_proposal_category: "analysis" | "planning" | "report"
      ai_proposal_status:
        | "pending"
        | "approved"
        | "rejected"
        | "executed"
        | "failed"
      ai_validation_decision: "approved" | "rejected"
      estado_certificacion: "vigente" | "suspendida" | "en_tramite" | "caducada"
      estado_parcela:
        | "activa"
        | "plantada"
        | "preparacion"
        | "cosechada"
        | "vacia"
        | "baja"
      tipo_residuo:
        | "plastico_acolchado"
        | "cinta_riego"
        | "rafia"
        | "envase_fitosanitario"
        | "otro"
      tipo_riego: "goteo" | "tradicional" | "aspersion" | "ninguno"
      tipo_suelo:
        | "arcilloso"
        | "franco"
        | "arenoso"
        | "limoso"
        | "franco_arcilloso"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_proposal_category: ["analysis", "planning", "report"],
      ai_proposal_status: [
        "pending",
        "approved",
        "rejected",
        "executed",
        "failed",
      ],
      ai_validation_decision: ["approved", "rejected"],
      estado_certificacion: ["vigente", "suspendida", "en_tramite", "caducada"],
      estado_parcela: [
        "activa",
        "plantada",
        "preparacion",
        "cosechada",
        "vacia",
        "baja",
      ],
      tipo_residuo: [
        "plastico_acolchado",
        "cinta_riego",
        "rafia",
        "envase_fitosanitario",
        "otro",
      ],
      tipo_riego: ["goteo", "tradicional", "aspersion", "ninguno"],
      tipo_suelo: [
        "arcilloso",
        "franco",
        "arenoso",
        "limoso",
        "franco_arcilloso",
      ],
    },
  },
} as const
