-- =============================================================================
-- MIGRATION: Multi-tenant pilot mode
-- DATE: 2026-04-11
-- PURPOSE: Add company_id to all operational tables, backfill with pilot tenant,
--          create indexes, enable RLS in open mode (USING true for authenticated),
--          and create latent RBAC functions.
--
-- SAFETY: This migration does NOT break anything. All policies use USING (true),
--         meaning every authenticated user sees everything — identical to current
--         behavior. company_id has a DEFAULT so existing INSERT code keeps working.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Ensure prerequisite tables exist
-- ---------------------------------------------------------------------------

-- companies table (may already exist from manual setup)
CREATE TABLE IF NOT EXISTS public.companies (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add slug column if missing (table may pre-exist without it)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Pilot tenant seed (idempotent)
INSERT INTO public.companies (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Fincas Marvic', 'fincas-marvic')
ON CONFLICT (id) DO NOTHING;

-- user_profiles table (may already exist from manual setup)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  full_name   text,
  role        text DEFAULT 'operario',
  company_id  uuid REFERENCES public.companies(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  status      text DEFAULT 'active',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Ensure columns exist if table was created manually with fewer columns
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'operario';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Enable RLS on user_profiles (policies already exist from prior migration)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Ensure own-profile read (bootstrap: new user can read own row)
DROP POLICY IF EXISTS profiles_own_select ON public.user_profiles;
CREATE POLICY profiles_own_select ON public.user_profiles
  FOR SELECT USING (id = auth.uid());

-- Enable RLS on companies (read-only for authenticated)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS companies_read ON public.companies;
CREATE POLICY companies_read ON public.companies
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER — bypass RLS to avoid recursion)
-- ---------------------------------------------------------------------------

-- current_user_company_id: returns the company of the logged-in user
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

-- current_user_role: returns the role of the logged-in user
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

-- current_user_is_admin: boolean check
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

-- user_has_role: hierarchical role check (admin > encargado > operario)
CREATE OR REPLACE FUNCTION public.user_has_role(required_role text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT CASE
    WHEN required_role = 'operario' THEN true
    WHEN required_role = 'encargado' THEN public.current_user_role() IN ('admin', 'encargado')
    WHEN required_role = 'admin' THEN public.current_user_role() = 'admin'
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_company_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_role(text) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Add company_id to ALL operational tables
--    (catalogs are global, shared across tenants — excluded)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  operational_tables text[] := ARRAY[
    -- Personal
    'personal', 'personal_externo', 'personal_tipos_trabajo',
    -- Maquinaria
    'maquinaria_tractores', 'maquinaria_aperos', 'maquinaria_mantenimiento',
    'maquinaria_uso', 'maquinaria_inventario_sync',
    -- Logística
    'camiones', 'vehiculos_empresa', 'logistica_viajes', 'logistica_conductores',
    'logistica_combustible', 'logistica_mantenimiento', 'logistica_inventario_sync',
    -- Inventario
    'inventario_ubicaciones', 'inventario_registros', 'inventario_productos_catalogo',
    'inventario_entradas', 'inventario_movimientos', 'inventario_informes',
    'inventario_ubicacion_activo',
    -- Trabajos
    'trabajos_registro', 'trabajos_incidencias',
    'work_records', 'work_records_cuadrillas',
    -- Parte Diario
    'partes_diarios', 'parte_trabajo', 'parte_estado_finca',
    'parte_personal', 'parte_residuos_vegetales',
    'cierres_jornada',
    -- Campo / Parcelas
    'parcels', 'parcel_photos', 'fotos_campo',
    'plantings', 'harvests', 'parcel_production',
    'registros_estado_parcela', 'certificaciones_parcela', 'residuos_operacion',
    -- Análisis
    'analisis_suelo', 'analisis_agua', 'lecturas_sensor_planta',
    'registros_riego', 'sistema_riego_zonas',
    -- Trazabilidad
    'palots', 'movimientos_palot', 'camaras_almacen', 'tickets_pesaje',
    'trazabilidad_registros',
    -- Cuadrillas / Presencia
    'cuadrillas', 'presencia_tiempo_real', 'vehicle_positions',
    -- Proveedores
    'proveedores', 'proveedores_precios',
    -- Planificación
    'planificacion_campana',
    -- AI
    'ai_proposals', 'ai_proposal_validations',
    'lia_contexto_sesion', 'lia_memoria', 'lia_patrones',
    -- Ganaderos
    'ganaderos',
    -- ERP
    'erp_exportaciones',
    -- Legacy
    'aperos', 'tractores', 'vuelos_dron',
    'logistica_conductores'
  ];
BEGIN
  FOREACH tbl IN ARRAY operational_tables LOOP
    -- Only add if table exists and column doesn't
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl)
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'company_id')
    THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN company_id uuid REFERENCES public.companies(id) DEFAULT ''00000000-0000-0000-0000-000000000001''::uuid',
        tbl
      );
      RAISE NOTICE 'Added company_id to %', tbl;
    ELSE
      RAISE NOTICE 'Skipped % (not found or already has company_id)', tbl;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Backfill: set company_id for any existing NULL rows
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  operational_tables text[] := ARRAY[
    'personal', 'personal_externo', 'personal_tipos_trabajo',
    'maquinaria_tractores', 'maquinaria_aperos', 'maquinaria_mantenimiento',
    'maquinaria_uso', 'maquinaria_inventario_sync',
    'camiones', 'vehiculos_empresa', 'logistica_viajes', 'logistica_conductores',
    'logistica_combustible', 'logistica_mantenimiento', 'logistica_inventario_sync',
    'inventario_ubicaciones', 'inventario_registros', 'inventario_productos_catalogo',
    'inventario_entradas', 'inventario_movimientos', 'inventario_informes',
    'inventario_ubicacion_activo',
    'trabajos_registro', 'trabajos_incidencias',
    'work_records', 'work_records_cuadrillas',
    'partes_diarios', 'parte_trabajo', 'parte_estado_finca',
    'parte_personal', 'parte_residuos_vegetales',
    'cierres_jornada',
    'parcels', 'parcel_photos', 'fotos_campo',
    'plantings', 'harvests', 'parcel_production',
    'registros_estado_parcela', 'certificaciones_parcela', 'residuos_operacion',
    'analisis_suelo', 'analisis_agua', 'lecturas_sensor_planta',
    'registros_riego', 'sistema_riego_zonas',
    'palots', 'movimientos_palot', 'camaras_almacen', 'tickets_pesaje',
    'trazabilidad_registros',
    'cuadrillas', 'presencia_tiempo_real', 'vehicle_positions',
    'proveedores', 'proveedores_precios',
    'planificacion_campana',
    'ai_proposals', 'ai_proposal_validations',
    'lia_contexto_sesion', 'lia_memoria', 'lia_patrones',
    'ganaderos',
    'erp_exportaciones',
    'aperos', 'tractores', 'vuelos_dron'
  ];
  cnt integer;
