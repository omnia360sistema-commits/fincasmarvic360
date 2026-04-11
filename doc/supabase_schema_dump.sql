


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



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


CREATE OR REPLACE FUNCTION "public"."current_user_company_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  SELECT up.company_id
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
    AND up.status = 'active'
  LIMIT 1;
$$;


ALTER FUNCTION "public"."current_user_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.status = 'active'
      AND up.role = 'admin'
  );
$$;


ALTER FUNCTION "public"."current_user_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  SELECT up.role
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
    AND up.status = 'active'
  LIMIT 1;
$$;


ALTER FUNCTION "public"."current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_company_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_company_id UUID;
BEGIN
  IF TG_OP != 'INSERT' THEN
    RETURN NEW;
  END IF;
  
  -- Si ya tiene company_id, validar
  IF NEW.company_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND company_id = NEW.company_id
      AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Invalid company_id';
    END IF;
    RETURN NEW;
  END IF;
  
  -- Auto-asignar
  SELECT company_id INTO STRICT v_company_id
  FROM user_profiles
  WHERE id = auth.uid()
  AND status = 'active';
  
  NEW.company_id := v_company_id;
  RETURN NEW;
  
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE EXCEPTION 'User has no active company';
  WHEN TOO_MANY_ROWS THEN
    RAISE EXCEPTION 'User has multiple companies';
END;
$$;


ALTER FUNCTION "public"."enforce_company_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_update_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_context"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;
  
  SELECT jsonb_build_object(
    'authenticated', true,
    'user_id', up.id,
    'email', up.email,
    'full_name', up.full_name,
    'role', up.role,
    'status', up.status,
    'company', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'nif', c.nif,
      'status', c.status
    ),
    'personal', CASE 
      WHEN up.personal_id IS NOT NULL THEN
        (SELECT row_to_json(p.*) FROM personal p WHERE p.id = up.personal_id)
      ELSE NULL
    END
  ) INTO v_result
  FROM user_profiles up
  JOIN companies c ON c.id = up.company_id
  WHERE up.id = v_user_id;
  
  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'authenticated', true,
      'user_id', v_user_id,
      'error', 'No profile found'
    );
  END IF;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_user_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pilot_disable_fallback"("p_actor_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.pilot_config
     set fallback_enabled = false,
         updated_at = now(),
         updated_by = p_actor_user_id
   where singleton = true;
end;
$$;


