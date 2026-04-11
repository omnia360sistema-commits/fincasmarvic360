-- =============================================================================
-- Carga inventario físico 01/04/2026 — VERSIÓN LIMPIA
-- Compatible con schema multi-tenant (company_id en todas las tablas)
-- Ejecutar en SQL Editor de Supabase (como usuario autenticado con service_role)
--
-- Artefactos corregidos: "" eliminados, comillas escapadas arregladas,
-- categorías faltantes creadas, unique constraint para catálogo productos.
-- company_id se rellena automáticamente vía DEFAULT en todas las tablas.
-- =============================================================================
BEGIN;
-- Marcador de carga: carga_inventario_fisico_2026_04_01
-- Fecha lógica de snapshot: 2026-04-01T12:00:00+02:00

-- ── 0. Garantizar categorías referenciadas por los datos ──
INSERT INTO public.inventario_categorias (nombre, slug, icono, orden)
VALUES
  ('Manta térmica', 'manta_termica', 'Thermometer', 8),
  ('Plástico', 'plastico', 'Package', 9)
ON CONFLICT (slug) DO NOTHING;

-- ── 0b. Unique constraint para upsert del catálogo de productos ──
-- (idempotent: no falla si ya existe)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventario_productos_catalogo_nombre_categoria_id_key'
  ) THEN
    ALTER TABLE public.inventario_productos_catalogo
      ADD CONSTRAINT inventario_productos_catalogo_nombre_categoria_id_key
      UNIQUE (nombre, categoria_id);
  END IF;
