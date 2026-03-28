# AGRÍCOLA MARVIC 360 — CONTEXTO COMPLETO DEL PROYECTO

## ESTADO ACTUAL DEL SISTEMA (28/03/2026 — rev. 5)

Sistema ERP agrícola completamente funcional. Todos los módulos principales están implementados y conectados a Supabase.

**Auditoría de código aplicada:**
- Código muerto eliminado, duplicados centralizados en constantes, utilidades extraídas, rutas corregidas
- Operadores `||` reemplazados por `??` en todos los campos UUID/ID (personal_id, camion_id, tractor_id, apero_id, ganadero_id)
- Bug crítico corregido: `num_operarios: nombresSelec.length || null` → `> 0 ? length : null` (0 era falsy)
- Bug medio corregido: `textura: suelo.textura || undefined` → `?? undefined` (RegisterEstadoUnificadoForm)
- Mezcla `?? / ||` sin paréntesis corregida en ParteDiario (nombreConductor, nombreGanadero)
- Bug crítico corregido (28/03): `ruta: '/'` → `ruta: '/farm'` en MODULOS de Dashboard.tsx (botón CAMPO navegaba al Dashboard en vez de al selector de fincas)
- Bug medio corregido (28/03): `useGeoJSON()` ahora desestructura `error` en FarmMap.tsx — pantalla de error con botón "Volver" en lugar de spinner infinito si falla la carga del GeoJSON
- Migración BD aplicada (28/03 rev.5): `ALTER TABLE parte_personal ADD COLUMN foto_url TEXT`, `ALTER TABLE maquinaria_uso ADD COLUMN foto_url TEXT`, `ALTER COLUMN tractorista DROP NOT NULL`
- Foto en Bloque C Parte Diario implementada (28/03 rev.5): FormC, submitC, modal UI, hasPhoto en lista, addPhoto en PDF
- Foto obligatoria en uso de maquinaria implementada (28/03 rev.5): ModalUso con campo foto requerido, upload a `parcel-images/maquinaria_uso/`, icono en listas
- `UsoMaquinaria.tractorista` ahora `string | null` en interface y BD — campo legacy, fuente real es `personal_id`

**Convención de operadores establecida:**
- Campos UUID / IDs: usar `?? null` — nunca `|| null`
- Campos texto de formulario (string → BD): `|| null` es correcto (convierte `""` a null)
- Campos numéricos con 0 válido: usar comparación explícita (`> 0 ? x : null`)
- Mezcla `??` + `||`: siempre entre paréntesis para evitar error de compilación TS

**Compilación:** `~/.nvm/versions/node/v20.20.1/bin/node ./node_modules/.bin/vite build` = 0 errores (Node v12 del sistema no soporta Vite — usar Node v20 de nvm).

---

## IDENTIDAD DEL PROYECTO

**Nombre:** Agrícola Marvic 360
**Tipo:** ERP agrícola digital completo para explotación hortícola ecológica
**Cliente:** Grupo MARVIC — 250 ha ecológicas en Murcia y Valencia
**Director técnico:** JuanPe
**Stack:** React 18 + TypeScript + Tailwind CSS + Supabase (PostgreSQL) + Leaflet + React Query v5 + jsPDF + SheetJS (xlsx 0.18.5)
**Ruta del proyecto:** `/home/pedro/Escritorio/PC/fincasmarvic-main/`
**Puerto dev:** `localhost:8080` (npm run dev)

---

## REGLA DE TRABAJO — OBLIGATORIA

1. JuanPe pide UNA cosa concreta
2. Lees los archivos afectados primero
3. Muestras los cambios en diff antes de aplicar
4. Aplicas SOLO si JuanPe confirma
5. Verificas con `~/.nvm/versions/node/v20.20.1/bin/node ./node_modules/.bin/vite build` = 0 errores
6. Confirmas y esperas el siguiente paso

**NUNCA** hagas cambios en múltiples archivos a la vez sin confirmación.
**NUNCA** asumas que algo funciona sin verificar la compilación.

---

## ARQUITECTURA GENERAL

```
src/
  App.tsx                    — Rutas: ver tabla abajo
  main.tsx                   — Entry point React
  App.css                    — Reset: max-width:100%, margin:0, padding:0
  index.css                  — Tailwind + .parcel-label
  pages/                     — Una página por módulo
  components/                — Componentes compartidos + ui/ (shadcn)
  hooks/                     — React Query hooks por dominio
  constants/                 — Datos estáticos centralizados
  utils/                     — Utilidades puras reutilizables
  context/                   — ThemeContext
  types/                     — farm.ts (tipos GeoJSON)
  integrations/supabase/     — client.ts + types.ts (generado)
public/
  FINCAS_MARVIC_FINAL.geojson — 119 sectores reales WGS84
  MARVIC_logo.png             — Logo watermark
doc/
  generar_seed_inventario.py  — Parser Excel → SQL
  seed_inventario_historico.sql — 177 productos + 431 registros históricos
```

