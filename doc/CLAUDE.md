# AGRÍCOLA MARVIC 360 — CONTEXTO Y FUENTE DE VERDAD DEL PROYECTO

**Última revisión documental:** 20 de abril de 2026  
**Versión de producto referida:** v4.0 código base → **v4.1** en curso (plan [MEGAPROMPT producción piloto](MEGAPROMPT_PRODUCCION_PILOTO_MARVIC360.md)).  
**Ruta del repositorio:** `/home/pedro/Escritorio/PC/fincasmarvic-main/`  
**Puerto dev:** `8080` (`npm run dev`)

---

## REGLA DE DOCUMENTACIÓN POR ETAPA (OBLIGATORIA DESDE ABRIL 2026)

Cada vez que se **cierre una etapa** del plan de producción piloto (u otro hito equivalente):

1. **Actualizar por completo este `doc/CLAUDE.md`** para que refleje la realidad del código, la base de datos y el despliegue **sin contradicciones** entre secciones.
2. Incluir en la sección **«PLAN PRODUCCIÓN PILOTO — ESTADO»** la fecha, el alcance y los artefactos (migraciones SQL, archivos tocados, comandos de verificación).
3. Mantener alineados los **cuatro pilares de auditoría** del PAV cuando el cambio lo exija (tipos, SQL de auditoría, arquitectura, diagrama de dependencias). La ruta exacta de cada pilar está más abajo.

---

## PLAN PRODUCCIÓN PILOTO — ESTADO (MEGAPROMPT ABRIL 2026)

| Etapa | Nombre | Toca BD | Toca código | Estado |
|-------|--------|---------|-------------|--------|
| **1** | Seguridad base de datos (RLS, `anon`, columna `responsable`) | Sí | No (solo migración Supabase) | **Completada** — migración `etapa1_seguridad_rls_abril2026` |
| **2** | Identidad en UI y PDFs (sin literal `JuanPe` en `src/`) | No (defaults SQL `'JuanPe'` en tablas siguen siendo DBA aparte) | Sí | **Completada** — `nombreFirmaPdfFromUser`, pie corporativo, Parte Diario, tipos `responsable` |
| **3** | División de archivos gigantes | No | Sí | Pendiente |
| **4** | Rediseño visual (verde corporativo, Dashboard, sidebar) | No | Sí | Pendiente |
| **5** | Rendimiento, límites consultas, TS estricto gradual | No | Sí / config | Pendiente |

### Etapa 1 — Detalle ejecutado (Supabase)

- **`work_records`:** eliminada política `work_records_anon` (ALL). Creada `work_records_anon_insert_only` — `anon` solo **INSERT** con `cuadrilla_id IS NOT NULL`. Se mantienen políticas `authenticated` existentes (`work_records_pilot_open`).
- **`presencia_tiempo_real`:** eliminada `presencia_anon` (ALL). Creadas `presencia_anon_insert` y `presencia_anon_select` con `cuadrilla_id IS NOT NULL`. Política `authenticated` existente conservada.
- **`cuadrillas`:** eliminada `cuadrillas_anon`. Creada `cuadrillas_anon_select` — `anon` solo **SELECT** con `activa = true`.
- **RLS en 6 tablas:** `pilot_config`, `pilot_fallback_log`, `pilot_fallback_table_allowlist`, `pilot_fallback_user_allowlist`, `plantaciones_transformadas`, `raw_plantaciones_csv` — `ENABLE ROW LEVEL SECURITY` + políticas solo **`authenticated` FOR ALL**.
- **`inventario_registros`:** columna **`responsable TEXT`** nullable (`ADD COLUMN IF NOT EXISTS`).
- **Post-check:** ninguna tabla en `public` con `relrowsecurity = false` tras la migración. Las políticas **`anon`** en **`storage.objects`** (fotos inventario / parcela / partes) **no** forman parte del bloque 1.1 del megaprompt y se mantienen para subidas desde cliente anónimo según configuración actual.

### Etapa 2 — Detalle ejecutado (código)