END $$;
create temporary table tmp_inventory_load (
  source_file text not null,
  location_name text not null,
  category_name text not null,
  product_name text not null,
  quantity numeric not null,
  unit text not null,
  description text null,
  notes text null
) on commit drop;
create temporary table tmp_apero_load (
  source_file text not null,
  location_name text not null,
  apero_name text not null,
  code_raw text null,
  notes text null
) on commit drop;
create temporary table tmp_tractor_load (
  source_file text not null,
  location_name text not null,
  tractor_name text not null,
  matricula_raw text null,
  marca text null,
  modelo text null,
  notes text null
) on commit drop;
insert into tmp_inventory_load (source_file, location_name, category_name, product_name, quantity, unit, description, notes) values
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'ALTACOR 35WG', 0.25, 'bote 300g', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'CARAQUIM RB', 1.5, 'bolsa 5kg', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'TERAFIT', 5.5, 'bote 200g', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'DECIS EVO', 1.25, 'garrafa 5L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'GOAL SUPREME', 8.5, 'garrafa 5L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'PROMETREX', 3.5, 'garrafa', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'CLOSER', 4.0, 'botellas 1L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'TOUCHDOWN PREMIUM', 6.0, 'garrafas 20L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'THIOVIT JET', 36.0, 'sacos 800g', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'ÁCIDO NÍTRICO 54%', 1.0, 'garrafa 30kg', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'SOLUCIÓN N-32', 1.0, 'garrafa 30kg', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'LEDOR', 3.0, 'garrafas 5L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'DIOXI MIRTO', 20.0, 'caja (10x1kg)', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'DIOXI GO', 2.0, 'garrafa 5L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'DIOXI CUPER', 1.0, 'garrafa 20L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'IRONMAX PRO ColzActive', 15.0, 'saco 20kg', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'DIOXI TANOK', 1.0, 'garrafa 5L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'LIMAGRAN', 25.0, 'saco 25kg', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'DIOXI BLUE', 5.0, 'garrafas 5L', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'AZÚCAR (Azucarera)', 800.0, 'kg', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Material riego', 'AZUD FIT CTR Ø16', 1.0, 'caja 2.400 ud', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Material riego', 'AZUD FIT Enlace Cinta-Tubería', 3.0, 'cajas 1.200 ud', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Fitosanitarios y abonos', 'AFFIRM', 11.5, 'kg (bolsas 1kg)', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Maquinaria grande', 'Mochila fumigadora', 1.0, 'ud', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Maquinaria grande', 'Cubeta / depósito blanco', 2.0, 'ud', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Maquinaria grande', 'Filtro de riego', 2.0, 'ud', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Maquinaria grande', 'Aforadora', 2.0, 'ud', NULL, NULL),
  ('Inventario_fitosanitarios_semillero.pdf', 'Semillero', 'Maquinaria grande', 'Motobomba pequeña', 1.0, 'ud', NULL, NULL),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Proactif Dureza', 4.0, 'bolsas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'SMG Ecomet 25kg Medfer', 1.5, 'bolsas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Mixto', 6.0, 'bolsas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Kira', 12.0, 'bolsas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Piranka', 4.0, 'garrafas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Big', 4.0, 'garrafas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Soldier', 5.0, 'garrafas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Quorum CXP', 8.5, 'garrafas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi YooKoo', 4.0, 'garrafas', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Thiovit Jet', 1.0, 'saco', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Escova', 1.0, 'unidad', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Recorredor', 1.0, 'unidad', NULL, 'Origen PDF: La Valda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Azúcar', 8.0, 'paquetes x10', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Bite', 4.0, 'garrafas 20L', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Kusu', 2.0, 'garrafas 20L', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Solución N-32 Nitro', 3.0, 'garrafas', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Proatif R-28', 2.0, 'garrafas', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Proatif VERA', 2.0, 'garrafas', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Proatif G-20', 2.0, 'garrafas', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi OIL', 6.0, 'garrafas', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Titan', 0.5, 'garrafa', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Dioxi Control', 1.0, 'garrafa', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Zenith A26', 1.0, 'garrafa', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'ABanto Max', 1.0, 'garrafa', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Spachem', 2.5, 'garrafas', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Volkete insecticida', 3.0, 'botes', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Similsso', 1.0, 'bote', NULL, 'Origen PDF: La Barda'),
  ('Inventario Almacen FITOS BARDA.pdf', 'Cabezal Finca La Barda', 'Fitosanitarios y abonos', 'Siapton', 3.0, 'garrafas', NULL, 'Origen PDF: La Barda'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Alargadera', 2.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Bidon abono', 1.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Carretilla', 1.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Carro para fumigar', 1.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Depósito de abono / abonadora', 2.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Karcher', 2.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Mochila de fumigar', 8.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Motocultor', 1.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Submarino', 3.0, 'ud', NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero AB-087', 1.0, 'ud', NULL, 'Código: AB-087'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero 102', 1.0, 'ud', NULL, 'Código: 102'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero 105', 1.0, 'ud', NULL, 'Código: 105'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero AB-098', 1.0, 'ud', NULL, 'Código: AB-098'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero 104', 1.0, 'ud', NULL, 'Código: 104'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero AB-088', 1.0, 'ud', NULL, 'Código: AB-088'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero Y-11033', 1.0, 'ud', NULL, 'Código: Y-11033'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero AB-089', 1.0, 'ud', NULL, 'Código: AB-089'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Apero 003', 1.0, 'ud', NULL, 'Código: 003'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Tractor E-5069-BJF', 1.0, 'ud', NULL, 'Matrícula: E-5069-BJF'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Tractor E-6237-BBN', 1.0, 'ud', NULL, 'Matrícula: E-6237-BBN'),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Maquinaria grande', 'Tractor E-4565-BGB', 1.0, 'ud', NULL, 'Matrícula: E-4565-BGB'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Abonadora con motor agitador AP-025', 1.0, 'ud', NULL, 'Código: AP-025'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Apero AB-023', 1.0, 'ud', NULL, 'Código: AB-023'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Apero AV-025', 1.0, 'ud', NULL, 'Código: AV-025'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Apero AP-097', 1.0, 'ud', NULL, 'Código: AP-097'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Apero AB-022', 1.0, 'ud', NULL, 'Código: AB-022'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Apero AP-101', 1.0, 'ud', NULL, 'Código: AP-101'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Asiento de tractor', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Aperos manuales', 'AZADAS', 2.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material diverso', 'Bancos', 3.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material diverso', 'CAJA DE GOMAS', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Cámara de tractor', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Cañón espantapájaros', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material diverso', 'CAPAZOS', 0.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Compresor', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Aperos manuales', 'Corbilla', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Cuadro procesadoras de mano', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Depósito de gasoil', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Desbrozadora', 4.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Flejadora', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material riego', 'Manguera de agua', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material riego', 'Manguera para bomba / sacar agua', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material diverso', 'Mesa', 2.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Mochila de fumigación', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Mochila de fumigar a motor', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Motobomba', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Motobomba pequeña', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Pesa para tractor', 6.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Aperos manuales', 'Pistola para compresor (aire ruedas)', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Aperos manuales', 'Rasqueta', 7.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material diverso', 'REMOVEDOR ABONO', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material riego', 'Rollo cinta goteo', 3.0, 'ud', NULL, 'Línea 1 de rollos cinta goteo'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material riego', 'Rollo cinta goteo', 3.0, 'ud', NULL, 'Línea 2 de rollos cinta goteo'),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material riego', 'Rollo de cinta', 3.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Rueda de tractor 420/70 R24', 2.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Rueda de tractor 520/70 R28', 2.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Rueda de tractor 520/70 R34', 2.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Rueda de tractor HC 70 Mitas', 2.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Material diverso', 'Taza / recipiente medidor', 1.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Traspaleta', 3.0, 'ud', NULL, NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Maquinaria grande', 'Turbina', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Neumáticos', 1.0, 'lote', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Palets de madera', 1.0, 'lote', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Tuberías de PVC', 1.0, 'lote', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Sacos Big Bags', 1.0, 'lote', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Rollos de cable / manguera', 1.0, 'lote', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Cajas de plástico verdes', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Jaula metálica', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Remolque de tractor', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Depósito IBC', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Escalera de mano', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Aperos de labranza (varios)', 1.0, 'lote', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Apero AP-061', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Apero AP-044', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Apero AP-042', 1.0, 'ud', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Ladrillos cerámicos', 3.0, 'palet', NULL, NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Bloques de hormigón', 3.5, 'palet', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Chasis de apero agrícola AP-043', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Elevador hidráulico agrícola de mástil Roda AP-063', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Elevador hidráulico agrícola de mástil con horquillas Roda AP-045', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Tubería de goteo Azud Sprint 160/1L-0.20', 3.5, 'rollo', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Adaptador de brida para tubería de PVC o polietileno', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Tubos de PVC para presión o saneamiento', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Asiento de tractor', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Codo de PVC con brida (gran diámetro)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Válvula de bola y accesorios de riego (cesta de valvulería)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Caja con racores de compresión y tubería de polietileno', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Filtro de anillas para sistemas de riego', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Manómetro de presión para riego', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Válvula de esfera con maneta (rojo)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Ventosa de riego', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Cabezal de filtrado de anillas con programador de riego', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Programador de riego electrónico', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Electroválvula de riego', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Manómetro de glicerina para cabezal de riego', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Ventosa de aire para red de riego', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Electrobomba centrífuga horizontal de alta presión', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Cuadro eléctrico de control de bomba de riego', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Depósito de abonado (venturi) para fertirrigación', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Filtro de malla metálica en Y (gran diámetro)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Tanque de presión para filtrado de arena (filtro lecho profundo)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Pistola de engrase manual (engrasadora de palanca)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Sierra de mano', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Transpaleta manual (mula / zorra)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Compresor de aire de pistón Cevik Pro AB 100-3M', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Kit quemador de gas (botella + lanza + manguera + regulador)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Capazo de goma de obra', 4.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Codos de PVC para fontanería', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Bote de adhesivo tipo Würth', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Cinta de teflón', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Tambo de aceite John Deere 208 L', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Depósito de gasoil de polietileno con bomba y cuentalitros', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Cuentalitros / medidor de flujo mecánico para combustible', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Tractor Agrosan Nassib', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Abonadora centrífuga Agrícola Marvic AP-017', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Apero agrícola Agrosan AP-041', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Subsolador agrícola de brazos (galvanizado)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Cultivador de discos AP-049', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Plataforma elevadora / remolque agrícola de trabajo AP-012', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Apero hidráulico rojo Vinckb AP-056', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Apero agrícola azul AP-020', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Compuerta / panel metálico de maquinaria agrícola', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Rollo de tubería de polietileno de gran diámetro 60 con racor', 1.5, 'rollo', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Carretes / bobinas de riego por aspersión', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Portabobinas / soporte de carretes metálico', 3.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Electrobomba centrífuga RDA CS 80-160 A', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Motor eléctrico trifásico de gran potencia (sobre palet)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Red / malla de recogida agrícola (salmón/naranja)', 14.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Caja con juntas y bridas de recambio (Hidroten/Cepe)', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Neumáticos de tractor usados', 4.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Bidones metálicos usados', 5.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Cultivador de discos amarillo AP-039', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Fresadora / rotovator agrícola AP-057', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Tubería de goteo Azud Sprint 160/1L-0.20 — Lote 05PAC020', 1.0, 'rollo', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Plástico', 'Rollo de plástico acolchado negro 150 cm galga 110', 14.0, 'palets', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Unión PVC ø 200', 2.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Unión PVC ø 160', 4.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Unión PVC ø 140', 5.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Unión PVC ø 125', 3.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Unión PVC ø 110', 3.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Unión PVC ø 90', 2.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Codo PVC 160', 2.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Codo PVC 110', 2.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Codo PVC 90', 6.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Codo PVC 75', 4.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Codo PVC 40', 0.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Llave de paso de 63', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Enlace cinta a cinta', 3000.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Enlace cinta-tubería', 6000.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Empalme de 16', 250.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Empalme de 63', 2.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'T de PVC 110', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'T de PVC 90', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'T de PVC 75', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material riego', 'Rollo cinta de riego', 38.0, 'rollo', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Azada', 10.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Pala', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Pico', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Orca', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Mochila de fumigar', 0.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Radial / amoladora angular', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Pinzas', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Tijeras de conexión', 2.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Llave de apretar tubería 63', 2.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Alargadera eléctrica', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos manuales', 'Latiguillo hidráulico', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Carretilla de obra', 2.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Cañón espantapájaros', 0.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Maquinaria grande', 'Motor de riego 30 CV', 1.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Material diverso', 'Tuberías varias', 1.0, 'lote', NULL, 'Cantidad no visible en PDF, se carga como 1 lote por defecto'),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Manta térmica', 'Manta térmica agrícola', 0.0, 'ud', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Plástico', 'Rollo de malla 50 m', 0.0, 'rollo', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'JOHN DEERE (E-0931-BBX)', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'JOHN DEERE 5510 HighCrop', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'VALTRA 6350', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Apero AP-013', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Apero AP-048', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Apero AP-059', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Apero AP-09 (azul)', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Apero AP-095', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Apero azul (sin ref. visible)', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Cultivador de discos verde', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Trajilla/rastra (sin marca)', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Plástico', 'Lona/malla verde usada', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Manta térmica', 'Manta verde MT 17 UV', 3.0, 'rollos', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Manta térmica', 'Rollo manta blanca', 8.0, 'rollos', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Plástico', 'Rollo plástico naranja/salmón', 6.0, 'rollos', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Plástico', 'Rollo plástico negro', 60.0, 'rollos', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material riego', 'AZUD FIT Enlace Cinta-Tubería', 16.0, 'cajas', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material riego', 'AZUD SPRINT 05PAC020', 15.0, 'rollos', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material riego', 'Rollo AZUD (cinta pequeña)', 2.0, 'rollos', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material riego', 'Rollo fleje blanco PP', 1.0, 'rollo', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material riego', 'Rollo tubería PE negra grande', 3.0, 'rollos', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material riego', 'Tubería PE Ø63 ECOCAR', 5.0, 'rollos', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material riego', 'Tubo corrugado amarillo', 1.0, 'lote', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Alambre galvanizado', 1.0, 'paquete', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Bieldo / horca', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Capazos azules (usados)', 36.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Carro de transporte verde', 2.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Cubo negro grande', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Cubos azules', 3.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Cubos negros pequeños', 3.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Garrafa amarilla pequeña', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Legón / pico', 5.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Pala', 4.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Panaderitas / tolvas blancas', 4.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Rastrillo', 8.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Aperos manuales', 'Varillas acero corrugado', 100.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Accesorios PVC sueltos', 1.0, 'lote', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Bombona camping gas', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Caja herramientas negra', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Cañón espantapájaros Guardian 2', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Cuadro eléctrico', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Extintor rojo', 2.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'IBC contenedor "uso no alim."', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Nevera/caja isotérmica', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Recogedor/enrrollador cinta', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Maquinaria grande', 'Traspaletas CARVIN', 2.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material diverso', 'Bidón gasoil rosa', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material diverso', 'Cajas de campo verdes', 4.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material diverso', 'Mochila naranja', 1.0, 'ud', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Material diverso', 'Varillas barillas metálicas', 38.0, 'paquete', NULL, NULL);
