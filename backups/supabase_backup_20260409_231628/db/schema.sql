


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ai_proposal_category" AS ENUM (
    'analysis',
    'planning',
    'report'
);


ALTER TYPE "public"."ai_proposal_category" OWNER TO "postgres";


CREATE TYPE "public"."ai_proposal_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'executed',
    'failed'
);


ALTER TYPE "public"."ai_proposal_status" OWNER TO "postgres";


CREATE TYPE "public"."ai_validation_decision" AS ENUM (
    'approved',
    'rejected'
);


ALTER TYPE "public"."ai_validation_decision" OWNER TO "postgres";


CREATE TYPE "public"."estado_certificacion" AS ENUM (
    'vigente',
    'suspendida',
    'en_tramite',
    'caducada'
);


ALTER TYPE "public"."estado_certificacion" OWNER TO "postgres";


CREATE TYPE "public"."estado_parcela" AS ENUM (
    'activa',
    'plantada',
    'preparacion',
    'cosechada',
    'vacia',
    'baja',
    'en_produccion',
    'acolchado'
);


ALTER TYPE "public"."estado_parcela" OWNER TO "postgres";


CREATE TYPE "public"."tipo_residuo" AS ENUM (
    'plastico_acolchado',
    'cinta_riego',
    'rafia',
    'envase_fitosanitario',
    'otro'
);


ALTER TYPE "public"."tipo_residuo" OWNER TO "postgres";


CREATE TYPE "public"."tipo_riego" AS ENUM (
    'goteo',
    'tradicional',
    'aspersion',
    'ninguno'
);


ALTER TYPE "public"."tipo_riego" OWNER TO "postgres";


CREATE TYPE "public"."tipo_suelo" AS ENUM (
    'arcilloso',
    'franco',
    'arenoso',
    'limoso',
    'franco_arcilloso'
);


ALTER TYPE "public"."tipo_suelo" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_ai_proposals_payload_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only allow payload mutation when proposal_version increments exactly by +1
  IF NEW.proposal_version = OLD.proposal_version + 1 THEN
    RETURN NEW;
  END IF;

  -- Block payload changes otherwise
  IF NEW.input_json IS DISTINCT FROM OLD.input_json THEN
    RAISE EXCEPTION 'ai_proposals.input_json is immutable after creation (id=%)', OLD.id;
  END IF;

  IF NEW.output_json IS DISTINCT FROM OLD.output_json THEN
    RAISE EXCEPTION 'ai_proposals.output_json is immutable after creation (id=%)', OLD.id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."block_ai_proposals_payload_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cerrar_jornada_atomica"("p_fecha" "date", "p_usuario" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_parte_id UUID;
  v_fecha_manana DATE;
  v_ejecutados INT := 0;
  v_pendientes INT := 0;
  v_arrastrados INT := 0;
  v_incidencias INT := 0;
  v_cierre_id UUID;
BEGIN
  -- 1. Buscar parte_id del día
  SELECT id INTO v_parte_id FROM partes_diarios WHERE fecha = p_fecha LIMIT 1;
  v_fecha_manana := p_fecha + 1;

  -- 2. Marcar como ejecutados
  WITH actualizados AS (
    UPDATE trabajos_registro tr
    SET estado_planificacion = 'ejecutado', updated_at = NOW()
    WHERE fecha_planificada = p_fecha AND estado_planificacion != 'cancelado'
      AND EXISTS (
        SELECT 1 FROM parte_trabajo pt
        WHERE pt.parte_id = v_parte_id AND pt.tipo_trabajo = tr.tipo_trabajo
          AND COALESCE(pt.finca, '') = COALESCE(tr.finca, '')
      )
    RETURNING id
  ) SELECT count(*) INTO v_ejecutados FROM actualizados;

  -- 3. Marcar y copiar pendientes
  WITH actualizados AS (
    UPDATE trabajos_registro SET estado_planificacion = 'pendiente', updated_at = NOW()
    WHERE fecha_planificada = p_fecha AND estado_planificacion NOT IN ('cancelado', 'ejecutado')
    RETURNING id, tipo_bloque, finca, parcel_id, tipo_trabajo, num_operarios, nombres_operarios, notas, fecha_original, recursos_personal, tractor_id, apero_id, materiales_previstos
  ),
  insertados AS (
    INSERT INTO trabajos_registro (tipo_bloque, fecha, finca, parcel_id, tipo_trabajo, num_operarios, nombres_operarios, notas, created_by, estado_planificacion, prioridad, fecha_planificada, fecha_original, recursos_personal, tractor_id, apero_id, materiales_previstos)
    SELECT tipo_bloque, v_fecha_manana, finca, parcel_id, tipo_trabajo, num_operarios, nombres_operarios, notas, p_usuario, 'borrador', 'alta', v_fecha_manana, COALESCE(fecha_original, p_fecha), recursos_personal, tractor_id, apero_id, materiales_previstos FROM actualizados RETURNING id
  ) SELECT count(*) INTO v_arrastrados FROM insertados;

  SELECT count(*) INTO v_pendientes FROM trabajos_registro WHERE fecha_planificada = p_fecha AND estado_planificacion = 'pendiente';

  -- 4. Copiar incidencias urgentes
  WITH insertados AS (
    INSERT INTO trabajos_registro (tipo_bloque, fecha, finca, parcel_id, tipo_trabajo, notas, created_by, estado_planificacion, prioridad, fecha_planificada)
    SELECT 'mano_obra_interna', v_fecha_manana, finca, parcel_id, 'Incidencia: ' || titulo, descripcion, p_usuario, 'borrador', 'alta', v_fecha_manana
    FROM trabajos_incidencias WHERE urgente = true AND fecha = p_fecha AND estado != 'resuelta' RETURNING id
  ) SELECT count(*) INTO v_incidencias FROM insertados;

  -- 5. Crear registro final
  INSERT INTO cierres_jornada (fecha, parte_diario_id, trabajos_ejecutados, trabajos_pendientes, trabajos_arrastrados, cerrado_by, cerrado_at)
  VALUES (p_fecha, v_parte_id, v_ejecutados, v_pendientes, v_arrastrados, p_usuario, NOW()) RETURNING id INTO v_cierre_id;

  RETURN json_build_object('ejecutados', v_ejecutados, 'arrastrados', v_arrastrados, 'incidenciasNuevasTrabajo', v_incidencias, 'pendientes', v_pendientes, 'fechaMañana', v_fecha_manana, 'cierre', json_build_object('id', v_cierre_id));
END;
$$;


ALTER FUNCTION "public"."cerrar_jornada_atomica"("p_fecha" "date", "p_usuario" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_update_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_proposal_validations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "decision" "public"."ai_validation_decision" NOT NULL,
    "note" "text",
    "decided_by" "uuid",
    "decided_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_proposal_validations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "public"."ai_proposal_status" DEFAULT 'pending'::"public"."ai_proposal_status" NOT NULL,
    "category" "public"."ai_proposal_category" NOT NULL,
    "provider" "text",
    "model" "text",
    "input_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "related_parcel_id" "text",
    "related_campaign" "text",
    "related_work_record_id" "uuid",
    "proposal_reason" "text",
    "proposal_version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "executed_at" timestamp with time zone,
    "execution_error" "text",
    "created_by" "uuid",
    "source" "text",
    "hash" "text"
);


ALTER TABLE "public"."ai_proposals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analisis_agua" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "finca" "text" NOT NULL,
    "fuente" "text" NOT NULL,
    "fecha" timestamp with time zone DEFAULT "now"(),
    "ph" numeric(5,2),
    "conductividad_ec" numeric(8,3),
    "salinidad_ppm" numeric(8,2),
    "temperatura" numeric(5,2),
    "sodio_ppm" numeric(8,2),
    "cloruros_ppm" numeric(8,2),
    "nitratos_ppm" numeric(8,2),
    "dureza_total" numeric(8,2),
    "operario" "text",
    "herramienta" "text" DEFAULT 'Hanna HI9814'::"text",
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analisis_agua" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analisis_suelo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha" timestamp without time zone DEFAULT "now"(),
    "ph" numeric,
    "materia_organica" numeric,
    "observaciones" "text",
    "conductividad_ec" numeric(8,3),
    "salinidad_ppm" numeric(8,2),
    "temperatura_suelo" numeric(5,2),
    "sodio_ppm" numeric(8,2),
    "nitrogeno_ppm" numeric(8,2),
    "fosforo_ppm" numeric(8,2),
    "potasio_ppm" numeric(8,2),
    "textura" "text",
    "profundidad_cm" integer DEFAULT 20,
    "num_muestras" integer DEFAULT 1,
    "operario" "text",
    "herramienta" "text" DEFAULT 'Hanna HI9814'::"text",
    "informe_url" "text",
    "parcel_id" "text"
);


ALTER TABLE "public"."analisis_suelo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."aperos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" "text",
    "denominacion" "text" NOT NULL,
    "marca" "text",
    "ubicacion" "text",
    "estado" "text" DEFAULT 'disponible'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."aperos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."camaras_almacen" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "capacidad_palots" integer,
    "temperatura_objetivo" numeric(5,2),
    "activa" boolean DEFAULT true,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."camaras_almacen" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."camiones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "matricula" "text" NOT NULL,
    "empresa_transporte" "text",
    "tipo" "text",
    "capacidad_kg" numeric(10,2),
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "marca" "text",
    "modelo" "text",
    "anio" integer,
    "fecha_itv" "date",
    "notas_mantenimiento" "text",
    "foto_url" "text",
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    "kilometros_actuales" numeric,
    "fecha_proxima_itv" "date",
    "fecha_proxima_revision" "date",
    "km_proximo_mantenimiento" numeric,
    "gps_info" "text",
    "codigo_interno" "text",
    "estado_operativo" "text" DEFAULT 'disponible'::"text",
    CONSTRAINT "camiones_estado_operativo_check" CHECK (("estado_operativo" = ANY (ARRAY['disponible'::"text", 'en_uso'::"text", 'mantenimiento'::"text", 'baja'::"text"]))),
    CONSTRAINT "camiones_tipo_check" CHECK (("tipo" = ANY (ARRAY['propio'::"text", 'contratado'::"text"])))
);


ALTER TABLE "public"."camiones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalogo_tipos_mantenimiento" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "modulo" "text" NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalogo_tipos_mantenimiento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalogo_tipos_trabajo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."catalogo_tipos_trabajo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificaciones_parcela" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "entidad_certificadora" "text" NOT NULL,
    "numero_expediente" "text",
    "campana" "text" NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date",
    "estado" "public"."estado_certificacion" DEFAULT 'en_tramite'::"public"."estado_certificacion" NOT NULL,
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."certificaciones_parcela" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cierres_jornada" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha" "date" NOT NULL,
    "parte_diario_id" "uuid",
    "trabajos_ejecutados" integer DEFAULT 0,
    "trabajos_pendientes" integer DEFAULT 0,
    "trabajos_arrastrados" integer DEFAULT 0,
    "notas" "text",
    "cerrado_at" timestamp with time zone DEFAULT "now"(),
    "cerrado_by" "text" DEFAULT 'JuanPe'::"text"
);


