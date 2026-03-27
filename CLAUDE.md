# AGRÍCOLA MARVIC 360 — CONTEXTO COMPLETO DEL PROYECTO

## IDENTIDAD DEL PROYECTO

**Nombre:** Agrícola Marvic 360
**Tipo:** ERP agrícola digital completo para explotación hortícola ecológica
**Cliente:** Grupo MARVIC — 250 ha ecológicas en Murcia y Valencia
**Director técnico:** JuanPe — conoce las fincas y parcelas desde años de trabajo externo
**Stack:** React + TypeScript + Tailwind CSS + Supabase (PostgreSQL) + Leaflet + React Query + jsPDF + SheetJS (xlsx 0.18.5)
**Ruta del proyecto:** `/home/pedro/Escritorio/PC/fincasmarvic-main/`
**Puerto dev:** `localhost:8080` (npm run dev)
**Compilación:** `npx tsc --noEmit` debe dar 0 errores siempre

---

## REGLA DE TRABAJO — OBLIGATORIA

1. JuanPe pide UNA cosa concreta
2. Lees los archivos afectados primero
3. Muestras los cambios en diff antes de aplicar
4. Aplicas SOLO si JuanPe confirma
5. Verificas con `npx tsc --noEmit` = 0 errores
6. Confirmas y esperas el siguiente paso

**NUNCA** hagas cambios en múltiples archivos a la vez sin confirmación.
**NUNCA** asumas que algo funciona sin verificar la compilación.
**SIEMPRE** entrega archivos completos, nunca fragmentos ni parches.

---

## FINCAS REALES (7 fincas, 119 sectores, 211.94 ha)

| Nombre exacto | Sectores | Ha |
|---|---|---|
| LA CONCEPCION | 24 | 28.37 |
| LONSORDO | 16 | 10.54 |
| FINCA COLLADOS | 18 | 46.06 |
| FINCA BRAZO DE LA VIRGEN | 4 | 7.08 |
| FINCA LA BARDA | 28 | 74.70 |
| FINCA LA NUEVA | 13 | 15.66 |
| FINCA MAYORAZGO | 16 | 29.53 |

**CRÍTICO:** Los nombres deben ser exactamente como están escritos arriba.
**GeoJSON:** `public/FINCAS_MARVIC_FINAL.geojson` — coordenadas WGS84, NO convertir UTM.

---

## ALERTAS CRÍTICAS — NO ROMPER NUNCA

1. `parcel_id` es **TEXT** en **TODAS** las tablas sin excepción — consistencia total desde 27/03/2026
2. Estado parcela usa `'vacia'` **NUNCA** `'empty'`
3. GeoJSON ya está en WGS84 — NO aplicar conversión UTM
4. Navegación a fincas usa `encodeURIComponent(ruta)` en el link
5. El panel antiguo de bottom sheet fue ELIMINADO — no restaurar
6. Bucket Supabase Storage: `parcel-images` — existe y funciona con políticas RLS para `anon`
7. Bucket Supabase Storage: `inventario-images` — existe y funciona con políticas RLS para `anon`
8. `analisis_suelo` y `lecturas_sensor_planta` **migradas de UUID a TEXT** el 27/03/2026 — ya son TEXT como el resto
9. Solo existen **7 fincas reales** (las del GeoJSON) — no crear ni asumir fincas de prueba

---

## ESTRUCTURA DE ARCHIVOS CLAVE

