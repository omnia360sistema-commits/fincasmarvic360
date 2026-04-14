-- =============================================================
-- MIGRACION: fix_rls_critical
-- FECHA: 2026-04-14
-- OBJETIVO: Agregar politicas RLS faltantes para rol authenticated
--           en tablas criticas que bloquean el frontend
-- RIESGO: NINGUNO (solo agrega politicas permisivas, no modifica datos)
-- TABLAS AFECTADAS: work_records, presencia_tiempo_real, cuadrillas,
--                   work_records_cuadrillas
-- PREREQUISITO VERIFICADO:
--   - work_records: RLS ON, solo policy work_records_anon (anon ALL)
--   - presencia_tiempo_real: RLS ON, solo policy presencia_anon (anon ALL)
--   - cuadrillas: RLS OFF, policy cuadrillas_anon existe pero inerte
--   - work_records_cuadrillas: RLS OFF, sin policies
--   - Las 4 tablas tienen 0 filas
-- =============================================================

-- 1. work_records: RLS ya esta ON, falta policy authenticated
CREATE POLICY work_records_pilot_open ON public.work_records
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 2. presencia_tiempo_real: RLS ya esta ON, falta policy authenticated
CREATE POLICY presencia_tiempo_real_pilot_open ON public.presencia_tiempo_real
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 3. cuadrillas: activar RLS + policy authenticated
--    La policy cuadrillas_anon (SELECT para anon) ya existe y
--    empezara a funcionar al activar RLS
ALTER TABLE public.cuadrillas ENABLE ROW LEVEL SECURITY;

CREATE POLICY cuadrillas_pilot_open ON public.cuadrillas
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 4. work_records_cuadrillas: activar RLS + policy authenticated
--    Tabla sin uso actual pero conviene asegurarla
ALTER TABLE public.work_records_cuadrillas ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_records_cuadrillas_pilot_open ON public.work_records_cuadrillas
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