### Rutas registradas (App.tsx)

| Ruta | Componente | Notas |
|---|---|---|
| `/` | Dashboard | Pantalla principal |
| `/dashboard` | Dashboard | Alias |
| `/farm` | FarmSelector | Selector de finca |
| `/farm/:farmName` | FarmMap | Mapa con `encodeURIComponent` en links |
| `/qr/:cuadrilla_id` | QRCuadrilla | Fichaje QR campo, sin login |
| `/inventario` | Inventario | Grid 6 ubicaciones |
| `/inventario/:ubicacionId` | InventarioUbicacion | Detalle ubicación |
| `/parte-diario` | ParteDiario | 4 bloques + PDF |
| `/trabajos` | Trabajos | 4 sub-bloques + PDF |
| `/logistica` | Logistica | Camiones + viajes + PDF |
| `/maquinaria` | Maquinaria | Tractores + aperos + PDF |
| `/personal` | Personal | 5 tabs + PDF |
| `*` | NotFound | 404 |

---

## FINCAS REALES (fuente única: `src/constants/farms.ts`)

| Nombre exacto | Sectores | Ha |
|---|---|---|
| LA CONCEPCION | 24 | 28.37 |
| LONSORDO | 16 | 10.54 |
| FINCA COLLADOS | 18 | 46.06 |
| FINCA BRAZO DE LA VIRGEN | 4 | 7.08 |
| FINCA LA BARDA | 28 | 74.70 |
| FINCA LA NUEVA | 13 | 15.66 |
| FINCA MAYORAZGO | 16 | 29.53 |

**Total:** 7 fincas, 119 sectores, 211.94 ha
**CRÍTICO:** Nombres exactos como arriba — fuente única `FINCAS_DATA` / `FINCAS_NOMBRES`.
**GeoJSON:** WGS84 ya — NO convertir UTM nunca.

---

## CONSTANTES Y UTILIDADES

### `src/constants/farms.ts`
- `FINCAS_DATA: FincaData[]` — array con nombre, sectores, ha
- `FINCAS_NOMBRES: string[]` — solo nombres
- Usado por: FarmSelector, Dashboard, Trabajos, Logistica, Maquinaria, RegisterEstadoUnificadoForm

### `src/constants/tiposTrabajo.ts`
- `TIPOS_TRABAJO: string[]` — 25 tipos canónicos (unión de 3 fuentes anteriores)
- Usado por: Trabajos, Maquinaria, ParteDiario

### `src/constants/estadosParcela.ts`
- `ESTADOS_PARCELA: {value, label}[]` — 6 estados exactos del ENUM Supabase
- Valores: `vacia | preparacion | plantada | cosechada | en_produccion | acolchado`
- Usado por: RegisterEstadoUnificadoForm, ParteDiario

### `src/utils/uploadImage.ts`
- `uploadImage(file, bucket, path, upsert?)` → `Promise<string | null>` — sube a Storage, devuelve URL pública o null (nunca lanza excepción)
- `buildStoragePath(folder, file, prefix?)` → `string` — genera path único `folder/timestamp-random.ext`
- Usado por: Trabajos, ParteDiario, InventarioUbicacion, Personal, Maquinaria

### `src/utils/dateFormat.ts`
- `formatHora(ts)` → `'HH:MM'` — para timestamps ISO
- `formatFecha(iso)` → `'dd/mm/yyyy, HH:MM'` — fecha + hora completa
- `formatFechaCompleta(fecha)` → `'dd/mm/yyyy'` — solo fecha
- `formatFechaCorta(fecha)` → `'dd mmm'` — compacto para listas
- `formatFechaLarga(fecha)` → `'JUEVES, 27 DE MARZO DE 2026'` — cabeceras parte diario
- `formatFechaNav(fecha)` → `'JUE 27 MAR'` — navegador de fechas
- Usado por: Trabajos, ParteDiario

---

## ALERTAS CRÍTICAS — NO ROMPER NUNCA

