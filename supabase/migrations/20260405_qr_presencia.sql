-- Ampliación QR cuadrillas con presencia en tiempo real
-- rev. 26 — 05/04/2026

-- Agregar columnas a work_records para registros QR
ALTER TABLE work_records
  ADD COLUMN IF NOT EXISTS qr_scan_entrada TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qr_scan_salida TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS horas_calculadas NUMERIC(5,2);

-- Tabla de presencia en tiempo real
CREATE TABLE IF NOT EXISTS presencia_tiempo_real (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuadrilla_id UUID NOT NULL REFERENCES cuadrillas(id) ON DELETE CASCADE,
  parcel_id TEXT REFERENCES parcels(parcel_id) ON DELETE SET NULL,
  work_record_id UUID REFERENCES work_records(id) ON DELETE SET NULL,
  hora_entrada TIMESTAMPTZ NOT NULL DEFAULT now(),
  hora_salida TIMESTAMPTZ,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para presencia_tiempo_real
ALTER TABLE presencia_tiempo_real ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full access" ON presencia_tiempo_real
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_presencia_cuadrilla ON presencia_tiempo_real(cuadrilla_id);
CREATE INDEX IF NOT EXISTS idx_presencia_activo ON presencia_tiempo_real(activo);
CREATE INDEX IF NOT EXISTS idx_presencia_entrada ON presencia_tiempo_real(hora_entrada);
