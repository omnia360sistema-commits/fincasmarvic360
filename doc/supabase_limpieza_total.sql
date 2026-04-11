-- =============================================================================
-- LIMPIEZA TOTAL — Fincas Marvic 360
-- Borra TODOS los datos operacionales.
-- PRESERVA: estructura (tablas, funciones, RLS, índices), catálogos base,
--           companies, user_profiles, parcels (GeoJSON).
--
-- Ejecutar en SQL Editor de Supabase como service_role.
-- Para rollback: restaurar desde supabase_data_dump.sql del 11/04/2026.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- NIVEL 1: Tablas hoja (sin dependientes, o solo referenciadas por otras hojas)
-- Orden: de más dependiente a menos, para respetar FKs
-- ─────────────────────────────────────────────────────────────────────────────

-- Presencia / GPS
TRUNCATE public.presencia_tiempo_real CASCADE;
TRUNCATE public.vehicle_positions CASCADE;

-- Trazabilidad
TRUNCATE public.movimientos_palot CASCADE;
TRUNCATE public.palots CASCADE;
TRUNCATE public.camaras_almacen CASCADE;
TRUNCATE public.trazabilidad_registros CASCADE;
TRUNCATE public.tickets_pesaje CASCADE;

-- Parte Diario (hijos primero)
TRUNCATE public.parte_estado_finca CASCADE;
TRUNCATE public.parte_trabajo CASCADE;
TRUNCATE public.parte_personal CASCADE;
TRUNCATE public.parte_residuos_vegetales CASCADE;
TRUNCATE public.cierres_jornada CASCADE;
TRUNCATE public.partes_diarios CASCADE;

-- Trabajos
TRUNCATE public.trabajos_incidencias CASCADE;
TRUNCATE public.trabajos_registro CASCADE;
TRUNCATE public.work_records_cuadrillas CASCADE;
TRUNCATE public.work_records CASCADE;
TRUNCATE public.planificacion_campana CASCADE;

-- Inventario (hijos primero)
TRUNCATE public.inventario_registros CASCADE;
TRUNCATE public.inventario_movimientos CASCADE;
TRUNCATE public.inventario_entradas CASCADE;
TRUNCATE public.inventario_informes CASCADE;
TRUNCATE public.inventario_ubicacion_activo CASCADE;
TRUNCATE public.inventario_productos_catalogo CASCADE;

-- Maquinaria (hijos primero)
TRUNCATE public.maquinaria_uso CASCADE;
TRUNCATE public.maquinaria_mantenimiento CASCADE;
TRUNCATE public.maquinaria_inventario_sync CASCADE;
TRUNCATE public.maquinaria_aperos CASCADE;
TRUNCATE public.maquinaria_tractores CASCADE;

-- Logística (hijos primero)
TRUNCATE public.logistica_combustible CASCADE;
TRUNCATE public.logistica_mantenimiento CASCADE;
TRUNCATE public.logistica_viajes CASCADE;
TRUNCATE public.logistica_inventario_sync CASCADE;
TRUNCATE public.logistica_conductores CASCADE;
TRUNCATE public.vehiculos_empresa CASCADE;
TRUNCATE public.camiones CASCADE;

-- Personal
TRUNCATE public.personal_tipos_trabajo CASCADE;
TRUNCATE public.personal_externo CASCADE;
TRUNCATE public.personal CASCADE;

-- Campo / Parcelas (datos, NO la parcela en sí)
TRUNCATE public.parcel_photos CASCADE;
TRUNCATE public.fotos_campo CASCADE;
TRUNCATE public.registros_estado_parcela CASCADE;
TRUNCATE public.certificaciones_parcela CASCADE;
TRUNCATE public.residuos_operacion CASCADE;
TRUNCATE public.parcel_production CASCADE;
TRUNCATE public.plantings CASCADE;
TRUNCATE public.harvests CASCADE;

-- Análisis
TRUNCATE public.analisis_suelo CASCADE;
TRUNCATE public.analisis_agua CASCADE;
TRUNCATE public.lecturas_sensor_planta CASCADE;
TRUNCATE public.registros_riego CASCADE;
TRUNCATE public.sistema_riego_zonas CASCADE;