ALTER TABLE "public"."cierres_jornada" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cuadrillas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "empresa" "text",
    "nif" "text",
    "responsable" "text",
    "telefono" "text",
    "activa" boolean DEFAULT true,
    "qr_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cuadrillas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cultivos_catalogo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre_interno" "text" NOT NULL,
    "nombre_display" "text" NOT NULL,
    "ciclo_dias" integer NOT NULL,
    "rendimiento_kg_ha" numeric(10,2),
    "marco_std_entre_lineas_cm" numeric(6,2),
    "marco_std_entre_plantas_cm" numeric(6,2),
    "kg_plastico_por_ha" numeric(10,2),
    "m_cinta_riego_por_ha" numeric(10,2),
    "es_ecologico" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cultivos_catalogo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."erp_exportaciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "registros_exportados" integer,
    "formato" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "erp_exportaciones_formato_check" CHECK (("formato" = ANY (ARRAY['csv'::"text", 'json'::"text", 'excel'::"text"])))
);


ALTER TABLE "public"."erp_exportaciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fotos_campo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "fecha" timestamp with time zone DEFAULT "now"(),
    "url_imagen" "text",
    "descripcion" "text",
    "latitud" numeric(10,7),
    "longitud" numeric(10,7),
    "tipo" "text" DEFAULT 'general'::"text",
    CONSTRAINT "fotos_campo_tipo_check" CHECK (("tipo" = ANY (ARRAY['general'::"text", 'inspeccion'::"text", 'estado'::"text", 'trabajo'::"text"])))
);


ALTER TABLE "public"."fotos_campo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ganaderos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "telefono" "text",
    "direccion" "text",
    "activo" boolean DEFAULT true NOT NULL,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'sistema'::"text"
);


ALTER TABLE "public"."ganaderos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."harvests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "crop" "text" NOT NULL,
    "production_kg" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "price_kg" numeric,
    "harvest_cost" numeric
);


ALTER TABLE "public"."harvests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icono" "text" NOT NULL,
    "orden" integer NOT NULL
);


ALTER TABLE "public"."inventario_categorias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_entradas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proveedor_id" "uuid",
    "ubicacion_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "producto_id" "uuid",
    "cantidad" numeric(10,2) NOT NULL,
    "unidad" "text" NOT NULL,
    "precio_unitario" numeric(10,2),
    "importe_total" numeric(10,2),
    "receptor" "text",
    "fecha" "date" DEFAULT CURRENT_DATE,
    "foto_albaran" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."inventario_entradas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_informes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "ubicacion_id" "uuid",
    "categoria_id" "uuid",
    "contenido" "jsonb" NOT NULL,
    "generado_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'sistema'::"text",
    CONSTRAINT "inventario_informes_tipo_check" CHECK (("tipo" = ANY (ARRAY['mensual_auto'::"text", 'manual'::"text", 'comparativa'::"text"])))
);


ALTER TABLE "public"."inventario_informes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_movimientos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "producto_id" "uuid",
    "categoria_id" "uuid" NOT NULL,
    "ubicacion_origen_id" "uuid" NOT NULL,
    "ubicacion_destino_id" "uuid" NOT NULL,
    "cantidad" numeric(10,2) NOT NULL,
    "unidad" "text" NOT NULL,
    "fecha" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responsable" "text",
    "notas" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inventario_movimientos_cantidad_check" CHECK (("cantidad" > (0)::numeric)),
    CONSTRAINT "no_mismo_origen_destino" CHECK (("ubicacion_origen_id" <> "ubicacion_destino_id"))
);


ALTER TABLE "public"."inventario_movimientos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_productos_catalogo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "precio_unitario" numeric(10,2),
    "unidad_defecto" "text",
    "activo" boolean DEFAULT true NOT NULL,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inventario_productos_catalogo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_registros" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ubicacion_id" "uuid" NOT NULL,
    "categoria_id" "uuid" NOT NULL,
    "cantidad" numeric(10,2) NOT NULL,
    "unidad" "text" NOT NULL,
    "descripcion" "text",
    "foto_url" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "precio_unitario" numeric(10,2),
    "producto_id" "uuid",
    "foto_url_2" "text",
    "created_by" "text"
);


ALTER TABLE "public"."inventario_registros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_ubicacion_activo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ubicacion_id" "uuid" NOT NULL,
    "maquinaria_tractor_id" "uuid",
    "apero_id" "uuid",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    CONSTRAINT "inventario_ubicacion_activo_un_solo_activo" CHECK (((("maquinaria_tractor_id" IS NOT NULL) AND ("apero_id" IS NULL)) OR (("maquinaria_tractor_id" IS NULL) AND ("apero_id" IS NOT NULL))))
);


ALTER TABLE "public"."inventario_ubicacion_activo" OWNER TO "postgres";


COMMENT ON TABLE "public"."inventario_ubicacion_activo" IS 'Asignación de un tractor (maquinaria_tractores) o un apero (aperos) a una ubicación de inventario; sin duplicar datos del activo.';



CREATE TABLE IF NOT EXISTS "public"."inventario_ubicaciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "descripcion" "text",
    "foto_url" "text",
    "activa" boolean DEFAULT true,
    "orden" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventario_ubicaciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lecturas_sensor_planta" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha" timestamp without time zone DEFAULT "now"(),
    "indice_salud" numeric,
    "nivel_estres" numeric,
    "observaciones" "text",
    "clorofila" numeric(6,2),
    "ndvi" numeric(5,3),
    "cultivo" "text",
    "num_plantas_medidas" integer DEFAULT 5,
    "operario" "text",
    "herramienta" "text" DEFAULT 'SPAD-502'::"text",
    "parcel_id" "text"
);


ALTER TABLE "public"."lecturas_sensor_planta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lia_contexto_sesion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "modulo" "text" NOT NULL,
    "evento" "text" NOT NULL,
    "datos" "jsonb",
    "procesado" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lia_contexto_sesion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lia_memoria" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "descripcion" "text" NOT NULL,
    "modulo" "text",
    "finca" "text",
    "parcel_id" "text",
    "fecha_referencia" "date",
    "peso" numeric(4,2) DEFAULT 1.0,
    "verificado" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lia_memoria_tipo_check" CHECK (("tipo" = ANY (ARRAY['patron'::"text", 'hecho'::"text", 'decision'::"text", 'incidencia'::"text", 'resultado'::"text"])))
);


ALTER TABLE "public"."lia_memoria" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lia_patrones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patron" "text" NOT NULL,
    "frecuencia" integer DEFAULT 1,
    "modulos" "text"[],
    "ultima_deteccion" "date",
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lia_patrones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logistica_combustible" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehiculo_tipo" "text" NOT NULL,
    "vehiculo_id" "uuid" NOT NULL,
    "conductor_id" "uuid",
    "fecha" timestamp with time zone DEFAULT "now"(),
    "litros" numeric(8,2),
    "coste_total" numeric(10,2),
    "gasolinera" "text",
    "foto_url" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    CONSTRAINT "logistica_combustible_vehiculo_tipo_check" CHECK (("vehiculo_tipo" = ANY (ARRAY['camion'::"text", 'vehiculo'::"text"])))
);


ALTER TABLE "public"."logistica_combustible" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logistica_conductores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "telefono" "text",
    "activo" boolean DEFAULT true NOT NULL,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'JuanPe'::"text"
);


ALTER TABLE "public"."logistica_conductores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logistica_inventario_sync" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "vehiculo_id" "uuid" NOT NULL,
    "ubicacion_id" "uuid" NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "logistica_inventario_sync_tipo_check" CHECK (("tipo" = ANY (ARRAY['camion'::"text", 'vehiculo'::"text"])))
);


ALTER TABLE "public"."logistica_inventario_sync" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logistica_mantenimiento" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "camion_id" "uuid",
    "tipo" "text" NOT NULL,
    "descripcion" "text",
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "coste_euros" numeric(10,2),
    "proveedor" "text",
    "foto_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    "foto_url_2" "text"
);


ALTER TABLE "public"."logistica_mantenimiento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logistica_viajes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conductor_id" "uuid",
    "camion_id" "uuid",
    "finca" "text",
    "trabajo_realizado" "text",
    "ruta" "text",
    "hora_salida" timestamp with time zone,
    "hora_llegada" timestamp with time zone,
    "gasto_gasolina_litros" numeric(6,2),
    "gasto_gasolina_euros" numeric(8,2),
    "km_recorridos" numeric(8,2),
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    "destino" "text",
    "personal_id" "uuid"
);


ALTER TABLE "public"."logistica_viajes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maquinaria_aperos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "descripcion" "text",
    "tractor_id" "uuid",
    "activo" boolean DEFAULT true NOT NULL,
    "foto_url" "text",
    "notas" "text",
    "codigo_interno" "text",
    "estado" "text" DEFAULT 'disponible'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    CONSTRAINT "maquinaria_aperos_estado_check" CHECK (("estado" = ANY (ARRAY['disponible'::"text", 'asignado'::"text", 'en_reparacion'::"text", 'baja'::"text"])))
);


ALTER TABLE "public"."maquinaria_aperos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maquinaria_inventario_sync" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "maquinaria_id" "uuid" NOT NULL,
    "ubicacion_id" "uuid" NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "maquinaria_inventario_sync_tipo_check" CHECK (("tipo" = ANY (ARRAY['tractor'::"text", 'apero'::"text"])))
);


ALTER TABLE "public"."maquinaria_inventario_sync" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maquinaria_mantenimiento" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tractor_id" "uuid",
    "tipo" "text" NOT NULL,
    "descripcion" "text",
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "horas_motor_al_momento" numeric(8,1),
    "coste_euros" numeric(10,2),
    "proveedor" "text",
    "foto_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    "foto_url_2" "text"
);


ALTER TABLE "public"."maquinaria_mantenimiento" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maquinaria_tractores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "matricula" "text" NOT NULL,
    "marca" "text",
    "modelo" "text",
    "anio" integer,
    "horas_motor" numeric(8,1) DEFAULT 0,
    "ficha_tecnica" "text",
    "activo" boolean DEFAULT true NOT NULL,
    "foto_url" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    "fecha_proxima_itv" "date",
    "fecha_proxima_revision" "date",
    "horas_proximo_mantenimiento" numeric,
    "gps_info" "text",
    "codigo" "text",
    "tipo" "text",
    "estado" "text" DEFAULT 'disponible'::"text",
    "ubicacion" "text",
    "codigo_interno" "text",
    "estado_operativo" "text" DEFAULT 'disponible'::"text",
    CONSTRAINT "maquinaria_tractores_estado_operativo_check" CHECK (("estado_operativo" = ANY (ARRAY['disponible'::"text", 'en_uso'::"text", 'mantenimiento'::"text", 'baja'::"text"])))
);