insert into tmp_apero_load (source_file, location_name, apero_name, code_raw, notes) values
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero AB-087', 'AB-087', NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero 102', '102', NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero 105', '105', NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero AB-098', 'AB-098', NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero 104', '104', NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero AB-088', 'AB-088', NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero Y-11033', 'Y-11033', NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero AB-089', 'AB-089', NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Apero 003', '003', NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Abonadora con motor agitador AP-025', 'AP-025', NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Apero AB-023', 'AB-023', NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Apero AV-025', 'AV-025', NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Apero AP-097', 'AP-097', NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Apero AB-022', 'AB-022', NULL),
  ('inventario_Concepcion 01-04-2026.pdf', 'Nave Finca La Concepción', 'Apero AP-101', 'AP-101', NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Apero AP-061', 'AP-061', NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Apero AP-044', 'AP-044', NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Apero AP-042', 'AP-042', NULL),
  ('inventario_exterior_finca_collados.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Aperos de labranza (varios)', NULL, 'Apero sin referencia individual en PDF'),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Chasis de apero agrícola AP-043', 'AP-043', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Elevador hidráulico agrícola de mástil Roda AP-063', 'AP-063', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Elevador hidráulico agrícola de mástil con horquillas Roda AP-045', 'AP-045', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Abonadora centrífuga Agrícola Marvic AP-017', 'AP-017', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Apero agrícola Agrosan AP-041', 'AP-041', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Cultivador de discos AP-049', 'AP-049', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Plataforma elevadora / remolque agrícola de trabajo AP-012', 'AP-012', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Apero hidráulico rojo Vinckb AP-056', 'AP-056', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Apero agrícola azul AP-020', 'AP-020', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Cultivador de discos amarillo AP-039', 'AP-039', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Fresadora / rotovator agrícola AP-057', 'AP-057', NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Subsolador agrícola de brazos (galvanizado)', NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Compuerta / panel metálico de maquinaria agrícola', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Apero AP-013', 'AP-013', NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Apero AP-048', 'AP-048', NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Apero AP-059', 'AP-059', NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Apero AP-09', 'AP-09', NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Apero AP-095', 'AP-095', NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Apero azul (sin ref. visible)', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Cultivador de discos verde', NULL, NULL),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'Trajilla/rastra (sin marca)', NULL, NULL);