ALTER FUNCTION "public"."pilot_disable_fallback"("p_actor_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pilot_enforce_company_write"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_actor_user_id uuid;
  v_actor_company_id uuid;
begin
  v_actor_user_id := auth.uid();
  v_actor_company_id := public.pilot_get_active_user_company_id(v_actor_user_id);

  if tg_op = 'INSERT' then
    -- Ignore client-sent company_id completely.
    new.company_id := v_actor_company_id;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Do not allow tenant drift on non-null historic rows.
    if old.company_id is not null and new.company_id is distinct from old.company_id then
      raise exception 'PILOT_COMPANY_ID_IMMUTABLE';
    end if;

    -- For legacy null rows, self-heal to actor company for pilot continuity.
    if old.company_id is null then
      new.company_id := v_actor_company_id;
      return new;
    end if;

    if old.company_id is distinct from v_actor_company_id then
      raise exception 'PILOT_TENANT_MISMATCH_UPDATE';
    end if;

    new.company_id := old.company_id;
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."pilot_enforce_company_write"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pilot_fallback_write"("p_actor_user_id" "uuid", "p_table_name" "text", "p_action" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_record_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("record_id" "uuid", "company_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  v_fallback_enabled boolean;
  v_actor_company_id uuid;
  v_record_id uuid;
  v_company_id uuid;
  v_col_list text;
begin
  select pc.fallback_enabled
    into v_fallback_enabled
  from public.pilot_config pc
  where pc.singleton = true;

  if coalesce(v_fallback_enabled, false) = false then
    raise exception 'PILOT_FALLBACK_DISABLED';
  end if;

  if not exists (
    select 1
    from public.pilot_fallback_user_allowlist fu
    where fu.user_id = p_actor_user_id
      and fu.enabled = true
  ) then
    raise exception 'PILOT_FALLBACK_USER_NOT_ALLOWED';
  end if;

  if not exists (
    select 1
    from public.pilot_fallback_table_allowlist ft
    where ft.table_name = p_table_name
      and ft.enabled = true
  ) then
    raise exception 'PILOT_FALLBACK_TABLE_NOT_ALLOWED';
  end if;

  v_actor_company_id := public.pilot_get_active_user_company_id(p_actor_user_id);

  -- Make auth.uid() available for trigger-based enforcement during fallback.
  perform set_config('request.jwt.claim.sub', p_actor_user_id::text, true);

  if upper(p_action) = 'INSERT' then
    execute format(
      'insert into public.%I
       select * from jsonb_populate_record(null::public.%I, $1)
       returning id, company_id',
      p_table_name,
      p_table_name
    )
    using ((p_payload - 'company_id') || jsonb_build_object('company_id', v_actor_company_id))
    into v_record_id, v_company_id;

  elsif upper(p_action) = 'UPDATE' then
    if p_record_id is null then
      raise exception 'PILOT_FALLBACK_UPDATE_REQUIRES_RECORD_ID';
    end if;

    select string_agg(format('%I', c.column_name), ', ')
      into v_col_list
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = p_table_name
      and c.column_name not in ('id', 'company_id');

    if v_col_list is null then
      raise exception 'PILOT_FALLBACK_UPDATE_NO_MUTABLE_COLUMNS';
    end if;

    execute format(
      'update public.%I t
       set (%s) = (
         select %s
         from jsonb_populate_record(t, $2) as r
       )
       where t.id = $1
         and t.company_id = $3
       returning t.id, t.company_id',
      p_table_name,
      v_col_list,
      v_col_list
    )
    using p_record_id, (p_payload - 'company_id'), v_actor_company_id
    into v_record_id, v_company_id;

    if v_record_id is null then
      raise exception 'PILOT_FALLBACK_UPDATE_NOT_FOUND_OR_TENANT_MISMATCH';
    end if;

  elsif upper(p_action) = 'DELETE' then
    if p_record_id is null then
      raise exception 'PILOT_FALLBACK_DELETE_REQUIRES_RECORD_ID';
    end if;

    execute format(
      'delete from public.%I t
       where t.id = $1
         and t.company_id = $2
       returning t.id, t.company_id',
      p_table_name
    )
    using p_record_id, v_actor_company_id
    into v_record_id, v_company_id;

    if v_record_id is null then
      raise exception 'PILOT_FALLBACK_DELETE_NOT_FOUND_OR_TENANT_MISMATCH';
    end if;

  else
    raise exception 'PILOT_FALLBACK_ACTION_NOT_SUPPORTED';
  end if;

  insert into public.pilot_fallback_log (
    actor_user_id,
    company_id,
    table_name,
    action,
    record_id
  )
  values (
    p_actor_user_id,
    v_company_id,
    p_table_name,
    upper(p_action),
    v_record_id
  );

  return query select v_record_id, v_company_id;
end;
$_$;


ALTER FUNCTION "public"."pilot_fallback_write"("p_actor_user_id" "uuid", "p_table_name" "text", "p_action" "text", "p_payload" "jsonb", "p_record_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pilot_get_active_user_company_id"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_company_id uuid;
begin
  if p_user_id is null then
    raise exception 'PILOT_AUTH_REQUIRED';
  end if;

  select up.company_id
    into v_company_id
  from public.user_profiles up
  where up.id = p_user_id
    and up.status = 'active'
  limit 1;

  if v_company_id is null then
    raise exception 'PILOT_USER_PROFILE_INVALID_OR_INACTIVE';
  end if;

  return v_company_id;
end;
$$;


ALTER FUNCTION "public"."pilot_get_active_user_company_id"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_role"("required_role" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  SELECT CASE
    WHEN required_role = 'operario' THEN true
    WHEN required_role = 'encargado' THEN public.current_user_role() IN ('admin', 'encargado')
    WHEN required_role = 'admin' THEN public.current_user_role() = 'admin'
    ELSE false
  END;
$$;


ALTER FUNCTION "public"."user_has_role"("required_role" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_proposal_validations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "decision" "public"."ai_validation_decision" NOT NULL,
    "note" "text",
    "decided_by" "uuid",
    "decided_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "hash" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "parcel_id" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."aperos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."camaras_almacen" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "capacidad_palots" integer,
    "temperatura_objetivo" numeric(5,2),
    "activa" boolean DEFAULT true,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "cerrado_by" "text" DEFAULT 'JuanPe'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."cierres_jornada" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "nif" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "slug" "text",
    CONSTRAINT "companies_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cuadrillas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "empresa" "text",
    "nif" "text",
    "responsable" "text",
    "telefono" "text",
    "activa" boolean DEFAULT true,
    "qr_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "created_by" "text" DEFAULT 'sistema'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "harvest_cost" numeric,
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_by" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_by" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "parcel_id" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."lecturas_sensor_planta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lia_contexto_sesion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "modulo" "text" NOT NULL,
    "evento" "text" NOT NULL,
    "datos" "jsonb",
    "procesado" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "created_by" "text" DEFAULT 'JuanPe'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."logistica_conductores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logistica_inventario_sync" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "vehiculo_id" "uuid" NOT NULL,
    "ubicacion_id" "uuid" NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "foto_url_2" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "personal_id" "uuid",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "foto_url_2" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "created_by" "text" DEFAULT 'sistema'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
    CONSTRAINT "palots_estado_check" CHECK (("estado" = ANY (ARRAY['en_campo'::"text", 'en_transporte'::"text", 'en_almacen'::"text", 'expedido'::"text"])))
);


ALTER TABLE "public"."palots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcel_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text",
    "image_url" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."parcel_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parcel_production" (
    "parcel_id" "text" NOT NULL,
    "crop" "text",
    "area_hectares" numeric,
    "estimated_production_kg" numeric,
    "estimated_plastic_kg" numeric,
    "estimated_drip_meters" numeric,
    "estimated_cost" numeric,
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "irrigation_type_v2" "public"."tipo_riego",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_by" "text" DEFAULT 'sistema'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_by" "text" DEFAULT 'sistema'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_by" "text" DEFAULT 'sistema'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_by" "text" DEFAULT 'sistema'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."parte_trabajo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."partes_diarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha" "date" DEFAULT CURRENT_DATE NOT NULL,
    "responsable" "text" DEFAULT 'JuanPe'::"text" NOT NULL,
    "notas_generales" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "text" DEFAULT 'sistema'::"text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT "public"."current_user_company_id"(),
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
    CONSTRAINT "personal_externo_tipo_check" CHECK (("tipo" = ANY (ARRAY['destajo'::"text", 'jornal_servicio'::"text"])))
);


ALTER TABLE "public"."personal_externo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_tipos_trabajo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "personal_id" "uuid" NOT NULL,
    "tipo_trabajo_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."personal_tipos_trabajo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_config" (
    "singleton" boolean DEFAULT true NOT NULL,
    "fallback_enabled" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "pilot_config_singleton_check" CHECK (("singleton" = true))
);


ALTER TABLE "public"."pilot_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_fallback_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "table_name" "text" NOT NULL,
    "action" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    CONSTRAINT "pilot_fallback_log_action_check" CHECK (("action" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."pilot_fallback_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_fallback_table_allowlist" (
    "table_name" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pilot_fallback_table_allowlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_fallback_user_allowlist" (
    "user_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pilot_fallback_user_allowlist" OWNER TO "postgres";


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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "sistema_riego" "public"."tipo_riego",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."proveedores_precios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registros_estado_parcela" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "text" NOT NULL,
    "fecha" timestamp with time zone DEFAULT "now"(),
    "estado" "text",
    "cultivo" "text",
    "observaciones" "text",
    "foto_url" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "created_by" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."trazabilidad_registros" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "role" "text" DEFAULT 'operario'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "personal_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'encargado'::"text", 'operario'::"text", 'viewer'::"text"]))),
    CONSTRAINT "user_profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuario_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rol" "text" NOT NULL,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "usuario_roles_rol_check" CHECK (("rol" = ANY (ARRAY['admin'::"text", 'encargado'::"text", 'operario'::"text"])))
);


ALTER TABLE "public"."usuario_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."usuario_roles" IS 'DEPRECADO: Usar user_profiles. Mantenido por compatibilidad.';



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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
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
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid",
    CONSTRAINT "vehiculos_empresa_estado_operativo_check" CHECK (("estado_operativo" = ANY (ARRAY['disponible'::"text", 'en_uso'::"text", 'mantenimiento'::"text", 'baja'::"text"]))),
    CONSTRAINT "vehiculos_empresa_tipo_check" CHECK (("tipo" = ANY (ARRAY['furgoneta'::"text", 'turismo'::"text", 'pick_up'::"text", 'otro'::"text"])))
);


ALTER TABLE "public"."vehiculos_empresa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vuelos_dron" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parcel_id" "uuid",
    "fecha_vuelo" timestamp without time zone,
    "url_imagen" "text",
    "observaciones" "text",
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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
    "horas_calculadas" numeric(5,2),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
);


ALTER TABLE "public"."work_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_records_cuadrillas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_record_id" "uuid" NOT NULL,
    "cuadrilla_id" "uuid" NOT NULL,
    "num_trabajadores" integer DEFAULT 1 NOT NULL,
    "hora_entrada" timestamp with time zone,
    "hora_salida" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid"
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



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_nif_key" UNIQUE ("nif");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_slug_key" UNIQUE ("slug");



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



ALTER TABLE ONLY "public"."pilot_config"
    ADD CONSTRAINT "pilot_config_pkey" PRIMARY KEY ("singleton");



ALTER TABLE ONLY "public"."pilot_fallback_log"
    ADD CONSTRAINT "pilot_fallback_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_fallback_table_allowlist"
    ADD CONSTRAINT "pilot_fallback_table_allowlist_pkey" PRIMARY KEY ("table_name");



ALTER TABLE ONLY "public"."pilot_fallback_user_allowlist"
    ADD CONSTRAINT "pilot_fallback_user_allowlist_pkey" PRIMARY KEY ("user_id");



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



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_company_id_email_key" UNIQUE ("company_id", "email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_ai_proposal_validations_company_id" ON "public"."ai_proposal_validations" USING "btree" ("company_id");



CREATE INDEX "idx_ai_proposal_validations_proposal_id" ON "public"."ai_proposal_validations" USING "btree" ("proposal_id");



CREATE INDEX "idx_ai_proposals_category" ON "public"."ai_proposals" USING "btree" ("category");



CREATE INDEX "idx_ai_proposals_company_id" ON "public"."ai_proposals" USING "btree" ("company_id");



CREATE INDEX "idx_ai_proposals_created_by" ON "public"."ai_proposals" USING "btree" ("created_by");



CREATE INDEX "idx_ai_proposals_hash" ON "public"."ai_proposals" USING "btree" ("hash");



CREATE INDEX "idx_ai_proposals_status" ON "public"."ai_proposals" USING "btree" ("status");



CREATE INDEX "idx_analisis_agua_company_id" ON "public"."analisis_agua" USING "btree" ("company_id");



CREATE INDEX "idx_analisis_suelo_company_id" ON "public"."analisis_suelo" USING "btree" ("company_id");



CREATE INDEX "idx_aperos_company" ON "public"."aperos" USING "btree" ("company_id");



CREATE INDEX "idx_aperos_company_id" ON "public"."aperos" USING "btree" ("company_id");



CREATE INDEX "idx_camaras_almacen_company_id" ON "public"."camaras_almacen" USING "btree" ("company_id");



CREATE INDEX "idx_camiones_company" ON "public"."camiones" USING "btree" ("company_id");



CREATE INDEX "idx_camiones_company_id" ON "public"."camiones" USING "btree" ("company_id");



CREATE INDEX "idx_certificaciones_parcel" ON "public"."certificaciones_parcela" USING "btree" ("parcel_id");



CREATE INDEX "idx_certificaciones_parcela_company_id" ON "public"."certificaciones_parcela" USING "btree" ("company_id");



CREATE INDEX "idx_cierres_jornada_company_id" ON "public"."cierres_jornada" USING "btree" ("company_id");



CREATE INDEX "idx_companies_status" ON "public"."companies" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_cuadrillas_company" ON "public"."cuadrillas" USING "btree" ("company_id");



CREATE INDEX "idx_cuadrillas_company_id" ON "public"."cuadrillas" USING "btree" ("company_id");



CREATE INDEX "idx_dron_parcela" ON "public"."vuelos_dron" USING "btree" ("parcel_id");



CREATE INDEX "idx_erp_exportaciones_company_id" ON "public"."erp_exportaciones" USING "btree" ("company_id");



CREATE INDEX "idx_fotos_campo_company_id" ON "public"."fotos_campo" USING "btree" ("company_id");



CREATE INDEX "idx_ganaderos_company_id" ON "public"."ganaderos" USING "btree" ("company_id");



CREATE INDEX "idx_harvests_company" ON "public"."harvests" USING "btree" ("company_id");



CREATE INDEX "idx_harvests_company_id" ON "public"."harvests" USING "btree" ("company_id");



CREATE INDEX "idx_harvests_parcel_date" ON "public"."harvests" USING "btree" ("parcel_id", "date" DESC);



CREATE INDEX "idx_harvests_parcel_id" ON "public"."harvests" USING "btree" ("parcel_id");



CREATE INDEX "idx_inventario_entradas_company_id" ON "public"."inventario_entradas" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_informes_company_id" ON "public"."inventario_informes" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_movimientos_company_id" ON "public"."inventario_movimientos" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_productos_catalogo_company" ON "public"."inventario_productos_catalogo" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_productos_catalogo_company_id" ON "public"."inventario_productos_catalogo" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_productos_catalogo_company_id_pilot" ON "public"."inventario_productos_catalogo" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_registros_company" ON "public"."inventario_registros" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_registros_company_id" ON "public"."inventario_registros" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_ubicacion_activo_company_id" ON "public"."inventario_ubicacion_activo" USING "btree" ("company_id");



CREATE INDEX "idx_inventario_ubicacion_activo_ubicacion" ON "public"."inventario_ubicacion_activo" USING "btree" ("ubicacion_id");



CREATE INDEX "idx_inventario_ubicaciones_company_id" ON "public"."inventario_ubicaciones" USING "btree" ("company_id");



CREATE INDEX "idx_lecturas_sensor_planta_company_id" ON "public"."lecturas_sensor_planta" USING "btree" ("company_id");



CREATE INDEX "idx_lia_contexto_sesion_company_id" ON "public"."lia_contexto_sesion" USING "btree" ("company_id");



CREATE INDEX "idx_lia_memoria_company_id" ON "public"."lia_memoria" USING "btree" ("company_id");



CREATE INDEX "idx_lia_patrones_company_id" ON "public"."lia_patrones" USING "btree" ("company_id");



CREATE INDEX "idx_logistica_combustible_company_id" ON "public"."logistica_combustible" USING "btree" ("company_id");



CREATE INDEX "idx_logistica_conductores_company_id" ON "public"."logistica_conductores" USING "btree" ("company_id");



CREATE INDEX "idx_logistica_inventario_sync_company_id" ON "public"."logistica_inventario_sync" USING "btree" ("company_id");



CREATE INDEX "idx_logistica_mantenimiento_company_id" ON "public"."logistica_mantenimiento" USING "btree" ("company_id");



CREATE INDEX "idx_logistica_viajes_company_id" ON "public"."logistica_viajes" USING "btree" ("company_id");



CREATE INDEX "idx_maquinaria_aperos_company_id" ON "public"."maquinaria_aperos" USING "btree" ("company_id");



CREATE INDEX "idx_maquinaria_inventario_sync_company_id" ON "public"."maquinaria_inventario_sync" USING "btree" ("company_id");



CREATE INDEX "idx_maquinaria_mantenimiento_company_id" ON "public"."maquinaria_mantenimiento" USING "btree" ("company_id");



CREATE INDEX "idx_maquinaria_tractores_company" ON "public"."maquinaria_tractores" USING "btree" ("company_id");



CREATE INDEX "idx_maquinaria_tractores_company_id" ON "public"."maquinaria_tractores" USING "btree" ("company_id");



CREATE INDEX "idx_maquinaria_tractores_company_id_pilot" ON "public"."maquinaria_tractores" USING "btree" ("company_id");



CREATE INDEX "idx_maquinaria_uso_company_id" ON "public"."maquinaria_uso" USING "btree" ("company_id");



CREATE INDEX "idx_maquinaria_uso_personal" ON "public"."maquinaria_uso" USING "btree" ("personal_id", "fecha" DESC);



CREATE INDEX "idx_maquinaria_uso_tractor" ON "public"."maquinaria_uso" USING "btree" ("tractor_id", "fecha" DESC);



CREATE INDEX "idx_movimientos_palot_company_id" ON "public"."movimientos_palot" USING "btree" ("company_id");



CREATE INDEX "idx_palots_company_id" ON "public"."palots" USING "btree" ("company_id");



CREATE INDEX "idx_parcel_photos_company_id" ON "public"."parcel_photos" USING "btree" ("company_id");



CREATE INDEX "idx_parcel_production" ON "public"."parcel_production" USING "btree" ("parcel_id");



CREATE INDEX "idx_parcel_production_company_id" ON "public"."parcel_production" USING "btree" ("company_id");



CREATE INDEX "idx_parcels_company" ON "public"."parcels" USING "btree" ("company_id");



CREATE INDEX "idx_parcels_company_id" ON "public"."parcels" USING "btree" ("company_id");



CREATE INDEX "idx_parte_estado_finca_company_id" ON "public"."parte_estado_finca" USING "btree" ("company_id");



CREATE INDEX "idx_parte_personal_company_id" ON "public"."parte_personal" USING "btree" ("company_id");



CREATE INDEX "idx_parte_residuos_vegetales_company_id" ON "public"."parte_residuos_vegetales" USING "btree" ("company_id");



CREATE INDEX "idx_parte_trabajo_company_id" ON "public"."parte_trabajo" USING "btree" ("company_id");



CREATE INDEX "idx_partes_diarios_company" ON "public"."partes_diarios" USING "btree" ("company_id");



CREATE INDEX "idx_partes_diarios_company_id" ON "public"."partes_diarios" USING "btree" ("company_id");



CREATE INDEX "idx_partes_diarios_company_id_pilot" ON "public"."partes_diarios" USING "btree" ("company_id");



CREATE INDEX "idx_personal_company" ON "public"."personal" USING "btree" ("company_id");



CREATE INDEX "idx_personal_company_id" ON "public"."personal" USING "btree" ("company_id");



CREATE INDEX "idx_personal_company_id_pilot" ON "public"."personal" USING "btree" ("company_id");



CREATE INDEX "idx_personal_externo_company_id" ON "public"."personal_externo" USING "btree" ("company_id");



CREATE INDEX "idx_personal_tipos_trabajo_company_id" ON "public"."personal_tipos_trabajo" USING "btree" ("company_id");



CREATE INDEX "idx_pilot_fallback_log_created_at" ON "public"."pilot_fallback_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_planificacion_campana_company_id" ON "public"."planificacion_campana" USING "btree" ("company_id");



CREATE INDEX "idx_plantings_company" ON "public"."plantings" USING "btree" ("company_id");



CREATE INDEX "idx_plantings_company_id" ON "public"."plantings" USING "btree" ("company_id");



CREATE INDEX "idx_plantings_parcel_date" ON "public"."plantings" USING "btree" ("parcel_id", "date" DESC);



CREATE INDEX "idx_plantings_parcel_id" ON "public"."plantings" USING "btree" ("parcel_id");



CREATE INDEX "idx_presencia_tiempo_real_company_id" ON "public"."presencia_tiempo_real" USING "btree" ("company_id");



CREATE INDEX "idx_proveedores_company" ON "public"."proveedores" USING "btree" ("company_id");



CREATE INDEX "idx_proveedores_company_id" ON "public"."proveedores" USING "btree" ("company_id");



CREATE INDEX "idx_proveedores_precios_company_id" ON "public"."proveedores_precios" USING "btree" ("company_id");



CREATE INDEX "idx_registros_estado_parcela_company_id" ON "public"."registros_estado_parcela" USING "btree" ("company_id");



CREATE INDEX "idx_registros_riego_company_id" ON "public"."registros_riego" USING "btree" ("company_id");



CREATE INDEX "idx_residuos_operacion_company_id" ON "public"."residuos_operacion" USING "btree" ("company_id");



CREATE INDEX "idx_residuos_parcel" ON "public"."residuos_operacion" USING "btree" ("parcel_id");



CREATE INDEX "idx_residuos_parcel_id" ON "public"."residuos_operacion" USING "btree" ("parcel_id");



CREATE INDEX "idx_sistema_riego_zonas_company_id" ON "public"."sistema_riego_zonas" USING "btree" ("company_id");



CREATE INDEX "idx_tickets_harvest" ON "public"."tickets_pesaje" USING "btree" ("harvest_id");



CREATE INDEX "idx_tickets_pesaje_company_id" ON "public"."tickets_pesaje" USING "btree" ("company_id");



CREATE INDEX "idx_trabajos_incidencias_company_id" ON "public"."trabajos_incidencias" USING "btree" ("company_id");



CREATE INDEX "idx_trabajos_registro_company" ON "public"."trabajos_registro" USING "btree" ("company_id");



CREATE INDEX "idx_trabajos_registro_company_id" ON "public"."trabajos_registro" USING "btree" ("company_id");



CREATE INDEX "idx_trabajos_registro_company_id_pilot" ON "public"."trabajos_registro" USING "btree" ("company_id");



CREATE INDEX "idx_tractores_company_id" ON "public"."tractores" USING "btree" ("company_id");



CREATE INDEX "idx_trazabilidad_registros_company_id" ON "public"."trazabilidad_registros" USING "btree" ("company_id");



CREATE INDEX "idx_user_profiles_company" ON "public"."user_profiles" USING "btree" ("company_id");



CREATE INDEX "idx_user_profiles_company_id_pilot" ON "public"."user_profiles" USING "btree" ("company_id");



CREATE INDEX "idx_user_profiles_id_pilot" ON "public"."user_profiles" USING "btree" ("id");



CREATE INDEX "idx_user_profiles_lookup" ON "public"."user_profiles" USING "btree" ("id", "company_id", "role", "status");



CREATE INDEX "idx_user_profiles_user" ON "public"."user_profiles" USING "btree" ("id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_vehicle_positions_company_id" ON "public"."vehicle_positions" USING "btree" ("company_id");



CREATE INDEX "idx_vehicle_positions_vehicle_time" ON "public"."vehicle_positions" USING "btree" ("vehicle_id", "timestamp" DESC);



CREATE INDEX "idx_vehiculos_empresa_company_id" ON "public"."vehiculos_empresa" USING "btree" ("company_id");



CREATE INDEX "idx_vuelos_dron_company_id" ON "public"."vuelos_dron" USING "btree" ("company_id");



CREATE INDEX "idx_work_records_company" ON "public"."work_records" USING "btree" ("company_id");



CREATE INDEX "idx_work_records_company_id" ON "public"."work_records" USING "btree" ("company_id");



CREATE INDEX "idx_work_records_cuadrillas_company_id" ON "public"."work_records_cuadrillas" USING "btree" ("company_id");



CREATE INDEX "idx_work_records_parcel_date" ON "public"."work_records" USING "btree" ("parcel_id", "date" DESC);



CREATE INDEX "idx_work_records_parcel_id" ON "public"."work_records" USING "btree" ("parcel_id");



CREATE INDEX "inventario_registros_lookup_idx" ON "public"."inventario_registros" USING "btree" ("ubicacion_id", "categoria_id", "created_at" DESC);



CREATE UNIQUE INDEX "uq_inventario_ubicacion_activo_apero" ON "public"."inventario_ubicacion_activo" USING "btree" ("apero_id") WHERE ("apero_id" IS NOT NULL);



CREATE UNIQUE INDEX "uq_inventario_ubicacion_activo_tractor" ON "public"."inventario_ubicacion_activo" USING "btree" ("maquinaria_tractor_id") WHERE ("maquinaria_tractor_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "auto_company_trabajos" BEFORE INSERT ON "public"."trabajos_registro" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_company_id"();



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



CREATE OR REPLACE TRIGGER "trg_pilot_enforce_company_write" BEFORE INSERT OR UPDATE ON "public"."inventario_productos_catalogo" FOR EACH ROW EXECUTE FUNCTION "public"."pilot_enforce_company_write"();



CREATE OR REPLACE TRIGGER "trg_pilot_enforce_company_write" BEFORE INSERT OR UPDATE ON "public"."maquinaria_tractores" FOR EACH ROW EXECUTE FUNCTION "public"."pilot_enforce_company_write"();



CREATE OR REPLACE TRIGGER "trg_pilot_enforce_company_write" BEFORE INSERT OR UPDATE ON "public"."partes_diarios" FOR EACH ROW EXECUTE FUNCTION "public"."pilot_enforce_company_write"();



CREATE OR REPLACE TRIGGER "trg_pilot_enforce_company_write" BEFORE INSERT OR UPDATE ON "public"."personal" FOR EACH ROW EXECUTE FUNCTION "public"."pilot_enforce_company_write"();



CREATE OR REPLACE TRIGGER "trg_pilot_enforce_company_write" BEFORE INSERT OR UPDATE ON "public"."trabajos_registro" FOR EACH ROW EXECUTE FUNCTION "public"."pilot_enforce_company_write"();



ALTER TABLE ONLY "public"."ai_proposal_validations"
    ADD CONSTRAINT "ai_proposal_validations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."ai_proposal_validations"
    ADD CONSTRAINT "ai_proposal_validations_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_proposal_validations"
    ADD CONSTRAINT "ai_proposal_validations_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."ai_proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_proposals"
    ADD CONSTRAINT "ai_proposals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."ai_proposals"
    ADD CONSTRAINT "ai_proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."analisis_agua"
    ADD CONSTRAINT "analisis_agua_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."analisis_suelo"
    ADD CONSTRAINT "analisis_suelo_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."analisis_suelo"
    ADD CONSTRAINT "analisis_suelo_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."aperos"
    ADD CONSTRAINT "aperos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."camaras_almacen"
    ADD CONSTRAINT "camaras_almacen_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."camiones"
    ADD CONSTRAINT "camiones_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."certificaciones_parcela"
    ADD CONSTRAINT "certificaciones_parcela_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."certificaciones_parcela"
    ADD CONSTRAINT "certificaciones_parcela_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."cierres_jornada"
    ADD CONSTRAINT "cierres_jornada_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."cierres_jornada"
    ADD CONSTRAINT "cierres_jornada_parte_diario_id_fkey" FOREIGN KEY ("parte_diario_id") REFERENCES "public"."partes_diarios"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cuadrillas"
    ADD CONSTRAINT "cuadrillas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."erp_exportaciones"
    ADD CONSTRAINT "erp_exportaciones_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."fotos_campo"
    ADD CONSTRAINT "fotos_campo_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."fotos_campo"
    ADD CONSTRAINT "fotos_campo_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ganaderos"
    ADD CONSTRAINT "ganaderos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."harvests"
    ADD CONSTRAINT "harvests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."harvests"
    ADD CONSTRAINT "harvests_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id");



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."inventario_productos_catalogo"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventario_entradas"
    ADD CONSTRAINT "inventario_entradas_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."inventario_informes"
    ADD CONSTRAINT "inventario_informes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id");



ALTER TABLE ONLY "public"."inventario_informes"
    ADD CONSTRAINT "inventario_informes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."inventario_informes"
    ADD CONSTRAINT "inventario_informes_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."inventario_productos_catalogo"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_ubicacion_destino_id_fkey" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "public"."inventario_ubicaciones"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_movimientos"
    ADD CONSTRAINT "inventario_movimientos_ubicacion_origen_id_fkey" FOREIGN KEY ("ubicacion_origen_id") REFERENCES "public"."inventario_ubicaciones"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_productos_catalogo"
    ADD CONSTRAINT "inventario_productos_catalogo_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_productos_catalogo"
    ADD CONSTRAINT "inventario_productos_catalogo_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."inventario_registros"
    ADD CONSTRAINT "inventario_registros_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."inventario_categorias"("id");



ALTER TABLE ONLY "public"."inventario_registros"
    ADD CONSTRAINT "inventario_registros_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."inventario_registros"
    ADD CONSTRAINT "inventario_registros_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."inventario_productos_catalogo"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventario_registros"
    ADD CONSTRAINT "inventario_registros_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."inventario_ubicacion_activo"
    ADD CONSTRAINT "inventario_ubicacion_activo_apero_id_fkey" FOREIGN KEY ("apero_id") REFERENCES "public"."aperos"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_ubicacion_activo"
    ADD CONSTRAINT "inventario_ubicacion_activo_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."inventario_ubicacion_activo"
    ADD CONSTRAINT "inventario_ubicacion_activo_maquinaria_tractor_id_fkey" FOREIGN KEY ("maquinaria_tractor_id") REFERENCES "public"."maquinaria_tractores"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_ubicacion_activo"
    ADD CONSTRAINT "inventario_ubicacion_activo_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventario_ubicaciones"
    ADD CONSTRAINT "inventario_ubicaciones_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."lecturas_sensor_planta"
    ADD CONSTRAINT "lecturas_sensor_planta_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."lecturas_sensor_planta"
    ADD CONSTRAINT "lecturas_sensor_planta_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lia_contexto_sesion"
    ADD CONSTRAINT "lia_contexto_sesion_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."lia_memoria"
    ADD CONSTRAINT "lia_memoria_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."lia_patrones"
    ADD CONSTRAINT "lia_patrones_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."logistica_combustible"
    ADD CONSTRAINT "logistica_combustible_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."logistica_combustible"
    ADD CONSTRAINT "logistica_combustible_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "public"."personal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."logistica_conductores"
    ADD CONSTRAINT "logistica_conductores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."logistica_inventario_sync"
    ADD CONSTRAINT "logistica_inventario_sync_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."logistica_inventario_sync"
    ADD CONSTRAINT "logistica_inventario_sync_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."logistica_mantenimiento"
    ADD CONSTRAINT "logistica_mantenimiento_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "public"."camiones"("id");



ALTER TABLE ONLY "public"."logistica_mantenimiento"
    ADD CONSTRAINT "logistica_mantenimiento_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."logistica_viajes"
    ADD CONSTRAINT "logistica_viajes_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "public"."camiones"("id");



ALTER TABLE ONLY "public"."logistica_viajes"
    ADD CONSTRAINT "logistica_viajes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."logistica_viajes"
    ADD CONSTRAINT "logistica_viajes_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "public"."logistica_conductores"("id");



ALTER TABLE ONLY "public"."logistica_viajes"
    ADD CONSTRAINT "logistica_viajes_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maquinaria_aperos"
    ADD CONSTRAINT "maquinaria_aperos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."maquinaria_aperos"
    ADD CONSTRAINT "maquinaria_aperos_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "public"."maquinaria_tractores"("id");



ALTER TABLE ONLY "public"."maquinaria_inventario_sync"
    ADD CONSTRAINT "maquinaria_inventario_sync_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."maquinaria_inventario_sync"
    ADD CONSTRAINT "maquinaria_inventario_sync_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "public"."inventario_ubicaciones"("id");



ALTER TABLE ONLY "public"."maquinaria_mantenimiento"
    ADD CONSTRAINT "maquinaria_mantenimiento_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."maquinaria_mantenimiento"
    ADD CONSTRAINT "maquinaria_mantenimiento_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "public"."maquinaria_tractores"("id");



ALTER TABLE ONLY "public"."maquinaria_tractores"
    ADD CONSTRAINT "maquinaria_tractores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."maquinaria_uso"
    ADD CONSTRAINT "maquinaria_uso_apero_id_fkey" FOREIGN KEY ("apero_id") REFERENCES "public"."maquinaria_aperos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maquinaria_uso"
    ADD CONSTRAINT "maquinaria_uso_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."maquinaria_uso"
    ADD CONSTRAINT "maquinaria_uso_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."maquinaria_uso"
    ADD CONSTRAINT "maquinaria_uso_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "public"."maquinaria_tractores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimientos_palot"
    ADD CONSTRAINT "movimientos_palot_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "public"."camiones"("id");



ALTER TABLE ONLY "public"."movimientos_palot"
    ADD CONSTRAINT "movimientos_palot_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."movimientos_palot"
    ADD CONSTRAINT "movimientos_palot_palot_id_fkey" FOREIGN KEY ("palot_id") REFERENCES "public"."palots"("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_camara_id_fkey" FOREIGN KEY ("camara_id") REFERENCES "public"."camaras_almacen"("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_harvest_id_fkey" FOREIGN KEY ("harvest_id") REFERENCES "public"."harvests"("id");



ALTER TABLE ONLY "public"."palots"
    ADD CONSTRAINT "palots_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."parcel_photos"
    ADD CONSTRAINT "parcel_photos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."parcel_photos"
    ADD CONSTRAINT "parcel_photos_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parcel_production"
    ADD CONSTRAINT "parcel_production_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."parcels"
    ADD CONSTRAINT "parcels_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."parte_estado_finca"
    ADD CONSTRAINT "parte_estado_finca_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."parte_estado_finca"
    ADD CONSTRAINT "parte_estado_finca_parte_id_fkey" FOREIGN KEY ("parte_id") REFERENCES "public"."partes_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parte_personal"
    ADD CONSTRAINT "parte_personal_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."parte_personal"
    ADD CONSTRAINT "parte_personal_parte_id_fkey" FOREIGN KEY ("parte_id") REFERENCES "public"."partes_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parte_residuos_vegetales"
    ADD CONSTRAINT "parte_residuos_vegetales_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."parte_residuos_vegetales"
    ADD CONSTRAINT "parte_residuos_vegetales_ganadero_id_fkey" FOREIGN KEY ("ganadero_id") REFERENCES "public"."ganaderos"("id");



ALTER TABLE ONLY "public"."parte_residuos_vegetales"
    ADD CONSTRAINT "parte_residuos_vegetales_parte_id_fkey" FOREIGN KEY ("parte_id") REFERENCES "public"."partes_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parte_residuos_vegetales"
    ADD CONSTRAINT "parte_residuos_vegetales_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id");



ALTER TABLE ONLY "public"."parte_trabajo"
    ADD CONSTRAINT "parte_trabajo_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."parte_trabajo"
    ADD CONSTRAINT "parte_trabajo_parte_id_fkey" FOREIGN KEY ("parte_id") REFERENCES "public"."partes_diarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."partes_diarios"
    ADD CONSTRAINT "partes_diarios_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."personal"
    ADD CONSTRAINT "personal_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."personal_externo"
    ADD CONSTRAINT "personal_externo_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."personal_tipos_trabajo"
    ADD CONSTRAINT "personal_tipos_trabajo_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."personal_tipos_trabajo"
    ADD CONSTRAINT "personal_tipos_trabajo_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_tipos_trabajo"
    ADD CONSTRAINT "personal_tipos_trabajo_tipo_trabajo_id_fkey" FOREIGN KEY ("tipo_trabajo_id") REFERENCES "public"."catalogo_tipos_trabajo"("id");



ALTER TABLE ONLY "public"."planificacion_campana"
    ADD CONSTRAINT "planificacion_campana_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."planificacion_campana"
    ADD CONSTRAINT "planificacion_campana_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."plantings"
    ADD CONSTRAINT "plantings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."plantings"
    ADD CONSTRAINT "plantings_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."presencia_tiempo_real"
    ADD CONSTRAINT "presencia_tiempo_real_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."presencia_tiempo_real"
    ADD CONSTRAINT "presencia_tiempo_real_cuadrilla_id_fkey" FOREIGN KEY ("cuadrilla_id") REFERENCES "public"."cuadrillas"("id");



ALTER TABLE ONLY "public"."presencia_tiempo_real"
    ADD CONSTRAINT "presencia_tiempo_real_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."presencia_tiempo_real"
    ADD CONSTRAINT "presencia_tiempo_real_work_record_id_fkey" FOREIGN KEY ("work_record_id") REFERENCES "public"."work_records"("id");



ALTER TABLE ONLY "public"."proveedores"
    ADD CONSTRAINT "proveedores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."proveedores_precios"
    ADD CONSTRAINT "proveedores_precios_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."proveedores_precios"
    ADD CONSTRAINT "proveedores_precios_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registros_estado_parcela"
    ADD CONSTRAINT "registros_estado_parcela_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."registros_estado_parcela"
    ADD CONSTRAINT "registros_estado_parcela_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registros_riego"
    ADD CONSTRAINT "registros_riego_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."registros_riego"
    ADD CONSTRAINT "registros_riego_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."registros_riego"
    ADD CONSTRAINT "registros_riego_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "public"."sistema_riego_zonas"("id");



ALTER TABLE ONLY "public"."residuos_operacion"
    ADD CONSTRAINT "residuos_operacion_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."residuos_operacion"
    ADD CONSTRAINT "residuos_operacion_operacion_id_fkey" FOREIGN KEY ("operacion_id") REFERENCES "public"."work_records"("id");



ALTER TABLE ONLY "public"."residuos_operacion"
    ADD CONSTRAINT "residuos_operacion_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."sistema_riego_zonas"
    ADD CONSTRAINT "sistema_riego_zonas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."sistema_riego_zonas"
    ADD CONSTRAINT "sistema_riego_zonas_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."tickets_pesaje"
    ADD CONSTRAINT "tickets_pesaje_camion_id_fkey" FOREIGN KEY ("camion_id") REFERENCES "public"."camiones"("id");



ALTER TABLE ONLY "public"."tickets_pesaje"
    ADD CONSTRAINT "tickets_pesaje_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."tickets_pesaje"
    ADD CONSTRAINT "tickets_pesaje_harvest_id_fkey" FOREIGN KEY ("harvest_id") REFERENCES "public"."harvests"("id");



ALTER TABLE ONLY "public"."trabajos_incidencias"
    ADD CONSTRAINT "trabajos_incidencias_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."trabajos_registro"
    ADD CONSTRAINT "trabajos_registro_apero_id_fkey" FOREIGN KEY ("apero_id") REFERENCES "public"."maquinaria_aperos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trabajos_registro"
    ADD CONSTRAINT "trabajos_registro_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."trabajos_registro"
    ADD CONSTRAINT "trabajos_registro_tractor_id_fkey" FOREIGN KEY ("tractor_id") REFERENCES "public"."maquinaria_tractores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tractores"
    ADD CONSTRAINT "tractores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."trazabilidad_registros"
    ADD CONSTRAINT "trazabilidad_registros_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "public"."personal"("id");



ALTER TABLE ONLY "public"."vehicle_positions"
    ADD CONSTRAINT "vehicle_positions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."vehicle_positions"
    ADD CONSTRAINT "vehicle_positions_parcel_id_detectada_fkey" FOREIGN KEY ("parcel_id_detectada") REFERENCES "public"."parcels"("parcel_id");



ALTER TABLE ONLY "public"."vehiculos_empresa"
    ADD CONSTRAINT "vehiculos_empresa_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."vehiculos_empresa"
    ADD CONSTRAINT "vehiculos_empresa_conductor_habitual_id_fkey" FOREIGN KEY ("conductor_habitual_id") REFERENCES "public"."personal"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vuelos_dron"
    ADD CONSTRAINT "vuelos_dron_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."work_records"
    ADD CONSTRAINT "work_records_cuadrilla_id_fkey" FOREIGN KEY ("cuadrilla_id") REFERENCES "public"."cuadrillas"("id");



ALTER TABLE ONLY "public"."work_records_cuadrillas"
    ADD CONSTRAINT "work_records_cuadrillas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



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


CREATE POLICY "ai_proposal_validations_pilot_open" ON "public"."ai_proposal_validations" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."ai_proposals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_proposals_pilot_open" ON "public"."ai_proposals" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."analisis_agua" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analisis_agua_pilot_open" ON "public"."analisis_agua" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "analisis_agua_public" ON "public"."analisis_agua" USING (true);



ALTER TABLE "public"."analisis_suelo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analisis_suelo_pilot_open" ON "public"."analisis_suelo" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "anon INSERT catalogo" ON "public"."inventario_productos_catalogo" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon INSERT movimientos" ON "public"."inventario_movimientos" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon SELECT catalogo" ON "public"."inventario_productos_catalogo" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon SELECT movimientos" ON "public"."inventario_movimientos" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon UPDATE catalogo" ON "public"."inventario_productos_catalogo" FOR UPDATE TO "anon" USING (true);



CREATE POLICY "anon full access ganaderos" ON "public"."ganaderos" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."parte_estado_finca" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."parte_personal" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."parte_residuos_vegetales" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."parte_trabajo" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all" ON "public"."partes_diarios" TO "anon" USING (true) WITH CHECK (true);



CREATE POLICY "anon_all_maquinaria_uso" ON "public"."maquinaria_uso" TO "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."aperos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "aperos_pilot_open" ON "public"."aperos" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."camaras_almacen" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "camaras_almacen_pilot_open" ON "public"."camaras_almacen" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."camiones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "camiones_pilot_open" ON "public"."camiones" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."catalogo_tipos_mantenimiento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catalogo_tipos_mantenimiento_catalog_open" ON "public"."catalogo_tipos_mantenimiento" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."catalogo_tipos_trabajo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "catalogo_tipos_trabajo_catalog_open" ON "public"."catalogo_tipos_trabajo" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."certificaciones_parcela" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "certificaciones_parcela_pilot_open" ON "public"."certificaciones_parcela" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."cierres_jornada" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cierres_jornada_pilot_open" ON "public"."cierres_jornada" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "companies_admin" ON "public"."companies" USING (("id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text") AND ("user_profiles"."role" = 'admin'::"text")))));



CREATE POLICY "companies_read" ON "public"."companies" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "companies_select" ON "public"."companies" FOR SELECT USING (("id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text")))));