1. `parcel_id` es **TEXT** en **TODAS** las tablas sin excepción
2. Estado parcela usa `'vacia'` — **NUNCA** `'empty'`; `'en_produccion'` — **NUNCA** `'produccion'`
3. GeoJSON ya está en WGS84 — NO aplicar conversión UTM
4. Navegación a fincas usa `encodeURIComponent(ruta)` en el link
5. El panel antiguo de bottom sheet fue ELIMINADO — no restaurar
6. Bucket Storage `parcel-images` — fotos parcelas, trabajos, personal, maquinaria
7. Bucket Storage `inventario-images` — fotos inventario
8. Bucket Storage `partes-images` — fotos parte diario
9. Solo existen **7 fincas reales** — no crear ni asumir fincas de prueba
10. jsPDF se importa **estático**: `import jsPDF from 'jspdf'` — NO `await import('jspdf')`
11. `UploadParcelPhoto.tsx` usa spinner CSS — **NO** Loader2 (causaba error DOM)
12. `logistica_conductores` y `maquinaria_tractoristas` son tablas **deprecated** — solo lectura histórica
13. Campos UUID: usar `?? null` — **NUNCA** `|| null` (0 y `""` son falsy, UUID nunca es 0)
14. Campos numéricos con 0 válido: usar `> 0 ? valor : null` — **NUNCA** `valor || null`
15. Mezcla `??` + `||` en la misma expresión: siempre con paréntesis explícitos o TypeScript falla

---

## ESTRUCTURA DE ARCHIVOS CLAVE

### Pages

| Archivo | Descripción |
|---|---|
| `Dashboard.tsx` | Grid 10 módulos (3 col) + KPIs globales + 3 botones WIP |
| `FarmSelector.tsx` | Selector 7 fincas reales del GeoJSON |
| `FarmMap.tsx` | Mapa sistema operativo: menú 7 botones + informe PDF |
| `Inventario.tsx` | Grid 6 ubicaciones + KPIs dinámicos + Informe Global PDF |
| `InventarioUbicacion.tsx` | Detalle ubicación: 7 categorías + panel lateral + modales + Excel/PDF |
| `Trabajos.tsx` | 4 sub-bloques + incidencias + selector cascada finca→parcela + PDF |
| `Logistica.tsx` | Camiones (ITV/mant/viajes) + conductores legacy + PDF |
| `Maquinaria.tsx` | Tractores + aperos + uso + mantenimientos + PDF |
| `Personal.tsx` | 5 tabs (Operarios/Encargados/Maquinaria/Camión/Externa) + PDF |
| `ParteDiario.tsx` | 4 bloques (Estado/Trabajo/Personal/Residuos) + navegador fechas + PDF |
| `QRCuadrilla.tsx` | Fichaje QR campo — pantalla fullscreen móvil, sin login |

### Components

| Archivo | Descripción |
|---|---|
| `ParcelDetailPanel.tsx` | Modal datos básicos sector (sin formularios) |
| `ParcelHistory.tsx` | Panel historial 6 tabs |
| `RegisterWorkForm.tsx` | Formulario registro trabajo desde FarmMap |
| `RegisterEstadoUnificadoForm.tsx` | Formulario unificado (estado+plantación+cosecha+análisis+foto) |
| `UploadParcelPhoto.tsx` | Captura foto + subida Storage (spinner CSS, no Loader2) |

### Hooks

| Archivo | Exports principales |
|---|---|
| `useGeoJSON.ts` | `useGeoJSON` — carga GeoJSON + upsert parcelas (singleton: una sola vez por sesión de navegador) |
| `useParcelData.ts` | `useParcelRecords`, `useInsertWorkRecord`, `useInsertWorkRecordQR`, `useParcelas`, `useTicketsPesaje`, `useResiduosOperacion`, `useCertificaciones`, `useAnalisisSuelo`, `useAddAnalisisSuelo`, `useLecturaSensor`, `useAddLecturaSensor`, `useAnalisisAgua`, `useAddAnalisisAgua`, `useFarmParcelStatuses`, `useUpdateParcelStatus`, `useAddPlanting`, `useAddHarvest`, `useAddEstadoParcela` |
| `useParteDiario.ts` | `usePartePorFecha`, `useEnsureParteHoy`, `useEstadosFinca`, `useAddEstadoFinca`, `useTrabajos`, `useAddTrabajo`, `usePersonales`, `useAddPersonal`, `useResiduos`, `useAddResiduos`, `useUpdateParteDiario`, `useDeleteEntradaParte`, `useGanaderos`, `useAddGanadero` |
| `useInventario.ts` | `useUbicaciones`, `useCategorias`, `useRegistros`, `useUltimoRegistro`, `useResumenUbicacion`, `useAddRegistro`, `useTotalRegistros`, `useConteosUbicaciones`, `useAddInforme`, `useInformes`, `useProductosCatalogo`, `useAddProductoCatalogo`, `useUpdatePrecioProducto`, `useMovimientos`, `useAddMovimiento` |
| `useTrabajos.ts` | `useRegistrosTrabajos`, `useAddTrabajoRegistro`, `useIncidencias`, `useAddIncidencia`, `useUpdateIncidencia`, `useKPIsTrabajos` |
| `useLogistica.ts` | `useCamiones`, `useAddCamion`, `useUpdateCamion`, `useConductores`, `useViajes`, `useAddViaje`, `useMantenimientoCamion`, `useAddMantenimientoCamion`, `useKPIsLogistica` |
| `useMaquinaria.ts` | `useTractores`, `useAddTractor`, `useUpdateTractor`, `useAperos`, `useAddApero`, `useUsosMaquinaria`, `useAddUsoMaquinaria`, `useMantenimientoTractor`, `useAddMantenimientoTractor`, `useKPIsMaquinaria` |
| `usePersonal.ts` | `usePersonal`, `useAddPersonal`, `useUpdatePersonal`, `usePersonalExterno`, `useAddPersonalExterno`, `useUpdatePersonalExterno`, `useKPIsPersonal` |