insert into tmp_tractor_load (source_file, location_name, tractor_name, matricula_raw, marca, modelo, notes) values
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Tractor E-5069-BJF', 'E-5069-BJF', NULL, NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Tractor E-6237-BBN', 'E-6237-BBN', NULL, NULL, NULL),
  ('Inventario Poligono 01-04-2026.pdf', 'Nave Polígono Finca La Barda', 'Tractor E-4565-BGB', 'E-4565-BGB', NULL, NULL, NULL),
  ('inventario_nave_collados_actualizado.pdf', 'Nave + Cabezal Finca Collados + Cabezal Brazo Virgen', 'Tractor Agrosan Nassib', NULL, 'Agrosan', 'Nassib', 'Sin matrícula visible en PDF'),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'JOHN DEERE (E-0931-BBX)', 'E-0931-BBX', 'JOHN DEERE', NULL, 'Nº interno 30 en PDF'),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'JOHN DEERE 5510 HighCrop', NULL, 'JOHN DEERE', '5510 HighCrop', 'Nº interno 3 en PDF; sin matrícula visible'),
  ('inventario_finca_barda 01-04-2026.pdf', 'Cabezal Finca La Barda', 'VALTRA 6350', 'E-1611-BDS', 'VALTRA', '6350', 'Nº interno 4 en PDF');