ALTER TABLE "public"."cuadrillas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cuadrillas_anon" ON "public"."cuadrillas" FOR SELECT TO "anon" USING (true);



CREATE POLICY "cuadrillas_pilot_open" ON "public"."cuadrillas" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."cultivos_catalogo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cultivos_catalogo_catalog_open" ON "public"."cultivos_catalogo" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."erp_exportaciones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "erp_exportaciones_pilot_open" ON "public"."erp_exportaciones" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."fotos_campo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fotos_campo_pilot_open" ON "public"."fotos_campo" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."ganaderos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ganaderos_pilot_open" ON "public"."ganaderos" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."harvests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "harvests_pilot_open" ON "public"."harvests" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventario_categorias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventario_categorias_catalog_open" ON "public"."inventario_categorias" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventario_entradas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventario_entradas_pilot_open" ON "public"."inventario_entradas" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventario_informes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventario_informes_pilot_open" ON "public"."inventario_informes" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventario_movimientos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventario_movimientos_pilot_open" ON "public"."inventario_movimientos" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventario_productos_catalogo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventario_productos_catalogo_pilot_open" ON "public"."inventario_productos_catalogo" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventario_registros" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventario_registros_pilot_open" ON "public"."inventario_registros" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventario_ubicacion_activo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventario_ubicacion_activo_pilot_open" ON "public"."inventario_ubicacion_activo" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventario_ubicaciones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventario_ubicaciones_pilot_open" ON "public"."inventario_ubicaciones" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."lecturas_sensor_planta" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lecturas_sensor_planta_pilot_open" ON "public"."lecturas_sensor_planta" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."lia_contexto_sesion" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lia_contexto_sesion_pilot_open" ON "public"."lia_contexto_sesion" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."lia_memoria" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lia_memoria_pilot_open" ON "public"."lia_memoria" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."lia_patrones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lia_patrones_pilot_open" ON "public"."lia_patrones" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."logistica_combustible" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "logistica_combustible_pilot_open" ON "public"."logistica_combustible" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."logistica_conductores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "logistica_conductores_pilot_open" ON "public"."logistica_conductores" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."logistica_inventario_sync" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "logistica_inventario_sync_pilot_open" ON "public"."logistica_inventario_sync" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."logistica_mantenimiento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "logistica_mantenimiento_pilot_open" ON "public"."logistica_mantenimiento" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."logistica_viajes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "logistica_viajes_pilot_open" ON "public"."logistica_viajes" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."maquinaria_aperos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maquinaria_aperos_pilot_open" ON "public"."maquinaria_aperos" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."maquinaria_inventario_sync" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maquinaria_inventario_sync_pilot_open" ON "public"."maquinaria_inventario_sync" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."maquinaria_mantenimiento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maquinaria_mantenimiento_pilot_open" ON "public"."maquinaria_mantenimiento" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."maquinaria_tractores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maquinaria_tractores_pilot_open" ON "public"."maquinaria_tractores" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."maquinaria_uso" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "maquinaria_uso_pilot_open" ON "public"."maquinaria_uso" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."movimientos_palot" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "movimientos_palot_pilot_open" ON "public"."movimientos_palot" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."palots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "palots_pilot_open" ON "public"."palots" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."parcel_photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parcel_photos_pilot_open" ON "public"."parcel_photos" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."parcel_production" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parcel_production_pilot_open" ON "public"."parcel_production" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."parcels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parcels_insert" ON "public"."parcels" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text") AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'encargado'::"text"]))))));