ALTER TABLE "public"."maquinaria_tractores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maquinaria_uso" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tractor_id" "uuid",
    "apero_id" "uuid",
    "tractorista" "text",
    "personal_id" "uuid",
    "finca" "text",
    "parcel_id" "text",
    "tipo_trabajo" "text",
    "fecha" "date" NOT NULL,
    "hora_inicio" timestamp with time zone,
    "hora_fin" timestamp with time zone,
    "horas_trabajadas" numeric(6,2),
    "gasolina_litros" numeric(8,2),
    "foto_url" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text" DEFAULT 'sistema'::"text"
);


ALTER TABLE "public"."maquinaria_uso" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."movimientos_palot" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "palot_id" "uuid" NOT NULL,
    "camion_id" "uuid",
    "tipo" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "latitud" numeric(10,7),
    "longitud" numeric(10,7),
    "operador" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "movimientos_palot_tipo_check" CHECK (("tipo" = ANY (ARRAY['carga_campo'::"text", 'descarga_almacen'::"text", 'entrada_camara'::"text", 'salida_expedicion'::"text"])))
);


ALTER TABLE "public"."movimientos_palot" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."palots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "qr_code" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "parcel_id" "text",
    "harvest_id" "uuid",
    "cultivo" "text",
    "lote" "text",
    "peso_kg" numeric(10,2),
    "camara_id" "uuid",
    "posicion_camara" "text",
    "estado" "text" DEFAULT 'en_campo'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "palots_estado_check" CHECK (("estado" = ANY (ARRAY['en_campo'::"text", 'en_transporte'::"text", 'en_almacen'::"text", 'expedido'::"text"])))
);


ALTER TABLE "public"."palots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcel_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text",
    "image_url" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."parcel_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcel_production" (
    "parcel_id" "text" NOT NULL,
    "crop" "text",
    "area_hectares" numeric,
    "estimated_production_kg" numeric,
    "estimated_plastic_kg" numeric,
    "estimated_drip_meters" numeric,
    "estimated_cost" numeric
);


ALTER TABLE "public"."parcel_production" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcels" (
    "parcel_id" "text" NOT NULL,
    "farm" "text" NOT NULL,
    "parcel_number" "text",
    "code" "text",
    "area_hectares" numeric,
    "irrigation_type" "text",
    "status" "text" DEFAULT 'empty'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tipo_suelo" "public"."tipo_suelo",
    "ph_suelo" numeric(4,2),
    "materia_organica_pct" numeric(5,2),
    "ultima_analisis_suelo" "date",
    "irrigation_type_v2" "public"."tipo_riego"
);


ALTER TABLE "public"."parcels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parte_estado_finca" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parte_id" "uuid" NOT NULL,
    "finca" "text" NOT NULL,
    "parcel_id" "text",
    "estado" "text",
    "num_operarios" integer,
    "nombres_operarios" "text",
    "foto_url" "text",
    "foto_url_2" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'sistema'::"text"
);


ALTER TABLE "public"."parte_estado_finca" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parte_personal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parte_id" "uuid" NOT NULL,
    "texto" "text" NOT NULL,
    "con_quien" "text",
    "donde" "text",
    "fecha_hora" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "foto_url" "text",
    "created_by" "text" DEFAULT 'sistema'::"text"
);


ALTER TABLE "public"."parte_personal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parte_residuos_vegetales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parte_id" "uuid" NOT NULL,
    "nombre_conductor" "text",
    "hora_salida_nave" timestamp with time zone,
    "nombre_ganadero" "text",
    "hora_llegada_ganadero" timestamp with time zone,
    "hora_regreso_nave" timestamp with time zone,
    "notas_descarga" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "foto_url" "text",
    "personal_id" "uuid",
    "ganadero_id" "uuid",
    "created_by" "text" DEFAULT 'sistema'::"text"
);


ALTER TABLE "public"."parte_residuos_vegetales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parte_trabajo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parte_id" "uuid" NOT NULL,
    "tipo_trabajo" "text" NOT NULL,
    "finca" "text",
    "ambito" "text",
    "parcelas" "text"[],
    "num_operarios" integer,
    "nombres_operarios" "text",
    "hora_inicio" timestamp with time zone,
    "hora_fin" timestamp with time zone,
    "foto_url" "text",
    "foto_url_2" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'sistema'::"text"
);


ALTER TABLE "public"."parte_trabajo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partes_diarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "responsable" "text" DEFAULT 'JuanPe'::"text" NOT NULL,
    "notas_generales" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'sistema'::"text"
);


ALTER TABLE "public"."partes_diarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "dni" "text",
    "telefono" "text",
    "categoria" "text" NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "foto_url" "text",
    "qr_code" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "codigo_interno" "text",
    "fecha_alta" "date" DEFAULT CURRENT_DATE,
    "carnet_tipo" "text",
    "carnet_caducidad" "date",
    "tacografo" boolean DEFAULT false,
    "finca_asignada" "text",
    "licencias" "text",
    CONSTRAINT "personal_categoria_check" CHECK (("categoria" = ANY (ARRAY['operario_campo'::"text", 'encargado'::"text", 'conductor_maquinaria'::"text", 'conductor_camion'::"text"])))
);


ALTER TABLE "public"."personal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_externo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre_empresa" "text" NOT NULL,
    "nif" "text",
    "telefono_contacto" "text",
    "tipo" "text" NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "qr_code" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "codigo_interno" "text",
    "persona_contacto" "text",
    "presupuesto" "text",
    "trabajos_realiza" "text",
    CONSTRAINT "personal_externo_tipo_check" CHECK (("tipo" = ANY (ARRAY['destajo'::"text", 'jornal_servicio'::"text"])))
);


ALTER TABLE "public"."personal_externo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_tipos_trabajo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "personal_id" "uuid" NOT NULL,
    "tipo_trabajo_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personal_tipos_trabajo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."planificacion_campana" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "finca" "text" NOT NULL,
    "parcel_id" "text",
    "cultivo" "text" NOT NULL,
    "fecha_prevista_plantacion" "date",
    "fecha_estimada_cosecha" "date",
    "recursos_estimados" "text",
    "observaciones" "text",
    "estado" "text" DEFAULT 'planificado'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "planificacion_campana_estado_check" CHECK (("estado" = ANY (ARRAY['planificado'::"text", 'en_curso'::"text", 'completado'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."planificacion_campana" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plantings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "crop" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "variedad" "text",
    "marco_cm_entre_lineas" numeric(6,2),
    "marco_cm_entre_plantas" numeric(6,2),
    "num_plantas_real" integer,
    "lote_semilla" "text",
    "proveedor_semilla" "text",
    "fecha_cosecha_estimada" "date",
    "sistema_riego" "public"."tipo_riego"
);


ALTER TABLE "public"."plantings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presencia_tiempo_real" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cuadrilla_id" "uuid" NOT NULL,
    "parcel_id" "text",
    "work_record_id" "uuid",
    "hora_entrada" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hora_salida" timestamp with time zone,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."presencia_tiempo_real" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proveedores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo_interno" "text",
    "nombre" "text" NOT NULL,
    "nif" "text",
    "telefono" "text",
    "email" "text",
    "direccion" "text",
    "tipo" "text",
    "persona_contacto" "text",
    "activo" boolean DEFAULT true,
    "notas" "text",
    "foto_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    CONSTRAINT "proveedores_tipo_check" CHECK (("tipo" = ANY (ARRAY['proveedor_materiales'::"text", 'ganadero'::"text", 'gestor_residuos_plasticos'::"text", 'otro'::"text"])))
);


ALTER TABLE "public"."proveedores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proveedores_precios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proveedor_id" "uuid" NOT NULL,
    "producto" "text" NOT NULL,
    "unidad" "text",
    "precio_unitario" numeric(10,2),
    "fecha_vigencia" "date" DEFAULT CURRENT_DATE,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."proveedores_precios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registros_estado_parcela" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "fecha" timestamp with time zone DEFAULT "now"(),
    "estado" "text",
    "cultivo" "text",
    "observaciones" "text",
    "foto_url" "text"
);


ALTER TABLE "public"."registros_estado_parcela" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registros_riego" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "zona_id" "uuid",
    "parcel_id" "text",
    "fecha_inicio" timestamp with time zone NOT NULL,
    "fecha_fin" timestamp with time zone,
    "litros_aplicados" numeric(12,2),
    "presion_bar" numeric(5,2),
    "origen_agua" "text",
    "operador" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."registros_riego" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."residuos_operacion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "operacion_id" "uuid",
    "tipo_residuo" "public"."tipo_residuo" NOT NULL,
    "kg_instalados" numeric(10,2),
    "kg_retirados" numeric(10,2),
    "proveedor" "text",
    "lote_material" "text",
    "gestor_residuos" "text",
    "fecha_instalacion" "date",
    "fecha_retirada" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."residuos_operacion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sistema_riego_zonas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "nombre_zona" "text" NOT NULL,
    "tipo_riego" "text",
    "area_ha" numeric(8,4),
    "caudal_nominal_lh" numeric(10,2),
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sistema_riego_zonas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets_pesaje" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "harvest_id" "uuid" NOT NULL,
    "camion_id" "uuid",
    "matricula_manual" "text",
    "destino" "text" NOT NULL,
    "peso_bruto_kg" numeric(10,2) NOT NULL,
    "peso_tara_kg" numeric(10,2) DEFAULT 0 NOT NULL,
    "peso_neto_kg" numeric(10,2) GENERATED ALWAYS AS (("peso_bruto_kg" - "peso_tara_kg")) STORED,
    "conductor" "text",
    "hora_salida" timestamp with time zone DEFAULT "now"(),
    "numero_albaran" "text",
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tickets_pesaje" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trabajos_incidencias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "urgente" boolean DEFAULT false NOT NULL,
    "titulo" "text" NOT NULL,
    "descripcion" "text",
    "finca" "text",
    "parcel_id" "text",
    "estado" "text" DEFAULT 'abierta'::"text" NOT NULL,
    "foto_url" "text",
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "fecha_resolucion" "date",
    "notas_resolucion" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    CONSTRAINT "trabajos_incidencias_estado_check" CHECK (("estado" = ANY (ARRAY['abierta'::"text", 'en_proceso'::"text", 'resuelta'::"text"])))
);