```
src/
  pages/
    Dashboard.tsx          — Pantalla principal: grid 9 módulos 3×3 (CAMPO, INVENTARIO, TRABAJOS, LOGÍSTICA, MAQUINARIA, PERSONAL, TRAZABILIDAD, MATERIALES, AUDITORÍA) + 3 botones + KPIs
    FarmMap.tsx            — Mapa sistema operativo: menú 6 módulos + botón Informe PDF
    FarmSelector.tsx       — Selector real de fincas (reescrito)
    Inventario.tsx         — Pantalla principal inventario: 6 ubicaciones, KPIs dinámicos
    InventarioUbicacion.tsx — Pantalla ubicación: 7 categorías, panel lateral, modales, informes PDF
    Trabajos.tsx           — 4 sub-bloques (logística, maquinaria agrícola, M.O. interna, M.O. externa) + incidencias urgentes/no urgentes + PDF
    Logistica.tsx          — Camiones (ITV, mantenimiento, viajes) + conductores legacy + PDF; conductores nuevos vía Personal
    Maquinaria.tsx         — Tractores (ficha técnica, horas) + aperos + registros uso + mantenimientos + PDF; tractoristas nuevos vía Personal
    Personal.tsx           — 5 tabs (Operarios, Encargados, Maquinaria, Camión, Externa) + fichas + modales + PDF
  components/
    ParcelDetailPanel.tsx  — Modal datos básicos del sector (SIN formularios)
    ParcelHistory.tsx      — Panel historial 6 tabs
    RegisterWorkForm.tsx   — Formulario registro trabajo
    RegisterPlantingForm.tsx — Formulario plantación
    RegisterHarvestForm.tsx  — Formulario cosecha 2 pasos
    RegisterParcelEstadoForm.tsx — Estado parcela 6 botones
    UploadParcelPhoto.tsx  — Captura foto + subida Storage (spinner CSS, sin Loader2)
    RegisterAnalisisSueloForm.tsx — Análisis suelo Hanna HI9814 + LaMotte
    RegisterLecturaSensorForm.tsx — Lectura NDVI/SPAD con semáforo
    RegisterAnalisisAguaForm.tsx  — Análisis agua por fuente
    QRCuadrilla.tsx        — Página QR fichaje campo (en desarrollo, sin ruta en App.tsx)
  hooks/
    useGeoJSON.ts          — Carga GeoJSON + upsert Supabase
    useParcelData.ts       — Todos los hooks de datos de parcelas
    useInventario.ts       — Hooks módulo inventario (ubicaciones, categorías, registros, conteos, informes)
    useTrabajos.ts         — 6 hooks: useRegistrosTrabajos, useAddTrabajoRegistro, useIncidencias, useAddIncidencia, useUpdateIncidencia, useKPIsTrabajos
    useLogistica.ts        — 8 hooks: useCamiones, useAddCamion, useUpdateCamion, useConductores, useViajes, useAddViaje, useMantenimientoCamion, useAddMantenimientoCamion, useKPIsLogistica
    useMaquinaria.ts       — 8 hooks: useTractores, useAddTractor, useUpdateTractor, useAperos, useAddApero, useUsosMaquinaria, useAddUsoMaquinaria, useMantenimientoTractor, useAddMantenimientoTractor, useKPIsMaquinaria
    usePersonal.ts         — 7 hooks: usePersonal, useAddPersonal, useUpdatePersonal, usePersonalExterno, useAddPersonalExterno, useUpdatePersonalExterno, useKPIsPersonal
  context/
    ThemeContext.tsx        — Contexto tema oscuro/claro, persiste en localStorage('marvic-theme')
  types/
    farm.ts                — ParcelFeature, ParcelStatus, STATUS_COLORS, STATUS_LABELS
  integrations/
    supabase/types.ts      — Tipos generados Supabase (incluye tablas inventario + trabajos + logística + maquinaria)
  App.css                  — Reset Vite: max-width:100%, margin:0, padding:0
  index.css                — Tailwind + .parcel-label estilos mapa
public/
  FINCAS_MARVIC_FINAL.geojson — 119 sectores reales WGS84
  FINCAS_COMPLETAS.geojson    — ANTIGUO en UTM — NO USAR
  MARVIC_logo.png             — Logo usado como watermark en Inventario y Dashboard
doc/
  generar_seed_inventario.py  — Script Python que lee Excel y genera seed_inventario_historico.sql
  seed_inventario_historico.sql — SQL listo para ejecutar en Supabase (177 productos + 431 registros)
```

---

## DISEÑO VISUAL — DECISIONES TOMADAS

**Estilo:** Sistema operativo de control agrícola industrial.
**Colores:** `bg-[#020617]` fondo, `#38bdf8` acento azul, `bg-slate-900` paneles.
**Tipografía:** Inter (ya configurada en index.css).
**Tema:** oscuro/claro persistente vía ThemeContext + localStorage. Botón solo en Dashboard.

**⚠️ NOTA CRÍTICA — PANTALLA PRINCIPAL:**
- Dashboard.tsx es ahora un **grid de 9 módulos (3×3)**, NO un grid de fincas
- El acceso a fincas se hace desde el módulo CAMPO (`/farm`)
- Los módulos TRAZABILIDAD, MATERIALES y AUDITORÍA muestran modal "En desarrollo"
- Los 3 botones inferiores (Estado General, Históricos, Exportar PDF) también muestran modal "En desarrollo"

**Estructura Dashboard (actualizado 27/03/2026):**
- Grid **10 módulos** (3 columnas): CAMPO (verde), INVENTARIO (azul), TRABAJOS (ámbar), LOGÍSTICA (violeta), MAQUINARIA (naranja), PERSONAL (fuchsia `#e879f9`), PARTE DIARIO (`#4ade80`, `ClipboardList`, `/parte-diario`), TRAZABILIDAD (wip), MATERIALES (wip), AUDITORÍA (wip)
- Cada módulo tiene icono con color de acento propio, nombre, descripción y flecha de navegación
- KPIs globales (fincas/sectores/ha) en la parte superior
- 3 botones pequeños en la parte inferior (Estado General, Históricos, Exportar PDF)
- Modal "En desarrollo" para módulos y botones aún no implementados

