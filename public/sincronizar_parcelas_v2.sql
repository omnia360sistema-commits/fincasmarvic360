-- =============================================
-- SQL PARA SINCRONIZAR PARCELAS MARVIC
-- Fecha: 2026-04-12
-- Total parcelas a sincronizar: 135
-- NOTA: Sin columna "code" - no existe en tabla parcels
-- =============================================

-- PASO 1: Verificar parcelas actuales en BD
SELECT farm, COUNT(*) as parcelas_actuales FROM public.parcels GROUP BY farm ORDER BY farm;

-- PASO 2: UPSERT de todas las parcelas desde GeoJSON

-- === BRAZO DE LA VIRGEN (4 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'brazo_de_la_-s3', 
    'BRAZO DE LA VIRGEN', 
    'SECTOR 3', 
    1.3, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'brazo_de_la_-s4', 
    'BRAZO DE LA VIRGEN', 
    'SECTOR 4', 
    3.53, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'brazo_de_la_-s2', 
    'BRAZO DE LA VIRGEN', 
    'SECTOR 2', 
    1.65, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'brazo_de_la_-s1', 
    'BRAZO DE LA VIRGEN', 
    'SECTOR 1', 
    0.57, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === COLLADOS (18 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s1', 
    'COLLADOS', 
    'SECTOR 1', 
    3.14, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s2', 
    'COLLADOS', 
    'SECTOR 2', 
    4.61, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s3', 
    'COLLADOS', 
    'SECTOR 3', 
    2.37, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s4', 
    'COLLADOS', 
    'SECTOR 4', 
    1.47, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s4', 
    'COLLADOS', 
    'SECTOR 4.1', 
    0.39, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s5', 
    'COLLADOS', 
    'SECTOR 5', 
    5.72, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s6', 
    'COLLADOS', 
    'SECTOR 6', 
    2.99, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s7', 
    'COLLADOS', 
    'SECTOR 7', 
    2.0, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s8', 
    'COLLADOS', 
    'SECTOR 8', 
    2.84, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s9', 
    'COLLADOS', 
    'SECTOR 9', 
    3.77, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s10', 
    'COLLADOS', 
    'SECTOR 10', 
    1.45, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s11', 
    'COLLADOS', 
    'SECTOR 11.1', 
    3.65, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s11', 
    'COLLADOS', 
    'SECTOR 11.2', 
    0.82, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s12', 
    'COLLADOS', 
    'SECTOR 12', 
    1.91, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s13', 
    'COLLADOS', 
    'SECTOR 13', 
    4.54, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s15', 
    'COLLADOS', 
    'SECTOR 15.1', 
    2.2, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s15', 
    'COLLADOS', 
    'SECTOR 15.2', 
    1.06, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'collados-s48', 
    'COLLADOS', 
    'LAGO 1', 
    0.86, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === EL CARMEN (4 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'el_carmen-s1', 
    'EL CARMEN', 
    'SECTOR 1', 
    4.02, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'el_carmen-s2', 
    'EL CARMEN', 
    'SECTOR 2', 
    4.44, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'el_carmen-s3', 
    'EL CARMEN', 
    'SECTOR 3', 
    3.01, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'el_carmen-s4', 
    'EL CARMEN', 
    'SECTOR 4', 
    1.91, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === FRANCES (4 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'frances-s4', 
    'FRANCES', 
    'SECTO 4', 
    3.58, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'frances-s3', 
    'FRANCES', 
    'SECTOR 3', 
    5.09, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'frances-s2', 
    'FRANCES', 
    'SECTOR 2', 
    6.0, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'frances-s1', 
    'FRANCES', 
    'SECTOR 1', 
    6.68, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === LA ALMAJALETA (2 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_almajalet-s1', 
    'LA ALMAJALETA', 
    'SECTOR 1', 
    0.75, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_almajalet-s2', 
    'LA ALMAJALETA', 
    'SECTOR 2', 
    0.33, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === LA BARDA (28 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s1', 
    'LA BARDA', 
    'SECTOR 1', 
    3.12, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s2', 
    'LA BARDA', 
    'SECTOR 2', 
    3.12, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s3', 
    'LA BARDA', 
    'SECTOR 3', 
    2.89, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s4', 
    'LA BARDA', 
    'SECTOR 4', 
    3.15, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s5', 
    'LA BARDA', 
    'SECTOR 5', 
    3.32, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s6', 
    'LA BARDA', 
    'SECTOR 6', 
    2.96, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s7', 
    'LA BARDA', 
    'SECTOR 7', 
    2.68, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s8b', 
    'LA BARDA', 
    'SECTOR 8-B', 
    1.47, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s8a', 
    'LA BARDA', 
    'SECTOR 8-A', 
    1.36, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s9', 
    'LA BARDA', 
    'SECTOR 9', 
    2.94, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s10', 
    'LA BARDA', 
    'SECTOR 10', 
    2.83, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s11', 
    'LA BARDA', 
    'SECTOR 11', 
    3.04, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s12', 
    'LA BARDA', 
    'SECTOR 12', 
    3.26, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s13', 
    'LA BARDA', 
    'SECTOR 13', 
    3.05, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s14', 
    'LA BARDA', 
    'SECTOR 14', 
    3.01, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s15', 
    'LA BARDA', 
    'SECTOR 15', 
    3.02, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s16', 
    'LA BARDA', 
    'SECTOR 16', 
    3.07, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s18a', 
    'LA BARDA', 
    'SECTOR 18-A', 
    1.17, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s17', 
    'LA BARDA', 
    'SECTOR 17', 
    2.92, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s18b', 
    'LA BARDA', 
    'SECTOR 18-B', 
    1.5, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s19', 
    'LA BARDA', 
    'SECTOR 19', 
    1.81, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s20', 
    'LA BARDA', 
    'SECTOR 20', 
    2.87, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s21', 
    'LA BARDA', 
    'SECTOR 21', 
    2.15, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s22', 
    'LA BARDA', 
    'SECTOR 22', 
    1.64, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s23', 
    'LA BARDA', 
    'SECTOR 23', 
    2.85, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s24', 
    'LA BARDA', 
    'SECTOR 24', 
    3.2, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s25', 
    'LA BARDA', 
    'SECTOR 25', 
    2.95, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_barda-s26', 
    'LA BARDA', 
    'SECTOR 26', 
    2.89, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === LA CONCEPCION (23 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s1a', 
    'LA CONCEPCION', 
    'SECTOR 1-A', 
    1.19, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s1b', 
    'LA CONCEPCION', 
    'SECTOR 1-B', 
    1.48, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s1c', 
    'LA CONCEPCION', 
    'SECTOR 1-C', 
    1.05, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s2a', 
    'LA CONCEPCION', 
    'SECTOR 2-A', 
    1.37, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s2c', 
    'LA CONCEPCION', 
    'SECTOR 2-C', 
    0.79, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s2b', 
    'LA CONCEPCION', 
    'SECTOR 2-B', 
    1.35, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s2d', 
    'LA CONCEPCION', 
    'SECTOR 2-D', 
    0.74, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s3a', 
    'LA CONCEPCION', 
    'SECTO 3-A', 
    0.94, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s3b', 
    'LA CONCEPCION', 
    'SECTOR 3-B', 
    1.51, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s3c', 
    'LA CONCEPCION', 
    'SECTOR 3-C', 
    1.47, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s3d', 
    'LA CONCEPCION', 
    'SECTOR 3-D', 
    1.43, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s4a', 
    'LA CONCEPCION', 
    'SECTOR 4-A', 
    1.64, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s4b', 
    'LA CONCEPCION', 
    'SECTOR 4-B', 
    1.9, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s4c', 
    'LA CONCEPCION', 
    'SECTOR 4-C', 
    1.94, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s5a', 
    'LA CONCEPCION', 
    'SECTOR 5-A', 
    0.86, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s5b', 
    'LA CONCEPCION', 
    'SECTOR 5-B', 
    1.47, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s6', 
    'LA CONCEPCION', 
    'SECTOR 6', 
    0.73, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s7', 
    'LA CONCEPCION', 
    'SECTOR 7', 
    1.01, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s8', 
    'LA CONCEPCION', 
    'SECTOR 8', 
    1.38, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s9', 
    'LA CONCEPCION', 
    'SECTOR 9', 
    1.15, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s10', 
    'LA CONCEPCION', 
    'SECTOR 10', 
    0.98, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s11', 
    'LA CONCEPCION', 
    'SECTOR 11', 
    0.72, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_concepcio-s12', 
    'LA CONCEPCION', 
    'SECTOR 12', 
    0.66, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === LA NUEVA (14 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s1a', 
    'LA NUEVA', 
    'SECTOR 1-A', 
    1.02, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s1b', 
    'LA NUEVA', 
    'SECTOR 1-B', 
    1.47, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s2a', 
    'LA NUEVA', 
    'SECTOR 2-A', 
    0.54, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s2b', 
    'LA NUEVA', 
    'SECTOR 2-B', 
    0.72, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s3', 
    'LA NUEVA', 
    'SECTOR 3', 
    1.92, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s4', 
    'LA NUEVA', 
    'SECTOR 4', 
    1.88, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s5', 
    'LA NUEVA', 
    'SECTOR 5', 
    1.34, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s6a', 
    'LA NUEVA', 
    'SECTOR 6-A', 
    0.48, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s6b', 
    'LA NUEVA', 
    'SECTOR 6-B', 
    0.95, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s7', 
    'LA NUEVA', 
    'SECTOR 7', 
    1.95, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s8', 
    'LA NUEVA', 
    'SECTOR 8', 
    0.93, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s9', 
    'LA NUEVA', 
    'SECTOR 9', 
    0.97, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s10', 
    'LA NUEVA', 
    'SECTOR 10', 
    1.35, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'la_nueva-s11', 
    'LA NUEVA', 
    'SECTOR 11', 
    2.01, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === LONSORDO (7 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'lonsordo-s1', 
    'LONSORDO', 
    'SECTOR 1', 
    1.97, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'lonsordo-s2', 
    'LONSORDO', 
    'SECTOR 2', 
    2.38, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'lonsordo-s3', 
    'LONSORDO', 
    'SECTOR 3', 
    1.59, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'lonsordo-s4', 
    'LONSORDO', 
    'SECTOR 4', 
    0.95, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'lonsordo-s5', 
    'LONSORDO', 
    'SECTOR 5', 
    2.09, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'lonsordo-s6', 
    'LONSORDO', 
    'SECTOR 6', 
    1.02, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'lonsordo-s7', 
    'LONSORDO', 
    'SECTOR 7', 
    0.83, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === LOS CLRERIGOS (7 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'los_clrerigo-s116', 
    'LOS CLRERIGOS', 
    'PARCELA 4-6 A', 
    1.86, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'los_clrerigo-s117', 
    'LOS CLRERIGOS', 
    'PARCELA 5-6 B', 
    0.93, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'los_clrerigo-s118', 
    'LOS CLRERIGOS', 
    'PARCELA 20 A-6 A', 
    1.79, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'los_clrerigo-s119', 
    'LOS CLRERIGOS', 
    'PARCELA 20 B-6 B', 
    1.19, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'los_clrerigo-s120', 
    'LOS CLRERIGOS', 
    'PARCELA 24-25-29', 
    1.41, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'los_clrerigo-s121', 
    'LOS CLRERIGOS', 
    'PARCELA 22-23', 
    1.21, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'los_clrerigo-s122', 
    'LOS CLRERIGOS', 
    'PARCELA 26', 
    0.93, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === MAYORAZGO (17 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s5', 
    'MAYORAZGO', 
    'SECTOR 5', 
    5.51, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s4a', 
    'MAYORAZGO', 
    'SECTOR 4-A', 
    1.45, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s6', 
    'MAYORAZGO', 
    'SECTOR 6', 
    3.61, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s4b', 
    'MAYORAZGO', 
    'SECTOR 4-B', 
    3.21, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s2e', 
    'MAYORAZGO', 
    'SECTOR 2-E', 
    1.58, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s2d', 
    'MAYORAZGO', 
    'SECTOR 2-D', 
    1.32, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s2c', 
    'MAYORAZGO', 
    'SECTOR 2-C', 
    1.31, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s2b', 
    'MAYORAZGO', 
    'SECTOR 2B', 
    0.9, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s2a', 
    'MAYORAZGO', 
    'SECTOR 2-A', 
    0.5, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s1a', 
    'MAYORAZGO', 
    'SECTOR 1-A', 
    0.52, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s1b', 
    'MAYORAZGO', 
    'SECTOR 1-B', 
    1.06, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s1c', 
    'MAYORAZGO', 
    'SECTOR 1-C', 
    1.72, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s1d', 
    'MAYORAZGO', 
    'SECTOR 1-D', 
    1.48, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s1e', 
    'MAYORAZGO', 
    'SECTOR 1-E', 
    1.72, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s3b', 
    'MAYORAZGO', 
    'SECTOR 3-B', 
    1.94, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s3a', 
    'MAYORAZGO', 
    'SECTOR 3-A', 
    1.57, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'mayorazgo-s7', 
    'MAYORAZGO', 
    'SECTOR 7', 
    1.16, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === PASO LOBO (4 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'paso_lobo-s1', 
    'PASO LOBO', 
    'SECTOR 1', 
    3.24, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'paso_lobo-s2', 
    'PASO LOBO', 
    'SECTO 2', 
    3.6, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'paso_lobo-s3', 
    'PASO LOBO', 
    'SECTOR 3', 
    3.54, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'paso_lobo-s4', 
    'PASO LOBO', 
    'SECTO 4', 
    3.32, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- === TRIGUEROS (3 parcelas) ===

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'trigueros-s1', 
    'TRIGUEROS', 
    'SECTOR 1', 
    0.57, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'trigueros-s2', 
    'TRIGUEROS', 
    'SECTOR 2', 
    0.61, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    'trigueros-s3', 
    'TRIGUEROS', 
    'SECTOR 3', 
    0.94, 
    'goteo'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;

-- =============================================
-- PASO 3: Verificación post-actualización
-- =============================================

SELECT
    farm,
    COUNT(*) as total_parcelas,
    SUM(area_hectares) as superficie_total_ha
FROM public.parcels
GROUP BY farm
ORDER BY farm;

-- Verificar parcelas vacías (listas para usar)
SELECT parcel_id, farm, parcel_number, area_hectares
FROM public.parcels
WHERE status = 'vacia'::estado_parcela
ORDER BY farm, parcel_number;