-- ---------------------------
-- 1) Alta/actualización en APEROS (legacy)
-- ---------------------------
with inc as (
  select
    source_file,
    location_name,
    apero_name,
    code_raw,
    nullif(regexp_replace(coalesce(code_raw, ''), '[^0-9]', '', 'g'), '') as code_digits,
    notes
  from tmp_apero_load
), match_existing as (
  select
    i.*,
    a.id as apero_id
  from inc i
  left join lateral (
    select a1.id
    from public.aperos a1
    where (i.code_digits is not null and ltrim(regexp_replace(coalesce(a1.codigo, ''), '[^0-9]', '', 'g'), '0') = ltrim(i.code_digits, '0'))
       or (i.code_digits is null and lower(trim(a1.denominacion)) = lower(trim(i.apero_name)))
    order by a1.created_at asc nulls last
    limit 1
  ) a on true
)
update public.aperos a
set estado = 'disponible',
    ubicacion = m.location_name,
    updated_at = now()
from match_existing m
where m.apero_id = a.id;
insert into public.aperos (codigo, denominacion, marca, ubicacion, estado, created_at, updated_at)
select
  case when i.code_digits is null then null else lpad(i.code_digits, 3, '0') end as codigo,
  i.apero_name,
  null::text as marca,
  i.location_name as ubicacion,
  'disponible' as estado,
  '2026-04-01T12:00:00+02:00'::timestamptz::timestamp as created_at,
  '2026-04-01T12:00:00+02:00'::timestamptz::timestamp as updated_at