**Estructura módulos Trabajos / Logística / Maquinaria (colores de acento):**
- Trabajos: `#f59e0b` (ámbar) — header con botón urgentes + PDF
- Logística: `#a78bfa` (violeta) — tabs camiones/conductores + botón viaje + PDF
- Maquinaria: `#fb923c` (naranja) — tabs tractores/aperos/uso + botón uso + PDF

**Estructura FarmMap:**
- Mapa 100% fondo siempre
- Panel identidad superior izquierda (finca + hora + estado)
- Menú vertical 7 botones superior derecha (SECTORES/REGISTRAR/ANÁLISIS/TRAZABILIDAD/ALERTAS/HISTÓRICO + divisor + INFORME PDF)
- Cada módulo abre panel lateral — NO cubre el mapa completo
- Cada acción (formulario) abre modal centrado independiente
- Barra inferior de estado (finca, sectores, coordenadas, hora)
- **NOTA:** FarmMap usa clases hardcoded oscuras — NO tiene variantes `dark:` implementadas aún

**Estructura InventarioUbicacion:**
- Fondo: logo MARVIC watermark centrado (opacity 0.04)
- Panel identidad superior izquierda
- Menú vertical derecha: 7 categorías + divisor + Informe PDF
- Panel lateral: Estado actual / Histórico
- Modal: Añadir Registro (foto, cantidad, unidad, descripción, notas)
- Modal: Informe PDF (3 opciones con generación jsPDF + fotos vía canvas)

**Generación PDF (patrón común en FarmMap e InventarioUbicacion):**
- `writeLine / checkPage / separator` — helpers de layout
- `loadImage(url)` — fetch + canvas → base64 JPEG, devuelve null si falla
- `addPhoto(url)` — añade "Foto adjunta:" + imagen 80mm proporcional, no-op si url es null
- Descarga automática con nombre descriptivo

---

## BASE DE DATOS SUPABASE — TABLAS PRINCIPALES