ALTER TABLE "public"."trabajos_incidencias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trabajos_registro" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo_bloque" "text" NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "hora_inicio" timestamp with time zone,
    "hora_fin" timestamp with time zone,
    "finca" "text",
    "parcel_id" "text",
    "tipo_trabajo" "text" NOT NULL,
    "num_operarios" integer DEFAULT 0,
    "nombres_operarios" "text",
    "foto_url" "text",
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    "estado_planificacion" "text" DEFAULT 'borrador'::"text",
    "prioridad" "text" DEFAULT 'media'::"text",
    "fecha_planificada" "date",
    "fecha_original" "date",
    "tractor_id" "uuid",
    "apero_id" "uuid",
    CONSTRAINT "trabajos_registro_estado_planificacion_check" CHECK (("estado_planificacion" = ANY (ARRAY['borrador'::"text", 'confirmado'::"text", 'ejecutado'::"text", 'pendiente'::"text", 'cancelado'::"text"]))),
    CONSTRAINT "trabajos_registro_prioridad_check" CHECK (("prioridad" = ANY (ARRAY['alta'::"text", 'media'::"text", 'baja'::"text"]))),
    CONSTRAINT "trabajos_registro_tipo_bloque_check" CHECK (("tipo_bloque" = ANY (ARRAY['logistica'::"text", 'maquinaria_agricola'::"text", 'mano_obra_interna'::"text", 'mano_obra_externa'::"text"])))
);


ALTER TABLE "public"."trabajos_registro" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tractores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" "text",
    "matricula" "text",
    "marca" "text",
    "ubicacion" "text",
    "estado" "text" DEFAULT 'disponible'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."tractores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trazabilidad_registros" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "finca" "text" NOT NULL,
    "lote" "text" NOT NULL,
    "cultivo" "text" NOT NULL,
    "fase_produccion" "text",
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date",
    "notas" "text",
    "foto_url" "text",
    "estado" "text" DEFAULT 'activo'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text"
);


ALTER TABLE "public"."trazabilidad_registros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuario_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rol" "text" NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "usuario_roles_rol_check" CHECK (("rol" = ANY (ARRAY['admin'::"text", 'encargado'::"text", 'operario'::"text"])))
);


ALTER TABLE "public"."usuario_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_inventario_activos_en_ubicacion" AS
 SELECT "iua"."id" AS "asignacion_id",
    "iua"."ubicacion_id",
    "ub"."nombre" AS "ubicacion_nombre",
    'tractor'::"text" AS "tipo_activo",
    "mt"."id" AS "maquinaria_tractor_id",
    NULL::"uuid" AS "apero_id",
    "mt"."matricula" AS "etiqueta",
    TRIM(BOTH FROM "concat_ws"(' '::"text", NULLIF("mt"."marca", ''::"text"), NULLIF("mt"."modelo", ''::"text"))) AS "detalle",
    "mt"."estado" AS "estado_texto_activo",
    "mt"."ubicacion" AS "ubicacion_texto_legacy",
    "mt"."activo" AS "activo_operativo"
   FROM (("public"."inventario_ubicacion_activo" "iua"
     JOIN "public"."inventario_ubicaciones" "ub" ON (("ub"."id" = "iua"."ubicacion_id")))
     JOIN "public"."maquinaria_tractores" "mt" ON (("mt"."id" = "iua"."maquinaria_tractor_id")))
  WHERE ("iua"."maquinaria_tractor_id" IS NOT NULL)
UNION ALL
 SELECT "iua"."id" AS "asignacion_id",
    "iua"."ubicacion_id",
    "ub"."nombre" AS "ubicacion_nombre",
    'apero'::"text" AS "tipo_activo",
    NULL::"uuid" AS "maquinaria_tractor_id",
    "ap"."id" AS "apero_id",
    COALESCE(NULLIF("ap"."codigo", ''::"text"), "ap"."denominacion") AS "etiqueta",
    TRIM(BOTH FROM "concat_ws"(' — '::"text", "ap"."denominacion", NULLIF("ap"."marca", ''::"text"))) AS "detalle",
    "ap"."estado" AS "estado_texto_activo",
    "ap"."ubicacion" AS "ubicacion_texto_legacy",
    true AS "activo_operativo"
   FROM (("public"."inventario_ubicacion_activo" "iua"
     JOIN "public"."inventario_ubicaciones" "ub" ON (("ub"."id" = "iua"."ubicacion_id")))
     JOIN "public"."aperos" "ap" ON (("ap"."id" = "iua"."apero_id")))
  WHERE ("iua"."apero_id" IS NOT NULL);


ALTER VIEW "public"."v_inventario_activos_en_ubicacion" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_tractores_en_inventario" AS
 SELECT DISTINCT "mt"."id",
    "mt"."matricula",
    "mt"."marca",
    "mt"."modelo",
    "mt"."anio",
    "mt"."horas_motor",
    "mt"."ficha_tecnica",
    "mt"."activo",
    "mt"."foto_url",
    "mt"."notas",
    "mt"."created_at",
    "mt"."created_by",
    "mt"."fecha_proxima_itv",
    "mt"."fecha_proxima_revision",
    "mt"."horas_proximo_mantenimiento",
    "mt"."gps_info",
    "mt"."codigo",
    "mt"."tipo",
    "mt"."estado",
    "mt"."ubicacion"
   FROM ("public"."maquinaria_tractores" "mt"
     JOIN "public"."inventario_ubicacion_activo" "iua" ON (("iua"."maquinaria_tractor_id" = "mt"."id")));


ALTER VIEW "public"."v_tractores_en_inventario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "vehicle_tipo" "text",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "latitud" numeric(10,7) NOT NULL,
    "longitud" numeric(10,7) NOT NULL,
    "velocidad_kmh" numeric(6,2),
    "parcel_id_detectada" "text",
    "estado" "text" DEFAULT 'activo'::"text",
    CONSTRAINT "vehicle_positions_vehicle_tipo_check" CHECK (("vehicle_tipo" = ANY (ARRAY['tractor'::"text", 'camion'::"text", 'vehiculo'::"text"])))
);


ALTER TABLE "public"."vehicle_positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehiculos_empresa" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo_interno" "text",
    "matricula" "text" NOT NULL,
    "marca" "text",
    "modelo" "text",
    "anio" integer,
    "tipo" "text",
    "conductor_habitual_id" "uuid",
    "km_actuales" numeric,
    "estado_operativo" "text" DEFAULT 'disponible'::"text",
    "fecha_proxima_itv" "date",
    "fecha_proxima_revision" "date",
    "foto_url" "text",
    "notas" "text",
    "gps_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text",
    CONSTRAINT "vehiculos_empresa_estado_operativo_check" CHECK (("estado_operativo" = ANY (ARRAY['disponible'::"text", 'en_uso'::"text", 'mantenimiento'::"text", 'baja'::"text"]))),
    CONSTRAINT "vehiculos_empresa_tipo_check" CHECK (("tipo" = ANY (ARRAY['furgoneta'::"text", 'turismo'::"text", 'pick_up'::"text", 'otro'::"text"])))
);


ALTER TABLE "public"."vehiculos_empresa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vuelos_dron" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "uuid",
    "fecha_vuelo" timestamp without time zone,
    "url_imagen" "text",
    "observaciones" "text"
);


ALTER TABLE "public"."vuelos_dron" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "work_type" "text" NOT NULL,
    "workers" integer,
    "hours" numeric,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cuadrilla_id" "uuid",
    "hora_entrada" timestamp with time zone,
    "hora_salida" timestamp with time zone,
    "qr_scan_timestamp" timestamp with time zone,
    "qr_scan_entrada" timestamp with time zone,
    "qr_scan_salida" timestamp with time zone,
    "horas_calculadas" numeric(5,2)
);


ALTER TABLE "public"."work_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_records_cuadrillas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_record_id" "uuid" NOT NULL,
    "cuadrilla_id" "uuid" NOT NULL,
    "num_trabajadores" integer DEFAULT 1 NOT NULL,
    "hora_entrada" timestamp with time zone,
    "hora_salida" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."work_records_cuadrillas" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_proposal_validations"
    ADD CONSTRAINT "ai_proposal_validations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_proposals"
    ADD CONSTRAINT "ai_proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analisis_agua"
    ADD CONSTRAINT "analisis_agua_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analisis_suelo"
    ADD CONSTRAINT "analisis_suelo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."aperos"
    ADD CONSTRAINT "aperos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."camaras_almacen"
    ADD CONSTRAINT "camaras_almacen_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."camiones"
    ADD CONSTRAINT "camiones_codigo_interno_key" UNIQUE ("codigo_interno");



ALTER TABLE ONLY "public"."camiones"
    ADD CONSTRAINT "camiones_matricula_key" UNIQUE ("matricula");



ALTER TABLE ONLY "public"."camiones"
    ADD CONSTRAINT "camiones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalogo_tipos_mantenimiento"
    ADD CONSTRAINT "catalogo_tipos_mantenimiento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalogo_tipos_trabajo"
    ADD CONSTRAINT "catalogo_tipos_trabajo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificaciones_parcela"
    ADD CONSTRAINT "certificaciones_parcela_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cierres_jornada"
    ADD CONSTRAINT "cierres_jornada_fecha_key" UNIQUE ("fecha");



ALTER TABLE ONLY "public"."cierres_jornada"
    ADD CONSTRAINT "cierres_jornada_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cuadrillas"
    ADD CONSTRAINT "cuadrillas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cuadrillas"
    ADD CONSTRAINT "cuadrillas_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."cultivos_catalogo"
    ADD CONSTRAINT "cultivos_catalogo_nombre_interno_key" UNIQUE ("nombre_interno");



ALTER TABLE ONLY "public"."cultivos_catalogo"
    ADD CONSTRAINT "cultivos_catalogo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."erp_exportaciones"
    ADD CONSTRAINT "erp_exportaciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fotos_campo"
    ADD CONSTRAINT "fotos_campo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ganaderos"
    ADD CONSTRAINT "ganaderos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."harvests"
    ADD CONSTRAINT "harvests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_categorias"
    ADD CONSTRAINT "inventario_categorias_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."inventario_categorias"
    ADD CONSTRAINT "inventario_categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_categorias"
    ADD CONSTRAINT "inventario_categorias_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_informes"
    ADD CONSTRAINT "inventario_informes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_productos_catalogo"
    ADD CONSTRAINT "inventario_productos_catalogo_nombre_categoria_id_key" UNIQUE ("nombre", "categoria_id");