from (
  select
    source_file, location_name, apero_name, code_raw,
    nullif(regexp_replace(coalesce(code_raw, ''), '[^0-9]', '', 'g'), '') as code_digits
  from tmp_apero_load
) i
where not exists (
  select 1
  from public.aperos a
  where (i.code_digits is not null and ltrim(regexp_replace(coalesce(a.codigo, ''), '[^0-9]', '', 'g'), '0') = ltrim(i.code_digits, '0'))
     or (i.code_digits is null and lower(trim(a.denominacion)) = lower(trim(i.apero_name)))
);
-- ---------------------------
-- 2) Alta/actualización en TRACTORES (legacy)
-- ---------------------------
with inc as (
  select
    source_file, location_name, tractor_name, matricula_raw, marca, modelo, notes,
    nullif(upper(regexp_replace(coalesce(matricula_raw, ''), '[^A-Z0-9]', '', 'g')), '') as mat_norm
  from tmp_tractor_load
), norm as (
  select *,
    case when mat_norm is null then null else regexp_replace(mat_norm, '^E', '') end as mat_key
  from inc
), match_existing as (
  select n.*, t.id as tractor_id
  from norm n
  left join lateral (
    select t1.id
    from public.tractores t1
    where n.mat_key is not null and regexp_replace(upper(regexp_replace(coalesce(t1.matricula, ''), '[^A-Z0-9]', '', 'g')), '^E', '') = n.mat_key
    order by t1.created_at asc nulls last
    limit 1
  ) t on true
)
update public.tractores t
set estado = 'disponible',
    ubicacion = m.location_name,
    marca = coalesce(m.marca, t.marca),
    updated_at = now()
from match_existing m
where m.tractor_id = t.id;
insert into public.tractores (codigo, matricula, marca, ubicacion, estado, created_at, updated_at)
select
  case
    when i.matricula_raw is null and i.tractor_name ilike '%5510%' then 'TR-5510-HC'::text
    when i.matricula_raw is null and i.tractor_name ilike '%Agrosan Nassib%' then 'TR-AGROSAN-NASSIB'::text
    else null::text
  end as codigo,
  i.matricula_raw,
  i.marca,
  i.location_name,
  'disponible',
  '2026-04-01T12:00:00+02:00'::timestamptz::timestamp,
  '2026-04-01T12:00:00+02:00'::timestamptz::timestamp