- **Utilidad:** `src/utils/pdfUtils.ts` — función exportada **`nombreFirmaPdfFromUser(user)`** (`user_metadata.nombre` si es string no vacío, si no `email`, si no `'Director técnico'`). Pie corporativo: **`applyCorporateFootersAllPages(doc, fecha, firmaNombre?)`** y opción **`firmaNombre`** en **`GenerarPDFCorporativoBaseConfig`** / **`generarPDFCorporativoBase`**.
- **Parte diario (motor PDF local):** `src/pages/ParteDiario.tsx` — función **`generarPDFCorporativo(..., firmaNombre)`**; resumen «Responsable» usa `parte?.responsable ?? firmaNombre`; cabeceras bloque C y variantes PDF sin nombre fijo.
- **UI bloque C:** `src/components/ParteDiario/FormAnotacionesLibres.tsx` — títulos dinámicos con sesión.
- **Páginas que llaman a `generarPDFCorporativoBase`:** pasan `firmaNombre` desde `useAuth()` — `Dashboard`, `Trabajos`, `Logistica`, `Maquinaria`, `FarmMap`, `Historicos`, `EstadoGeneral`, `PresenciaPanel`, `Auditoria`, `Materiales`, `Trazabilidad`.
- **Tipos Supabase:** `src/integrations/supabase/types.ts.` — filas **`inventario_registros`** incluyen **`responsable`** (alineado con Etapa 1).
- **Verificación:** `grep -r JuanPe src` → **0** coincidencias en `src/`. El hook **`src/hooks/useCreatedBy.ts`** sigue siendo el patrón para **`created_by`** en mutaciones (ya estaba aplicado en hooks; no quedaban literales `'JuanPe'` en inserts del código revisado).

**Nota DBA (fuera de Etapa 2 código):** en PostgreSQL pueden persistir **DEFAULT** `'JuanPe'` en columnas como `partes_diarios.responsable`, `cierres_jornada.cerrado_by`, `planificacion_campana.created_by`, etc. Eso es esquema/migraciones históricas (`supabase/migrations/...`); cambiarlo es decisión de migración explícita, no automática de esta etapa.

---

## IDENTIDAD DEL PROYECTO

| Campo | Valor |
|--------|--------|
| **Nombre** | Agrícola Marvic 360 |
| **Tipo** | ERP agrícola de operación diaria en campo (móvil Android, 4G variable) |
| **Cliente** | Grupo MARVIC — explotación hortícola ecológica (Murcia y Valencia) |
| **Usuario principal** | Director técnico (uso intensivo en campo) |
| **Stack** | React 18, TypeScript, Tailwind, Supabase (Postgres + Auth + Storage), React Query v5, Leaflet, jsPDF, SheetJS (xlsx), PWA (workbox / manifest según `vite` config) |

**Doble escala «fincas» (no confundir):**

- **Grupo MARVIC (negocio):** documentación de negocio habla de **13 fincas** y **~274 ha** agregadas en Murcia/Valencia (ver [CONTEXTO_SISTEMA_MARVIC360_ABRIL2026.md](CONTEXTO_SISTEMA_MARVIC360_ABRIL2026.md)).
- **Aplicación (GeoJSON + `src/constants/farms.ts`):** **7 fincas** y **119 sectores** en `FINCAS_MARVIC_FINAL.geojson` — esta lista es la **fuente única** para selectores, rutas `/farm/:farmName` y KPIs que dependen de parcelas cargadas en BD.

---

## AUTENTICACIÓN Y RUTAS (`src/App.tsx`)

### Comportamiento real

- **`AuthProvider`** envuelve la app.
- **`AppRoutes`** (dentro de `BrowserRouter`): si `loading` → pantalla «Cargando…»; si **`!user`** → solo se renderiza **`Login`** (no hay rutas hijas).
- Si **`user`** existe → **`Routes`** con **`QRCuadrilla`** en `/qr/:cuadrilla_id` y el resto bajo **`AppLayout`**.

**Implicación crítica:** la ruta **`/qr/:cuadrilla_id`** está definida, pero **un usuario no autenticado nunca la ve** porque antes se muestra `Login`. El flujo «QR sin login» en campo requiere **refactor explícito** (enrutar QR fuera del guard o sesión anónima) si se quiere alinear con el diseño RLS «solo insert anon». La Etapa 1 en BD ya restringe `anon`; la app actual exige sesión para casi todo.

### Tabla de rutas registradas (fuente: `src/App.tsx`)

| Ruta | Componente | Layout |
|------|------------|--------|
| `/qr/:cuadrilla_id` | `QRCuadrilla` | Sin `AppLayout` (pero solo si hay sesión; ver nota arriba) |
| `/` | `Dashboard` | `AppLayout` |
| `/dashboard` | `Dashboard` | `AppLayout` |
| `/farm` | `FarmSelector` | `AppLayout` |
| `/farm/:farmName` | `FarmMap` | `AppLayout` |
| `/inventario` | `Inventario` | `AppLayout` |
| `/inventario/:ubicacionId` | `InventarioUbicacion` | `AppLayout` |
| `/parte-diario` | `ParteDiario` | `AppLayout` |
| `/trabajos` | `Trabajos` | `AppLayout` |
| `/logistica` | `Logistica` | `AppLayout` |
| `/maquinaria` | `Maquinaria` | `AppLayout` |
| `/personal` | `Personal` | `AppLayout` |
| `/presencia` | `PresenciaPanel` | `AppLayout` |
| `/estado-general` | `EstadoGeneral` | `AppLayout` |
| `/historicos` | `Historicos` | `AppLayout` |
| `/exportar-pdf` | `ExportarPDF` | `AppLayout` |
| `/integracion-erp` | `IntegracionERP` | `AppLayout` |
| `/trazabilidad` | `Trazabilidad` | `AppLayout` |
| `/materiales` | `Materiales` | `AppLayout` |
| `/auditoria` | `Auditoria` | `AppLayout` |
| `*` | `NotFound` | `AppLayout` |