```sql
-- FINCAS Y PARCELAS
parcels          — parcel_id TEXT PK, farm, parcel_number, area_hectares
cultivos_catalogo — nombre_interno UNIQUE, ciclo_dias, rendimiento_kg_ha, kg_plastico_por_ha

-- OPERACIONES AGRÍCOLAS
plantings        — parcel_id TEXT FK, crop, date, variedad, lote_semilla
harvests         — parcel_id TEXT FK, crop, date, production_kg, price_kg
work_records     — parcel_id TEXT FK, work_type, date, cuadrilla_id UUID FK, workers_count, hours_worked, notes
cuadrillas       — id UUID, nombre, qr_code UNIQUE, activa BOOL
camiones         — id UUID, matricula UNIQUE, activo BOOL, marca, modelo, anio, fecha_itv, notas_mantenimiento, foto_url, created_by (ampliado 26/03/2026)
tickets_pesaje   — harvest_id UUID FK, peso_neto_kg GENERATED, numero_albaran UNIQUE, destino
residuos_operacion — parcel_id TEXT FK, tipo_residuo ENUM, kg_instalados, kg_retirados
certificaciones_parcela — parcel_id TEXT FK, estado ENUM, fecha_inicio, fecha_fin, entidad_certificadora

-- ANÁLISIS (parcel_id es UUID aquí, NO TEXT — CRÍTICO)
analisis_suelo   — parcel_id UUID FK, ph, conductividad_ec, salinidad_ppm, nitrogeno_ppm, fosforo_ppm, potasio_ppm
lecturas_sensor_planta — parcel_id UUID FK, indice_salud, nivel_estres, ndvi, clorofila
analisis_agua    — finca TEXT, fuente TEXT, ph, conductividad_ec, salinidad_ppm

-- INVENTARIO DE ACTIVOS FÍSICOS (6 tablas)
inventario_ubicaciones        — id UUID PK, nombre TEXT UNIQUE, descripcion, foto_url, activa BOOL, orden INT
inventario_categorias         — id UUID PK, nombre TEXT UNIQUE, slug TEXT UNIQUE, icono TEXT, orden INT
inventario_productos_catalogo — id UUID PK, nombre TEXT, categoria_id UUID FK, precio_unitario NUMERIC, unidad TEXT, activo BOOL
inventario_registros          — id UUID PK, ubicacion_id UUID FK, categoria_id UUID FK, producto_id UUID FK, cantidad NUMERIC NOT NULL, unidad TEXT, descripcion, foto_url, foto_url_2, precio_unitario NUMERIC, responsable TEXT, notas, created_at, created_by UUID
inventario_movimientos        — id UUID PK, categoria_id UUID FK, producto_id UUID FK, cantidad NUMERIC, ubicacion_origen_id UUID FK, ubicacion_destino_id UUID FK, fecha TIMESTAMPTZ, notas TEXT
inventario_informes           — id UUID PK, tipo TEXT, fecha_inicio DATE, fecha_fin DATE, ubicacion_id UUID FK, categoria_id UUID FK, contenido JSONB, generado_at

-- MÓDULO TRABAJOS (2 tablas)
trabajos_registro    — id UUID PK, tipo_bloque ENUM(logistica|maquinaria_agricola|mano_obra_interna|mano_obra_externa), fecha DATE, hora_inicio/fin TIMESTAMPTZ, finca TEXT, parcel_id TEXT, tipo_trabajo TEXT, num_operarios INT, nombres_operarios TEXT, foto_url, notas, created_by
trabajos_incidencias — id UUID PK, urgente BOOL, titulo TEXT, descripcion, finca TEXT, parcel_id TEXT, estado ENUM(abierta|en_proceso|resuelta), foto_url, fecha DATE, fecha_resolucion, notas_resolucion, created_by

-- MÓDULO PERSONAL (2 tablas)
personal           — id UUID PK, nombre TEXT, dni, telefono, categoria TEXT CHECK(operario_campo|encargado|conductor_maquinaria|conductor_camion), activo BOOL, foto_url, qr_code TEXT UNIQUE DEFAULT gen_random_uuid()::text, notas, created_at, created_by
personal_externo   — id UUID PK, nombre_empresa TEXT, nif, telefono_contacto, tipo TEXT CHECK(destajo|jornal_servicio), activo BOOL, qr_code TEXT UNIQUE DEFAULT gen_random_uuid()::text, notas, created_at, created_by

-- MÓDULO LOGÍSTICA (3 tablas + camiones ampliado)
logistica_conductores    — id UUID PK, nombre TEXT, telefono, activo BOOL, notas, created_by [DEPRECATED — solo lectura histórica]
logistica_viajes         — id UUID PK, conductor_id UUID FK (legacy), personal_id UUID FK → personal, camion_id UUID FK, finca, destino, trabajo_realizado, ruta, hora_salida/llegada TIMESTAMPTZ, gasto_gasolina_litros/euros NUMERIC, km_recorridos, notas, created_by
logistica_mantenimiento  — id UUID PK, camion_id UUID FK, tipo TEXT, descripcion, fecha DATE, coste_euros, proveedor, foto_url, foto_url_2, created_by

-- MÓDULO MAQUINARIA (4 tablas)
maquinaria_tractores      — id UUID PK, matricula TEXT UNIQUE, marca, modelo, anio, horas_motor NUMERIC, ficha_tecnica TEXT, activo BOOL, foto_url, notas, fecha_proxima_itv, fecha_proxima_revision, horas_proximo_mantenimiento, gps_info, created_by
maquinaria_aperos         — id UUID PK, tipo TEXT, descripcion, tractor_id UUID FK, activo BOOL, foto_url, notas, created_by
maquinaria_uso            — id UUID PK, tractor_id UUID FK, apero_id UUID FK, tractorista TEXT (legacy nombre), personal_id UUID FK → personal, finca, parcel_id TEXT, tipo_trabajo, fecha DATE, hora_inicio/fin TIMESTAMPTZ, horas_trabajadas NUMERIC, gasolina_litros NUMERIC, notas, created_by
maquinaria_mantenimiento  — id UUID PK, tractor_id UUID FK, tipo TEXT, descripcion, fecha DATE, horas_motor_al_momento NUMERIC, coste_euros, proveedor, foto_url, foto_url_2, created_by
maquinaria_tractoristas   — id UUID PK [DEPRECATED — solo lectura histórica]

-- PARTE DIARIO (5 tablas)
partes_diarios           — id UUID PK, fecha DATE UNIQUE, responsable TEXT DEFAULT 'JuanPe', notas_generales TEXT, created_at
parte_estado_finca       — id UUID PK, parte_id UUID FK, finca TEXT, parcel_id TEXT, estado TEXT, num_operarios INT, nombres_operarios TEXT, foto_url TEXT, foto_url_2 TEXT, notas TEXT, created_at
parte_trabajo            — id UUID PK, parte_id UUID FK, tipo_trabajo TEXT, finca TEXT, ambito TEXT, parcelas TEXT[], num_operarios INT, nombres_operarios TEXT, hora_inicio TIMESTAMPTZ, hora_fin TIMESTAMPTZ, foto_url TEXT, foto_url_2 TEXT, notas TEXT, created_at
parte_personal           — id UUID PK, parte_id UUID FK, texto TEXT, con_quien TEXT, donde TEXT, foto_url TEXT, fecha_hora TIMESTAMPTZ, created_at
parte_residuos_vegetales — id UUID PK, parte_id UUID FK, nombre_conductor TEXT, hora_salida_nave TIMESTAMPTZ, nombre_ganadero TEXT, hora_llegada_ganadero TIMESTAMPTZ, hora_regreso_nave TIMESTAMPTZ, foto_url TEXT, notas_descarga TEXT, created_at
```