from tmp_tractor_load i
where not exists (
  select 1
  from public.tractores t
  where (
    i.matricula_raw is not null and regexp_replace(upper(regexp_replace(coalesce(t.matricula, ''), '[^A-Z0-9]', '', 'g')), '^E', '') = regexp_replace(upper(regexp_replace(i.matricula_raw, '[^A-Z0-9]', '', 'g')), '^E', '')
  ) or (
    i.matricula_raw is null and lower(trim(coalesce(t.codigo, ''))) in ('tr-5510-hc', 'tr-agrosan-nassib')
  )
);
-- ---------------------------
-- 3) Alta/actualización en MAQUINARIA_APEROS
-- ---------------------------
with inc as (
  select
    source_file, location_name, apero_name, code_raw, notes,
    nullif(regexp_replace(coalesce(code_raw, ''), '[^0-9]', '', 'g'), '') as code_digits
  from tmp_apero_load
), prepared as (
  select
    i.*,
    case when i.code_digits is not null then 'AP-' || lpad(i.code_digits, 3, '0') else 'AUTO-AP-' || upper(substr(md5(i.location_name || '|' || i.apero_name), 1, 10)) end as codigo_interno_resuelto
  from inc i
)
insert into public.maquinaria_aperos (tipo, descripcion, tractor_id, activo, foto_url, notas, codigo_interno, estado, created_at, created_by)
select
  p.apero_name as tipo,
  null::text as descripcion,
  null::uuid as tractor_id,
  true as activo,
  null::text as foto_url,
  coalesce(p.notes, '') || case when p.notes is null then '' else ' | ' end || 'Carga inventario 01/04/2026' as notas,
  p.codigo_interno_resuelto as codigo_interno,
  'disponible' as estado,
  '2026-04-01T12:00:00+02:00'::timestamptz as created_at,
  'carga_inventario_fisico_2026_04_01' as created_by
from prepared p
on conflict (codigo_interno) do update set
  tipo = excluded.tipo,
  estado = 'disponible',
  activo = true,
  notas = excluded.notas;
-- ---------------------------
-- 4) Alta/actualización en MAQUINARIA_TRACTORES
-- ---------------------------
with prepared as (
  select
    source_file, location_name, tractor_name, matricula_raw, marca, modelo, notes,
    case
      when matricula_raw is not null then matricula_raw
      when tractor_name ilike '%5510%' then 'SIN-MAT-JD-5510-HC-N3'
      when tractor_name ilike '%Agrosan Nassib%' then 'SIN-MAT-AGROSAN-NASSIB'
      else 'SIN-MAT-' || upper(substr(md5(location_name || '|' || tractor_name), 1, 12))
    end as matricula_resuelta
  from tmp_tractor_load
)
insert into public.maquinaria_tractores (matricula, marca, modelo, anio, horas_motor, ficha_tecnica, activo, foto_url, notas, created_at, created_by, fecha_proxima_itv, fecha_proxima_revision, horas_proximo_mantenimiento, gps_info, codigo, tipo, estado, ubicacion, codigo_interno, estado_operativo)
select
  p.matricula_resuelta,
  p.marca,
  p.modelo,
  null::integer,
  0::numeric,
  null::text,
  true,
  null::text,
  coalesce(p.notes, '') || case when p.notes is null then '' else ' | ' end || 'Carga inventario 01/04/2026' as notas,
  '2026-04-01T12:00:00+02:00'::timestamptz,
  'carga_inventario_fisico_2026_04_01',
  null::date,
  null::date,
  null::numeric,
  null::text,
  null::text,
  null::text,
  'disponible'::text,
  p.location_name,
  'TR-' || upper(substr(md5(p.location_name || '|' || p.tractor_name), 1, 10)) as codigo_interno,
  'disponible'::text