---

## BASE DE DATOS SUPABASE — TABLAS ACTIVAS

```sql
-- FINCAS Y PARCELAS
parcels                — parcel_id TEXT PK, farm, parcel_number, area_hectares, status
cultivos_catalogo      — nombre_interno UNIQUE, ciclo_dias, rendimiento_kg_ha, kg_plastico_por_ha

-- OPERACIONES AGRÍCOLAS
plantings              — parcel_id TEXT FK, crop, date, variedad, lote_semilla
harvests               — parcel_id TEXT FK, crop, date, production_kg, price_kg
work_records           — parcel_id TEXT FK, work_type, date, cuadrilla_id UUID FK, workers_count, hours_worked, hora_entrada, hora_salida, notas
cuadrillas             — id UUID, nombre, qr_code UNIQUE, activa BOOL
registros_estado_parcela — parcel_id TEXT FK, estado, foto_url, notas, created_at
tickets_pesaje         — harvest_id UUID FK, peso_neto_kg GENERATED, numero_albaran UNIQUE, destino
residuos_operacion     — parcel_id TEXT FK, tipo_residuo ENUM, kg_instalados, kg_retirados
certificaciones_parcela — parcel_id TEXT FK, estado ENUM, fecha_inicio, fecha_fin, entidad_certificadora

-- ANÁLISIS (parcel_id es TEXT)
analisis_suelo         — parcel_id TEXT FK, ph, conductividad_ec, salinidad_ppm, temperatura, nitrogeno_ppm, fosforo_ppm, potasio_ppm, textura
lecturas_sensor_planta — parcel_id TEXT FK, indice_salud, nivel_estres, ndvi, clorofila
analisis_agua          — finca TEXT, fuente TEXT, ph, conductividad_ec, salinidad_ppm

-- INVENTARIO (6 tablas)
inventario_ubicaciones        — id UUID PK, nombre, descripcion, foto_url, activa, orden
inventario_categorias         — id UUID PK, nombre, slug, icono, orden
inventario_productos_catalogo — id UUID PK, nombre, categoria_id UUID FK, precio_unitario, unidad, activo
inventario_registros          — id UUID PK, ubicacion_id, categoria_id, producto_id, cantidad, unidad, descripcion, foto_url, foto_url_2, precio_unitario, responsable, notas, created_at
inventario_movimientos        — id UUID PK, categoria_id, producto_id, cantidad, ubicacion_origen_id, ubicacion_destino_id, fecha, notas
inventario_informes           — id UUID PK, tipo, fecha_inicio, fecha_fin, ubicacion_id, categoria_id, contenido JSONB, generado_at

-- TRABAJOS (2 tablas)
trabajos_registro      — id UUID PK, tipo_bloque ENUM(logistica|maquinaria_agricola|mano_obra_interna|mano_obra_externa), fecha, hora_inicio/fin, finca, parcel_id TEXT, tipo_trabajo, num_operarios, nombres_operarios, foto_url, notas
trabajos_incidencias   — id UUID PK, urgente BOOL, titulo, descripcion, finca, parcel_id TEXT, estado ENUM(abierta|en_proceso|resuelta), foto_url, fecha, fecha_resolucion, notas_resolucion

-- PERSONAL (2 tablas activas)
personal               — id UUID PK, nombre, dni, telefono, categoria TEXT CHECK(operario_campo|encargado|conductor_maquinaria|conductor_camion), activo, foto_url, qr_code TEXT UNIQUE DEFAULT gen_random_uuid()::text, notas
personal_externo       — id UUID PK, nombre_empresa, nif, telefono_contacto, tipo TEXT CHECK(destajo|jornal_servicio), activo, qr_code TEXT UNIQUE, notas

-- LOGÍSTICA (3 tablas activas + camiones ampliado)
camiones               — id UUID PK, matricula UNIQUE, activo, marca, modelo, anio, kilometros_actuales, fecha_itv, fecha_proxima_itv, fecha_proxima_revision, km_proximo_mantenimiento, gps_info, notas_mantenimiento, foto_url
logistica_viajes       — id UUID PK, conductor_id UUID FK (legacy), personal_id UUID FK→personal, camion_id, finca, destino, trabajo_realizado, ruta, hora_salida/llegada, gasto_gasolina_litros/euros, km_recorridos, notas
logistica_mantenimiento — id UUID PK, camion_id, tipo, descripcion, fecha, coste_euros, proveedor, foto_url, foto_url_2
logistica_conductores  — DEPRECATED — solo lectura histórica

-- MAQUINARIA (4 tablas activas)
maquinaria_tractores   — id UUID PK, matricula UNIQUE, marca, modelo, anio, horas_motor, ficha_tecnica, activo, foto_url, notas, fecha_proxima_itv, fecha_proxima_revision, horas_proximo_mantenimiento, gps_info
maquinaria_aperos      — id UUID PK, tipo, descripcion, tractor_id UUID FK, activo, foto_url, notas
maquinaria_uso         — id UUID PK, tractor_id, apero_id, tractorista TEXT NULL (legacy), personal_id UUID FK→personal, finca, parcel_id TEXT, tipo_trabajo, fecha, hora_inicio/fin, horas_trabajadas, gasolina_litros, foto_url, notas
maquinaria_mantenimiento — id UUID PK, tractor_id, tipo, descripcion, fecha, horas_motor_al_momento, coste_euros, proveedor, foto_url, foto_url_2
maquinaria_tractoristas — DEPRECATED — solo lectura histórica

-- PARTE DIARIO (5 tablas)
partes_diarios           — id UUID PK, fecha DATE UNIQUE, responsable TEXT DEFAULT 'JuanPe', notas_generales
parte_estado_finca       — id UUID PK, parte_id UUID FK, finca, parcel_id TEXT, estado, num_operarios, nombres_operarios, foto_url, foto_url_2, notas
parte_trabajo            — id UUID PK, parte_id UUID FK, tipo_trabajo, finca, ambito, parcelas TEXT[], num_operarios, nombres_operarios, hora_inicio/fin, foto_url, foto_url_2, notas
parte_personal           — id UUID PK, parte_id UUID FK, texto, con_quien, donde, foto_url TEXT NULL, fecha_hora
parte_residuos_vegetales — id UUID PK, parte_id UUID FK, nombre_conductor, personal_id UUID FK→personal, hora_salida_nave, nombre_ganadero, ganadero_id UUID FK→ganaderos, hora_llegada_ganadero, hora_regreso_nave, foto_url, notas_descarga

-- GANADEROS
ganaderos — id UUID PK, nombre TEXT NOT NULL, telefono, direccion, activo BOOL DEFAULT true, notas
```