Además: **`ErrorBoundary`**, **`StabilityProvider`**, **`PWAUpdatePrompt`**, **`Toaster` / Sonner**.

---

## NAVEGACIÓN LATERAL (`src/constants/navItems.ts`)

- **`NAV_ITEMS`:** 16 entradas de primer nivel (todas con `activo: true` en el código actual).
- **Con `children`:** solo **CAMPO** (hijo: selector `/farm`) e **INVENTARIO** (hijo: `/inventario`).
- **Entradas planas con `ruta`:** TRABAJOS, LOGÍSTICA, MAQUINARIA, PERSONAL, PARTE DIARIO, PRESENCIA, ESTADO GENERAL, HISTÓRICOS, EXPORTAR PDF, INTEGRACIÓN ERP, TRAZABILIDAD, MATERIALES, AUDITORÍA.
- Cada ítem tiene **`icono`** (Lucide) y **`color`** — el rediseño Etapa 4 del megaprompt prevé reducir iconos decorativos; hasta entonces el código mantiene iconos en sidebar.

---

## MÓDULOS Y PÁGINAS (ESTADO REAL AL 20/04/2026)

Resumen: **módulos con página y ruta** = los listados en la tabla de rutas. No hay módulos «solo en menú deshabilitado» en el sentido antiguo del doc: Trazabilidad, Materiales y Auditoría **están activos** en `navItems` y tienen página.

| Módulo | Ruta principal | Notas breves |
|--------|----------------|--------------|
| Login | (sin ruta pública lista si no hay sesión) | Email/contraseña Supabase |
| Dashboard | `/` | KPIs, clima, LIA, PDF informe diario |
| Campo | `/farm`, `/farm/:farmName` | Mapa Leaflet, formularios, PDF finca, tractores en mapa |
| Inventario | `/inventario`, `/inventario/:ubicacionId` | Ubicaciones, categorías, PDF/Excel |
| Parte diario | `/parte-diario` | Bloques A–D, PDFs, cierre jornada vía RPC |
| Trabajos | `/trabajos` | Planificación diaria, campaña, incidencias, PDF |
| Logística | `/logistica` | Camiones, vehículos, viajes, mantenimiento, combustible, PDFs |
| Maquinaria | `/maquinaria` | Tractores, aperos, uso, mantenimiento, GPS, PDFs |
| Personal | `/personal` | Categorías, QR |
| Presencia | `/presencia` | Tiempo real, resumen, PDF, Excel |
| Estado general | `/estado-general` | Alertas consolidadas, PDF |
| Históricos | `/historicos` | Búsqueda multi-tabla, PDF |
| Exportar PDF | `/exportar-pdf` | Exportaciones globales / agronómicas (ver código) |
| Integración ERP | `/integracion-erp` | CSV/JSON e historial |
| Trazabilidad | `/trazabilidad` | Palots, cámaras, escáner, timeline parcela, PDF |
| Materiales | `/materiales` | Stock por categoría slug, movimientos, PDF |
| Auditoría | `/auditoria` | Trail de auditoría, PDF, borrado condicionado (`AUDITORIA_EDITABLE`) |
| QR cuadrilla | `/qr/:cuadrilla_id` | Registro trabajo vía QR (acceso efectivo limitado por guard de auth) |

---

## ARQUITECTURA DE CARPETAS (ALTO NIVEL)

```
src/
  App.tsx, main.tsx
  pages/           — Una página principal por módulo (varias >1000 líneas; Etapa 3 prevé trocear)
  components/      — UI compartida, ParteDiario/, base/, ui/ (shadcn)
  hooks/           — React Query por dominio (+ useCreatedBy, usePresencia, …)
  context/         — Auth, Theme, Sidebar
  constants/       — farms, navItems, estados, tipos trabajo, …
  utils/           — pdfUtils, dateFormat, validation, uploadImage, …
  integrations/supabase/  — client.ts, types.ts. (nombre de archivo con punto final en disco)
  stability/       — StabilityProvider (telemetría / estabilidad)
doc/
  CLAUDE.md                    — Este documento
  CONTEXTO_SISTEMA_MARVIC360_ABRIL2026.md
  MEGAPROMPT_PRODUCCION_PILOTO_MARVIC360.md
public/
  FINCAS_MARVIC_FINAL.geojson, MARVIC_logo.png, …
```

---

## CUATRO PILARES DE AUDITORÍA (PAV) — RUTAS EN EL REPO

