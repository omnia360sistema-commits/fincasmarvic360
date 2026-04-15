-- Snapshot de coste por trabajo (histórico económico congelado)
-- Preserva histórico aunque se borre el trabajo origen: FK ON DELETE SET NULL + trabajo_id nullable.
-- Idempotencia: unique parcial sobre trabajo_id cuando no es null.

CREATE TABLE IF NOT EXISTS public.trabajos_coste_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trabajo_id uuid REFERENCES public.trabajos_registro(id) ON DELETE SET NULL,
  version_calculo integer NOT NULL DEFAULT 1,
  calculado_en timestamptz NOT NULL DEFAULT now(),
  calculado_por text,

  -- Entradas congeladas
  horas numeric(6,2) NOT NULL DEFAULT 0,
  num_operarios integer NOT NULL DEFAULT 0,
  tractor_id uuid,
  apero_id uuid,
  tarifa_tractor_eur_h numeric(8,2) NOT NULL DEFAULT 0,
  tarifa_operario_eur_h numeric(8,2) NOT NULL DEFAULT 0,

  -- Resultados (coste_total calculado en backend)
  coste_materiales numeric(12,2) NOT NULL DEFAULT 0,
  coste_maquinaria numeric(12,2) NOT NULL DEFAULT 0,
  coste_mano_obra  numeric(12,2) NOT NULL DEFAULT 0,
  coste_total numeric(12,2) GENERATED ALWAYS AS
    (coste_materiales + coste_maquinaria + coste_mano_obra) STORED,

  -- Producción vinculada (opcional)
  produccion_kg_total numeric(12,2),
  coste_por_kg numeric(12,4),

  -- Desglose sin recalcular
  lineas_materiales jsonb NOT NULL DEFAULT '[]'::jsonb,
  produccion_vinculada jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_trabajos_coste_snapshot_trabajo_id
  ON public.trabajos_coste_snapshot (trabajo_id)
  WHERE trabajo_id IS NOT NULL;

ALTER TABLE public.trabajos_coste_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trabajos_coste_snapshot_pilot_open ON public.trabajos_coste_snapshot;
CREATE POLICY trabajos_coste_snapshot_pilot_open
  ON public.trabajos_coste_snapshot
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