from prepared p
on conflict (matricula) do update set
  estado_operativo = 'disponible',
  activo = true,
  ubicacion = excluded.ubicacion,
  marca = coalesce(excluded.marca, public.maquinaria_tractores.marca),
  modelo = coalesce(excluded.modelo, public.maquinaria_tractores.modelo),
  notas = excluded.notas;
-- ---------------------------
-- 5) Catálogo inventario (upsert por nombre+categoría)
-- ---------------------------
insert into public.inventario_productos_catalogo (nombre, categoria_id, precio_unitario, unidad_defecto, activo, created_by, created_at)
select
  t.product_name,
  c.id as categoria_id,
  null::numeric as precio_unitario,
  min(t.unit) as unidad_defecto,
  true as activo,
  'carga_inventario_fisico_2026_04_01' as created_by,
  '2026-04-01T12:00:00+02:00'::timestamptz as created_at
from tmp_inventory_load t
join public.inventario_categorias c on lower(c.nombre) = lower(t.category_name)
group by t.product_name, c.id
on conflict (nombre, categoria_id) do update set
  unidad_defecto = coalesce(public.inventario_productos_catalogo.unidad_defecto, excluded.unidad_defecto),
  activo = true;
-- ---------------------------
-- 6) Inserción snapshot en inventario_registros
-- ---------------------------
insert into public.inventario_registros (ubicacion_id, categoria_id, cantidad, unidad, descripcion, foto_url, notas, created_at, precio_unitario, producto_id, foto_url_2, created_by)
select
  u.id as ubicacion_id,
  c.id as categoria_id,
  t.quantity,
  t.unit,
  t.description,
  null::text as foto_url,
  trim(both ' ' from (coalesce('Fuente: ' || t.source_file, '') || case when t.notes is null then '' else ' | ' || t.notes end)) as notas,
  '2026-04-01T12:00:00+02:00'::timestamptz as created_at,
  null::numeric as precio_unitario,
  p.id as producto_id,
  null::text as foto_url_2,
  'carga_inventario_fisico_2026_04_01' as created_by
from tmp_inventory_load t
join public.inventario_ubicaciones u on lower(u.nombre) = lower(t.location_name)
join public.inventario_categorias c on lower(c.nombre) = lower(t.category_name)
join public.inventario_productos_catalogo p on p.nombre = t.product_name and p.categoria_id = c.id;
-- ---------------------------
-- 7) Validación rápida post-carga
-- ---------------------------
select u.nombre as ubicacion, c.nombre as categoria, count(*) as lineas, coalesce(sum(r.cantidad),0) as cantidad_total
from public.inventario_registros r
join public.inventario_ubicaciones u on u.id = r.ubicacion_id
join public.inventario_categorias c on c.id = r.categoria_id
where r.created_by = 'carga_inventario_fisico_2026_04_01'
group by u.nombre, c.nombre
order by u.nombre, c.nombre;
select
  (select count(*) from public.inventario_registros where created_by = 'carga_inventario_fisico_2026_04_01') as inventario_rows,
  (select count(*) from public.maquinaria_tractores where created_by = 'carga_inventario_fisico_2026_04_01' or notas ilike '%Carga inventario 01/04/2026%') as maquinaria_tractores_tocados,
  (select count(*) from public.maquinaria_aperos where created_by = 'carga_inventario_fisico_2026_04_01' or notas ilike '%Carga inventario 01/04/2026%') as maquinaria_aperos_tocados;
-- ---------------------------
-- 8) Sentencias de rollback manual (opcionales)
-- ---------------------------
-- delete from public.inventario_registros where created_by = 'carga_inventario_fisico_2026_04_01';
-- delete from public.inventario_productos_catalogo where created_by = 'carga_inventario_fisico_2026_04_01';
-- delete from public.maquinaria_aperos where created_by = 'carga_inventario_fisico_2026_04_01';
-- delete from public.maquinaria_tractores where created_by = 'carga_inventario_fisico_2026_04_01';
-- delete from public.aperos where created_at = '2026-04-01T12:00:00+02:00'::timestamptz::timestamp and estado = 'disponible';
-- delete from public.tractores where created_at = '2026-04-01T12:00:00+02:00'::timestamptz::timestamp and estado = 'disponible';
commit;