
-- Create parcels table
CREATE TABLE public.parcels (
  parcel_id TEXT PRIMARY KEY,
  farm TEXT NOT NULL,
  parcel_number TEXT,
  code TEXT,
  area_hectares NUMERIC,
  irrigation_type TEXT,
  status TEXT DEFAULT 'empty',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read parcels" ON public.parcels FOR SELECT USING (true);
CREATE POLICY "Public insert parcels" ON public.parcels FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update parcels" ON public.parcels FOR UPDATE USING (true);

-- Create work_records table
CREATE TABLE public.work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id TEXT NOT NULL REFERENCES public.parcels(parcel_id),
  date DATE NOT NULL,
  work_type TEXT NOT NULL,
  workers INTEGER,
  hours NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read work_records" ON public.work_records FOR SELECT USING (true);
CREATE POLICY "Public insert work_records" ON public.work_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete work_records" ON public.work_records FOR DELETE USING (true);

-- Create plantings table
CREATE TABLE public.plantings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id TEXT NOT NULL REFERENCES public.parcels(parcel_id),
  date DATE NOT NULL,
  crop TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plantings" ON public.plantings FOR SELECT USING (true);
CREATE POLICY "Public insert plantings" ON public.plantings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete plantings" ON public.plantings FOR DELETE USING (true);

-- Create harvests table
CREATE TABLE public.harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id TEXT NOT NULL REFERENCES public.parcels(parcel_id),
  date DATE NOT NULL,
  crop TEXT NOT NULL,
  production_kg NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read harvests" ON public.harvests FOR SELECT USING (true);
CREATE POLICY "Public insert harvests" ON public.harvests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete harvests" ON public.harvests FOR DELETE USING (true);
