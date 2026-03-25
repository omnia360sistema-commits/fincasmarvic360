# AGRÍCOLA MARVIC 360 — CONTEXTO COMPLETO DEL PROYECTO

## IDENTIDAD DEL PROYECTO

**Nombre:** Agrícola Marvic 360
**Tipo:** ERP agrícola digital completo para explotación hortícola ecológica
**Cliente:** Grupo MARVIC — 250 ha ecológicas en Murcia y Valencia
**Director técnico:** JuanPe — conoce las fincas y parcelas desde años de trabajo externo
**Stack:** React + TypeScript + Tailwind CSS + Supabase (PostgreSQL) + Leaflet + React Query + jsPDF
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

1. `parcel_id` es **TEXT** en la mayoría de tablas (plantings, harvests, work_records, etc.)
2. Estado parcela usa `'vacia'` **NUNCA** `'empty'`
3. GeoJSON ya está en WGS84 — NO aplicar conversión UTM
4. Navegación a fincas usa `encodeURIComponent(ruta)` en el link
5. El panel antiguo de bottom sheet fue ELIMINADO — no restaurar
6. Bucket Supabase Storage: `parcel-images` — existe y funciona con políticas RLS para `anon`
7. Bucket Supabase Storage: `inventario-images` — existe y funciona con políticas RLS para `anon`
8. `analisis_suelo` y `lecturas_sensor_planta` usan `parcel_id UUID` (no TEXT) — diferente al resto

---

## ESTRUCTURA DE ARCHIVOS CLAVE

```
src/
  pages/
    Dashboard.tsx          — Pantalla inicio: 7 fincas, KPIs dinámicos Supabase, tema oscuro/claro
    FarmMap.tsx            — Mapa sistema operativo: menú 6 módulos + botón Informe PDF
    FarmSelector.tsx       — Selector de finca
    Inventario.tsx         — Pantalla principal inventario: 6 ubicaciones, KPIs dinámicos
    InventarioUbicacion.tsx — Pantalla ubicación: 7 categorías, panel lateral, modales, informes PDF
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
  context/
    ThemeContext.tsx        — Contexto tema oscuro/claro, persiste en localStorage('marvic-theme')
  types/
    farm.ts                — ParcelFeature, ParcelStatus, STATUS_COLORS, STATUS_LABELS
  integrations/
    supabase/types.ts      — Tipos generados Supabase (incluye 4 tablas inventario)
  App.css                  — Reset Vite: max-width:100%, margin:0, padding:0
  index.css                — Tailwind + .parcel-label estilos mapa
public/
  FINCAS_MARVIC_FINAL.geojson — 119 sectores reales WGS84
  FINCAS_COMPLETAS.geojson    — ANTIGUO en UTM — NO USAR
  MARVIC_logo.png             — Logo usado como watermark en Inventario y Dashboard
doc/                       — Documentos del proyecto (contexto pasivo — NO usar como fuente de verdad)
```

---

## DISEÑO VISUAL — DECISIONES TOMADAS

**Estilo:** Sistema operativo de control agrícola industrial.
**Colores:** `bg-[#020617]` fondo, `#38bdf8` acento azul, `bg-slate-900` paneles.
**Tipografía:** Inter (ya configurada en index.css).
**Tema:** oscuro/claro persistente vía ThemeContext + localStorage. Botón solo en Dashboard.

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
camiones         — id UUID, matricula UNIQUE, activo BOOL
tickets_pesaje   — harvest_id UUID FK, peso_neto_kg GENERATED, numero_albaran UNIQUE, destino
residuos_operacion — parcel_id TEXT FK, tipo_residuo ENUM, kg_instalados, kg_retirados
certificaciones_parcela — parcel_id TEXT FK, estado ENUM, fecha_inicio, fecha_fin, entidad_certificadora

-- ANÁLISIS (parcel_id es UUID aquí, NO TEXT — CRÍTICO)
analisis_suelo   — parcel_id UUID FK, ph, conductividad_ec, salinidad_ppm, nitrogeno_ppm, fosforo_ppm, potasio_ppm
lecturas_sensor_planta — parcel_id UUID FK, indice_salud, nivel_estres, ndvi, clorofila
analisis_agua    — finca TEXT, fuente TEXT, ph, conductividad_ec, salinidad_ppm

