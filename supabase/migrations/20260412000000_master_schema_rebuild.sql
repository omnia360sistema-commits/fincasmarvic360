-- =============================================================================
-- AGRÍCOLA MARVIC 360 — MASTER SCHEMA REBUILD
-- FECHA: 2026-04-12
-- PROPÓSITO: Reconstrucción limpia del schema public de Supabase.
--            Todas las tablas alineadas 100% con el código React/TS del proyecto.
--            Incorpora todos los fixes de la auditoría "auditoria real".
--
-- EJECUCIÓN: Aplicar en Supabase SQL Editor con rol service_role.
--            Puede ejecutarse bloque a bloque para verificar entre pasos.
--
-- FIXES INCORPORADOS:
--   [CRÍTICO] inventario_ubicacion_activo.maquinaria_apero_id (campo fantasma → añadido)
--   [CRÍTICO] trabajos_registro.recursos_personal + materiales_previstos (ya no se pierden)
--   [ALTO]    logistica_mantenimiento: DROP FK camiones + ADD vehiculo_tipo discriminador
--   [ALTO]    logistica_viajes.conductor_id: sin FK (legacy, solo personal_id activo)
--   [ALTO]    registros_estado_parcela.parcel_id: TEXT (era UUID en migración 20260314)
--   [MEDIO]   maquinaria_tractores: sin campos legacy estado/codigo/tipo/ubicacion
--   [MEDIO]   3 vistas SQL creadas (faltaban en todas las migrations)
--   [LIMPIEZA] DROP tablas zombi: tractores, logistica_conductores, maquinaria_tractoristas
-- =============================================================================

-- =============================================================================
-- BLOQUE 0 — DROP COMPLETO (CASCADE maneja dependencias)
-- =============================================================================

-- Vistas
DROP VIEW IF EXISTS public.v_maquinaria_aperos_en_inventario CASCADE;
DROP VIEW IF EXISTS public.v_tractores_en_inventario CASCADE;
DROP VIEW IF EXISTS public.v_inventario_activos_en_ubicacion CASCADE;

-- Funciones custom
DROP FUNCTION IF EXISTS public.cerrar_jornada_atomica CASCADE;
DROP FUNCTION IF EXISTS public.user_has_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.current_user_is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.current_user_company_id() CASCADE;

-- Tablas (orden inverso de dependencias)
DROP TABLE IF EXISTS public.ai_proposal_validations CASCADE;
DROP TABLE IF EXISTS public.ai_proposals CASCADE;
DROP TABLE IF EXISTS public.lia_patrones CASCADE;
DROP TABLE IF EXISTS public.lia_memoria CASCADE;
DROP TABLE IF EXISTS public.lia_contexto_sesion CASCADE;
DROP TABLE IF EXISTS public.erp_exportaciones CASCADE;
DROP TABLE IF EXISTS public.vuelos_dron CASCADE;
DROP TABLE IF EXISTS public.trazabilidad_registros CASCADE;
DROP TABLE IF EXISTS public.movimientos_palot CASCADE;
DROP TABLE IF EXISTS public.palots CASCADE;
DROP TABLE IF EXISTS public.camaras_almacen CASCADE;
DROP TABLE IF EXISTS public.tickets_pesaje CASCADE;
DROP TABLE IF EXISTS public.registros_riego CASCADE;
DROP TABLE IF EXISTS public.sistema_riego_zonas CASCADE;
DROP TABLE IF EXISTS public.lecturas_sensor_planta CASCADE;
DROP TABLE IF EXISTS public.analisis_agua CASCADE;
DROP TABLE IF EXISTS public.analisis_suelo CASCADE;
DROP TABLE IF EXISTS public.vehicle_positions CASCADE;
DROP TABLE IF EXISTS public.presencia_tiempo_real CASCADE;
DROP TABLE IF EXISTS public.planificacion_campana CASCADE;
DROP TABLE IF EXISTS public.trabajos_incidencias CASCADE;
DROP TABLE IF EXISTS public.trabajos_registro CASCADE;
DROP TABLE IF EXISTS public.cierres_jornada CASCADE;
DROP TABLE IF EXISTS public.parte_residuos_vegetales CASCADE;
DROP TABLE IF EXISTS public.parte_personal CASCADE;
DROP TABLE IF EXISTS public.parte_trabajo CASCADE;
DROP TABLE IF EXISTS public.parte_estado_finca CASCADE;
DROP TABLE IF EXISTS public.partes_diarios CASCADE;
DROP TABLE IF EXISTS public.parcel_production CASCADE;
DROP TABLE IF EXISTS public.residuos_operacion CASCADE;
DROP TABLE IF EXISTS public.certificaciones_parcela CASCADE;
DROP TABLE IF EXISTS public.registros_estado_parcela CASCADE;
DROP TABLE IF EXISTS public.fotos_campo CASCADE;
DROP TABLE IF EXISTS public.parcel_photos CASCADE;
DROP TABLE IF EXISTS public.work_records_cuadrillas CASCADE;
DROP TABLE IF EXISTS public.work_records CASCADE;
DROP TABLE IF EXISTS public.harvests CASCADE;
DROP TABLE IF EXISTS public.plantings CASCADE;
DROP TABLE IF EXISTS public.personal_tipos_trabajo CASCADE;
DROP TABLE IF EXISTS public.inventario_ubicacion_activo CASCADE;
DROP TABLE IF EXISTS public.inventario_informes CASCADE;
DROP TABLE IF EXISTS public.inventario_entradas CASCADE;
DROP TABLE IF EXISTS public.inventario_movimientos CASCADE;
DROP TABLE IF EXISTS public.inventario_registros CASCADE;
DROP TABLE IF EXISTS public.inventario_productos_catalogo CASCADE;
DROP TABLE IF EXISTS public.inventario_ubicaciones CASCADE;
DROP TABLE IF EXISTS public.logistica_inventario_sync CASCADE;
DROP TABLE IF EXISTS public.logistica_mantenimiento CASCADE;
DROP TABLE IF EXISTS public.logistica_combustible CASCADE;
DROP TABLE IF EXISTS public.logistica_viajes CASCADE;
DROP TABLE IF EXISTS public.vehiculos_empresa CASCADE;
DROP TABLE IF EXISTS public.camiones CASCADE;
DROP TABLE IF EXISTS public.maquinaria_inventario_sync CASCADE;
DROP TABLE IF EXISTS public.maquinaria_mantenimiento CASCADE;
DROP TABLE IF EXISTS public.maquinaria_uso CASCADE;
DROP TABLE IF EXISTS public.aperos CASCADE;
DROP TABLE IF EXISTS public.maquinaria_aperos CASCADE;
DROP TABLE IF EXISTS public.maquinaria_tractores CASCADE;
DROP TABLE IF EXISTS public.ganaderos CASCADE;
DROP TABLE IF EXISTS public.personal_externo CASCADE;
DROP TABLE IF EXISTS public.personal CASCADE;
DROP TABLE IF EXISTS public.proveedores_precios CASCADE;
DROP TABLE IF EXISTS public.proveedores CASCADE;
DROP TABLE IF EXISTS public.cuadrillas CASCADE;
DROP TABLE IF EXISTS public.parcels CASCADE;
DROP TABLE IF EXISTS public.usuario_roles CASCADE;
DROP TABLE IF EXISTS public.inventario_categorias CASCADE;
DROP TABLE IF EXISTS public.catalogo_tipos_mantenimiento CASCADE;
DROP TABLE IF EXISTS public.catalogo_tipos_trabajo CASCADE;
DROP TABLE IF EXISTS public.cultivos_catalogo CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
-- Zombies (no se recrean)
DROP TABLE IF EXISTS public.tractores CASCADE;
DROP TABLE IF EXISTS public.logistica_conductores CASCADE;
DROP TABLE IF EXISTS public.maquinaria_tractoristas CASCADE;