**ENUMs Supabase:**
- `estado_parcela`: activa | plantada | preparacion | cosechada | **vacia** | baja | **en_produccion** | **acolchado**
- `tipo_riego`: goteo | tradicional | aspersion | ninguno
- `tipo_residuo`: plastico_acolchado | cinta_riego | rafia | envase_fitosanitario | otro
- `estado_certificacion`: vigente | suspendida | en_tramite | caducada

**Seeds inventario:**
- 6 ubicaciones, 7 categorías, 177 productos, 431 registros históricos (5 snapshots Nov–Feb 2026)
- Script: `doc/seed_inventario_historico.sql` (BEGIN/COMMIT, upsert productos + insert registros)

---

## DISEÑO VISUAL

**Fondo:** `bg-[#020617]` | **Acento:** `#38bdf8` | **Paneles:** `bg-slate-900`
**Tipografía:** Inter | **Tema:** oscuro/claro via ThemeContext + `localStorage('marvic-theme')`

**Colores de módulo:**
- CAMPO: verde | INVENTARIO: azul | TRABAJOS: ámbar `#f59e0b` | LOGÍSTICA: violeta `#a78bfa`
- MAQUINARIA: naranja `#fb923c` | PERSONAL: fuchsia `#e879f9` | PARTE DIARIO: verde `#4ade80`

**⚠️ FarmMap:** usa clases hardcoded oscuras — NO tiene variantes `dark:` aún.

**Patrón PDF (común en todos los módulos):**
- Import estático: `import jsPDF from 'jspdf'`
- Helpers: `writeLine / checkPage / separator`
- `loadImage(url)` — fetch + canvas → base64 JPEG (rellena `#ffffff` antes de drawImage para PNGs transparentes)
- Descarga automática con nombre descriptivo tipo `Módulo_YYYY-MM-DD.pdf`