CREATE POLICY "parcels_pilot_open" ON "public"."parcels" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "parcels_select" ON "public"."parcels" FOR SELECT USING (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text")))));



CREATE POLICY "parcels_update" ON "public"."parcels" FOR UPDATE USING (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text") AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'encargado'::"text"]))))));



ALTER TABLE "public"."parte_estado_finca" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parte_estado_finca_pilot_open" ON "public"."parte_estado_finca" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."parte_personal" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parte_personal_pilot_open" ON "public"."parte_personal" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."parte_residuos_vegetales" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parte_residuos_vegetales_pilot_open" ON "public"."parte_residuos_vegetales" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."parte_trabajo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parte_trabajo_pilot_open" ON "public"."parte_trabajo" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."partes_diarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "partes_diarios_pilot_open" ON "public"."partes_diarios" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."personal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_externo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "personal_externo_pilot_open" ON "public"."personal_externo" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "personal_pilot_open" ON "public"."personal" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "personal_select" ON "public"."personal" FOR SELECT USING (("company_id" = "public"."current_user_company_id"()));



ALTER TABLE "public"."personal_tipos_trabajo" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "personal_tipos_trabajo_pilot_open" ON "public"."personal_tipos_trabajo" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "personal_write" ON "public"."personal" USING (("company_id" = "public"."current_user_company_id"())) WITH CHECK (("company_id" = "public"."current_user_company_id"()));



ALTER TABLE "public"."planificacion_campana" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "planificacion_campana_pilot_open" ON "public"."planificacion_campana" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."plantings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "plantings_pilot_open" ON "public"."plantings" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "presencia_anon_read" ON "public"."presencia_tiempo_real" TO "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."presencia_tiempo_real" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "presencia_tiempo_real_pilot_open" ON "public"."presencia_tiempo_real" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "profiles_admin_all" ON "public"."user_profiles" USING (("public"."current_user_is_admin"() AND ("company_id" = "public"."current_user_company_id"()))) WITH CHECK (("public"."current_user_is_admin"() AND ("company_id" = "public"."current_user_company_id"())));



CREATE POLICY "profiles_own_select" ON "public"."user_profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select" ON "public"."user_profiles" FOR SELECT USING (("company_id" = "public"."current_user_company_id"()));



ALTER TABLE "public"."proveedores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proveedores_pilot_open" ON "public"."proveedores" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."proveedores_precios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proveedores_precios_pilot_open" ON "public"."proveedores_precios" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."registros_estado_parcela" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registros_estado_parcela_pilot_open" ON "public"."registros_estado_parcela" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."registros_riego" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registros_riego_pilot_open" ON "public"."registros_riego" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."residuos_operacion" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "residuos_operacion_pilot_open" ON "public"."residuos_operacion" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."sistema_riego_zonas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sistema_riego_zonas_pilot_open" ON "public"."sistema_riego_zonas" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."tickets_pesaje" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tickets_pesaje_pilot_open" ON "public"."tickets_pesaje" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "trabajos_delete" ON "public"."trabajos_registro" FOR DELETE USING (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text") AND ("user_profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."trabajos_incidencias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trabajos_incidencias_pilot_open" ON "public"."trabajos_incidencias" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "trabajos_insert" ON "public"."trabajos_registro" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text") AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'encargado'::"text", 'operario'::"text"]))))));