-- ENUMs (incluye los del AUDITORIA_DATABASE_OMNIA por si existen)
DROP TYPE IF EXISTS public.ai_validation_decision CASCADE;
DROP TYPE IF EXISTS public.ai_proposal_status CASCADE;
DROP TYPE IF EXISTS public.ai_proposal_category CASCADE;
DROP TYPE IF EXISTS public.estado_certificacion CASCADE;
DROP TYPE IF EXISTS public.tipo_residuo CASCADE;
DROP TYPE IF EXISTS public.tipo_suelo CASCADE;
DROP TYPE IF EXISTS public.tipo_riego CASCADE;
DROP TYPE IF EXISTS public.estado_parcela CASCADE;
DROP TYPE IF EXISTS public.estado_operativo CASCADE;
DROP TYPE IF EXISTS public.categoria_personal CASCADE;
DROP TYPE IF EXISTS public.estado_planificacion CASCADE;
DROP TYPE IF EXISTS public.prioridad_trabajo CASCADE;
DROP TYPE IF EXISTS public.alerta_itv CASCADE;
DROP TYPE IF EXISTS public.unidad_inventario CASCADE;
DROP TYPE IF EXISTS public.tipo_viaje CASCADE;

-- =============================================================================
-- BLOQUE 1 — ENUMs PostgreSQL (8 tipos reales usados en types.ts)
-- =============================================================================

-- Estado de parcela agrícola
CREATE TYPE public.estado_parcela AS ENUM (
  'activa', 'plantada', 'preparacion', 'cosechada',
  'vacia', 'baja', 'en_produccion', 'acolchado'
);

-- Tipo de sistema de riego
CREATE TYPE public.tipo_riego AS ENUM (
  'goteo', 'tradicional', 'aspersion', 'ninguno'
);

-- Tipo de suelo (análisis edafológico)
CREATE TYPE public.tipo_suelo AS ENUM (
  'arcilloso', 'franco', 'arenoso', 'limoso', 'franco_arcilloso'
);

-- Tipo de residuo agrícola
CREATE TYPE public.tipo_residuo AS ENUM (
  'plastico_acolchado', 'cinta_riego', 'rafia',
  'envase_fitosanitario', 'otro'
);

-- Estado de certificación ecológica
CREATE TYPE public.estado_certificacion AS ENUM (
  'vigente', 'suspendida', 'en_tramite', 'caducada'
);

-- Categoría de propuesta IA
CREATE TYPE public.ai_proposal_category AS ENUM (
  'analysis', 'planning', 'report'
);

-- Estado de propuesta IA
CREATE TYPE public.ai_proposal_status AS ENUM (
  'pending', 'approved', 'rejected', 'executed', 'failed'
);

-- Decisión de validación IA
CREATE TYPE public.ai_validation_decision AS ENUM (
  'approved', 'rejected'
);

-- =============================================================================
-- BLOQUE 2 — MULTI-TENANT: companies + user_profiles + funciones SECURITY DEFINER
-- =============================================================================