---

## MÓDULOS — ESTADO ACTUAL

### ✅ IMPLEMENTADOS Y FUNCIONALES

| Módulo | Ruta | Estado |
|---|---|---|
| Dashboard | `/` | Grid 10 módulos, KPIs dinámicos, botón tema |
| CAMPO (FarmMap) | `/farm/:farmName` | Mapa 119 sectores, 7 botones, formulario unificado, PDF |
| FarmSelector | `/farm` | Grid 7 fincas reales |
| INVENTARIO | `/inventario` y `/inventario/:id` | 6 ubicaciones, 177 productos, Excel, 3 tipos PDF |
| PARTE DIARIO | `/parte-diario` | 4 bloques, navegador fechas, PDF cronológico |
| TRABAJOS | `/trabajos` | 4 sub-bloques, incidencias, selector cascada, PDF |
| LOGÍSTICA | `/logistica` | Camiones+viajes+mant, conductor desde Personal, PDF |
| MAQUINARIA | `/maquinaria` | Tractores+aperos+uso+mant, tractorista desde Personal, PDF |
| PERSONAL | `/personal` | 5 tabs, fichas expandibles, QR auto, PDF |
| QR Cuadrilla | `/qr/:cuadrilla_id` | Ruta registrada, hook `useInsertWorkRecordQR` listo |

### 🔧 WIP — MODAL "EN DESARROLLO"

| Módulo | Dashboard |
|---|---|
| TRAZABILIDAD | Modal WIP |
| MATERIALES | Modal WIP |
| AUDITORÍA | Modal WIP |
| Estado General | Modal WIP |
| Históricos | Modal WIP |
| Exportar PDF global | Modal WIP |

---

## LO QUE FALTA POR IMPLEMENTAR (orden prioridad)

### PRIORIDAD 1 — Inmediato

**P1.1 — FarmMap tema oscuro/claro**
- FarmMap.tsx usa clases hardcoded oscuras — añadir variantes `dark:` a todos los elementos

**P1.2 — QRCuadrilla UI completa**
- Ruta `/qr/:cuadrilla_id` y hook `useInsertWorkRecordQR` ya existen
- Falta: UI completa de la página (pantalla fullscreen móvil, entrada/salida, max 2 taps)

### PRIORIDAD 2

**P2.1 — Hook useParcelAlerts** — certificaciones <30d, residuos sin retirar, sensores >7d sin lectura

**P2.2 — Módulo ALERTAS en FarmMap** — panel real (actualmente placeholder)

**P2.3 — Módulo TRAZABILIDAD** — página `/trazabilidad` + cadena semilla→cosecha→camión por sector

**P2.4 — Módulo MATERIALES** — página `/materiales` — fitosanitarios, riego y plástico de campo

**P2.5 — Módulo AUDITORÍA** — página `/auditoria` — certificaciones, trazas, logs

**P2.6 — Botones Dashboard** — Estado General, Históricos, Exportar PDF global

**P2.7 — Tab ANÁLISIS en ParcelHistory** — datos analisis_suelo y lecturas_sensor_planta

### PRIORIDAD 3

- ~~Foto en Bloque C Parte Diario~~ — ✅ IMPLEMENTADO (28/03 rev.5)
- ~~Foto en uso de maquinaria~~ — ✅ IMPLEMENTADO (28/03 rev.5)
- Sistema riego: tablas + RegisterRiegoForm + hooks
- Trazabilidad palots QR: tablas palots, camaras_almacen, movimientos_palot
- Fotos reales de ubicaciones inventario
- Integración ERP actual de Marvic (pendiente identificar sistema)

### PRIORIDAD 4

- Autenticación Supabase + roles (Admin/JuanPe/Capataz/Técnico) — RLS actual es para `anon`
- PWA + modo offline IndexedDB
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
2. Lee los archivos relevantes a la tarea concreta
3. Espera a que JuanPe diga qué quiere hacer
4. Muestra el plan antes de ejecutar
5. Un archivo a la vez, con verificación build entre cada cambio

---

## ESTADO ACTUAL — AUDITADO (28/03/2026 — rev. 3)

### MÓDULOS IMPLEMENTADOS Y FUNCIONALES

