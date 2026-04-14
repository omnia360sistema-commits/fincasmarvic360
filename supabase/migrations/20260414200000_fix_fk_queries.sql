-- =============================================================
-- MIGRACION: fix_fk_queries
-- FECHA: 2026-04-14
-- OBJETIVO: Crear FK faltantes para que embeds PostgREST funcionen
-- RIESGO: NINGUNO (tablas afectadas tienen 0 filas)
-- TABLAS AFECTADAS: logistica_mantenimiento, movimientos_palot
-- PREREQUISITO VERIFICADO:
--   - logistica_mantenimiento: columna camion_id (uuid) EXISTE, FK NO existe, 0 filas
--   - movimientos_palot: columna camion_id NO existe, 0 filas
-- =============================================================

-- 1. logistica_mantenimiento: agregar FK en columna existente camion_id
--    Permite embed PostgREST: .select('*, camiones(matricula)')
ALTER TABLE public.logistica_mantenimiento
  ADD CONSTRAINT fk_logistica_mant_camion
  FOREIGN KEY (camion_id) REFERENCES public.camiones(id)
  ON DELETE SET NULL;

-- 2. movimientos_palot: agregar columna camion_id + FK
--    Permite embed PostgREST: .select('*, camiones(matricula)')
ALTER TABLE public.movimientos_palot
  ADD COLUMN camion_id uuid;

ALTER TABLE public.movimientos_palot
  ADD CONSTRAINT fk_movimientos_palot_camion
  FOREIGN KEY (camion_id) REFERENCES public.camiones(id)
  ON DELETE SET NULL;