**ENUMs:**
- `estado_parcela`: activa | plantada | preparacion | cosechada | **vacia** | baja
- `tipo_riego`: goteo | tradicional | aspersion | ninguno
- `tipo_residuo`: plastico_acolchado | cinta_riego | rafia | envase_fitosanitario | otro
- `estado_certificacion`: vigente | suspendida | en_tramite | caducada

**Seeds fijos en inventario:**
- 6 ubicaciones físicas (Nave Collados+Brazo Virgen, Cabezal La Barda, Nave Polígono La Barda, Nave La Concepción, Nave Lonsordo, Semillero)
- 7 categorías (Fitosanitarios y abonos, Material riego, Plástico, Manta térmica, Aperos manuales, Material diverso, Maquinaria grande)
- **177 productos** en catálogo (`inventario_productos_catalogo`) — histórico Excel importado con `doc/generar_seed_inventario.py`
- **431 registros históricos** en `inventario_registros` — 5 fechas: 2025-11-30, 2025-12-31, 2026-01-07, 2026-01-31, 2026-02-28
- Script de carga: `doc/seed_inventario_historico.sql` (BEGIN/COMMIT, 629 líneas, upsert productos + insert registros con subquery)

---

## LO QUE ESTÁ COMPLETADO ✅

### Infraestructura y base
- Entorno React + TypeScript + Tailwind + Supabase + Leaflet configurado
- ThemeContext.tsx — tema oscuro/claro con persistencia en `localStorage('marvic-theme')`
- App.tsx — rutas: `/` (FarmSelector), `/dashboard`, `/farm/:farmName`, `/inventario`, `/inventario/:ubicacionId`, `/parte-diario`, `/trabajos`, `/logistica`, `/maquinaria`, `/personal`
- Supabase Storage — buckets `parcel-images`, `inventario-images` y `partes-images` con políticas RLS para `anon`

### Dashboard.tsx — REDISEÑADO 26/03/2026 + ACTUALIZADO 27/03/2026
- **Nueva pantalla principal**: grid **10 módulos** (3 columnas) con iconos y colores de acento propios
- Módulos activos: CAMPO (`/farm`), INVENTARIO (`/inventario`), TRABAJOS (`/trabajos`), LOGÍSTICA (`/logistica`), MAQUINARIA (`/maquinaria`), PERSONAL (`/personal`), PARTE DIARIO (`/parte-diario`, `ClipboardList`, `#4ade80`)
- Módulos WIP con modal "En desarrollo": TRAZABILIDAD, MATERIALES, AUDITORÍA
- KPIs globales dinámicos Supabase (fincas/sectores/ha) en la parte superior
- 3 botones inferiores con modal WIP: Estado General, Históricos, Exportar PDF
- Botón tema oscuro/claro (único punto de control del tema)
- **ELIMINADO**: grid de fincas directas — ahora el acceso a fincas es vía módulo CAMPO

### FarmMap.tsx
- Mapa Leaflet con 119 sectores reales GeoJSON WGS84
- 6 módulos: SECTORES, REGISTRAR, ANÁLISIS, TRAZABILIDAD (placeholder), ALERTAS (placeholder), HISTÓRICO
- Formularios: trabajo, plantación, cosecha 2 pasos, estado parcela, foto
- Análisis: suelo (Hanna HI9814 + LaMotte), sensor NDVI/SPAD, agua por fuente
- **Botón Informe PDF** con modal 3 opciones:
  - Por Sector y fechas (trabajos + plantaciones + cosechas + tickets)
  - Por Tipo y fechas (6 tipos × toda la finca, agrupado por sector)
  - Estado actual finca (último dato de cada sector)
- Generación PDF con jsPDF: `loadImage + addPhoto` para fotos embebidas
- **Fix fondo blanco PDFs:** canvas rellena `#ffffff` antes de `drawImage` para que el logo PNG (transparente) sea visible correctamente en todos los PDFs de la app

### Módulo Inventario de Activos Físicos — COMPLETO
- **6 tablas Supabase**: ubicaciones, categorías, productos_catalogo, registros, movimientos, informes
- **177 productos** en catálogo + **431 registros históricos** cargados (5 snapshots Nov–Feb)
- **`src/pages/Inventario.tsx`** — grid 6 ubicaciones, KPIs dinámicos, botón **Informe Global**:
  - Modal con filtros: rango de fechas, selección de ubicaciones y categorías (checkboxes con Todas/Ninguna)
  - Genera PDF con todas las ubicaciones y categorías seleccionadas, fotos embebidas, agrupado por ubicación → categoría
  - Nombre archivo: `Inventario_Global_YYYY-MM-DD_YYYY-MM-DD.pdf`