| Módulo | Ruta | Estado | Notas |
|---|---|---|---|
| Dashboard | `/` | ✅ OK | KPIs globales, tema oscuro/claro |
| CAMPO (FarmMap) | `/farm/:farmName` | ✅ OK | Mapa 119 sectores, formulario unificado, PDF |
| FarmSelector | `/farm` | ✅ OK | Grid 7 fincas |
| INVENTARIO | `/inventario` y `/inventario/:id` | ✅ OK | 6 ubicaciones, Excel + PDF |
| PARTE DIARIO | `/parte-diario` | ✅ OK | 4 bloques A/B/C/D, PDF cronológico |
| TRABAJOS | `/trabajos` | ✅ OK | 4 sub-bloques, incidencias, PDF |
| LOGÍSTICA | `/logistica` | ✅ OK | Camiones+viajes+mant, conductor desde Personal |
| MAQUINARIA | `/maquinaria` | ✅ OK | Tractores+aperos+uso+mant. Deprecated eliminado |
| PERSONAL | `/personal` | ✅ OK | 5 tabs, QR auto, PDF |
| QR Cuadrilla | `/qr/:cuadrilla_id` | ✅ OK | Hook QR listo, UI implementada |
| **ESTADO GENERAL** | `/estado-general` | ✅ NUEVO | Alertas ITV, incidencias, certificaciones, sensores |
| **HISTÓRICOS** | `/historicos` | ✅ NUEVO | Buscador global multi-módulo con filtros |
| **EXPORTAR PDF** | `/exportar-pdf` | ✅ NUEVO | PDF global multi-módulo con selector de período |

### UTILIDADES NUEVAS (28/03/2026)

| Archivo | Descripción |
|---|---|
| `src/utils/pdfUtils.ts` | Motor PDF unificado: `initPdf()`, `createPdfContext()`, `loadPdfImage()` |
| `src/utils/validation.ts` | Validaciones declarativas: `validateForm()`, `parseOperarios()`, `parseDecimal()`, `parseCoste()` |

### ARQUITECTURA DE CONEXIONES ENTRE MÓDULOS

```
Trabajos ──────────── inserta en → maquinaria_uso (si hay tractor)
Trabajos ──────────── inserta en → logistica_viajes (si hay camión)
Trabajos ──────────── inserta en → plantings / harvests (si procede)
Estado General ─────── lee desde → maquinaria_tractores, camiones, trabajos_incidencias,
                                    certificaciones_parcela, lecturas_sensor_planta
Históricos ─────────── lee desde → trabajos_registro, maquinaria_uso, logistica_viajes,
                                    partes_diarios, parte_estado_finca, parte_trabajo
Exportar PDF ───────── lee desde → todos los módulos por rango de fechas
```

### TABLA PERSONAL — FUENTE ÚNICA DE CONDUCTORES/TRACTORISTAS

```
categoria = 'conductor_camion'      → usado en Logística (selector conductor viajes)
categoria = 'conductor_maquinaria'  → usado en Maquinaria (selector tractorista uso)
categoria = 'operario_campo'        → usado en Trabajos, ParteDiario (operarios)
categoria = 'encargado'             → administración de personal
```

**REGLA:** NO leer de `logistica_conductores` ni `maquinaria_tractoristas`. Son deprecated.
Ambas tablas siguen en BD para lectura histórica pero no se usan en código activo.

### NOMBRES REALES DE HOOKS EN useParcelData.ts

⚠️ CLAUDE.md anterior tenía nombres INCORRECTOS. Los nombres REALES son:

| CLAUDE.md anterior (INCORRECTO) | Nombre REAL en código |
|---|---|
| `useTicketsPesaje` | `useParcelTickets` |
| `useResiduosOperacion` | `useParcelResiduos` |
| `useCertificaciones` | `useParcelCertification` |
| `useAnalisisSuelo` | `useParcelAnalisisSuelo` |
| `useLecturaSensor` | `useParcelLecturasSensor` |
| `useAnalisisAgua` | `useFincaAnalisisAgua` |
| `useAddAnalisisSuelo` | `useInsertAnalisisSuelo` |
| `useAddLecturaSensor` | `useInsertLecturaSensor` |
| `useAddAnalisisAgua` | `useInsertAnalisisAgua` |
| `useUpdateParcelStatus` | **NO EXISTE** |
| `useAddEstadoParcela` | **NO EXISTE** |

**Hooks que SÍ existen (nombres correctos):**
`useCropCatalog`, `useParcelProduction`, `useParcelTickets`, `useParcelResiduos`,
`useParcelCertification`, `useCamiones`*, `useCuadrillas`, `useParcelRecords`,
`useParcelAnalisisSuelo`, `useParcelLecturasSensor`, `useFincaAnalisisAgua`,
`useFarmParcelStatuses`, `useInsertWorkRecord`, `useInsertWorkRecordQR`,
`useInsertPlanting`, `useInsertHarvest`, `useInsertResiduo`, `useInsertTicketPesaje`,
`useInsertCamion`, `useInsertCuadrilla`, `useInsertAnalisisSuelo`, `useInsertLecturaSensor`,
`useInsertAnalisisAgua`, `useParcelas`, `useAddPlanting`, `useAddHarvest`

