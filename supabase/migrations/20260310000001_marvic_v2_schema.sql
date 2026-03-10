-- ============================================================
-- AGRÍCOLA MARVIC 360 — Migración v2
-- Esquema extendido completo
-- ============================================================

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE tipo_riego AS ENUM (
  'goteo', 'tradicional', 'aspersion', 'ninguno'
);

CREATE TYPE estado_parcela AS ENUM (
  'activa', 'plantada', 'preparacion', 'cosechada', 'vacia', 'baja'
);

CREATE TYPE tipo_suelo AS ENUM (
  'arcilloso', 'franco', 'arenoso', 'limoso', 'franco_arcilloso'
);

CREATE TYPE tipo_residuo AS ENUM (
  'plastico_acolchado', 'cinta_riego', 'rafia', 'envase_fitosanitario', 'otro'
);

CREATE TYPE estado_certificacion AS ENUM (
  'vigente', 'suspendida', 'en_tramite', 'caducada'
);

-- ── CATÁLOGO DE CULTIVOS ──────────────────────────────────────
CREATE TABLE public.cultivos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_interno TEXT UNIQUE NOT NULL,
  nombre_display TEXT NOT NULL,
  ciclo_dias INTEGER NOT NULL,
  rendimiento_kg_ha NUMERIC(10,2),
  marco_std_entre_lineas_cm NUMERIC(6,2),
  marco_std_entre_plantas_cm NUMERIC(6,2),
  kg_plastico_por_ha NUMERIC(10,2),
  m_cinta_riego_por_ha NUMERIC(10,2),
  es_ecologico BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cultivos_catalogo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cultivos_catalogo"
  ON public.cultivos_catalogo FOR SELECT USING (true);

-- ── CUADRILLAS ───────────────────────────────────────────────
CREATE TABLE public.cuadrillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  empresa TEXT,
  nif TEXT,
  responsable TEXT,
  telefono TEXT,
  activa BOOLEAN DEFAULT true,
  qr_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cuadrillas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cuadrillas"
  ON public.cuadrillas FOR SELECT USING (true);
CREATE POLICY "Public insert cuadrillas"
  ON public.cuadrillas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cuadrillas"
  ON public.cuadrillas FOR UPDATE USING (true);

-- ── CAMIONES ─────────────────────────────────────────────────
CREATE TABLE public.camiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula TEXT NOT NULL UNIQUE,
  empresa_transporte TEXT,
  tipo TEXT CHECK (tipo IN ('propio', 'contratado')),
  capacidad_kg NUMERIC(10,2),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.camiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read camiones"
  ON public.camiones FOR SELECT USING (true);
CREATE POLICY "Public insert camiones"
  ON public.camiones FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update camiones"
  ON public.camiones FOR UPDATE USING (true);

-- ── AMPLIAR PARCELAS ─────────────────────────────────────────
ALTER TABLE public.parcels
  ADD COLUMN IF NOT EXISTS tipo_suelo tipo_suelo,
  ADD COLUMN IF NOT EXISTS ph_suelo NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS materia_organica_pct NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS ultima_analisis_suelo DATE,
  ADD COLUMN IF NOT EXISTS irrigation_type_v2 tipo_riego;

-- ── AMPLIAR PLANTACIONES ─────────────────────────────────────
ALTER TABLE public.plantings
  ADD COLUMN IF NOT EXISTS variedad TEXT,
  ADD COLUMN IF NOT EXISTS marco_cm_entre_lineas NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS marco_cm_entre_plantas NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS num_plantas_real INTEGER,
  ADD COLUMN IF NOT EXISTS lote_semilla TEXT,
  ADD COLUMN IF NOT EXISTS proveedor_semilla TEXT,
  ADD COLUMN IF NOT EXISTS fecha_cosecha_estimada DATE,
  ADD COLUMN IF NOT EXISTS sistema_riego tipo_riego;

-- ── AMPLIAR REGISTROS DE TRABAJO ─────────────────────────────
ALTER TABLE public.work_records
  ADD COLUMN IF NOT EXISTS cuadrilla_id UUID REFERENCES public.cuadrillas(id),
  ADD COLUMN IF NOT EXISTS hora_entrada TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hora_salida TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qr_scan_timestamp TIMESTAMPTZ;