- **`src/pages/InventarioUbicacion.tsx`** — pantalla completa por ubicación:
  - Selector de producto del catálogo con precio_unitario automático
  - Segunda foto para fitosanitarios (etiqueta producto)
  - Campo responsable en registro
  - Modal "Mover Producto" entre ubicaciones (`inventario_movimientos`)
  - Botón exportar Excel (SheetJS xlsx 0.18.5, import dinámico)
  - Modal Informe PDF (3 opciones: Histórico por fechas, Por categoría, Stock día 1 del mes)
- **`src/hooks/useInventario.ts`** — 15 hooks: useUbicaciones, useCategorias, useRegistros, useUltimoRegistro, useResumenUbicacion, useAddRegistro, useTotalRegistros, useConteosUbicaciones, useAddInforme, useInformes, useProductosCatalogo, useAddProductoCatalogo, useUpdatePrecioProducto, useMovimientos, useAddMovimiento
- **`doc/generar_seed_inventario.py`** — parser Excel → SQL con `parse_cantidad()` robusto para valores no numéricos
- **`doc/seed_inventario_historico.sql`** — SQL listo para Supabase, BEGIN/COMMIT, upsert con ON CONFLICT

### Módulo Parte Diario — COMPLETO
- **5 tablas Supabase**: `partes_diarios`, `parte_estado_finca`, `parte_trabajo`, `parte_personal`, `parte_residuos_vegetales`
  - `partes_diarios` tiene `UNIQUE(fecha)` — un parte por día, creado automáticamente al entrar
- **`src/hooks/useParteDiario.ts`** — 12 hooks: usePartePorFecha, useEnsureParteHoy, useEstadosFinca, useAddEstadoFinca, useTrabajos, useAddTrabajo, usePersonales, useAddPersonal, useResiduos, useAddResiduos, useUpdateParteDiario, useDeleteEntradaParte
- **`src/pages/ParteDiario.tsx`** — 4 bloques + PDF ultra-detallado:
  - **Bloque A** — Estado finca/parcela: finca, sector, estado, operarios (nº + nombres), 2 fotos, notas
  - **Bloque B** — Trabajo en curso: tipo, finca, ámbito (finca completa / parcelas concretas), operarios, hora inicio/fin, 2 fotos, notas
  - **Bloque C** — Parte personal JuanPe: texto libre, con quién, dónde, foto
  - **Bloque D** — Residuos vegetales: conductor, hora salida nave, ganadero destino, hora llegada, hora regreso, notas, foto
  - Navegador de fechas (← →) para consultar partes anteriores en modo lectura
  - Botón "Generar PDF" → `Parte_Diario_YYYY-MM-DD.pdf`:
    - Logo MARVIC en cabecera de cada página
    - Orden cronológico estricto mezclando los 4 bloques
    - Foto **inmediatamente después** de cada entrada que la tenga
    - Trazabilidad completa: quién, dónde, qué hora, con quién
- **Bucket Storage** `partes-images` — fotos subidas desde los 4 bloques
- **NOTA:** `parte_personal` y `parte_residuos_vegetales` requieren `ALTER TABLE ... ADD COLUMN foto_url TEXT` para activar la foto en esos bloques

### Módulo TRABAJOS — COMPLETO (26/03/2026)
- **2 tablas Supabase**: `trabajos_registro`, `trabajos_incidencias`
- **`src/hooks/useTrabajos.ts`** — 6 hooks completos con KPIs
- **`src/pages/Trabajos.tsx`**:
  - 4 sub-bloques con colores propios: Logística (violeta), Maquinaria Agrícola (naranja), M.O. Interna (verde), M.O. Externa (azul)
  - Modal registro por bloque: tipo trabajo, finca, hora inicio/fin, operarios, notas
  - Incidencias urgentes (rojo pulsante) y no urgentes con ciclo de estados: abierta → en_proceso → resuelta
  - PDF descargable: `Trabajos_YYYY-MM-DD.pdf` con registros por bloque + incidencias

### Módulo LOGÍSTICA — COMPLETO + MEJORADO (26/03/2026 + 27/03/2026)
- **3 tablas nuevas + `camiones` ampliado**: conductores, viajes, mantenimiento
- **`src/hooks/useLogistica.ts`** — hooks completos con KPIs; `Viaje` incluye campo `personal_id`
- **`src/pages/Logistica.tsx`**:
  - Tab Camiones: ficha + estado expandido (km actuales, próx. ITV con alerta color <30d, próx. revisión, km próx. mant., GPS manual)
  - Modal Viaje: conductor seleccionado desde módulo **Personal** (`conductor_camion`), guarda `personal_id`
  - Historial viajes: resuelve nombre por `personal_id` primero, luego `conductor_id` (legacy)
  - Tab Conductores: banner → `/personal` + historial legacy de `logistica_conductores`
  - PDF descargable: `Logistica_YYYY-MM-DD.pdf`