ALTER TABLE "public"."trabajos_registro" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trabajos_registro_pilot_open" ON "public"."trabajos_registro" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "trabajos_select" ON "public"."trabajos_registro" FOR SELECT USING (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text")))));



CREATE POLICY "trabajos_update" ON "public"."trabajos_registro" FOR UPDATE USING (("company_id" IN ( SELECT "user_profiles"."company_id"
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"text") AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'encargado'::"text"]))))));



ALTER TABLE "public"."tractores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tractores_pilot_open" ON "public"."tractores" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."trazabilidad_registros" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trazabilidad_registros_pilot_open" ON "public"."trazabilidad_registros" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usuario_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuario_roles_catalog_open" ON "public"."usuario_roles" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."vehicle_positions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vehicle_positions_pilot_open" ON "public"."vehicle_positions" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."vehiculos_empresa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vehiculos_empresa_pilot_open" ON "public"."vehiculos_empresa" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."vuelos_dron" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vuelos_dron_pilot_open" ON "public"."vuelos_dron" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."work_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "work_records_anon" ON "public"."work_records" TO "anon" USING (true) WITH CHECK (true);



ALTER TABLE "public"."work_records_cuadrillas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "work_records_cuadrillas_pilot_open" ON "public"."work_records_cuadrillas" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "work_records_pilot_open" ON "public"."work_records" TO "authenticated" USING (true) WITH CHECK (true);



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