ALTER TABLE ONLY "public"."inventario_productos_catalogo"
    ADD CONSTRAINT "inventario_productos_catalogo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_registros"
    ADD CONSTRAINT "inventario_registros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_ubicacion_activo"
    ADD CONSTRAINT "inventario_ubicacion_activo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_ubicaciones"
    ADD CONSTRAINT "inventario_ubicaciones_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."inventario_ubicaciones"
    ADD CONSTRAINT "inventario_ubicaciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_sensor_planta"
    ADD CONSTRAINT "lecturas_sensor_planta_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lia_contexto_sesion"
    ADD CONSTRAINT "lia_contexto_sesion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lia_memoria"
    ADD CONSTRAINT "lia_memoria_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lia_patrones"
    ADD CONSTRAINT "lia_patrones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logistica_combustible"
    ADD CONSTRAINT "logistica_combustible_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logistica_conductores"
    ADD CONSTRAINT "logistica_conductores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logistica_inventario_sync"
    ADD CONSTRAINT "logistica_inventario_sync_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logistica_mantenimiento"
    ADD CONSTRAINT "logistica_mantenimiento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logistica_viajes"
    ADD CONSTRAINT "logistica_viajes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maquinaria_aperos"
    ADD CONSTRAINT "maquinaria_aperos_codigo_interno_key" UNIQUE ("codigo_interno");



ALTER TABLE ONLY "public"."maquinaria_aperos"
    ADD CONSTRAINT "maquinaria_aperos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maquinaria_inventario_sync"
    ADD CONSTRAINT "maquinaria_inventario_sync_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maquinaria_mantenimiento"
    ADD CONSTRAINT "maquinaria_mantenimiento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maquinaria_tractores"
    ADD CONSTRAINT "maquinaria_tractores_codigo_interno_key" UNIQUE ("codigo_interno");



ALTER TABLE ONLY "public"."maquinaria_tractores"
    ADD CONSTRAINT "maquinaria_tractores_matricula_key" UNIQUE ("matricula");



ALTER TABLE ONLY "public"."maquinaria_tractores"
    ADD CONSTRAINT "maquinaria_tractores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maquinaria_uso"
    ADD CONSTRAINT "maquinaria_uso_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimientos_palot"
    ADD CONSTRAINT "movimientos_palot_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."parcel_photos"
    ADD CONSTRAINT "parcel_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parcel_production"
    ADD CONSTRAINT "parcel_production_pkey" PRIMARY KEY ("parcel_id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_pkey" PRIMARY KEY ("parcel_id");



ALTER TABLE ONLY "public"."parte_estado_finca"
    ADD CONSTRAINT "parte_estado_finca_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parte_personal"
    ADD CONSTRAINT "parte_personal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parte_residuos_vegetales"
    ADD CONSTRAINT "parte_residuos_vegetales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parte_trabajo"
    ADD CONSTRAINT "parte_trabajo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."partes_diarios"
    ADD CONSTRAINT "partes_diarios_fecha_unique" UNIQUE ("fecha");



ALTER TABLE ONLY "public"."partes_diarios"
    ADD CONSTRAINT "partes_diarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal"
    ADD CONSTRAINT "personal_codigo_interno_key" UNIQUE ("codigo_interno");



ALTER TABLE ONLY "public"."personal_externo"
    ADD CONSTRAINT "personal_externo_codigo_interno_key" UNIQUE ("codigo_interno");



ALTER TABLE ONLY "public"."personal_externo"
    ADD CONSTRAINT "personal_externo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_externo"
    ADD CONSTRAINT "personal_externo_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."personal"
    ADD CONSTRAINT "personal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal"
    ADD CONSTRAINT "personal_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."personal_tipos_trabajo"
    ADD CONSTRAINT "personal_tipos_trabajo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."planificacion_campana"
    ADD CONSTRAINT "planificacion_campana_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plantings"
    ADD CONSTRAINT "plantings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presencia_tiempo_real"
    ADD CONSTRAINT "presencia_tiempo_real_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proveedores"
    ADD CONSTRAINT "proveedores_codigo_interno_key" UNIQUE ("codigo_interno");



ALTER TABLE ONLY "public"."proveedores"
    ADD CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proveedores_precios"
    ADD CONSTRAINT "proveedores_precios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registros_estado_parcela"
    ADD CONSTRAINT "registros_estado_parcela_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registros_riego"
    ADD CONSTRAINT "registros_riego_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."residuos_operacion"
    ADD CONSTRAINT "residuos_operacion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sistema_riego_zonas"
    ADD CONSTRAINT "sistema_riego_zonas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets_pesaje"
    ADD CONSTRAINT "tickets_pesaje_numero_albaran_key" UNIQUE ("numero_albaran");



ALTER TABLE ONLY "public"."tickets_pesaje"
    ADD CONSTRAINT "tickets_pesaje_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trabajos_incidencias"
    ADD CONSTRAINT "trabajos_incidencias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trabajos_registro"
    ADD CONSTRAINT "trabajos_registro_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tractores"
    ADD CONSTRAINT "tractores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trazabilidad_registros"
    ADD CONSTRAINT "trazabilidad_registros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuario_roles"
    ADD CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_positions"
    ADD CONSTRAINT "vehicle_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehiculos_empresa"
    ADD CONSTRAINT "vehiculos_empresa_codigo_interno_key" UNIQUE ("codigo_interno");



ALTER TABLE ONLY "public"."vehiculos_empresa"
    ADD CONSTRAINT "vehiculos_empresa_matricula_key" UNIQUE ("matricula");



ALTER TABLE ONLY "public"."vehiculos_empresa"
    ADD CONSTRAINT "vehiculos_empresa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vuelos_dron"
    ADD CONSTRAINT "vuelos_dron_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_records_cuadrillas"
    ADD CONSTRAINT "work_records_cuadrillas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_records_cuadrillas"
    ADD CONSTRAINT "work_records_cuadrillas_work_record_id_cuadrilla_id_key" UNIQUE ("work_record_id", "cuadrilla_id");



ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_proposal_validations_proposal_id" ON "public"."ai_proposal_validations" USING "btree" ("proposal_id");



CREATE INDEX "idx_ai_proposals_category" ON "public"."ai_proposals" USING "btree" ("category");



CREATE INDEX "idx_ai_proposals_created_by" ON "public"."ai_proposals" USING "btree" ("created_by");



CREATE INDEX "idx_ai_proposals_hash" ON "public"."ai_proposals" USING "btree" ("hash");



CREATE INDEX "idx_ai_proposals_status" ON "public"."ai_proposals" USING "btree" ("status");



CREATE INDEX "idx_certificaciones_parcel" ON "public"."certificaciones_parcela" USING "btree" ("parcel_id");



CREATE INDEX "idx_dron_parcela" ON "public"."vuelos_dron" USING "btree" ("parcel_id");



CREATE INDEX "idx_harvests_parcel_date" ON "public"."harvests" USING "btree" ("parcel_id", "date" DESC);



CREATE INDEX "idx_harvests_parcel_id" ON "public"."harvests" USING "btree" ("parcel_id");



CREATE INDEX "idx_inventario_ubicacion_activo_ubicacion" ON "public"."inventario_ubicacion_activo" USING "btree" ("ubicacion_id");



CREATE INDEX "idx_maquinaria_uso_personal" ON "public"."maquinaria_uso" USING "btree" ("personal_id", "fecha" DESC);



CREATE INDEX "idx_maquinaria_uso_tractor" ON "public"."maquinaria_uso" USING "btree" ("tractor_id", "fecha" DESC);



CREATE INDEX "idx_parcel_production" ON "public"."parcel_production" USING "btree" ("parcel_id");



CREATE INDEX "idx_plantings_parcel_date" ON "public"."plantings" USING "btree" ("parcel_id", "date" DESC);



CREATE INDEX "idx_plantings_parcel_id" ON "public"."plantings" USING "btree" ("parcel_id");



CREATE INDEX "idx_residuos_parcel" ON "public"."residuos_operacion" USING "btree" ("parcel_id");



CREATE INDEX "idx_residuos_parcel_id" ON "public"."residuos_operacion" USING "btree" ("parcel_id");



CREATE INDEX "idx_tickets_harvest" ON "public"."tickets_pesaje" USING "btree" ("harvest_id");



CREATE INDEX "idx_vehicle_positions_vehicle_time" ON "public"."vehicle_positions" USING "btree" ("vehicle_id", "timestamp" DESC);



CREATE INDEX "idx_work_records_parcel_date" ON "public"."work_records" USING "btree" ("parcel_id", "date" DESC);



CREATE INDEX "idx_work_records_parcel_id" ON "public"."work_records" USING "btree" ("parcel_id");



CREATE INDEX "inventario_registros_lookup_idx" ON "public"."inventario_registros" USING "btree" ("ubicacion_id", "categoria_id", "created_at" DESC);



CREATE UNIQUE INDEX "uq_inventario_ubicacion_activo_apero" ON "public"."inventario_ubicacion_activo" USING "btree" ("apero_id") WHERE ("apero_id" IS NOT NULL);



CREATE UNIQUE INDEX "uq_inventario_ubicacion_activo_tractor" ON "public"."inventario_ubicacion_activo" USING "btree" ("maquinaria_tractor_id") WHERE ("maquinaria_tractor_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "block_ai_proposals_payload_mutation_trigger" BEFORE UPDATE ON "public"."ai_proposals" FOR EACH ROW EXECUTE FUNCTION "public"."block_ai_proposals_payload_mutation"();



CREATE OR REPLACE TRIGGER "tr_camiones_updated_at" BEFORE UPDATE ON "public"."camiones" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_catalogo_tipos_trabajo_updated_at" BEFORE UPDATE ON "public"."catalogo_tipos_trabajo" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_inventario_registros_updated_at" BEFORE UPDATE ON "public"."inventario_registros" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_inventario_ubicaciones_updated_at" BEFORE UPDATE ON "public"."inventario_ubicaciones" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_maquinaria_aperos_updated_at" BEFORE UPDATE ON "public"."maquinaria_aperos" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_maquinaria_tractores_updated_at" BEFORE UPDATE ON "public"."maquinaria_tractores" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_partes_diarios_updated_at" BEFORE UPDATE ON "public"."partes_diarios" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_personal_externo_updated_at" BEFORE UPDATE ON "public"."personal_externo" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_personal_updated_at" BEFORE UPDATE ON "public"."personal" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_planificacion_campana_updated_at" BEFORE UPDATE ON "public"."planificacion_campana" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_trabajos_registro_updated_at" BEFORE UPDATE ON "public"."trabajos_registro" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_trazabilidad_registros_updated_at" BEFORE UPDATE ON "public"."trazabilidad_registros" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_usuario_roles_updated_at" BEFORE UPDATE ON "public"."usuario_roles" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



CREATE OR REPLACE TRIGGER "tr_vehiculos_empresa_updated_at" BEFORE UPDATE ON "public"."vehiculos_empresa" FOR EACH ROW WHEN (("old".* IS DISTINCT FROM "new".*)) EXECUTE FUNCTION "public"."fn_update_timestamp"();



ALTER TABLE ONLY "public"."ai_proposal_validations"
    ADD CONSTRAINT "ai_proposal_validations_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_proposal_validations"
    ADD CONSTRAINT "ai_proposal_validations_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."ai_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_proposals"
    ADD CONSTRAINT "ai_proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."analisis_suelo"
    ADD CONSTRAINT "analisis_suelo_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificaciones_parcela"
    ADD CONSTRAINT "certificaciones_parcela_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."cierres_jornada"
    ADD CONSTRAINT "cierres_jornada_parte_diario_id_fkey" FOREIGN KEY ("parte_diario_id") REFERENCES "public"."partes_diarios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fotos_campo"
    ADD CONSTRAINT "fotos_campo_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."harvests"
    ADD CONSTRAINT "harvests_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id");



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."inventario_productos_catalogo"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."inventario_informes"
    ADD CONSTRAINT "inventario_informes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id");