Los nombres históricos «OMNIA» siguen siendo la referencia de proceso; **comprueba si el archivo existe en tu clone** (en algunos entornos solo vive `doc/`).

| Pilar | Ruta típica en repo |
|--------|---------------------|
| Tipos / dominio | `AUDITORIA_TIPOS_OMNIA.ts` (raíz o `src/`, según clone) |
| Arquitectura | `ARQUITECTURA_TECNICA_OMNIA.md` |
| Dependencias | `DIAGRAMA_DEPENDENCIAS_OMNIA.md` |
| SQL esquema | `AUDITORIA_DATABASE_OMNIA.sql` / `supabase/migrations/` |

**MANTRA:** tipos y documentación de esquema coherentes con los cambios de BD y de dominio.

---

## REGLA DE TRABAJO OPERATIVA (IA / DESARROLLO)

1. Leer este **`doc/CLAUDE.md`** y los archivos afectados.
2. Para cambios de BD: validar contra migraciones y políticas; no asumir `anon` abierto.
3. Tras cambios de código: **`~/.nvm/versions/node/v20.20.1/bin/node ./node_modules/.bin/vite build`** (el sistema puede tener Node 12 global; Vite necesita Node moderno).
4. TypeScript: **`./node_modules/typescript/bin/tsc --noEmit`** con el mismo Node.
5. Al cerrar etapa del plan piloto: **actualizar este documento** (esta regla).

---

## ESTÁNDARES DE CÓDIGO (TYPESCRIPT / SUPABASE)

1. Cero **`any`** en payloads Supabase; usar `Tables`, `TablesInsert`, aserciones `unknown as`.
2. **`catch (e: unknown)`** y mensaje seguro.
3. Contextos: excepción Fast Refresh documentada con `eslint-disable-next-line react-refresh/only-export-components` donde aplique.
4. **`SelectWithOther`:** siempre **`onCreateNew`**.
5. Joins anidados: aserción estructural, no `(row as any).x`.
6. Updates: objetos explícitos de campos, no `Record<string, string>` genérico para parches tipados.

---

## BASE DE DATOS — NOTAS QUE AFECTAN AL CÓDIGO

- **`parcel_id`:** tipo **TEXT** en tablas de negocio.
- **Estados de parcela:** valores en españil / snake_case del enum (`vacia`, `en_produccion`, …) — no usar sinónimos en inglés mezclados en escritura a BD.
- **`inventario_registros`:** incluye **`responsable`** (TEXT, nullable) además de **`created_by`**.
- **Conductores / tractoristas:** desde tabla **`personal`** por `categoria`; tablas legacy de conductores/tractoristas deprecated.
- **Buckets Storage:** `parcel-images`, `inventario-images`, `partes-images` (y políticas `storage.objects` para anon según Supabase).

---

## FINCAS EN APP (`src/constants/farms.ts`)

Lista canónica **de la aplicación** (7 fincas). Totales de sectores y hectáreas: ver constantes y GeoJSON.

---

## BUILD Y ENTORNO

| Problema | Causa | Solución |
|----------|--------|----------|
| `npm run build` falla con sintaxis antigua | Node 12 en PATH | Usar Node **20.20.1** vía ruta nvm como arriba |
| `tsc` extraño en global | Misma causa | Invocar `tsc` desde `node_modules` con Node 20 |

---

## DOCUMENTOS DE CONTEXTO ADICIONALES

- **[CONTEXTO_SISTEMA_MARVIC360_ABRIL2026.md](CONTEXTO_SISTEMA_MARVIC360_ABRIL2026.md)** — Narrativa de negocio, madurez, rediseño previsto.
- **[MEGAPROMPT_PRODUCCION_PILOTO_MARVIC360.md](MEGAPROMPT_PRODUCCION_PILOTO_MARVIC360.md)** — Plan por etapas 1–5, criterios de verificación.

---

## PRÓXIMOS PASOS INMEDIATOS (TRAS ETAPA 2)

1. **Etapa 3:** troceo de páginas >600–1000 líneas sin cambiar comportamiento; mover supabase directo residual a hooks donde el megaprompt lo indique.
2. **Etapa 4:** color corporativo verde `#1B4332` / variables CSS; Dashboard y `GlobalSidebar` según spec; sync URL `?tab=` / `?bloque=`.
3. **Etapa 5:** lazy routes, límites `.limit()` en hooks pesados, revisión RPC `cerrar_jornada_atomica`.
4. **Producto / auth:** decidir si **`/qr/:cuadrilla_id`** debe ser accesible **sin** sesión y ajustar `AppRoutes` + flujo de login en consecuencia.

---

*Documento reescrito en sesión del 20 de abril de 2026 para eliminar duplicidades contradictorias y reflejar Etapas 1–2 del plan piloto. Actualizar de nuevo al cerrar la Etapa 3.*