- **Columnas nuevas en `camiones`**: `kilometros_actuales`, `fecha_proxima_itv`, `fecha_proxima_revision`, `km_proximo_mantenimiento`, `gps_info`
- **Columna nueva en `logistica_viajes`**: `destino TEXT`, `personal_id UUID FK → personal`
- **Columna nueva en `logistica_mantenimiento`**: `foto_url_2 TEXT`
- **`logistica_conductores`** — deprecated como fuente de nuevos registros (mantenida para historial)

### Módulo MAQUINARIA — COMPLETO + MEJORADO (26/03/2026 + 27/03/2026)
- **4 tablas Supabase**: tractores, aperos, uso, mantenimiento
- **`src/hooks/useMaquinaria.ts`** — hooks completos; `UsoMaquinaria` incluye campo `personal_id`
- **`src/pages/Maquinaria.tsx`**:
  - Tab Tractores: ficha + estado expandido (próx. ITV alerta color, próx. revisión, horas próx. mant. con alerta si superadas, GPS)
  - Modal Uso: tractorista seleccionado desde módulo **Personal** (`conductor_maquinaria`), guarda `personal_id` + `tractorista` (nombre, compatibilidad col NOT NULL)
  - KPIs: tractores activos, aperos, horas totales, gasoil total
  - PDF descargable: `Maquinaria_YYYY-MM-DD.pdf`
- **Columnas nuevas en `maquinaria_tractores`**: `fecha_proxima_itv`, `fecha_proxima_revision`, `horas_proximo_mantenimiento`, `gps_info`
- **Columna nueva en `maquinaria_mantenimiento`**: `foto_url_2 TEXT`
- **Columna nueva en `maquinaria_uso`**: `personal_id UUID FK → personal`
- **`maquinaria_tractoristas`** — deprecated como fuente de nuevos registros (mantenida para historial)

### Módulo PERSONAL — COMPLETO (26/03/2026)
- **2 tablas Supabase**: `personal`, `personal_externo`
  - `personal` — 4 categorías: `operario_campo`, `encargado`, `conductor_maquinaria`, `conductor_camion`; campos: nombre, dni, telefono, activo, foto_url, qr_code (auto UUID), notas
  - `personal_externo` — tipo: `destajo` | `jornal_servicio`; campos: nombre_empresa, nif, telefono_contacto, activo, qr_code (auto UUID), notas
  - Ambas con RLS `anon` y `qr_code DEFAULT gen_random_uuid()::text`
- **`src/hooks/usePersonal.ts`** — 7 hooks: usePersonal, useAddPersonal, useUpdatePersonal, usePersonalExterno, useAddPersonalExterno, useUpdatePersonalExterno, useKPIsPersonal
- **`src/pages/Personal.tsx`** — 5 tabs + fichas expandibles + modales alta/edición + fotos (`parcel-images/personal/`) + PDF descargable
- Logística y Maquinaria usan `usePersonal('conductor_camion')` y `usePersonal('conductor_maquinaria')` respectivamente

### FarmSelector.tsx — REESCRITO 27/03/2026
- Selector real de fincas: grid visual con las 7 fincas reales del GeoJSON
- Sustituye la versión anterior que mostraba fincas de prueba/BD

### Hooks y componentes
- `useParcelData.ts` — hooks completos: tickets, residuos, certificaciones, análisis suelo/sensor/agua, estados mapa
- `ParcelHistory.tsx` — 6 tabs: Trabajos, Plantaciones, Cosechas, Tickets, Residuos, Certificación
- `UploadParcelPhoto.tsx` — spinner CSS (no Loader2, que causaba error DOM)
- `FINCAS_MARVIC_FINAL.geojson` — 119 sectores reales WGS84
- **Fix zoom mapa:** `fitDoneRef` evita re-zoom al volver al mapa con finca ya cargada

### Limpieza estructural BD — 27/03/2026
- `parcel_id` es **TEXT en todas las tablas sin excepción** — consistencia total
- `analisis_suelo` y `lecturas_sensor_planta` migradas de UUID a TEXT — `Relationships` FK actualizadas en `types.ts`
- Eliminadas fincas de prueba de Supabase — solo quedan las 7 fincas reales del GeoJSON

---

## LO QUE FALTA POR IMPLEMENTAR (orden de prioridad)

### PRIORIDAD 1 — INMEDIATO

**P1.1 — Módulo TRABAJOS con conexión automática a Campo**
- Trabajos.tsx ya existe con 4 sub-bloques e incidencias
- Conectar con FarmMap: al registrar un trabajo desde el mapa, que se grabe también en `trabajos_registro`
- Vincular parcel_id y finca de forma automática desde el contexto del mapa

**P1.2 — FarmMap tema oscuro/claro**
- FarmMap.tsx usa clases hardcoded oscuras — NO respeta el tema claro
- Añadir variantes `dark:` a todos los elementos