ALTER TABLE ONLY "public"."inventario_informes"
    ADD CONSTRAINT "inventario_informes_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."inventario_productos_catalogo"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_ubicacion_destino_id_fkey" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "public"."inventario_ubicaciones"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_ubicacion_origen_id_fkey" FOREIGN KEY ("ubicacion_origen_id") REFERENCES "public"."inventario_ubicaciones"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_productos_catalogo"
    ADD CONSTRAINT "inventario_productos_catalogo_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_registros"
    ADD CONSTRAINT "inventario_registros_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id");



ALTER TABLE ONLY "public"."inventario_registros"
    ADD CONSTRAINT "inventario_registros_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."inventario_productos_catalogo"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventario_registros"
    ADD CONSTRAINT "inventario_registros_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."inventario_ubicacion_activo"
    ADD CONSTRAINT "inventario_ubicacion_activo_apero_id_fkey" FOREIGN KEY ("apero_id") REFERENCES "public"."aperos"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_ubicacion_activo"
    ADD CONSTRAINT "inventario_ubicacion_activo_maquinaria_tractor_id_fkey" FOREIGN KEY ("maquinaria_tractor_id") REFERENCES "public"."maquinaria_tractores"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_ubicacion_activo"
    ADD CONSTRAINT "inventario_ubicacion_activo_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lecturas_sensor_planta"
    ADD CONSTRAINT "lecturas_sensor_planta_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logistica_combustible"
    ADD CONSTRAINT "logistica_combustible_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "public"."personal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."logistica_inventario_sync"
    ADD CONSTRAINT "logistica_inventario_sync_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."logistica_mantenimiento"
    ADD CONSTRAINT "logistica_mantenimiento_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "public"."camiones"("id");



ALTER TABLE ONLY "public"."logistica_viajes"
    ADD CONSTRAINT "logistica_viajes_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "public"."camiones"("id");



ALTER TABLE ONLY "public"."logistica_viajes"
    ADD CONSTRAINT "logistica_viajes_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "public"."logistica_conductores"("id");



ALTER TABLE ONLY "public"."logistica_viajes"
    ADD CONSTRAINT "logistica_viajes_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maquinaria_aperos"
    ADD CONSTRAINT "maquinaria_aperos_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "public"."maquinaria_tractores"("id");



ALTER TABLE ONLY "public"."maquinaria_inventario_sync"
    ADD CONSTRAINT "maquinaria_inventario_sync_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."maquinaria_mantenimiento"
    ADD CONSTRAINT "maquinaria_mantenimiento_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "public"."maquinaria_tractores"("id");



ALTER TABLE ONLY "public"."maquinaria_uso"
    ADD CONSTRAINT "maquinaria_uso_apero_id_fkey" FOREIGN KEY ("apero_id") REFERENCES "public"."maquinaria_aperos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maquinaria_uso"
    ADD CONSTRAINT "maquinaria_uso_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maquinaria_uso"
    ADD CONSTRAINT "maquinaria_uso_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "public"."maquinaria_tractores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimientos_palot"
    ADD CONSTRAINT "movimientos_palot_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "public"."camiones"("id");