CREATE TABLE public.companies (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  slug       text        UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.user_profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  full_name  text,
  role       text        DEFAULT 'operario',  -- admin | encargado | operario
  company_id uuid        REFERENCES public.companies(id)
                         DEFAULT '00000000-0000-0000-0000-000000000001',
  status     text        DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Funciones SECURITY DEFINER con SET row_security = off para evitar recursión RLS

CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT up.company_id
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
    AND up.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT up.role
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
    AND up.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.status = 'active'
      AND up.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(required_role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT CASE
    WHEN required_role = 'operario' THEN true
    WHEN required_role = 'encargado'
      THEN public.current_user_role() IN ('admin', 'encargado')
    WHEN required_role = 'admin'
      THEN public.current_user_role() = 'admin'
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_company_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role()       TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin()   TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_role(text)       TO anon, authenticated, service_role;

-- Función RPC atómica para cerrar jornada con arrastre de planificaciones
CREATE OR REPLACE FUNCTION public.cerrar_jornada_atomica(
  p_fecha    text,
  p_usuario  text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fecha           date := p_fecha::date;
  v_parte_id        uuid;
  v_ejecutados      integer;
  v_pendientes      integer;
  v_arrastrados     integer;
  v_cierre_id       uuid;
BEGIN
  -- Buscar parte_diario del día
  SELECT id INTO v_parte_id
  FROM public.partes_diarios
  WHERE fecha = v_fecha
  LIMIT 1;

  -- Contar trabajos según estado de planificación
  SELECT
    COUNT(*) FILTER (WHERE estado_planificacion = 'ejecutado'),
    COUNT(*) FILTER (WHERE estado_planificacion IN ('confirmado','borrador')),
    COUNT(*) FILTER (WHERE estado_planificacion = 'pendiente')
  INTO v_ejecutados, v_pendientes, v_arrastrados
  FROM public.trabajos_registro
  WHERE fecha_planificada = v_fecha;

  -- Arrastrar pendientes al día siguiente
  UPDATE public.trabajos_registro
  SET
    fecha_original    = COALESCE(fecha_original, fecha_planificada),
    fecha_planificada = v_fecha + 1,
    estado_planificacion = 'pendiente'
  WHERE fecha_planificada = v_fecha
    AND estado_planificacion IN ('confirmado','borrador');

  -- Crear o actualizar cierre de jornada
  INSERT INTO public.cierres_jornada (
    fecha, parte_diario_id,
    trabajos_ejecutados, trabajos_pendientes, trabajos_arrastrados,
    cerrado_at, cerrado_by
  )
  VALUES (
    v_fecha, v_parte_id,
    v_ejecutados, v_pendientes, v_arrastrados,
    now(), p_usuario
  )
  ON CONFLICT (fecha) DO UPDATE SET
    trabajos_ejecutados  = EXCLUDED.trabajos_ejecutados,
    trabajos_pendientes  = EXCLUDED.trabajos_pendientes,
    trabajos_arrastrados = EXCLUDED.trabajos_arrastrados,
    cerrado_at           = EXCLUDED.cerrado_at,
    cerrado_by           = EXCLUDED.cerrado_by
  RETURNING id INTO v_cierre_id;

  RETURN jsonb_build_object(
    'id',                   v_cierre_id,
    'fecha',                v_fecha,
    'trabajos_ejecutados',  v_ejecutados,
    'trabajos_pendientes',  v_pendientes,
    'trabajos_arrastrados', v_arrastrados,
    'cerrado_by',           p_usuario
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cerrar_jornada_atomica(text, text) TO authenticated, service_role;

-- Seed tenant piloto (idempotente)
INSERT INTO public.companies (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Fincas Marvic', 'fincas-marvic')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- BLOQUE 3 — CATÁLOGOS GLOBALES (sin company_id, acceso universal)
-- =============================================================================

CREATE TABLE public.cultivos_catalogo (
  id                          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_interno              text    UNIQUE NOT NULL,
  nombre_display              text    NOT NULL,
  ciclo_dias                  integer NOT NULL,
  rendimiento_kg_ha           numeric(10,2),
  kg_plastico_por_ha          numeric(10,2),
  m_cinta_riego_por_ha        numeric(10,2),
  marco_std_entre_lineas_cm   numeric(6,2),
  marco_std_entre_plantas_cm  numeric(6,2),
  es_ecologico                boolean DEFAULT true,
  created_at                  timestamptz DEFAULT now()
);

CREATE TABLE public.catalogo_tipos_trabajo (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text    NOT NULL,
  categoria  text,
  activo     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.catalogo_tipos_mantenimiento (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text    NOT NULL,
  modulo     text,   -- 'logistica' | 'maquinaria'
  activo     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.inventario_categorias (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text    NOT NULL,
  slug       text    UNIQUE NOT NULL,
  icono      text,
  orden      integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.usuario_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL UNIQUE,
  descripcion text,
  permisos    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- =============================================================================
-- BLOQUE 4 — CAMPO / PARCELAS
-- ⚠️ parcel_id es TEXT NOT NULL PRIMARY KEY — NUNCA uuid
-- =============================================================================

CREATE TABLE public.parcels (
  parcel_id             text    PRIMARY KEY,
  farm                  text,
  parcel_number         text,
  area_hectares         numeric(10,4),
  status                public.estado_parcela DEFAULT 'vacia',
  irrigation_type_v2    public.tipo_riego,
  tipo_suelo            public.tipo_suelo,
  ph_suelo              numeric(4,2),
  materia_organica_pct  numeric(5,2),
  ultima_analisis_suelo date,
  company_id            uuid REFERENCES public.companies(id)
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE public.cuadrillas (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text  NOT NULL,
  empresa     text,
  nif         text,
  responsable text,
  telefono    text,
  activa      boolean DEFAULT true,
  qr_code     text UNIQUE,
  company_id  uuid REFERENCES public.companies(id)
              DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.harvests (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id      text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  crop           text,
  date           date,
  production_kg  numeric(10,2),
  price_kg       numeric(10,4),
  harvest_cost   numeric(10,2),
  company_id     uuid REFERENCES public.companies(id)
                 DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE public.plantings (
  id                       uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id                text  REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  crop                     text,
  date                     date,
  variedad                 text,
  lote_semilla             text,
  proveedor_semilla        text,
  marco_cm_entre_lineas    numeric(6,2),
  marco_cm_entre_plantas   numeric(6,2),
  num_plantas_real         integer,
  fecha_cosecha_estimada   date,
  sistema_riego            public.tipo_riego,
  notes                    text,
  company_id               uuid REFERENCES public.companies(id)
                           DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at               timestamptz DEFAULT now()
);

CREATE TABLE public.work_records (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id        text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  work_type        text,
  date             date,
  cuadrilla_id     uuid    REFERENCES public.cuadrillas(id) ON DELETE SET NULL,
  workers_count    integer,
  hours_worked     numeric(5,2),
  hora_entrada     timestamptz,
  hora_salida      timestamptz,
  notas            text,
  qr_scan_entrada  timestamptz,
  qr_scan_salida   timestamptz,
  horas_calculadas numeric(5,2),
  company_id       uuid REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.work_records_cuadrillas (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  work_record_id  uuid    NOT NULL REFERENCES public.work_records(id) ON DELETE CASCADE,
  cuadrilla_id    uuid    NOT NULL REFERENCES public.cuadrillas(id),
  num_trabajadores integer DEFAULT 1,
  hora_entrada    timestamptz,
  hora_salida     timestamptz,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (work_record_id, cuadrilla_id)
);

CREATE TABLE public.parcel_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id   text REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  image_url   text,
  description text,
  company_id  uuid REFERENCES public.companies(id)
              DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.fotos_campo (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id   text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  url_imagen  text,
  descripcion text,
  latitud     numeric(10,7),
  longitud    numeric(10,7),
  tipo        text,
  fecha       timestamptz DEFAULT now(),
  company_id  uuid REFERENCES public.companies(id)
              DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- ⚠️ FIX: parcel_id TEXT (era UUID en migración 20260314_campos_operativos.sql)
CREATE TABLE public.registros_estado_parcela (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id    text REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  estado       text,
  cultivo      text,
  foto_url     text,
  observaciones text,
  fecha        timestamptz DEFAULT now(),
  company_id   uuid REFERENCES public.companies(id)
               DEFAULT '00000000-0000-0000-0000-000000000001'
);

CREATE TABLE public.certificaciones_parcela (
  id                    uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id             text  REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  estado                public.estado_certificacion NOT NULL DEFAULT 'en_tramite',
  campana               text  NOT NULL,
  entidad_certificadora text  NOT NULL,
  fecha_inicio          date  NOT NULL,
  fecha_fin             date,
  numero_expediente     text,
  observaciones         text,
  company_id            uuid  REFERENCES public.companies(id)
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE public.residuos_operacion (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id       text  REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  operacion_id    uuid  REFERENCES public.work_records(id) ON DELETE SET NULL,
  tipo_residuo    public.tipo_residuo NOT NULL,
  kg_instalados   numeric(10,2),
  kg_retirados    numeric(10,2),
  proveedor       text,
  lote_material   text,
  gestor_residuos text,
  fecha_instalacion date,
  fecha_retirada  date,
  company_id      uuid  REFERENCES public.companies(id)
                  DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at      timestamptz DEFAULT now()
);

-- Tabla de referencia: se calcula localmente en useParcelProduction(), nunca se escribe desde hooks
CREATE TABLE public.parcel_production (
  parcel_id               text    PRIMARY KEY REFERENCES public.parcels(parcel_id) ON DELETE CASCADE,
  crop                    text,
  area_hectares           numeric(10,4),
  estimated_production_kg numeric(10,2),
  estimated_plastic_kg    numeric(10,2),
  estimated_drip_meters   numeric(10,2),
  estimated_cost          numeric(10,2),
  company_id              uuid REFERENCES public.companies(id)
                          DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- =============================================================================
-- BLOQUE 5 — PERSONAL
-- =============================================================================

CREATE TABLE public.personal (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text    NOT NULL,
  dni         text,
  telefono    text,
  categoria   text    CHECK (categoria IN (
                'operario_campo','encargado',
                'conductor_maquinaria','conductor_camion')),
  activo      boolean DEFAULT true,
  foto_url    text,
  qr_code     text    UNIQUE,
  tacografo   boolean DEFAULT false,
  notas       text,
  created_by  text    DEFAULT 'JuanPe',
  company_id  uuid    REFERENCES public.companies(id)
              DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.personal_externo (
  id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa     text    NOT NULL,
  nif                text,
  telefono_contacto  text,
  tipo               text    CHECK (tipo IN ('destajo','jornal_servicio')),
  activo             boolean DEFAULT true,
  qr_code            text    UNIQUE,
  notas              text,
  created_by         text    DEFAULT 'JuanPe',
  company_id         uuid    REFERENCES public.companies(id)
                     DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at         timestamptz DEFAULT now()
);

CREATE TABLE public.personal_tipos_trabajo (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id      uuid NOT NULL REFERENCES public.personal(id) ON DELETE CASCADE,
  tipo_trabajo_id  uuid NOT NULL REFERENCES public.catalogo_tipos_trabajo(id) ON DELETE CASCADE,
  company_id       uuid REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now(),
  UNIQUE (personal_id, tipo_trabajo_id)
);

CREATE TABLE public.ganaderos (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text    NOT NULL,
  telefono    text,
  direccion   text,
  activo      boolean DEFAULT true,
  notas       text,
  created_by  text    DEFAULT 'JuanPe',
  company_id  uuid    REFERENCES public.companies(id)
              DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at  timestamptz DEFAULT now()
);

-- =============================================================================
-- BLOQUE 6 — MAQUINARIA
-- ⚠️ FIX: maquinaria_tractores sin campos legacy estado/codigo/tipo/ubicacion
-- =============================================================================

CREATE TABLE public.maquinaria_tractores (
  id                          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula                   text    UNIQUE NOT NULL,
  marca                       text,
  modelo                      text,
  anio                        integer,
  horas_motor                 numeric(10,2),
  ficha_tecnica               text,
  activo                      boolean DEFAULT true,
  foto_url                    text,
  notas                       text,
  fecha_proxima_itv           date,
  fecha_proxima_revision      date,
  horas_proximo_mantenimiento numeric(10,2),
  gps_info                    text,
  codigo_interno              text    UNIQUE,
  estado_operativo            text    CHECK (estado_operativo IN (
                                'disponible','en_uso','mantenimiento','baja')),
  created_by                  text    DEFAULT 'JuanPe',
  company_id                  uuid    REFERENCES public.companies(id)
                              DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at                  timestamptz DEFAULT now()
);

CREATE TABLE public.maquinaria_aperos (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           text,
  descripcion    text,
  tractor_id     uuid    REFERENCES public.maquinaria_tractores(id) ON DELETE SET NULL,
  activo         boolean DEFAULT true,
  foto_url       text,
  notas          text,
  codigo_interno text    UNIQUE,
  estado         text    CHECK (estado IN (
                   'disponible','asignado','en_reparacion','baja')),
  created_by     text    DEFAULT 'JuanPe',
  company_id     uuid    REFERENCES public.companies(id)
                 DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE public.maquinaria_uso (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tractor_id       uuid    REFERENCES public.maquinaria_tractores(id) ON DELETE SET NULL,
  apero_id         uuid    REFERENCES public.maquinaria_aperos(id) ON DELETE SET NULL,
  personal_id      uuid    REFERENCES public.personal(id) ON DELETE SET NULL,
  tractorista      text,   -- campo legacy, personal_id es la fuente real
  finca            text,
  parcel_id        text,
  tipo_trabajo     text,
  fecha            date,
  hora_inicio      text,
  hora_fin         text,
  horas_trabajadas numeric(5,2),
  gasolina_litros  numeric(8,2),
  foto_url         text,
  notas            text,
  created_by       text    DEFAULT 'JuanPe',
  company_id       uuid    REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.maquinaria_mantenimiento (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tractor_id            uuid    REFERENCES public.maquinaria_tractores(id) ON DELETE SET NULL,
  tipo                  text,
  descripcion           text,
  fecha                 date,
  horas_motor_al_momento numeric(10,2),
  coste_euros           numeric(10,2),
  proveedor             text,
  foto_url              text,
  foto_url_2            text,
  created_by            text    DEFAULT 'JuanPe',
  company_id            uuid    REFERENCES public.companies(id)
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at            timestamptz DEFAULT now()
);

-- =============================================================================
-- BLOQUE 7 — LOGÍSTICA
-- ⚠️ FIX 7.1: logistica_mantenimiento sin FK a camiones + vehiculo_tipo discriminador
-- ⚠️ FIX 7.2: logistica_viajes.conductor_id sin FK (legacy data)
-- =============================================================================

CREATE TABLE public.camiones (
  id                       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula                text    UNIQUE NOT NULL,
  activo                   boolean DEFAULT true,
  marca                    text,
  modelo                   text,
  anio                     integer,
  kilometros_actuales      numeric(10,2),
  fecha_itv                date,
  fecha_proxima_itv        date,
  fecha_proxima_revision   date,
  km_proximo_mantenimiento numeric(10,2),
  gps_info                 text,
  notas_mantenimiento      text,
  foto_url                 text,
  capacidad_kg             numeric(10,2),
  empresa_transporte       text,
  tipo                     text    CHECK (tipo IN ('propio','contratado')),
  codigo_interno           text    UNIQUE,
  estado_operativo         text    CHECK (estado_operativo IN (
                             'disponible','en_uso','mantenimiento','baja')),
  created_by               text    DEFAULT 'JuanPe',
  company_id               uuid    REFERENCES public.companies(id)
                           DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at               timestamptz DEFAULT now()
);

CREATE TABLE public.vehiculos_empresa (
  id                     uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_interno         text    UNIQUE,
  matricula              text    UNIQUE NOT NULL,
  marca                  text,
  modelo                 text,
  anio                   integer,
  tipo                   text    CHECK (tipo IN ('furgoneta','turismo','pick_up','otro')),
  conductor_habitual_id  uuid    REFERENCES public.personal(id) ON DELETE SET NULL,
  km_actuales            numeric(10,2),
  estado_operativo       text    CHECK (estado_operativo IN (
                           'disponible','en_uso','mantenimiento','baja')),
  fecha_proxima_itv      date,
  fecha_proxima_revision date,
  foto_url               text,
  notas                  text,
  gps_info               text,
  created_by             text    DEFAULT 'JuanPe',
  company_id             uuid    REFERENCES public.companies(id)
                         DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at             timestamptz DEFAULT now()
);

-- ⚠️ FIX: conductor_id SIN FK (legacy). Solo personal_id tiene FK activa.
CREATE TABLE public.logistica_viajes (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  conductor_id          uuid,   -- legacy sin FK (conductor_id de logistica_conductores deprecated)
  personal_id           uuid    REFERENCES public.personal(id) ON DELETE SET NULL,
  camion_id             uuid    REFERENCES public.camiones(id) ON DELETE SET NULL,
  finca                 text,
  destino               text,
  trabajo_realizado     text,
  ruta                  text,
  hora_salida           timestamptz,
  hora_llegada          timestamptz,
  gasto_gasolina_litros numeric(8,2),
  gasto_gasolina_euros  numeric(10,2),
  km_recorridos         numeric(10,2),
  notas                 text,
  created_by            text    DEFAULT 'JuanPe',
  company_id            uuid    REFERENCES public.companies(id)
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE public.logistica_combustible (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_tipo  text    CHECK (vehiculo_tipo IN ('camion','vehiculo')),
  vehiculo_id    uuid,   -- sin FK específico (puede ser camion o vehiculo_empresa)
  conductor_id   uuid    REFERENCES public.personal(id) ON DELETE SET NULL,
  fecha          date,
  litros         numeric(8,2),
  coste_total    numeric(10,2),
  gasolinera     text,
  foto_url       text,
  notas          text,
  created_by     text    DEFAULT 'JuanPe',
  company_id     uuid    REFERENCES public.companies(id)
                 DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at     timestamptz DEFAULT now()
);

-- ⚠️ FIX: camion_id SIN FK (puede ser camion o vehiculo_empresa).
-- vehiculo_tipo discrimina el tipo de vehículo referenciado.
CREATE TABLE public.logistica_mantenimiento (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  camion_id     uuid,   -- sin FK: puede referenciar camiones.id o vehiculos_empresa.id
  vehiculo_tipo text    CHECK (vehiculo_tipo IN ('camion','vehiculo')) DEFAULT 'camion',
  tipo          text,
  descripcion   text,
  fecha         date,
  coste_euros   numeric(10,2),
  proveedor     text,
  foto_url      text,
  foto_url_2    text,
  created_by    text    DEFAULT 'JuanPe',
  company_id    uuid    REFERENCES public.companies(id)
                DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at    timestamptz DEFAULT now()
);

-- =============================================================================
-- BLOQUE 8 — INVENTARIO
-- ⚠️ FIX CRÍTICO: inventario_ubicacion_activo.maquinaria_apero_id añadido
-- =============================================================================

CREATE TABLE public.inventario_ubicaciones (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text    NOT NULL,
  descripcion text,
  foto_url    text,
  activa      boolean DEFAULT true,
  orden       integer DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  company_id  uuid    REFERENCES public.companies(id)
              DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at  timestamptz DEFAULT now()
);

-- Ahora que inventario_ubicaciones existe, creamos las sync tables de maquinaria/logística

CREATE TABLE public.maquinaria_inventario_sync (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text    CHECK (tipo IN ('tractor','apero')) NOT NULL,
  maquinaria_id uuid,  -- sin FK específico (tractor o apero según tipo)
  ubicacion_id uuid    REFERENCES public.inventario_ubicaciones(id) ON DELETE SET NULL,
  activo       boolean DEFAULT true,
  company_id   uuid    REFERENCES public.companies(id)
               DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.logistica_inventario_sync (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text    CHECK (tipo IN ('camion','vehiculo')) NOT NULL,
  vehiculo_id  uuid,   -- sin FK específico (camion o vehiculo según tipo)
  ubicacion_id uuid    REFERENCES public.inventario_ubicaciones(id) ON DELETE SET NULL,
  activo       boolean DEFAULT true,
  company_id   uuid    REFERENCES public.companies(id)
               DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at   timestamptz DEFAULT now()
);

-- Tabla legacy aperos (solo lectura via useAperosTablaInventario)
CREATE TABLE public.aperos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       text,
  denominacion text NOT NULL,
  marca        text,
  estado       text,
  ubicacion    text,
  company_id   uuid REFERENCES public.companies(id)
               DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE public.inventario_productos_catalogo (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text    NOT NULL,
  categoria_id    uuid    REFERENCES public.inventario_categorias(id) ON DELETE SET NULL,
  precio_unitario numeric(10,4),
  unidad_defecto  text,
  activo          boolean DEFAULT true,
  company_id      uuid    REFERENCES public.companies(id)
                  DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at      timestamptz DEFAULT now(),
  UNIQUE (nombre, categoria_id)  -- permite upsert por nombre+categoría
);

CREATE TABLE public.inventario_registros (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  ubicacion_id    uuid    REFERENCES public.inventario_ubicaciones(id) ON DELETE SET NULL,
  categoria_id    uuid    REFERENCES public.inventario_categorias(id) ON DELETE SET NULL,
  producto_id     uuid    REFERENCES public.inventario_productos_catalogo(id) ON DELETE SET NULL,
  cantidad        numeric(12,4),
  unidad          text,
  descripcion     text,
  foto_url        text,
  foto_url_2      text,
  precio_unitario numeric(10,4),
  notas           text,
  -- ⚠️ NO tiene campo 'responsable' — solo created_by (auditado en useInventario.ts)
  created_by      text    DEFAULT 'JuanPe',
  company_id      uuid    REFERENCES public.companies(id)
                  DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.inventario_movimientos (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id          uuid    REFERENCES public.inventario_categorias(id) ON DELETE SET NULL,
  producto_id           uuid    REFERENCES public.inventario_productos_catalogo(id) ON DELETE SET NULL,
  cantidad              numeric(12,4),
  unidad                text,
  ubicacion_origen_id   uuid    REFERENCES public.inventario_ubicaciones(id) ON DELETE SET NULL,
  ubicacion_destino_id  uuid    REFERENCES public.inventario_ubicaciones(id) ON DELETE SET NULL,
  fecha                 timestamptz DEFAULT now(),
  notas                 text,
  responsable           text,
  created_by            text    DEFAULT 'JuanPe',
  company_id            uuid    REFERENCES public.companies(id)
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE public.proveedores (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_interno  text    UNIQUE,
  nombre          text    NOT NULL,
  nif             text,
  telefono        text,
  email           text,
  direccion       text,
  tipo            text    CHECK (tipo IN (
                    'proveedor_materiales','ganadero',
                    'gestor_residuos_plasticos','otro')),
  persona_contacto text,
  activo          boolean DEFAULT true,
  notas           text,
  foto_url        text,
  created_by      text    DEFAULT 'JuanPe',
  company_id      uuid    REFERENCES public.companies(id)
                  DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.proveedores_precios (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id    uuid    NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
  producto        text    NOT NULL,
  unidad          text,
  precio_unitario numeric(10,4),
  fecha_vigencia  date,
  activo          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.inventario_entradas (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id    uuid    REFERENCES public.proveedores(id) ON DELETE SET NULL,
  ubicacion_id    uuid    REFERENCES public.inventario_ubicaciones(id) ON DELETE SET NULL,
  categoria_id    uuid    REFERENCES public.inventario_categorias(id) ON DELETE SET NULL,
  producto_id     uuid    REFERENCES public.inventario_productos_catalogo(id) ON DELETE SET NULL,
  cantidad        numeric(12,4) NOT NULL,
  unidad          text    NOT NULL,
  precio_unitario numeric(10,4),
  importe_total   numeric(12,2),
  receptor        text,
  fecha           date,
  foto_albaran    text,
  notas           text,
  created_by      text    DEFAULT 'JuanPe',
  company_id      uuid    REFERENCES public.companies(id)
                  DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.inventario_informes (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text,
  fecha_inicio date,
  fecha_fin    date,
  ubicacion_id uuid    REFERENCES public.inventario_ubicaciones(id) ON DELETE SET NULL,
  categoria_id uuid    REFERENCES public.inventario_categorias(id) ON DELETE SET NULL,
  contenido    jsonb,
  generado_at  timestamptz DEFAULT now(),
  company_id   uuid    REFERENCES public.companies(id)
               DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- ⚠️ FIX CRÍTICO: maquinaria_apero_id añadido (antes era campo fantasma)
-- El hook useMaquinariaAperosAsignadosUbicacion lo usaba pero la columna no existía.
CREATE TABLE public.inventario_ubicacion_activo (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  ubicacion_id          uuid    NOT NULL REFERENCES public.inventario_ubicaciones(id) ON DELETE CASCADE,
  maquinaria_tractor_id uuid    REFERENCES public.maquinaria_tractores(id) ON DELETE SET NULL,
  maquinaria_apero_id   uuid    REFERENCES public.maquinaria_aperos(id) ON DELETE SET NULL,
  apero_id              uuid    REFERENCES public.aperos(id) ON DELETE SET NULL, -- legacy aperos tabla
  notas                 text,
  created_by            text    DEFAULT 'JuanPe',
  company_id            uuid    REFERENCES public.companies(id)
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at            timestamptz DEFAULT now()
);

-- =============================================================================
-- BLOQUE 9 — PARTE DIARIO
-- =============================================================================

CREATE TABLE public.partes_diarios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha           date UNIQUE NOT NULL,
  responsable     text DEFAULT 'JuanPe',
  notas_generales text,
  company_id      uuid REFERENCES public.companies(id)
                  DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.parte_estado_finca (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id         uuid NOT NULL REFERENCES public.partes_diarios(id) ON DELETE CASCADE,
  finca            text,
  parcel_id        text,
  estado           text,
  num_operarios    integer,
  nombres_operarios text,
  foto_url         text,
  foto_url_2       text,
  notas            text,
  company_id       uuid REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.parte_trabajo (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id         uuid    NOT NULL REFERENCES public.partes_diarios(id) ON DELETE CASCADE,
  tipo_trabajo     text,
  finca            text,
  ambito           text,
  parcelas         text[], -- array de parcel_id TEXT
  num_operarios    integer,
  nombres_operarios text,
  hora_inicio      text,
  hora_fin         text,
  foto_url         text,
  foto_url_2       text,
  notas            text,
  company_id       uuid    REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.parte_personal (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id   uuid NOT NULL REFERENCES public.partes_diarios(id) ON DELETE CASCADE,
  texto      text,
  con_quien  text,
  donde      text,
  foto_url   text,
  fecha_hora timestamptz DEFAULT now(),
  company_id uuid REFERENCES public.companies(id)
             DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.parte_residuos_vegetales (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parte_id              uuid NOT NULL REFERENCES public.partes_diarios(id) ON DELETE CASCADE,
  nombre_conductor      text,
  personal_id           uuid REFERENCES public.personal(id) ON DELETE SET NULL,
  hora_salida_nave      text,
  nombre_ganadero       text,
  ganadero_id           uuid REFERENCES public.ganaderos(id) ON DELETE SET NULL,
  hora_llegada_ganadero text,
  hora_regreso_nave     text,
  foto_url              text,
  notas_descarga        text,
  company_id            uuid REFERENCES public.companies(id)
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE public.cierres_jornada (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha               date    UNIQUE NOT NULL,
  parte_diario_id     uuid    REFERENCES public.partes_diarios(id) ON DELETE SET NULL,
  trabajos_ejecutados integer,
  trabajos_pendientes integer,
  trabajos_arrastrados integer,
  notas               text,
  cerrado_at          timestamptz DEFAULT now(),
  cerrado_by          text    DEFAULT 'JuanPe'
);

-- =============================================================================
-- BLOQUE 10 — TRABAJOS
-- ⚠️ FIX CRÍTICO: recursos_personal y materiales_previstos añadidos
-- =============================================================================

CREATE TABLE public.trabajos_registro (
  id                   uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_bloque          text    NOT NULL CHECK (tipo_bloque IN (
                         'logistica','maquinaria_agricola',
                         'mano_obra_interna','mano_obra_externa')),
  fecha                date,
  hora_inicio          text,
  hora_fin             text,
  finca                text,
  parcel_id            text,
  tipo_trabajo         text    NOT NULL,
  num_operarios        integer,
  nombres_operarios    text,
  -- ⚠️ FIX CRÍTICO: estos 2 campos existían en la interfaz TS pero no en BD
  recursos_personal    text[], -- array de nombres/IDs de operarios
  materiales_previstos jsonb,  -- materiales planificados {producto, cantidad, unidad}
  foto_url             text,
  notas                text,
  created_by           text    DEFAULT 'JuanPe',
  estado_planificacion text    DEFAULT 'borrador'
                       CHECK (estado_planificacion IN (
                         'borrador','confirmado','ejecutado','pendiente','cancelado')),
  prioridad            text    DEFAULT 'media'
                       CHECK (prioridad IN ('alta','media','baja')),
  fecha_planificada    date,
  fecha_original       date,
  tractor_id           uuid    REFERENCES public.maquinaria_tractores(id) ON DELETE SET NULL,
  apero_id             uuid    REFERENCES public.maquinaria_aperos(id) ON DELETE SET NULL,
  company_id           uuid    REFERENCES public.companies(id)
                       DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at           timestamptz DEFAULT now()
);

CREATE TABLE public.trabajos_incidencias (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  urgente          boolean DEFAULT false,
  titulo           text    NOT NULL,
  descripcion      text,
  finca            text,
  parcel_id        text,
  estado           text    DEFAULT 'abierta'
                   CHECK (estado IN ('abierta','en_proceso','resuelta')),
  foto_url         text,
  fecha            date    DEFAULT CURRENT_DATE,
  fecha_resolucion date,
  notas_resolucion text,
  created_by       text    DEFAULT 'JuanPe',
  company_id       uuid    REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.planificacion_campana (
  id                        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  finca                     text    NOT NULL,
  parcel_id                 text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  cultivo                   text    NOT NULL,
  fecha_prevista_plantacion date,
  fecha_estimada_cosecha    date,
  recursos_estimados        text,
  observaciones             text,
  estado                    text    NOT NULL DEFAULT 'planificado'
                            CHECK (estado IN ('planificado','en_curso','completado','cancelado')),
  created_by                text    DEFAULT 'JuanPe',
  company_id                uuid    REFERENCES public.companies(id)
                            DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at                timestamptz DEFAULT now()
);

-- =============================================================================
-- BLOQUE 11 — PRESENCIA EN TIEMPO REAL / GPS
-- =============================================================================

CREATE TABLE public.presencia_tiempo_real (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadrilla_id    uuid    NOT NULL REFERENCES public.cuadrillas(id) ON DELETE CASCADE,
  parcel_id       text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  work_record_id  uuid    REFERENCES public.work_records(id) ON DELETE SET NULL,
  hora_entrada    timestamptz NOT NULL DEFAULT now(),
  hora_salida     timestamptz,
  activo          boolean DEFAULT true,
  company_id      uuid    REFERENCES public.companies(id)
                  DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE public.vehicle_positions (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type text,   -- 'tractor' | 'camion' | 'vehiculo'
  vehicle_id   uuid,   -- ID del vehículo (sin FK específica — polimórfico)
  latitude     numeric(10,7),
  longitude    numeric(10,7),
  speed        numeric(6,2),
  heading      numeric(6,2),
  "timestamp"  timestamptz,
  recorded_at  timestamptz DEFAULT now(),
  company_id   uuid    REFERENCES public.companies(id)
               DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- =============================================================================
-- BLOQUE 12 — TRAZABILIDAD
-- =============================================================================

CREATE TABLE public.camaras_almacen (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              text    NOT NULL,
  ubicacion           text,
  capacidad_palots    integer,
  temperatura_objetivo numeric(5,2),
  activa              boolean DEFAULT true,
  company_id          uuid    REFERENCES public.companies(id)
                      DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE public.palots (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_palot  text    UNIQUE NOT NULL,
  parcel_id     text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  cultivo       text,
  variedad      text,
  peso_kg       numeric(10,2),
  estado        text,
  camara_id     uuid    REFERENCES public.camaras_almacen(id) ON DELETE SET NULL,
  fecha_entrada timestamptz,
  fecha_salida  timestamptz,
  notas         text,
  company_id    uuid    REFERENCES public.companies(id)
                DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE public.movimientos_palot (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  palot_id         uuid NOT NULL REFERENCES public.palots(id) ON DELETE CASCADE,
  tipo_movimiento  text,
  origen           text,
  destino          text,
  fecha            timestamptz DEFAULT now(),
  responsable      text,
  notas            text,
  company_id       uuid REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.trazabilidad_registros (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          text,
  referencia_id uuid,
  datos         jsonb,
  created_by    text DEFAULT 'JuanPe',
  company_id    uuid REFERENCES public.companies(id)
                DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE public.tickets_pesaje (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id      uuid    REFERENCES public.harvests(id) ON DELETE SET NULL,
  camion_id       uuid    REFERENCES public.camiones(id) ON DELETE SET NULL,
  matricula_manual text,
  destino         text    NOT NULL,
  peso_bruto_kg   numeric(10,2) NOT NULL,
  peso_tara_kg    numeric(10,2) NOT NULL DEFAULT 0,
  peso_neto_kg    numeric(10,2) GENERATED ALWAYS AS (peso_bruto_kg - peso_tara_kg) STORED,
  conductor       text,
  hora_salida     timestamptz DEFAULT now(),
  numero_albaran  text    UNIQUE,
  observaciones   text,
  company_id      uuid    REFERENCES public.companies(id)
                  DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at      timestamptz DEFAULT now()
);

-- =============================================================================
-- BLOQUE 13 — ANÁLISIS AGRONÓMICO / RIEGO
-- =============================================================================

CREATE TABLE public.analisis_suelo (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id         text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  ph                numeric(5,2),
  conductividad_ec  numeric(8,4),
  salinidad_ppm     numeric(10,2),
  temperatura_suelo numeric(5,2),
  materia_organica  numeric(6,3),
  sodio_ppm         numeric(10,2),
  nitrogeno_ppm     numeric(10,2),
  fosforo_ppm       numeric(10,2),
  potasio_ppm       numeric(10,2),
  textura           text,
  profundidad_cm    numeric(6,2),
  num_muestras      integer,
  operario          text,
  herramienta       text,
  informe_url       text,
  observaciones     text,
  fecha             date,
  company_id        uuid    REFERENCES public.companies(id)
                    DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE public.analisis_agua (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  finca            text,
  fuente           text,
  ph               numeric(5,2),
  conductividad_ec numeric(8,4),
  salinidad_ppm    numeric(10,2),
  temperatura      numeric(5,2),
  sodio_ppm        numeric(10,2),
  cloruros_ppm     numeric(10,2),
  nitratos_ppm     numeric(10,2),
  dureza_total     numeric(10,2),
  operario         text,
  herramienta      text,
  observaciones    text,
  fecha            date,
  company_id       uuid    REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.lecturas_sensor_planta (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id         text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  indice_salud      numeric(6,3),
  nivel_estres      numeric(6,3),
  ndvi              numeric(6,4),
  clorofila         numeric(8,2),
  cultivo           text,
  num_plantas_medidas integer,
  operario          text,
  herramienta       text,
  observaciones     text,
  fecha             date,
  company_id        uuid    REFERENCES public.companies(id)
                    DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE public.sistema_riego_zonas (
  id                 uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id          text    REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  nombre_zona        text,
  tipo_riego         public.tipo_riego,
  superficie_ha      numeric(10,4),
  goteros_por_planta integer,
  caudal_lh          numeric(8,2),
  activa             boolean DEFAULT true,
  company_id         uuid    REFERENCES public.companies(id)
                     DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at         timestamptz DEFAULT now()
);

CREATE TABLE public.registros_riego (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  zona_id               uuid    REFERENCES public.sistema_riego_zonas(id) ON DELETE SET NULL,
  fecha                 date,
  duracion_minutos      integer,
  volumen_m3            numeric(10,3),
  presion_bar           numeric(6,2),
  conductividad_entrada numeric(8,4),
  ph_entrada            numeric(5,2),
  notas                 text,
  company_id            uuid    REFERENCES public.companies(id)
                        DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at            timestamptz DEFAULT now()
);

-- =============================================================================
-- BLOQUE 14 — IA / LIA / MISC
-- =============================================================================

CREATE TABLE public.ai_proposals (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  status           public.ai_proposal_status DEFAULT 'pending',
  category         public.ai_proposal_category,
  input_json       jsonb,
  output_json      jsonb,
  related_parcel_id text   REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  company_id       uuid    REFERENCES public.companies(id)
                   DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE public.ai_proposal_validations (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id  uuid    NOT NULL REFERENCES public.ai_proposals(id) ON DELETE CASCADE,
  decision     public.ai_validation_decision NOT NULL,
  note         text,
  decided_by   text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.lia_contexto_sesion (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id  text,
  contexto   jsonb,
  company_id uuid  REFERENCES public.companies(id)
             DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.lia_memoria (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo       text,
  clave      text,
  valor      jsonb,
  company_id uuid  REFERENCES public.companies(id)
             DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.lia_patrones (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  patron     text,
  frecuencia integer DEFAULT 0,
  ultimo_uso timestamptz,
  company_id uuid  REFERENCES public.companies(id)
             DEFAULT '00000000-0000-0000-0000-000000000001'
);

CREATE TABLE public.vuelos_dron (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id     text  REFERENCES public.parcels(parcel_id) ON DELETE SET NULL,
  fecha_vuelo   date,
  url_imagen    text,
  observaciones text,
  company_id    uuid  REFERENCES public.companies(id)
                DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE public.erp_exportaciones (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        text,
  fecha       date,
  contenido   jsonb,
  generado_at timestamptz DEFAULT now(),
  created_by  text  DEFAULT 'JuanPe',
  company_id  uuid  REFERENCES public.companies(id)
              DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- =============================================================================
-- BLOQUE 15 — ÍNDICES (rendimiento y company_id para RLS)
-- =============================================================================

-- company_id indexes (críticos para RLS performance)
CREATE INDEX idx_parcels_company ON public.parcels (company_id);
CREATE INDEX idx_personal_company ON public.personal (company_id);
CREATE INDEX idx_personal_categoria ON public.personal (categoria, activo);
CREATE INDEX idx_personal_externo_company ON public.personal_externo (company_id);
CREATE INDEX idx_ganaderos_company ON public.ganaderos (company_id);
CREATE INDEX idx_maquinaria_tractores_company ON public.maquinaria_tractores (company_id);
CREATE INDEX idx_maquinaria_aperos_company ON public.maquinaria_aperos (company_id);
CREATE INDEX idx_maquinaria_uso_company ON public.maquinaria_uso (company_id);
CREATE INDEX idx_maquinaria_mantenimiento_company ON public.maquinaria_mantenimiento (company_id);
CREATE INDEX idx_camiones_company ON public.camiones (company_id);
CREATE INDEX idx_vehiculos_empresa_company ON public.vehiculos_empresa (company_id);
CREATE INDEX idx_logistica_viajes_company ON public.logistica_viajes (company_id);
CREATE INDEX idx_logistica_combustible_company ON public.logistica_combustible (company_id);
CREATE INDEX idx_logistica_mantenimiento_company ON public.logistica_mantenimiento (company_id);
CREATE INDEX idx_logistica_inventario_sync_company ON public.logistica_inventario_sync (company_id);
CREATE INDEX idx_inventario_ubicaciones_company ON public.inventario_ubicaciones (company_id);
CREATE INDEX idx_inventario_registros_company ON public.inventario_registros (company_id);
CREATE INDEX idx_inventario_registros_ubicacion ON public.inventario_registros (ubicacion_id, categoria_id);
CREATE INDEX idx_inventario_movimientos_company ON public.inventario_movimientos (company_id);
CREATE INDEX idx_inventario_entradas_company ON public.inventario_entradas (company_id);
CREATE INDEX idx_inventario_ubicacion_activo_ubicacion ON public.inventario_ubicacion_activo (ubicacion_id);
CREATE INDEX idx_inventario_ubicacion_activo_tractor ON public.inventario_ubicacion_activo (maquinaria_tractor_id);
CREATE INDEX idx_inventario_ubicacion_activo_apero ON public.inventario_ubicacion_activo (maquinaria_apero_id);
CREATE INDEX idx_partes_diarios_fecha ON public.partes_diarios (fecha DESC);
CREATE INDEX idx_trabajos_registro_company ON public.trabajos_registro (company_id);
CREATE INDEX idx_trabajos_registro_fecha ON public.trabajos_registro (fecha DESC);
CREATE INDEX idx_trabajos_registro_estado ON public.trabajos_registro (estado_planificacion, prioridad);
CREATE INDEX idx_trabajos_incidencias_estado ON public.trabajos_incidencias (estado, urgente);
CREATE INDEX idx_presencia_tiempo_real_cuadrilla ON public.presencia_tiempo_real (cuadrilla_id);
CREATE INDEX idx_presencia_tiempo_real_activo ON public.presencia_tiempo_real (activo);
CREATE INDEX idx_presencia_tiempo_real_entrada ON public.presencia_tiempo_real (hora_entrada DESC);
CREATE INDEX idx_work_records_parcel_date ON public.work_records (parcel_id, date DESC);
CREATE INDEX idx_work_records_cuadrilla ON public.work_records (cuadrilla_id);
CREATE INDEX idx_harvests_parcel_date ON public.harvests (parcel_id, date DESC);
CREATE INDEX idx_plantings_parcel_date ON public.plantings (parcel_id, date DESC);
CREATE INDEX idx_analisis_suelo_parcel ON public.analisis_suelo (parcel_id);
CREATE INDEX idx_lecturas_sensor_parcel ON public.lecturas_sensor_planta (parcel_id);
CREATE INDEX idx_palots_camara ON public.palots (camara_id);
CREATE INDEX idx_movimientos_palot_palot ON public.movimientos_palot (palot_id);
CREATE INDEX idx_tickets_pesaje_harvest ON public.tickets_pesaje (harvest_id);
CREATE INDEX idx_vehicle_positions_vehicle ON public.vehicle_positions (vehicle_id, "timestamp" DESC);
CREATE INDEX idx_maquinaria_inventario_sync_ubicacion ON public.maquinaria_inventario_sync (ubicacion_id);

-- =============================================================================
-- BLOQUE 16 — VISTAS SQL (faltaban en todas las migrations anteriores)
-- =============================================================================

-- Vista 1: Todos los activos (tractores + aperos) asignados por ubicación de inventario
CREATE OR REPLACE VIEW public.v_inventario_activos_en_ubicacion AS
SELECT
  iua.id,
  iua.ubicacion_id,
  iu.nombre       AS ubicacion_nombre,
  mt.id           AS tractor_id,
  mt.matricula    AS tractor_matricula,
  mt.marca        AS tractor_marca,
  mt.modelo       AS tractor_modelo,
  ma.id           AS apero_id,
  ma.tipo         AS apero_tipo,
  ma.descripcion  AS apero_descripcion,
  iua.notas,
  iua.created_at,
  iua.company_id
FROM public.inventario_ubicacion_activo iua
LEFT JOIN public.inventario_ubicaciones iu ON iu.id = iua.ubicacion_id
LEFT JOIN public.maquinaria_tractores    mt ON mt.id = iua.maquinaria_tractor_id
LEFT JOIN public.maquinaria_aperos       ma ON ma.id = iua.maquinaria_apero_id;

-- Vista 2: Solo tractores asignados a ubicaciones de inventario
CREATE OR REPLACE VIEW public.v_tractores_en_inventario AS
SELECT
  iua.id,
  iua.ubicacion_id,
  iu.nombre           AS ubicacion_nombre,
  mt.id               AS tractor_id,
  mt.matricula,
  mt.marca,
  mt.modelo,
  mt.anio,
  mt.estado_operativo,
  mt.codigo_interno,
  mt.activo,
  iua.notas,
  iua.created_at,
  iua.company_id
FROM public.inventario_ubicacion_activo iua
JOIN public.inventario_ubicaciones iu ON iu.id = iua.ubicacion_id
JOIN public.maquinaria_tractores   mt ON mt.id = iua.maquinaria_tractor_id
WHERE iua.maquinaria_tractor_id IS NOT NULL;

-- Vista 3: Solo aperos de maquinaria asignados a ubicaciones de inventario
-- Usa maquinaria_apero_id — el campo que FALTABA en BD y causaba retorno vacío
CREATE OR REPLACE VIEW public.v_maquinaria_aperos_en_inventario AS
SELECT
  iua.id,
  iua.ubicacion_id,
  iu.nombre       AS ubicacion_nombre,
  ma.id           AS apero_id,
  ma.tipo,
  ma.descripcion,
  ma.tractor_id,
  ma.estado,
  ma.codigo_interno,
  ma.activo,
  iua.notas,
  iua.created_at,
  iua.company_id
FROM public.inventario_ubicacion_activo iua
JOIN public.inventario_ubicaciones iu ON iu.id = iua.ubicacion_id
JOIN public.maquinaria_aperos      ma ON ma.id = iua.maquinaria_apero_id
WHERE iua.maquinaria_apero_id IS NOT NULL;

-- =============================================================================
-- BLOQUE 17 — RLS (Row Level Security)
-- Política piloto: authenticated = acceso total, anon = bloqueado (excepciones QR)
-- =============================================================================

-- Helper: habilitar RLS + política piloto authenticated en una tabla
DO $$
DECLARE tbl text;
DECLARE op_tables text[] := ARRAY[
  -- Personal
  'personal','personal_externo','personal_tipos_trabajo','ganaderos',
  -- Maquinaria
  'maquinaria_tractores','maquinaria_aperos','maquinaria_uso','maquinaria_mantenimiento',
  'maquinaria_inventario_sync',
  -- Logística
  'camiones','vehiculos_empresa','logistica_viajes','logistica_combustible',
  'logistica_mantenimiento','logistica_inventario_sync',
  -- Inventario
  'inventario_ubicaciones','inventario_productos_catalogo','inventario_registros',
  'inventario_movimientos','inventario_entradas','inventario_informes',
  'inventario_ubicacion_activo','aperos',
  -- Proveedores
  'proveedores','proveedores_precios',
  -- Campo
  'parcels','plantings','harvests','parcel_photos','fotos_campo',
  'registros_estado_parcela','certificaciones_parcela','residuos_operacion',
  'parcel_production',
  -- Análisis
  'analisis_suelo','analisis_agua','lecturas_sensor_planta',
  'sistema_riego_zonas','registros_riego',
  -- Parte diario
  'partes_diarios','parte_estado_finca','parte_trabajo','parte_personal',
  'parte_residuos_vegetales','cierres_jornada',
  -- Trabajos
  'trabajos_registro','trabajos_incidencias','planificacion_campana',
  -- GPS
  'vehicle_positions',
  -- Trazabilidad
  'camaras_almacen','palots','movimientos_palot','trazabilidad_registros','tickets_pesaje',
  -- IA/LIA/Misc
  'ai_proposals','ai_proposal_validations',
  'lia_contexto_sesion','lia_memoria','lia_patrones',
  'vuelos_dron','erp_exportaciones'
];
BEGIN
  FOREACH tbl IN ARRAY op_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_pilot_open ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_pilot_open ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Catálogos globales: lectura para todos los autenticados
DO $$
DECLARE tbl text;
DECLARE cat_tables text[] := ARRAY[
  'cultivos_catalogo','catalogo_tipos_trabajo','catalogo_tipos_mantenimiento',
  'inventario_categorias','usuario_roles'
];
BEGIN
  FOREACH tbl IN ARRAY cat_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I_catalog_open ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_catalog_open ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- companies: lectura para authenticated
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS companies_read ON public.companies;
CREATE POLICY companies_read ON public.companies
  FOR SELECT TO authenticated USING (true);

-- user_profiles: bootstrap (propio) + company_id isolation
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_own_select ON public.user_profiles;
CREATE POLICY profiles_own_select ON public.user_profiles
  FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS profiles_select ON public.user_profiles;
CREATE POLICY profiles_select ON public.user_profiles
  FOR SELECT USING (company_id = public.current_user_company_id());
DROP POLICY IF EXISTS profiles_admin_all ON public.user_profiles;
CREATE POLICY profiles_admin_all ON public.user_profiles
  FOR ALL
  USING (public.current_user_is_admin() AND company_id = public.current_user_company_id())
  WITH CHECK (public.current_user_is_admin() AND company_id = public.current_user_company_id());

-- Excepciones anon (acceso QR sin login)
ALTER TABLE public.presencia_tiempo_real ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS presencia_anon ON public.presencia_tiempo_real;
CREATE POLICY presencia_anon ON public.presencia_tiempo_real
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS work_records_anon ON public.work_records;
CREATE POLICY work_records_anon ON public.work_records
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS cuadrillas_anon ON public.cuadrillas;
CREATE POLICY cuadrillas_anon ON public.cuadrillas
  FOR SELECT TO anon USING (true);

-- =============================================================================
-- BLOQUE 18 — GRANTS
-- =============================================================================

GRANT ALL   ON ALL TABLES    IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES   IN SCHEMA public TO anon;
GRANT ALL   ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- =============================================================================
-- BLOQUE 19 — SEED: catálogos y datos de arranque
-- =============================================================================

-- Catálogo de tipos de trabajo (25 tipos de src/constants/tiposTrabajo.ts)
INSERT INTO public.catalogo_tipos_trabajo (nombre, categoria, activo) VALUES
  ('Laboreo',                    'general',   true),
  ('Siembra',                    'campo',     true),
  ('Transplante',                'campo',     true),
  ('Plantación',                 'campo',     true),
  ('Acolchado',                  'campo',     true),
  ('Encamado plástico',          'campo',     true),
  ('Colocación plástico',        'campo',     true),
  ('Retirada plástico',          'campo',     true),
  ('Riego',                      'campo',     true),
  ('Abonado',                    'campo',     true),
  ('Tratamiento fitosanitario',  'campo',     true),
  ('Preparación terreno',        'campo',     true),
  ('Preparación suelo',          'campo',     true),
  ('Labores tractor',            'maquinaria',true),
  ('Poda',                       'campo',     true),
  ('Deshierbe',                  'campo',     true),
  ('Desbrozado',                 'campo',     true),
  ('Cosecha',                    'campo',     true),
  ('Recolección',                'campo',     true),
  ('Transporte',                 'logistica', true),
  ('Limpieza nave',              'general',   true),
  ('Mantenimiento',              'general',   true),
  ('Mantenimiento maquinaria',   'maquinaria',true),
  ('Inspección',                 'general',   true),
  ('Otro',                       'general',   true)
ON CONFLICT DO NOTHING;

-- Catálogo de tipos de mantenimiento
INSERT INTO public.catalogo_tipos_mantenimiento (nombre, modulo, activo) VALUES
  ('Cambio de aceite',              'maquinaria', true),
  ('Revisión filtros',              'maquinaria', true),
  ('Revisión general',              'maquinaria', true),
  ('ITV / Inspección técnica',      'maquinaria', true),
  ('Reparación hidráulica',         'maquinaria', true),
  ('Reparación eléctrica',          'maquinaria', true),
  ('Sustitución neumáticos',        'maquinaria', true),
  ('Otros maquinaria',              'maquinaria', true),
  ('Cambio de aceite',              'logistica',  true),
  ('Revisión frenos',               'logistica',  true),
  ('ITV / Inspección técnica',      'logistica',  true),
  ('Revisión general',              'logistica',  true),
  ('Reparación carrocería',         'logistica',  true),
  ('Sustitución neumáticos',        'logistica',  true),
  ('Reparación sistema eléctrico',  'logistica',  true),
  ('Otros logística',               'logistica',  true)
ON CONFLICT DO NOTHING;

-- Categorías de inventario
INSERT INTO public.inventario_categorias (nombre, slug, icono, orden) VALUES
  ('Fitosanitarios y abonos', 'fitosanitarios_abonos', 'Leaf',        1),
  ('Semillas',                'semillas',               'Sprout',      2),
  ('Material riego',          'material_riego',         'Droplets',    3),
  ('Herramientas',            'herramientas',           'Wrench',      4),
  ('Maquinaria pequeña',      'maquinaria_pequena',     'Settings',    5),
  ('Consumibles',             'consumibles',            'Package',     6),
  ('Combustible',             'combustible',            'Fuel',        7),
  ('Manta térmica',           'manta_termica',          'Thermometer', 8),
  ('Plástico',                'plastico',               'Package',     9)
ON CONFLICT (slug) DO NOTHING;

-- Roles de usuario
INSERT INTO public.usuario_roles (nombre, descripcion) VALUES
  ('admin',     'Acceso total al sistema — puede gestionar usuarios y configuración'),
  ('encargado', 'Acceso a todos los módulos operativos — sin gestión de usuarios'),
  ('operario',  'Acceso limitado a registro de trabajos y parte diario')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================================================
-- VERIFICACIÓN — Ejecutar en SQL Editor tras aplicar la migración
-- =============================================================================

-- 1. Resumen de todas las tablas: columnas y RLS activo
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS num_cols,
  rowsecurity
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY table_name;

-- 2. FIX CRÍTICO: maquinaria_apero_id debe aparecer en inventario_ubicacion_activo
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'inventario_ubicacion_activo'
ORDER BY ordinal_position;
-- Resultado esperado: incluye maquinaria_apero_id (uuid)

-- 3. FIX CRÍTICO: recursos_personal + materiales_previstos en trabajos_registro
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trabajos_registro'
  AND column_name IN ('recursos_personal', 'materiales_previstos');
-- Resultado esperado: 2 filas

-- 4. FIX MEDIO: campos legacy eliminados de maquinaria_tractores
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'maquinaria_tractores'
  AND column_name IN ('estado', 'codigo', 'tipo', 'ubicacion');
-- Resultado esperado: 0 filas

-- 5. FIX ALTO: FK de logistica_mantenimiento a camiones debe haber desaparecido
SELECT conname
FROM pg_constraint
WHERE conrelid = 'public.logistica_mantenimiento'::regclass
  AND conname = 'logistica_mantenimiento_camion_id_fkey';
-- Resultado esperado: 0 filas

-- 6. Verificar las 3 vistas creadas
SELECT viewname FROM pg_views WHERE schemaname = 'public' ORDER BY viewname;
-- Resultado esperado: v_inventario_activos_en_ubicacion, v_tractores_en_inventario, v_maquinaria_aperos_en_inventario

-- 7. Contar total de tablas del schema
SELECT COUNT(*) AS total_tablas FROM pg_tables WHERE schemaname = 'public';
-- Resultado esperado: 71

-- =============================================================================