**P1.3 — Sistema QR cuadrillas**
- `QRCuadrilla.tsx` ya existe pero NO tiene ruta registrada en App.tsx
- Página `/qr/:cuadrilla_id` — pantalla fullscreen móvil, sin login, max 2 taps
- Registra `hora_entrada` en work_records al escanear entrada
- Registra `hora_salida` y calcula horas totales al escanear salida
- Añadir rutas públicas en App.tsx

### PRIORIDAD 2

**P2.1 — Hook useParcelAlerts**
- Certificaciones que caducan en < 30 días
- Residuos con kg_retirados = null
- Sensores sin lectura > 7 días

**P2.2 — Módulo ALERTAS en FarmMap**
- Panel ALERTAS real con lista usando el nuevo hook (actualmente es placeholder)

**P2.3 — Módulo TRAZABILIDAD completo**
- En Dashboard: modal WIP → implementar página `/trazabilidad`
- En FarmMap: cadena semilla → plantación → trabajos → cosecha → camión por sector (placeholder)

**P2.4 — Módulo MATERIALES**
- Dashboard muestra modal WIP → implementar página `/materiales`
- Fitosanitarios, riego y plástico de campo (diferente del Inventario de activos físicos)

**P2.5 — Módulo AUDITORÍA**
- Dashboard muestra modal WIP → implementar página `/auditoria`
- Certificaciones, trazas, logs de cambios

**P2.6 — Botones inferiores Dashboard**
- Estado General (`/estado-general`) — overview de toda la explotación
- Históricos (`/historicos`) — consultas históricas cross-módulo
- Exportar PDF — informe global de situación

**P2.7 — Tab ANÁLISIS en ParcelHistory**
- Añadir tab con datos de `analisis_suelo` y `lecturas_sensor_planta`

### PRIORIDAD 3

- Sistema riego: tablas + RegisterRiegoForm + hooks
- Trazabilidad palots QR: tablas palots, camaras_almacen, movimientos_palot
- Informe mensual automático inventario: Supabase Edge Function + pg_cron
- Fotos reales de ubicaciones en inventario (actualmente usa logo como watermark)
- Integración ERP actual de Marvic (pendiente identificar el sistema)
- Foto en Bloque C y D Parte Diario (requiere `ALTER TABLE parte_personal ADD COLUMN foto_url TEXT` y `ALTER TABLE parte_residuos_vegetales ADD COLUMN foto_url TEXT` en Supabase)

### PRIORIDAD 4

- Autenticación Supabase + roles (Admin/JuanPe/Capataz/Técnico)
- Políticas RLS actuales son para `anon` — migrar a `authenticated` cuando haya auth
- PWA + modo offline con IndexedDB
- Despliegue Vercel + dominio marvic360.es
- IA planificación campaña (activar Julio 2026 con datos reales)

---

## CONTEXTO DE NEGOCIO

JuanPe recogerá datos en campo desde el 1 de Abril 2026:
- **Hanna HI9814** → pH, EC, salinidad, temperatura suelo
- **Kit LaMotte NPK** → Nitrógeno, Fósforo, Potasio
- **Sensor SPAD/NDVI** → Salud vegetal, clorofila, estrés hídrico
- **Dron DJI** → Vuelos de inspección aérea por parcela
- **GPS Teltonika FMC920** → Tractores (pendiente compra e instalación)

El sistema NO tiene datos históricos digitales todavía. Todo se construye desde cero a partir del 1 de Abril 2026. La IA de planificación se activa en Julio 2026 cuando haya suficientes datos.

---

## CÓMO EMPEZAR CADA SESIÓN

1. Lee este archivo CLAUDE.md completo
2. Lee los archivos relevantes a la tarea que JuanPe va a pedir
3. Espera a que JuanPe diga qué quiere hacer primero
4. Muestra el plan antes de ejecutar
5. Un archivo a la vez, con verificación tsc entre cada cambio

**Próximas tareas recomendadas por prioridad:**
1. Verificar en navegador todos los módulos (CAMPO, INVENTARIO, TRABAJOS, LOGÍSTICA, MAQUINARIA, PERSONAL, PARTE DIARIO)
2. P1.1 — Módulo TRABAJOS con conexión automática a Campo (FarmMap → trabajos_registro)
3. P1.2 — FarmMap tema oscuro/claro (variantes `dark:` en clases hardcoded)
4. P1.3 — Sistema QR cuadrillas (QRCuadrilla.tsx + rutas App.tsx)
5. P2.1/P2.2 — useParcelAlerts + módulo ALERTAS real en FarmMap
6. P2.3 — Módulo TRAZABILIDAD completo (página + FarmMap)
7. P2.4/P2.5 — Módulos MATERIALES y AUDITORÍA
8. Pendiente menor — foto en Bloque C y D Parte Diario (requiere `ALTER TABLE parte_personal ADD COLUMN foto_url TEXT` y `ALTER TABLE parte_residuos_vegetales ADD COLUMN foto_url TEXT` en Supabase, luego actualizar types.ts y ParteDiario.tsx)