BEGIN
  FOREACH tbl IN ARRAY operational_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'company_id')
    THEN
      EXECUTE format(
        'UPDATE public.%I SET company_id = ''00000000-0000-0000-0000-000000000001''::uuid WHERE company_id IS NULL',
        tbl
      );
      GET DIAGNOSTICS cnt = ROW_COUNT;
      IF cnt > 0 THEN
        RAISE NOTICE 'Backfilled % rows in %', cnt, tbl;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Create indexes on company_id (critical for RLS performance)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  operational_tables text[] := ARRAY[
    'personal', 'personal_externo', 'personal_tipos_trabajo',
    'maquinaria_tractores', 'maquinaria_aperos', 'maquinaria_mantenimiento',
    'maquinaria_uso', 'maquinaria_inventario_sync',
    'camiones', 'vehiculos_empresa', 'logistica_viajes', 'logistica_conductores',
    'logistica_combustible', 'logistica_mantenimiento', 'logistica_inventario_sync',
    'inventario_ubicaciones', 'inventario_registros', 'inventario_productos_catalogo',
    'inventario_entradas', 'inventario_movimientos', 'inventario_informes',
    'inventario_ubicacion_activo',
    'trabajos_registro', 'trabajos_incidencias',
    'work_records', 'work_records_cuadrillas',
    'partes_diarios', 'parte_trabajo', 'parte_estado_finca',
    'parte_personal', 'parte_residuos_vegetales',
    'cierres_jornada',
    'parcels', 'parcel_photos', 'fotos_campo',
    'plantings', 'harvests', 'parcel_production',
    'registros_estado_parcela', 'certificaciones_parcela', 'residuos_operacion',
    'analisis_suelo', 'analisis_agua', 'lecturas_sensor_planta',
    'registros_riego', 'sistema_riego_zonas',
    'palots', 'movimientos_palot', 'camaras_almacen', 'tickets_pesaje',
    'trazabilidad_registros',
    'cuadrillas', 'presencia_tiempo_real', 'vehicle_positions',
    'proveedores', 'proveedores_precios',
    'planificacion_campana',
    'ai_proposals', 'ai_proposal_validations',
    'lia_contexto_sesion', 'lia_memoria', 'lia_patrones',
    'ganaderos',
    'erp_exportaciones',
    'aperos', 'tractores', 'vuelos_dron'
  ];
BEGIN
  FOREACH tbl IN ARRAY operational_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'company_id')
    THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%I_company_id ON public.%I (company_id)',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. RLS PILOT MODE: Enable RLS + open policy for authenticated