GRANT ALL ON FUNCTION "public"."current_user_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_company_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_company_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_company_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_timestamp"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_context"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_context"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."pilot_disable_fallback"("p_actor_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."pilot_disable_fallback"("p_actor_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."pilot_disable_fallback"("p_actor_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pilot_disable_fallback"("p_actor_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."pilot_enforce_company_write"() TO "anon";
GRANT ALL ON FUNCTION "public"."pilot_enforce_company_write"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pilot_enforce_company_write"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."pilot_fallback_write"("p_actor_user_id" "uuid", "p_table_name" "text", "p_action" "text", "p_payload" "jsonb", "p_record_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."pilot_fallback_write"("p_actor_user_id" "uuid", "p_table_name" "text", "p_action" "text", "p_payload" "jsonb", "p_record_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."pilot_fallback_write"("p_actor_user_id" "uuid", "p_table_name" "text", "p_action" "text", "p_payload" "jsonb", "p_record_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pilot_fallback_write"("p_actor_user_id" "uuid", "p_table_name" "text", "p_action" "text", "p_payload" "jsonb", "p_record_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."pilot_get_active_user_company_id"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."pilot_get_active_user_company_id"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pilot_get_active_user_company_id"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_role"("required_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_role"("required_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_role"("required_role" "text") TO "service_role";



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



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



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



GRANT ALL ON TABLE "public"."pilot_config" TO "anon";
GRANT ALL ON TABLE "public"."pilot_config" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_config" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_fallback_log" TO "anon";
GRANT ALL ON TABLE "public"."pilot_fallback_log" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_fallback_log" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_fallback_table_allowlist" TO "anon";
GRANT ALL ON TABLE "public"."pilot_fallback_table_allowlist" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_fallback_table_allowlist" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_fallback_user_allowlist" TO "anon";
GRANT ALL ON TABLE "public"."pilot_fallback_user_allowlist" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_fallback_user_allowlist" TO "service_role";



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



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



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







