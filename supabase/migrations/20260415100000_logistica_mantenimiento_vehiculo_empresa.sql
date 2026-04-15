-- logistica_mantenimiento: FK separada a vehiculos_empresa + CHECK (máximo un vehículo).
-- Reversible: eliminar CHECK y FK y columna (tras vacar vehiculo_empresa_id si hiciera falta).
-- FASE 0: ejecutar scripts/audit_logistica_mantenimiento_phase0.sql y revisar resultados.

-- FASE 1.1 — Columna nueva
ALTER TABLE public.logistica_mantenimiento
  ADD COLUMN IF NOT EXISTS vehiculo_empresa_id uuid NULL;

COMMENT ON COLUMN public.logistica_mantenimiento.vehiculo_empresa_id IS 'Mantenimiento de flota interna (vehiculos_empresa). Mutuamente excluyente con camion_id salvo ambos NULL.';

-- FASE 1.2 — FK (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_logistica_mant_vehiculo_empresa'
  ) THEN
    ALTER TABLE public.logistica_mantenimiento
      ADD CONSTRAINT fk_logistica_mant_vehiculo_empresa
      FOREIGN KEY (vehiculo_empresa_id)
      REFERENCES public.vehiculos_empresa (id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- FASE 2 — Backfill solo si el id guardado en camion_id existe en vehiculos_empresa (no asumir otros casos)
UPDATE public.logistica_mantenimiento m
SET
  vehiculo_empresa_id = m.camion_id,
  camion_id = NULL
WHERE m.vehiculo_tipo IN ('vehiculo_empresa', 'vehiculo')
  AND m.camion_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.vehiculos_empresa v WHERE v.id = m.camion_id);

-- FASE 3 — Pre-check: no filas con ambos FK
DO $$
DECLARE
  n integer;
BEGIN
  SELECT COUNT(*) INTO n
  FROM public.logistica_mantenimiento
  WHERE camion_id IS NOT NULL AND vehiculo_empresa_id IS NOT NULL;

  IF n > 0 THEN
    RAISE EXCEPTION 'logistica_mantenimiento: % filas con camion_id y vehiculo_empresa_id a la vez (revisar antes de CHECK)', n;
  END IF;
END
$$;

-- FASE 4 — CHECK: como máximo uno de los dos FKs no nulo (permite ambos NULL: registro sin vehículo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_mantenimiento_max_un_vehiculo'
  ) THEN
    ALTER TABLE public.logistica_mantenimiento
      ADD CONSTRAINT chk_mantenimiento_max_un_vehiculo
      CHECK (camion_id IS NULL OR vehiculo_empresa_id IS NULL);
  END IF;
END
$$;