-- ── CUADRILLAS POR OPERACIÓN (N:M) ───────────────────────────
CREATE TABLE public.work_records_cuadrillas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_record_id UUID NOT NULL REFERENCES public.work_records(id) ON DELETE CASCADE,
  cuadrilla_id UUID NOT NULL REFERENCES public.cuadrillas(id),
  num_trabajadores INTEGER NOT NULL DEFAULT 1,
  hora_entrada TIMESTAMPTZ,
  hora_salida TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(work_record_id, cuadrilla_id)
);

ALTER TABLE public.work_records_cuadrillas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read work_records_cuadrillas"
  ON public.work_records_cuadrillas FOR SELECT USING (true);
CREATE POLICY "Public insert work_records_cuadrillas"
  ON public.work_records_cuadrillas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update work_records_cuadrillas"
  ON public.work_records_cuadrillas FOR UPDATE USING (true);

-- ── RESIDUOS ─────────────────────────────────────────────────
CREATE TABLE public.residuos_operacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id TEXT NOT NULL REFERENCES public.parcels(parcel_id),
  operacion_id UUID REFERENCES public.work_records(id),
  tipo_residuo tipo_residuo NOT NULL,
  kg_instalados NUMERIC(10,2),
  kg_retirados NUMERIC(10,2),
  proveedor TEXT,
  lote_material TEXT,
  gestor_residuos TEXT,
  fecha_instalacion DATE,
  fecha_retirada DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.residuos_operacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read residuos_operacion"
  ON public.residuos_operacion FOR SELECT USING (true);
CREATE POLICY "Public insert residuos_operacion"
  ON public.residuos_operacion FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update residuos_operacion"
  ON public.residuos_operacion FOR UPDATE USING (true);

-- ── TICKETS DE PESAJE ────────────────────────────────────────
CREATE TABLE public.tickets_pesaje (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id UUID NOT NULL REFERENCES public.harvests(id),
  camion_id UUID REFERENCES public.camiones(id),
  matricula_manual TEXT,
  destino TEXT NOT NULL,
  peso_bruto_kg NUMERIC(10,2) NOT NULL,
  peso_tara_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  peso_neto_kg NUMERIC(10,2) GENERATED ALWAYS AS (peso_bruto_kg - peso_tara_kg) STORED,
  conductor TEXT,
  hora_salida TIMESTAMPTZ DEFAULT now(),
  numero_albaran TEXT UNIQUE,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tickets_pesaje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tickets_pesaje"
  ON public.tickets_pesaje FOR SELECT USING (true);
CREATE POLICY "Public insert tickets_pesaje"
  ON public.tickets_pesaje FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tickets_pesaje"
  ON public.tickets_pesaje FOR UPDATE USING (true);

-- ── CERTIFICACIONES ECOLÓGICAS ───────────────────────────────
CREATE TABLE public.certificaciones_parcela (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id TEXT NOT NULL REFERENCES public.parcels(parcel_id),
  entidad_certificadora TEXT NOT NULL,
  numero_expediente TEXT,
  campana TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado estado_certificacion NOT NULL DEFAULT 'en_tramite',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.certificaciones_parcela ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read certificaciones_parcela"
  ON public.certificaciones_parcela FOR SELECT USING (true);
CREATE POLICY "Public insert certificaciones_parcela"
  ON public.certificaciones_parcela FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update certificaciones_parcela"
  ON public.certificaciones_parcela FOR UPDATE USING (true);

-- ── ÍNDICES DE RENDIMIENTO ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_plantings_parcel_date
  ON public.plantings(parcel_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_harvests_parcel_date
  ON public.harvests(parcel_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_work_records_parcel_date
  ON public.work_records(parcel_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_residuos_parcel
  ON public.residuos_operacion(parcel_id);
CREATE INDEX IF NOT EXISTS idx_tickets_harvest
  ON public.tickets_pesaje(harvest_id);
CREATE INDEX IF NOT EXISTS idx_certificaciones_parcel
  ON public.certificaciones_parcela(parcel_id);