-- Proveedores
TRUNCATE public.proveedores_precios CASCADE;
TRUNCATE public.proveedores CASCADE;

-- Cuadrillas / Ganaderos
TRUNCATE public.cuadrillas CASCADE;
TRUNCATE public.ganaderos CASCADE;

-- AI / LIA
TRUNCATE public.ai_proposal_validations CASCADE;
TRUNCATE public.ai_proposals CASCADE;
TRUNCATE public.lia_contexto_sesion CASCADE;
TRUNCATE public.lia_memoria CASCADE;
TRUNCATE public.lia_patrones CASCADE;

-- ERP
TRUNCATE public.erp_exportaciones CASCADE;

-- Legacy
TRUNCATE public.aperos CASCADE;
TRUNCATE public.tractores CASCADE;
TRUNCATE public.vuelos_dron CASCADE;

-- Pilot tables
TRUNCATE public.pilot_fallback_log CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- NIVEL 2: Resetear parcelas a estado limpio (mantener estructura GeoJSON)
-- Las parcelas se re-sincronizan desde el GeoJSON al cargar FarmMap.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE public.parcels SET
  status = 'vacia',
  tipo_suelo = NULL,
  ph_suelo = NULL,
  materia_organica_pct = NULL,
  ultima_analisis_suelo = NULL,
  irrigation_type_v2 = NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- NIVEL 3: LO QUE SE PRESERVA (NO tocar)
-- ─────────────────────────────────────────────────────────────────────────────
-- ✓ parcels                    → 119 sectores GeoJSON (reseteados a 'vacia')
-- ✓ companies                  → tenant piloto '00000000-...-000001'
-- ✓ user_profiles              → perfil admin
-- ✓ usuario_roles              → rol admin
-- ✓ inventario_categorias      → 9 categorías (Fitosanitarios, Material riego, etc.)
-- ✓ inventario_ubicaciones     → 6 ubicaciones (Semillero, Naves, Cabezales)
-- ✓ catalogo_tipos_trabajo     → tipos de trabajo por categoría
-- ✓ catalogo_tipos_mantenimiento → tipos de mantenimiento
-- ✓ cultivos_catalogo          → catálogo de cultivos
-- ✓ pilot_config               → config modo piloto
-- ✓ pilot_fallback_table_allowlist → config piloto
-- ✓ pilot_fallback_user_allowlist  → config piloto
-- ✓ Todas las funciones SQL    → current_user_company_id(), etc.
-- ✓ Todas las RLS policies     → _pilot_open, anon access QR
-- ✓ Todos los índices          → idx_*_company_id, etc.

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN POST-LIMPIEZA
-- ─────────────────────────────────────────────────────────────────────────────

-- Debe devolver 0 en todo excepto las tablas preservadas
SELECT 'parcels' as tabla, count(*) as filas FROM public.parcels
UNION ALL SELECT 'companies', count(*) FROM public.companies
UNION ALL SELECT 'user_profiles', count(*) FROM public.user_profiles
UNION ALL SELECT 'usuario_roles', count(*) FROM public.usuario_roles
UNION ALL SELECT 'inventario_categorias', count(*) FROM public.inventario_categorias
UNION ALL SELECT 'inventario_ubicaciones', count(*) FROM public.inventario_ubicaciones
UNION ALL SELECT 'catalogo_tipos_trabajo', count(*) FROM public.catalogo_tipos_trabajo
UNION ALL SELECT 'catalogo_tipos_mantenimiento', count(*) FROM public.catalogo_tipos_mantenimiento
UNION ALL SELECT 'cultivos_catalogo', count(*) FROM public.cultivos_catalogo
UNION ALL SELECT 'personal', count(*) FROM public.personal
UNION ALL SELECT 'maquinaria_tractores', count(*) FROM public.maquinaria_tractores
UNION ALL SELECT 'inventario_registros', count(*) FROM public.inventario_registros
UNION ALL SELECT 'trabajos_registro', count(*) FROM public.trabajos_registro
UNION ALL SELECT 'partes_diarios', count(*) FROM public.partes_diarios
ORDER BY tabla;

COMMIT;