ALTER TABLE ONLY "public"."movimientos_palot"
    ADD CONSTRAINT "movimientos_palot_palot_id_fkey" FOREIGN KEY ("palot_id") REFERENCES "public"."palots"("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_camara_id_fkey" FOREIGN KEY ("camara_id") REFERENCES "public"."camaras_almacen"("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_harvest_id_fkey" FOREIGN KEY ("harvest_id") REFERENCES "public"."harvests"("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."parcel_photos"
    ADD CONSTRAINT "parcel_photos_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parte_estado_finca"
    ADD CONSTRAINT "parte_estado_finca_parte_id_fkey" FOREIGN KEY ("parte_id") REFERENCES "public"."partes_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parte_personal"
    ADD CONSTRAINT "parte_personal_parte_id_fkey" FOREIGN KEY ("parte_id") REFERENCES "public"."partes_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parte_residuos_vegetales"
    ADD CONSTRAINT "parte_residuos_vegetales_ganadero_id_fkey" FOREIGN KEY ("ganadero_id") REFERENCES "public"."ganaderos"("id");



ALTER TABLE ONLY "public"."parte_residuos_vegetales"
    ADD CONSTRAINT "parte_residuos_vegetales_parte_id_fkey" FOREIGN KEY ("parte_id") REFERENCES "public"."partes_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parte_residuos_vegetales"
    ADD CONSTRAINT "parte_residuos_vegetales_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id");



ALTER TABLE ONLY "public"."parte_trabajo"
    ADD CONSTRAINT "parte_trabajo_parte_id_fkey" FOREIGN KEY ("parte_id") REFERENCES "public"."partes_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_tipos_trabajo"
    ADD CONSTRAINT "personal_tipos_trabajo_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_tipos_trabajo"
    ADD CONSTRAINT "personal_tipos_trabajo_tipo_trabajo_id_fkey" FOREIGN KEY ("tipo_trabajo_id") REFERENCES "public"."catalogo_tipos_trabajo"("id");



ALTER TABLE ONLY "public"."planificacion_campana"
    ADD CONSTRAINT "planificacion_campana_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."plantings"
    ADD CONSTRAINT "plantings_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."presencia_tiempo_real"
    ADD CONSTRAINT "presencia_tiempo_real_cuadrilla_id_fkey" FOREIGN KEY ("cuadrilla_id") REFERENCES "public"."cuadrillas"("id");



ALTER TABLE ONLY "public"."presencia_tiempo_real"
    ADD CONSTRAINT "presencia_tiempo_real_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."presencia_tiempo_real"
    ADD CONSTRAINT "presencia_tiempo_real_work_record_id_fkey" FOREIGN KEY ("work_record_id") REFERENCES "public"."work_records"("id");



ALTER TABLE ONLY "public"."proveedores_precios"
    ADD CONSTRAINT "proveedores_precios_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registros_estado_parcela"
    ADD CONSTRAINT "registros_estado_parcela_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registros_riego"
    ADD CONSTRAINT "registros_riego_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."registros_riego"
    ADD CONSTRAINT "registros_riego_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "public"."sistema_riego_zonas"("id");



ALTER TABLE ONLY "public"."residuos_operacion"
    ADD CONSTRAINT "residuos_operacion_operacion_id_fkey" FOREIGN KEY ("operacion_id") REFERENCES "public"."work_records"("id");



ALTER TABLE ONLY "public"."residuos_operacion"
    ADD CONSTRAINT "residuos_operacion_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."sistema_riego_zonas"
    ADD CONSTRAINT "sistema_riego_zonas_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."tickets_pesaje"
    ADD CONSTRAINT "tickets_pesaje_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "public"."camiones"("id");



ALTER TABLE ONLY "public"."tickets_pesaje"
    ADD CONSTRAINT "tickets_pesaje_harvest_id_fkey" FOREIGN KEY ("harvest_id") REFERENCES "public"."harvests"("id");



ALTER TABLE ONLY "public"."trabajos_registro"
    ADD CONSTRAINT "trabajos_registro_apero_id_fkey" FOREIGN KEY ("apero_id") REFERENCES "public"."maquinaria_aperos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trabajos_registro"
    ADD CONSTRAINT "trabajos_registro_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "public"."maquinaria_tractores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_positions"
    ADD CONSTRAINT "vehicle_positions_parcel_id_detectada_fkey" FOREIGN KEY ("parcel_id_detectada") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."vehiculos_empresa"
    ADD CONSTRAINT "vehiculos_empresa_conductor_habitual_id_fkey" FOREIGN KEY ("conductor_habitual_id") REFERENCES "public"."personal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_cuadrilla_id_fkey" FOREIGN KEY ("cuadrilla_id") REFERENCES "public"."cuadrillas"("id");



ALTER TABLE ONLY "public"."work_records_cuadrillas"
    ADD CONSTRAINT "work_records_cuadrillas_cuadrilla_id_fkey" FOREIGN KEY ("cuadrilla_id") REFERENCES "public"."cuadrillas"("id");



ALTER TABLE ONLY "public"."work_records_cuadrillas"
    ADD CONSTRAINT "work_records_cuadrillas_work_record_id_fkey" FOREIGN KEY ("work_record_id") REFERENCES "public"."work_records"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



CREATE POLICY "Public all fotos_campo" ON "public"."fotos_campo" USING (true) WITH CHECK (true);



CREATE POLICY "Public all registros_estado_parcela" ON "public"."registros_estado_parcela" USING (true) WITH CHECK (true);



CREATE POLICY "Public delete harvests" ON "public"."harvests" FOR DELETE USING (true);



CREATE POLICY "Public delete plantings" ON "public"."plantings" FOR DELETE USING (true);



CREATE POLICY "Public delete work_records" ON "public"."work_records" FOR DELETE USING (true);



CREATE POLICY "Public insert ai_proposal_validations" ON "public"."ai_proposal_validations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert ai_proposals" ON "public"."ai_proposals" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert camiones" ON "public"."camiones" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert certificaciones_parcela" ON "public"."certificaciones_parcela" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert cuadrillas" ON "public"."cuadrillas" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert harvests" ON "public"."harvests" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert parcels" ON "public"."parcels" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert plantings" ON "public"."plantings" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert residuos_operacion" ON "public"."residuos_operacion" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert tickets_pesaje" ON "public"."tickets_pesaje" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert work_records" ON "public"."work_records" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public insert work_records_cuadrillas" ON "public"."work_records_cuadrillas" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public read ai_proposal_validations" ON "public"."ai_proposal_validations" FOR SELECT USING (true);



CREATE POLICY "Public read ai_proposals" ON "public"."ai_proposals" FOR SELECT USING (true);



CREATE POLICY "Public read camiones" ON "public"."camiones" FOR SELECT USING (true);



CREATE POLICY "Public read certificaciones_parcela" ON "public"."certificaciones_parcela" FOR SELECT USING (true);



CREATE POLICY "Public read cuadrillas" ON "public"."cuadrillas" FOR SELECT USING (true);



CREATE POLICY "Public read cultivos_catalogo" ON "public"."cultivos_catalogo" FOR SELECT USING (true);



CREATE POLICY "Public read harvests" ON "public"."harvests" FOR SELECT USING (true);



CREATE POLICY "Public read parcels" ON "public"."parcels" FOR SELECT USING (true);



CREATE POLICY "Public read plantings" ON "public"."plantings" FOR SELECT USING (true);



CREATE POLICY "Public read residuos_operacion" ON "public"."residuos_operacion" FOR SELECT USING (true);



CREATE POLICY "Public read tickets_pesaje" ON "public"."tickets_pesaje" FOR SELECT USING (true);



CREATE POLICY "Public read work_records" ON "public"."work_records" FOR SELECT USING (true);



CREATE POLICY "Public read work_records_cuadrillas" ON "public"."work_records_cuadrillas" FOR SELECT USING (true);



CREATE POLICY "Public update ai_proposals" ON "public"."ai_proposals" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Public update camiones" ON "public"."camiones" FOR UPDATE USING (true);



CREATE POLICY "Public update certificaciones_parcela" ON "public"."certificaciones_parcela" FOR UPDATE USING (true);



CREATE POLICY "Public update cuadrillas" ON "public"."cuadrillas" FOR UPDATE USING (true);



CREATE POLICY "Public update parcels" ON "public"."parcels" FOR UPDATE USING (true);



CREATE POLICY "Public update residuos_operacion" ON "public"."residuos_operacion" FOR UPDATE USING (true);



CREATE POLICY "Public update tickets_pesaje" ON "public"."tickets_pesaje" FOR UPDATE USING (true);



CREATE POLICY "Public update work_records_cuadrillas" ON "public"."work_records_cuadrillas" FOR UPDATE USING (true);



ALTER TABLE "public"."ai_proposal_validations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_proposals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analisis_agua" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analisis_agua_public" ON "public"."analisis_agua" USING (true);



CREATE POLICY "anon INSERT catalogo" ON "public"."inventario_productos_catalogo" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon INSERT movimientos" ON "public"."inventario_movimientos" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon SELECT catalogo" ON "public"."inventario_productos_catalogo" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon SELECT movimientos" ON "public"."inventario_movimientos" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon UPDATE catalogo" ON "public"."inventario_productos_catalogo" FOR UPDATE TO "anon" USING (true);



CREATE POLICY "anon full access" ON "public"."camaras_almacen" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."catalogo_tipos_mantenimiento" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."catalogo_tipos_trabajo" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."cierres_jornada" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."erp_exportaciones" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."inventario_entradas" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."lia_contexto_sesion" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."lia_memoria" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."lia_patrones" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."logistica_combustible" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."logistica_inventario_sync" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."maquinaria_aperos" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."maquinaria_inventario_sync" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."movimientos_palot" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."palots" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."personal" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."personal_externo" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."personal_tipos_trabajo" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."planificacion_campana" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."presencia_tiempo_real" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."proveedores" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."proveedores_precios" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."registros_riego" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."sistema_riego_zonas" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."trazabilidad_registros" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."usuario_roles" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."vehicle_positions" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access" ON "public"."vehiculos_empresa" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon full access ganaderos" ON "public"."ganaderos" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."parte_estado_finca" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."parte_personal" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."parte_residuos_vegetales" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."parte_trabajo" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."partes_diarios" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all_maquinaria_uso" ON "public"."maquinaria_uso" TO "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."camaras_almacen" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."camiones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalogo_tipos_mantenimiento" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catalogo_tipos_trabajo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificaciones_parcela" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cierres_jornada" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cuadrillas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cultivos_catalogo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."erp_exportaciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fotos_campo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ganaderos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."harvests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventario_entradas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventario_movimientos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventario_productos_catalogo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lia_contexto_sesion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lia_memoria" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lia_patrones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logistica_combustible" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logistica_inventario_sync" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maquinaria_aperos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maquinaria_inventario_sync" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maquinaria_uso" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."movimientos_palot" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."palots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parcels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parte_estado_finca" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parte_personal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parte_residuos_vegetales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parte_trabajo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."partes_diarios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_externo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_tipos_trabajo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."planificacion_campana" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plantings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."presencia_tiempo_real" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proveedores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proveedores_precios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registros_estado_parcela" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registros_riego" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."residuos_operacion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sistema_riego_zonas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets_pesaje" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trazabilidad_registros" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuario_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehiculos_empresa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_records_cuadrillas" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."block_ai_proposals_payload_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."block_ai_proposals_payload_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_ai_proposals_payload_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cerrar_jornada_atomica"("p_fecha" "date", "p_usuario" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cerrar_jornada_atomica"("p_fecha" "date", "p_usuario" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cerrar_jornada_atomica"("p_fecha" "date", "p_usuario" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_timestamp"() TO "service_role";
























GRANT ALL ON TABLE "public"."ai_proposal_validations" TO "anon";
GRANT ALL ON TABLE "public"."ai_proposal_validations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_proposal_validations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_proposals" TO "anon";
GRANT ALL ON TABLE "public"."ai_proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_proposals" TO "service_role";



GRANT ALL ON TABLE "public"."analisis_agua" TO "anon";
GRANT ALL ON TABLE "public"."analisis_agua" TO "authenticated";
GRANT ALL ON TABLE "public"."analisis_agua" TO "service_role";



GRANT ALL ON TABLE "public"."analisis_suelo" TO "anon";
GRANT ALL ON TABLE "public"."analisis_suelo" TO "authenticated";
GRANT ALL ON TABLE "public"."analisis_suelo" TO "service_role";



GRANT ALL ON TABLE "public"."aperos" TO "anon";
GRANT ALL ON TABLE "public"."aperos" TO "authenticated";
GRANT ALL ON TABLE "public"."aperos" TO "service_role";



GRANT ALL ON TABLE "public"."camaras_almacen" TO "anon";
GRANT ALL ON TABLE "public"."camaras_almacen" TO "authenticated";
GRANT ALL ON TABLE "public"."camaras_almacen" TO "service_role";



GRANT ALL ON TABLE "public"."camiones" TO "anon";
GRANT ALL ON TABLE "public"."camiones" TO "authenticated";
GRANT ALL ON TABLE "public"."camiones" TO "service_role";



GRANT ALL ON TABLE "public"."catalogo_tipos_mantenimiento" TO "anon";
GRANT ALL ON TABLE "public"."catalogo_tipos_mantenimiento" TO "authenticated";
GRANT ALL ON TABLE "public"."catalogo_tipos_mantenimiento" TO "service_role";



GRANT ALL ON TABLE "public"."catalogo_tipos_trabajo" TO "anon";
GRANT ALL ON TABLE "public"."catalogo_tipos_trabajo" TO "authenticated";
GRANT ALL ON TABLE "public"."catalogo_tipos_trabajo" TO "service_role";



GRANT ALL ON TABLE "public"."certificaciones_parcela" TO "anon";
GRANT ALL ON TABLE "public"."certificaciones_parcela" TO "authenticated";
GRANT ALL ON TABLE "public"."certificaciones_parcela" TO "service_role";



GRANT ALL ON TABLE "public"."cierres_jornada" TO "anon";
GRANT ALL ON TABLE "public"."cierres_jornada" TO "authenticated";
GRANT ALL ON TABLE "public"."cierres_jornada" TO "service_role";



GRANT ALL ON TABLE "public"."cuadrillas" TO "anon";
GRANT ALL ON TABLE "public"."cuadrillas" TO "authenticated";
GRANT ALL ON TABLE "public"."cuadrillas" TO "service_role";



GRANT ALL ON TABLE "public"."cultivos_catalogo" TO "anon";
GRANT ALL ON TABLE "public"."cultivos_catalogo" TO "authenticated";
GRANT ALL ON TABLE "public"."cultivos_catalogo" TO "service_role";



GRANT ALL ON TABLE "public"."erp_exportaciones" TO "anon";
GRANT ALL ON TABLE "public"."erp_exportaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."erp_exportaciones" TO "service_role";



GRANT ALL ON TABLE "public"."fotos_campo" TO "anon";
GRANT ALL ON TABLE "public"."fotos_campo" TO "authenticated";
GRANT ALL ON TABLE "public"."fotos_campo" TO "service_role";



GRANT ALL ON TABLE "public"."ganaderos" TO "anon";
GRANT ALL ON TABLE "public"."ganaderos" TO "authenticated";
GRANT ALL ON TABLE "public"."ganaderos" TO "service_role";



GRANT ALL ON TABLE "public"."harvests" TO "anon";
GRANT ALL ON TABLE "public"."harvests" TO "authenticated";
GRANT ALL ON TABLE "public"."harvests" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_categorias" TO "anon";
GRANT ALL ON TABLE "public"."inventario_categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_categorias" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_entradas" TO "anon";
GRANT ALL ON TABLE "public"."inventario_entradas" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_entradas" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_informes" TO "anon";
GRANT ALL ON TABLE "public"."inventario_informes" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_informes" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_movimientos" TO "anon";
GRANT ALL ON TABLE "public"."inventario_movimientos" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_movimientos" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_productos_catalogo" TO "anon";
GRANT ALL ON TABLE "public"."inventario_productos_catalogo" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_productos_catalogo" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_registros" TO "anon";
GRANT ALL ON TABLE "public"."inventario_registros" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_registros" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_ubicacion_activo" TO "anon";
GRANT ALL ON TABLE "public"."inventario_ubicacion_activo" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_ubicacion_activo" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_ubicaciones" TO "anon";
GRANT ALL ON TABLE "public"."inventario_ubicaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_ubicaciones" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_sensor_planta" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_sensor_planta" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_sensor_planta" TO "service_role";



GRANT ALL ON TABLE "public"."lia_contexto_sesion" TO "anon";
GRANT ALL ON TABLE "public"."lia_contexto_sesion" TO "authenticated";
GRANT ALL ON TABLE "public"."lia_contexto_sesion" TO "service_role";



GRANT ALL ON TABLE "public"."lia_memoria" TO "anon";
GRANT ALL ON TABLE "public"."lia_memoria" TO "authenticated";
GRANT ALL ON TABLE "public"."lia_memoria" TO "service_role";



GRANT ALL ON TABLE "public"."lia_patrones" TO "anon";
GRANT ALL ON TABLE "public"."lia_patrones" TO "authenticated";
GRANT ALL ON TABLE "public"."lia_patrones" TO "service_role";



GRANT ALL ON TABLE "public"."logistica_combustible" TO "anon";
GRANT ALL ON TABLE "public"."logistica_combustible" TO "authenticated";
GRANT ALL ON TABLE "public"."logistica_combustible" TO "service_role";



GRANT ALL ON TABLE "public"."logistica_conductores" TO "anon";
GRANT ALL ON TABLE "public"."logistica_conductores" TO "authenticated";
GRANT ALL ON TABLE "public"."logistica_conductores" TO "service_role";



GRANT ALL ON TABLE "public"."logistica_inventario_sync" TO "anon";
GRANT ALL ON TABLE "public"."logistica_inventario_sync" TO "authenticated";
GRANT ALL ON TABLE "public"."logistica_inventario_sync" TO "service_role";



GRANT ALL ON TABLE "public"."logistica_mantenimiento" TO "anon";
GRANT ALL ON TABLE "public"."logistica_mantenimiento" TO "authenticated";
GRANT ALL ON TABLE "public"."logistica_mantenimiento" TO "service_role";



GRANT ALL ON TABLE "public"."logistica_viajes" TO "anon";
GRANT ALL ON TABLE "public"."logistica_viajes" TO "authenticated";
GRANT ALL ON TABLE "public"."logistica_viajes" TO "service_role";



GRANT ALL ON TABLE "public"."maquinaria_aperos" TO "anon";
GRANT ALL ON TABLE "public"."maquinaria_aperos" TO "authenticated";
GRANT ALL ON TABLE "public"."maquinaria_aperos" TO "service_role";



GRANT ALL ON TABLE "public"."maquinaria_inventario_sync" TO "anon";
GRANT ALL ON TABLE "public"."maquinaria_inventario_sync" TO "authenticated";
GRANT ALL ON TABLE "public"."maquinaria_inventario_sync" TO "service_role";



GRANT ALL ON TABLE "public"."maquinaria_mantenimiento" TO "anon";
GRANT ALL ON TABLE "public"."maquinaria_mantenimiento" TO "authenticated";
GRANT ALL ON TABLE "public"."maquinaria_mantenimiento" TO "service_role";



GRANT ALL ON TABLE "public"."maquinaria_tractores" TO "anon";
GRANT ALL ON TABLE "public"."maquinaria_tractores" TO "authenticated";
GRANT ALL ON TABLE "public"."maquinaria_tractores" TO "service_role";



GRANT ALL ON TABLE "public"."maquinaria_uso" TO "anon";
GRANT ALL ON TABLE "public"."maquinaria_uso" TO "authenticated";
GRANT ALL ON TABLE "public"."maquinaria_uso" TO "service_role";



GRANT ALL ON TABLE "public"."movimientos_palot" TO "anon";
GRANT ALL ON TABLE "public"."movimientos_palot" TO "authenticated";
GRANT ALL ON TABLE "public"."movimientos_palot" TO "service_role";



GRANT ALL ON TABLE "public"."palots" TO "anon";
GRANT ALL ON TABLE "public"."palots" TO "authenticated";
GRANT ALL ON TABLE "public"."palots" TO "service_role";



GRANT ALL ON TABLE "public"."parcel_photos" TO "anon";
GRANT ALL ON TABLE "public"."parcel_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."parcel_photos" TO "service_role";



GRANT ALL ON TABLE "public"."parcel_production" TO "anon";
GRANT ALL ON TABLE "public"."parcel_production" TO "authenticated";
GRANT ALL ON TABLE "public"."parcel_production" TO "service_role";



GRANT ALL ON TABLE "public"."parcels" TO "anon";
GRANT ALL ON TABLE "public"."parcels" TO "authenticated";
GRANT ALL ON TABLE "public"."parcels" TO "service_role";



GRANT ALL ON TABLE "public"."parte_estado_finca" TO "anon";
GRANT ALL ON TABLE "public"."parte_estado_finca" TO "authenticated";
GRANT ALL ON TABLE "public"."parte_estado_finca" TO "service_role";



GRANT ALL ON TABLE "public"."parte_personal" TO "anon";
GRANT ALL ON TABLE "public"."parte_personal" TO "authenticated";
GRANT ALL ON TABLE "public"."parte_personal" TO "service_role";



GRANT ALL ON TABLE "public"."parte_residuos_vegetales" TO "anon";
GRANT ALL ON TABLE "public"."parte_residuos_vegetales" TO "authenticated";
GRANT ALL ON TABLE "public"."parte_residuos_vegetales" TO "service_role";



GRANT ALL ON TABLE "public"."parte_trabajo" TO "anon";
GRANT ALL ON TABLE "public"."parte_trabajo" TO "authenticated";
GRANT ALL ON TABLE "public"."parte_trabajo" TO "service_role";



GRANT ALL ON TABLE "public"."partes_diarios" TO "anon";
GRANT ALL ON TABLE "public"."partes_diarios" TO "authenticated";
GRANT ALL ON TABLE "public"."partes_diarios" TO "service_role";



GRANT ALL ON TABLE "public"."personal" TO "anon";
GRANT ALL ON TABLE "public"."personal" TO "authenticated";
GRANT ALL ON TABLE "public"."personal" TO "service_role";



GRANT ALL ON TABLE "public"."personal_externo" TO "anon";
GRANT ALL ON TABLE "public"."personal_externo" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_externo" TO "service_role";



GRANT ALL ON TABLE "public"."personal_tipos_trabajo" TO "anon";
GRANT ALL ON TABLE "public"."personal_tipos_trabajo" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_tipos_trabajo" TO "service_role";



GRANT ALL ON TABLE "public"."planificacion_campana" TO "anon";
GRANT ALL ON TABLE "public"."planificacion_campana" TO "authenticated";
GRANT ALL ON TABLE "public"."planificacion_campana" TO "service_role";



GRANT ALL ON TABLE "public"."plantings" TO "anon";
GRANT ALL ON TABLE "public"."plantings" TO "authenticated";
GRANT ALL ON TABLE "public"."plantings" TO "service_role";



GRANT ALL ON TABLE "public"."presencia_tiempo_real" TO "anon";
GRANT ALL ON TABLE "public"."presencia_tiempo_real" TO "authenticated";
GRANT ALL ON TABLE "public"."presencia_tiempo_real" TO "service_role";



GRANT ALL ON TABLE "public"."proveedores" TO "anon";
GRANT ALL ON TABLE "public"."proveedores" TO "authenticated";
GRANT ALL ON TABLE "public"."proveedores" TO "service_role";



GRANT ALL ON TABLE "public"."proveedores_precios" TO "anon";
GRANT ALL ON TABLE "public"."proveedores_precios" TO "authenticated";
GRANT ALL ON TABLE "public"."proveedores_precios" TO "service_role";



GRANT ALL ON TABLE "public"."registros_estado_parcela" TO "anon";
GRANT ALL ON TABLE "public"."registros_estado_parcela" TO "authenticated";
GRANT ALL ON TABLE "public"."registros_estado_parcela" TO "service_role";



GRANT ALL ON TABLE "public"."registros_riego" TO "anon";
GRANT ALL ON TABLE "public"."registros_riego" TO "authenticated";
GRANT ALL ON TABLE "public"."registros_riego" TO "service_role";



GRANT ALL ON TABLE "public"."residuos_operacion" TO "anon";
GRANT ALL ON TABLE "public"."residuos_operacion" TO "authenticated";
GRANT ALL ON TABLE "public"."residuos_operacion" TO "service_role";



GRANT ALL ON TABLE "public"."sistema_riego_zonas" TO "anon";
GRANT ALL ON TABLE "public"."sistema_riego_zonas" TO "authenticated";
GRANT ALL ON TABLE "public"."sistema_riego_zonas" TO "service_role";



GRANT ALL ON TABLE "public"."tickets_pesaje" TO "anon";
GRANT ALL ON TABLE "public"."tickets_pesaje" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets_pesaje" TO "service_role";



GRANT ALL ON TABLE "public"."trabajos_incidencias" TO "anon";
GRANT ALL ON TABLE "public"."trabajos_incidencias" TO "authenticated";
GRANT ALL ON TABLE "public"."trabajos_incidencias" TO "service_role";



GRANT ALL ON TABLE "public"."trabajos_registro" TO "anon";
GRANT ALL ON TABLE "public"."trabajos_registro" TO "authenticated";
GRANT ALL ON TABLE "public"."trabajos_registro" TO "service_role";



GRANT ALL ON TABLE "public"."tractores" TO "anon";
GRANT ALL ON TABLE "public"."tractores" TO "authenticated";
GRANT ALL ON TABLE "public"."tractores" TO "service_role";



GRANT ALL ON TABLE "public"."trazabilidad_registros" TO "anon";
GRANT ALL ON TABLE "public"."trazabilidad_registros" TO "authenticated";
GRANT ALL ON TABLE "public"."trazabilidad_registros" TO "service_role";



GRANT ALL ON TABLE "public"."usuario_roles" TO "anon";
GRANT ALL ON TABLE "public"."usuario_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."usuario_roles" TO "service_role";



GRANT ALL ON TABLE "public"."v_inventario_activos_en_ubicacion" TO "anon";
GRANT ALL ON TABLE "public"."v_inventario_activos_en_ubicacion" TO "authenticated";
GRANT ALL ON TABLE "public"."v_inventario_activos_en_ubicacion" TO "service_role";



GRANT ALL ON TABLE "public"."v_tractores_en_inventario" TO "anon";
GRANT ALL ON TABLE "public"."v_tractores_en_inventario" TO "authenticated";
GRANT ALL ON TABLE "public"."v_tractores_en_inventario" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_positions" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_positions" TO "service_role";



GRANT ALL ON TABLE "public"."vehiculos_empresa" TO "anon";
GRANT ALL ON TABLE "public"."vehiculos_empresa" TO "authenticated";
GRANT ALL ON TABLE "public"."vehiculos_empresa" TO "service_role";



GRANT ALL ON TABLE "public"."vuelos_dron" TO "anon";
GRANT ALL ON TABLE "public"."vuelos_dron" TO "authenticated";
GRANT ALL ON TABLE "public"."vuelos_dron" TO "service_role";



GRANT ALL ON TABLE "public"."work_records" TO "anon";
GRANT ALL ON TABLE "public"."work_records" TO "authenticated";
GRANT ALL ON TABLE "public"."work_records" TO "service_role";



GRANT ALL ON TABLE "public"."work_records_cuadrillas" TO "anon";
GRANT ALL ON TABLE "public"."work_records_cuadrillas" TO "authenticated";
GRANT ALL ON TABLE "public"."work_records_cuadrillas" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