-- INVENTARIO DE ACTIVOS FÍSICOS
inventario_ubicaciones — id UUID PK, nombre TEXT UNIQUE, descripcion, foto_url, activa BOOL, orden INT
inventario_categorias  — id UUID PK, nombre TEXT UNIQUE, slug TEXT UNIQUE, icono TEXT, orden INT
inventario_registros   — id UUID PK, ubicacion_id UUID FK, categoria_id UUID FK, cantidad NUMERIC, unidad TEXT, descripcion, foto_url, notas, created_at
inventario_informes    — id UUID PK, tipo TEXT, fecha_inicio DATE, fecha_fin DATE, ubicacion_id UUID FK, categoria_id UUID FK, contenido JSONB, generado_at
```

**ENUMs:**
- `estado_parcela`: activa | plantada | preparacion | cosechada | **vacia** | baja
- `tipo_riego`: goteo | tradicional | aspersion | ninguno
- `tipo_residuo`: plastico_acolchado | cinta_riego | rafia | envase_fitosanitario | otro
- `estado_certificacion`: vigente | suspendida | en_tramite | caducada

**Seeds fijos en inventario:**
- 6 ubicaciones físicas (Nave Collados+Brazo Virgen, Cabezal La Barda, Nave Polígono La Barda, Nave La Concepción, Nave Lonsordo, Semillero)
- 7 categorías (Fitosanitarios y abonos, Material riego, Plástico, Manta térmica, Aperos manuales, Material diverso, Maquinaria grande)

---

## LO QUE ESTÁ COMPLETADO ✅

### Infraestructura y base
- Entorno React + TypeScript + Tailwind + Supabase + Leaflet configurado
- ThemeContext.tsx — tema oscuro/claro con persistencia en `localStorage('marvic-theme')`
- App.tsx — rutas: `/` (FarmSelector), `/dashboard`, `/farm/:farmName`, `/inventario`, `/inventario/:ubicacionId`
- Supabase Storage — buckets `parcel-images` e `inventario-images` con políticas RLS para `anon`

### Dashboard.tsx
- Panel control con 7 fincas reales
- KPIs dinámicos desde Supabase: fincas, sectores y hectáreas (query inline a `parcels`)
- Footer dinámico con los mismos datos
- Botón tema oscuro/claro (único punto de control del tema)
- Acceso directo a Inventario

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

### Módulo Inventario de Activos Físicos — COMPLETO
- **4 tablas Supabase** creadas con seeds (6 ubicaciones + 7 categorías)
- **`src/pages/Inventario.tsx`** — grid 6 ubicaciones, KPIs dinámicos (total registros + conteo por ubicación), estética Dashboard
- **`src/pages/InventarioUbicacion.tsx`** — pantalla por ubicación con 7 categorías, panel Estado actual / Histórico, modal Añadir Registro, subida fotos a Storage
- **`src/hooks/useInventario.ts`** — 9 hooks: useUbicaciones, useCategorias, useRegistros, useUltimoRegistro, useResumenUbicacion, useAddRegistro, useTotalRegistros, useConteosUbicaciones, useAddInforme, useInformes
- **Informe PDF en InventarioUbicacion** — 3 tipos: Histórico por fechas, Por categoría y fechas, Stock día 1 del mes — con fotos embebidas

### Hooks y componentes
- `useParcelData.ts` — hooks completos: tickets, residuos, certificaciones, análisis suelo/sensor/agua, estados mapa
- `ParcelHistory.tsx` — 6 tabs: Trabajos, Plantaciones, Cosechas, Tickets, Residuos, Certificación
- `UploadParcelPhoto.tsx` — spinner CSS (no Loader2, que causaba error DOM)
- `FINCAS_MARVIC_FINAL.geojson` — 119 sectores reales WGS84

---

## LO QUE FALTA POR IMPLEMENTAR (orden de prioridad)

### PRIORIDAD 1 — INMEDIATO

**P1.1 — FarmMap tema oscuro/claro**
- FarmMap.tsx usa clases hardcoded oscuras — NO respeta el tema claro
- Añadir variantes `dark:` a todos los elementos para que el tema funcione también en el mapa

**P1.2 — Sistema QR cuadrillas**
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

**P2.3 — Módulo TRAZABILIDAD en FarmMap**
- Cadena semilla → plantación → trabajos → cosecha → camión por sector (actualmente es placeholder)

**P2.4 — Tab ANÁLISIS en ParcelHistory**
- Añadir tab con datos de `analisis_suelo` y `lecturas_sensor_planta`

**P2.5 — Rutas huérfanas**
- `/estado-general` e `/historicos` navegan a NotFound — implementar o eliminar botones

### PRIORIDAD 3

- Sistema riego: tablas + RegisterRiegoForm + hooks
- Trazabilidad palots QR: tablas palots, camaras_almacen, movimientos_palot
- Informe mensual automático inventario: Supabase Edge Function + pg_cron
- Fotos reales de ubicaciones en inventario (actualmente usa logo como watermark)
- Integración ERP actual de Marvic (pendiente identificar el sistema)

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
1. P1.1 — Variantes `dark:` en FarmMap.tsx para completar el sistema de tema
2. P1.2 — Sistema QR cuadrillas (QRCuadrilla.tsx + rutas App.tsx)
3. P2.1/P2.2 — useParcelAlerts + módulo ALERTAS real en FarmMap