*`useCamiones` existe tanto en `useParcelData` como en `useLogistica` — usar siempre el de `useLogistica` para páginas de transporte.

### DUPLICADOS CONOCIDOS (no son bugs, son legacy)

| Hook duplicado | En useParcelData | En useLogistica | Regla |
|---|---|---|---|
| `useCamiones()` | Línea 154 | Línea 59 | Usar el de useLogistica en Logística/Trabajos |

### ERRORES CONOCIDOS DEL ENTORNO

| Error | Causa | Workaround |
|---|---|---|
| `npm run build` falla con `SyntaxError: Unexpected reserved word` | Node v12.22.9 del sistema no soporta Vite (usa ESM `await import`) | Usar Node v20: `~/.nvm/versions/node/v20.20.1/bin/node ./node_modules/.bin/vite build` |
| `npx tsc --noEmit` falla | Node v12 no soporta TypeScript moderno | Usar el build de Vite con Node v20 para verificar tipos |
| `SyntaxError: Unexpected token '?'` | Node v12 no soporta optional chaining en el intérprete | El código es correcto. Solo afecta al CLI, no al bundle final. |
| `~/.nvm/versions/node/v20.20.1/bin/npm` falla | npm global de nvm instalado con Node distinto | Usar directamente `node ./node_modules/.bin/vite build` con el binario de Node v20 |

### SQL APLICADO EN SUPABASE (rev.5 — 28/03/2026)

```sql
-- ✅ EJECUTADO — parte_personal.foto_url
ALTER TABLE parte_personal
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- ✅ EJECUTADO — maquinaria_uso.foto_url
ALTER TABLE maquinaria_uso
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- ✅ EJECUTADO — tractorista nullable
ALTER TABLE maquinaria_uso
  ALTER COLUMN tractorista DROP NOT NULL;
```

**types.ts regenerado** — confirmar que contiene:
- `parte_personal.Row.foto_url: string | null` ✅
- `maquinaria_uso.Row.foto_url: string | null` ✅
- `maquinaria_uso.Row.tractorista: string | null` ✅

### ESTADO DEL SISTEMA — RESUMEN EJECUTIVO

```
Sistema funcional al 90%
━━━━━━━━━━━━━━━━━━━━━━━━
✅ 13 módulos operativos (10 originales + 3 nuevos)
✅ Motor PDF unificado (pdfUtils.ts)
✅ Validaciones centralizadas (validation.ts)
✅ Tablas deprecated eliminadas del código activo
✅ Personal como fuente única de conductores/tractoristas
✅ Conexiones cruzadas entre módulos implementadas
✅ Botón CAMPO del Dashboard navega correctamente a /farm (fix 28/03)
✅ FarmMap muestra error de usuario si falla carga GeoJSON (fix 28/03)
✅ Foto en Bloque C Parte Diario (rev.5 28/03)
✅ Foto obligatoria en uso de maquinaria (rev.5 28/03)
✅ tractorista nullable — personal_id es fuente real (rev.5 28/03)

⚠️ PENDIENTES (no bloquean uso):
  - Tab ANÁLISIS en ParcelHistory (P2.7)
  - FarmMap sin variantes dark: (P1.1)

🔴 NO IMPLEMENTADOS (WIP en Dashboard):
  - Trazabilidad (/trazabilidad)
  - Materiales (/materiales)
  - Auditoría (/auditoria)
```

### REGLAS GLOBALES (CONSOLIDADAS)

1. **UUID/IDs siempre `?? null`** — nunca `|| null` (0 y "" son falsy)
2. **Números con 0 válido**: `> 0 ? valor : null` — nunca `valor || null`
3. **Foto obligatoria**: Bloque D Parte Diario, Mantenimiento maquinaria/camiones, Uso maquinaria
4. **Personal = fuente única**: conductores y tractoristas SOLO desde tabla `personal`
5. **`parcel_id` es TEXT** en todas las tablas sin excepción
6. **Estado parcela**: `'vacia'` nunca `'empty'`; `'en_produccion'` nunca `'produccion'`
7. **jsPDF import estático**: `import jsPDF from 'jspdf'` — nunca dynamic import
8. **pdfUtils.ts**: usar `initPdf()` para nuevos PDFs; no duplicar helpers
9. **validation.ts**: usar `validateForm()` para nuevos formularios; no duplicar reglas
10. **GeoJSON WGS84**: NO convertir UTM nunca