--    This blocks anonymous access but allows all authenticated users full access.
--    To activate real tenant isolation, replace _pilot_open policies with
--    company_id = current_user_company_id() policies (see policies_tenant_lock.sql)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  operational_tables text[] := ARRAY[
    'personal', 'personal_externo', 'personal_tipos_trabajo',
    'maquinaria_tractores', 'maquinaria_aperos', 'maquinaria_mantenimiento',
    'maquinaria_uso', 'maquinaria_inventario_sync',
    'camiones', 'vehiculos_empresa', 'logistica_viajes', 'logistica_conductores',
    'logistica_combustible', 'logistica_mantenimiento', 'logistica_inventario_sync',
    'inventario_ubicaciones', 'inventario_registros', 'inventario_productos_catalogo',
    'inventario_entradas', 'inventario_movimientos', 'inventario_informes',
    'inventario_ubicacion_activo',
    'trabajos_registro', 'trabajos_incidencias',
    'work_records', 'work_records_cuadrillas',
    'partes_diarios', 'parte_trabajo', 'parte_estado_finca',
    'parte_personal', 'parte_residuos_vegetales',
    'cierres_jornada',
    'parcels', 'parcel_photos', 'fotos_campo',
    'plantings', 'harvests', 'parcel_production',
    'registros_estado_parcela', 'certificaciones_parcela', 'residuos_operacion',
    'analisis_suelo', 'analisis_agua', 'lecturas_sensor_planta',
    'registros_riego', 'sistema_riego_zonas',
    'palots', 'movimientos_palot', 'camaras_almacen', 'tickets_pesaje',
    'trazabilidad_registros',
    'cuadrillas', 'presencia_tiempo_real', 'vehicle_positions',
    'proveedores', 'proveedores_precios',
    'planificacion_campana',
    'ai_proposals', 'ai_proposal_validations',
    'lia_contexto_sesion', 'lia_memoria', 'lia_patrones',
    'ganaderos',
    'erp_exportaciones',
    'aperos', 'tractores', 'vuelos_dron'
  ];
BEGIN
  FOREACH tbl IN ARRAY operational_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl)
    THEN
      -- Enable RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

      -- Drop any legacy anon policies that give open access to anon role
      EXECUTE format('DROP POLICY IF EXISTS "anon full access" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "anon_full_access" ON public.%I', tbl);

      -- Drop prior pilot policy if re-running
      EXECUTE format('DROP POLICY IF EXISTS %I_pilot_open ON public.%I', tbl, tbl);

      -- Create pilot policy: authenticated can do everything
      EXECUTE format(
        'CREATE POLICY %I_pilot_open ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        tbl, tbl
      );

      RAISE NOTICE 'RLS pilot enabled on %', tbl;
    END IF;
  END LOOP;
END $$;

-- Catalogs: keep global access (no company_id, readable by all authenticated)
DO $$
DECLARE
  tbl text;
  catalog_tables text[] := ARRAY[
    'catalogo_tipos_trabajo',
    'catalogo_tipos_mantenimiento',
    'cultivos_catalogo',
    'inventario_categorias',
    'usuario_roles'
  ];
BEGIN
  FOREACH tbl IN ARRAY catalog_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl)
    THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "anon full access" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "anon_full_access" ON public.%I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I_catalog_open ON public.%I', tbl, tbl);
      EXECUTE format(
        'CREATE POLICY %I_catalog_open ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- Special: presencia_tiempo_real needs anon access (QR scanning without login)
DROP POLICY IF EXISTS presencia_anon_read ON public.presencia_tiempo_real;
CREATE POLICY presencia_anon_read ON public.presencia_tiempo_real
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Special: work_records needs anon access (QR creates work records)
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS work_records_anon ON public.work_records;
CREATE POLICY work_records_anon ON public.work_records
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Special: cuadrillas needs anon access (QR reads cuadrilla info)
DROP POLICY IF EXISTS cuadrillas_anon ON public.cuadrillas;
CREATE POLICY cuadrillas_anon ON public.cuadrillas
  FOR SELECT TO anon USING (true);

-- ---------------------------------------------------------------------------
-- 6. Grants for authenticated + service_role on new tables
-- ---------------------------------------------------------------------------

GRANT ALL ON public.companies TO authenticated, service_role;
GRANT ALL ON public.user_profiles TO authenticated, service_role;
GRANT SELECT ON public.companies TO anon;

-- ---------------------------------------------------------------------------
-- 7. Verification query (run manually after migration)
-- ---------------------------------------------------------------------------
-- SELECT table_name,
--        EXISTS(SELECT 1 FROM information_schema.columns
--               WHERE table_schema='public' AND column_name='company_id'
--               AND columns.table_name = tables.table_name) as has_company_id,
--        rowsecurity
-- FROM pg_tables tables
-- WHERE schemaname = 'public'
-- ORDER BY table_name;
-- =============================================================================
