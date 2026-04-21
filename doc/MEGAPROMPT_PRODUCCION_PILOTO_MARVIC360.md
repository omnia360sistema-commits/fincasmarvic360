# MEGAPROMPT — PLAN COMPLETO A PRODUCCIÓN PILOTO
## Agrícola Marvic 360 · Abril 2026
## Para ejecutar en Claude Code (VS Code) con acceso completo al repositorio y MCP Supabase

---

## ROL Y CONTEXTO

Actúa como **arquitecto senior de software + ingeniero de campo + diseñador de producto** con experiencia en sistemas agrícolas de operación real en móvil Android con conexión 4G débil.

Tienes acceso completo al repositorio en `/home/pedro/Escritorio/PC/fincasmarvic-main` y al servidor de base de datos vía MCP `user-supabase`.

Tu misión es ejecutar un **plan de corrección, reorganización, rediseño visual y puesta a punto total** del sistema Agrícola Marvic 360 para dejarlo **100% funcional y listo para uso piloto real en campo** por parte del director técnico de Grupo MARVIC.

---

## CONTEXTO DEL SISTEMA — LEE ESTO PRIMERO

**Qué es:** ERP agrícola de operación diaria en campo. 13 fincas, 135 sectores, 274 hectáreas en Murcia y Valencia. Usuario principal: 1 director técnico con móvil Android en campo con conexión 4G débil o intermitente.

**Stack:** React 18 + TypeScript + Tailwind CSS + Supabase (PostgreSQL) + React Query v5 + jsPDF + SheetJS + Leaflet. Desplegado como app Android + servidor Ubuntu privado.

**Estado actual:** v4.0 rev.38. Compila sin errores. 152 archivos, ~33.241 líneas. 71 tablas en base de datos.

**Color corporativo:** Verde bosque `#1B4332` como color principal. Sin azul en ningún sitio. Sin iconos decorativos hasta tener iconografía propia de marca.

**Principio absoluto de este plan:** NO se toca lógica de negocio que ya funciona. NO se tocan tablas de base de datos salvo las correcciones de seguridad explícitas. SOLO se corrige, reorganiza y mejora lo que está documentado en este prompt.

---

## REGLAS DE EJECUCIÓN OBLIGATORIAS

1. **Una etapa a la vez.** Presenta el alcance exacto de cada etapa antes de ejecutar. Espera confirmación.
2. **Sin inventar.** Cada cambio de código tiene su justificación exacta en este documento.
3. **Sin romper lo que funciona.** Antes de modificar cualquier archivo grande, lee su contenido completo.
4. **Verificación obligatoria.** Después de cada etapa: `npm run build` sin errores + `npx tsc --noEmit` sin errores.
5. **Un archivo a la vez** en modificaciones de archivos grandes (>500 líneas).
6. **CLAUDE.md actualizado** al final de cada etapa con commit y push.

---

## ESTRUCTURA DEL PLAN — 5 ETAPAS SECUENCIALES

```
ETAPA 1 — Seguridad base de datos (SQL puro, sin tocar código)
ETAPA 2 — Corrección de identidad de usuario en todo el código
ETAPA 3 — División de archivos gigantes (solo reorganización, sin cambiar lógica)
ETAPA 4 — Rediseño visual acordado (Dashboard + Menú lateral + sistema de color)
ETAPA 5 — Rendimiento, consistencia de datos y pulido final
```

---

## ETAPA 1 — SEGURIDAD BASE DE DATOS

**Objetivo:** Cerrar los accesos abiertos sin autenticación. Solo SQL en Supabase. Sin tocar ningún archivo de código.

**Duración estimada:** 30–60 minutos.

**Verificación previa — ejecutar antes de cualquier cambio:**
```sql
-- Ver todas las políticas actuales con acceso anónimo
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE 'anon' = ANY(roles)
ORDER BY tablename;

-- Ver tablas sin RLS activo
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT DISTINCT tablename FROM pg_policies
)
ORDER BY tablename;

-- Confirmar estado de RLS por tabla
SELECT relname, relrowsecurity
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
AND relkind = 'r'
ORDER BY relname;
```

---

### 1.1 — Cerrar acceso anónimo en 3 tablas con exposición total

Las tablas `work_records`, `presencia_tiempo_real` y `cuadrillas` tienen políticas que permiten acceso total (`USING (true)`) al rol `anon`. Esto significa que cualquier persona con la clave pública de Supabase puede leer y escribir esas tablas sin iniciar sesión.

**Acción para `work_records`:**
```sql
-- Eliminar política anon existente
DROP POLICY IF EXISTS "work_records_anon_all" ON work_records;
-- (ajustar el nombre exacto según lo que devuelva la consulta de verificación previa)

-- Para QR cuadrilla (única operación legítima sin login): permitir solo INSERT
-- desde la ruta /qr/:cuadrilla_id con validación de cuadrilla_id
CREATE POLICY "work_records_anon_insert_only" ON work_records
  FOR INSERT
  TO anon
  WITH CHECK (cuadrilla_id IS NOT NULL);

-- Para usuarios autenticados: acceso completo a sus propios registros
CREATE POLICY "work_records_authenticated_all" ON work_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Acción para `presencia_tiempo_real`:**
```sql
DROP POLICY IF EXISTS "presencia_anon_all" ON presencia_tiempo_real;

-- Anon solo puede insertar (fichaje QR) y leer su propia cuadrilla
CREATE POLICY "presencia_anon_insert" ON presencia_tiempo_real
  FOR INSERT TO anon
  WITH CHECK (cuadrilla_id IS NOT NULL);

CREATE POLICY "presencia_anon_select" ON presencia_tiempo_real
  FOR SELECT TO anon
  USING (cuadrilla_id IS NOT NULL);

-- Autenticado: acceso completo para el panel de presencia
CREATE POLICY "presencia_authenticated_all" ON presencia_tiempo_real
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

**Acción para `cuadrillas`:**
```sql
DROP POLICY IF EXISTS "cuadrillas_anon_select" ON cuadrillas;

-- Anon solo puede leer (necesario para validar el QR al fichar)
CREATE POLICY "cuadrillas_anon_select" ON cuadrillas
  FOR SELECT TO anon
  USING (activa = true);

-- Autenticado: gestión completa
CREATE POLICY "cuadrillas_authenticated_all" ON cuadrillas
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

---

### 1.2 — Activar RLS en las 6 tablas sin protección

Las tablas `pilot_config`, `pilot_fallback_log`, `pilot_fallback_table_allowlist`, `pilot_fallback_user_allowlist`, `plantaciones_transformadas` y `raw_plantaciones_csv` no tienen RLS activo.

```sql
-- Activar RLS en todas
ALTER TABLE pilot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_fallback_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_fallback_table_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_fallback_user_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantaciones_transformadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_plantaciones_csv ENABLE ROW LEVEL SECURITY;

-- Política: solo usuarios autenticados pueden acceder
CREATE POLICY "pilot_config_authenticated" ON pilot_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "pilot_fallback_log_authenticated" ON pilot_fallback_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "pilot_fallback_table_authenticated" ON pilot_fallback_table_allowlist
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "pilot_fallback_user_authenticated" ON pilot_fallback_user_allowlist
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "plantaciones_transformadas_authenticated" ON plantaciones_transformadas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "raw_plantaciones_authenticated" ON raw_plantaciones_csv
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

### 1.3 — Añadir campo `responsable` a `inventario_registros`

El formulario de inventario envía un campo `responsable` que no existe en la tabla. Los datos se pierden silenciosamente.

```sql
-- Añadir columna (nullable para no romper registros existentes)
ALTER TABLE inventario_registros
ADD COLUMN IF NOT EXISTS responsable TEXT;

-- Verificar que se añadió correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inventario_registros'
AND column_name = 'responsable';
```

---

### 1.4 — Verificación final de la etapa 1

```sql
-- Confirmar que no quedan tablas públicas sin RLS
SELECT relname, relrowsecurity
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
AND relkind = 'r'
AND relrowsecurity = false
ORDER BY relname;
-- Resultado esperado: 0 filas

-- Confirmar políticas anon actualizadas
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE 'anon' = ANY(roles)
ORDER BY tablename;
-- Resultado esperado: solo INSERT/SELECT limitado en work_records,
-- presencia_tiempo_real y cuadrillas
```

**Prueba en app después de etapa 1:** Navegar a la pantalla de presencia y fichar con un QR — debe seguir funcionando. Verificar que el resto de módulos cargan con el usuario autenticado.

---

## ETAPA 2 — CORRECCIÓN DE IDENTIDAD DE USUARIO

**Objetivo:** Eliminar todas las apariciones de `'JuanPe'` hardcodeado en el código y reemplazarlas por el usuario real que ha iniciado sesión, usando el hook `useCreatedBy.ts` que ya existe.

**Duración estimada:** 2–3 horas.

**Principio:** El hook `src/hooks/useCreatedBy.ts` ya existe y devuelve el email del usuario autenticado o `'sistema'` si no hay sesión. Solo hay que usarlo donde falta.

---

### 2.1 — Inventario completo de apariciones

```bash
# Localizar TODAS las apariciones antes de cambiar nada
grep -rn "JuanPe\|'JuanPe'\|\"JuanPe\"" \
  /home/pedro/Escritorio/PC/fincasmarvic-main/src \
  --include="*.ts" --include="*.tsx" \
  | sort

# Guardar la lista completa — es el checklist de esta etapa
```

---

### 2.2 — Corrección en hooks de datos

**Archivos a modificar:**

`src/hooks/useLogistica.ts` — líneas 156, 263, 352, 443, 516 aprox.
`src/hooks/useTrabajos.ts` — múltiples mutaciones
`src/hooks/useInventario.ts` — si tiene apariciones
`src/hooks/useParteDiario.ts` — si tiene apariciones
`src/hooks/useMaquinaria.ts` — si tiene apariciones

**Patrón de corrección en cada hook:**

```typescript
// ANTES (ejemplo)
export const useAddViaje = () => {
  return useMutation({
    mutationFn: async (data: NuevoViaje) => {
      const { error } = await supabase
        .from('logistica_viajes')
        .insert({ ...data, created_by: 'JuanPe' }); // ← ELIMINAR ESTO
    }
  });
};

// DESPUÉS
import { useCreatedBy } from './useCreatedBy';

export const useAddViaje = () => {
  const createdBy = useCreatedBy();
  return useMutation({
    mutationFn: async (data: NuevoViaje) => {
      const { error } = await supabase
        .from('logistica_viajes')
        .insert({ ...data, created_by: createdBy }); // ← USUARIO REAL
    }
  });
};
```

**Instrucción:** Leer cada archivo completo antes de modificarlo. Hacer los cambios uno por uno. Verificar compilación tras cada archivo.

---

### 2.3 — Corrección en archivos de generación de PDF

**Archivos a modificar:**
- `src/utils/pdfUtils.ts` — reemplazar referencias a 'JuanPe' en cabeceras y pies de página
- `src/pages/ParteDiario.tsx` — texto "Parte Personal JuanPe" y similares
- `src/components/ParteDiario/FormAnotacionesLibres.tsx` — si tiene apariciones

**Patrón:** Los PDFs deben usar el nombre del usuario autenticado. Si el PDF se genera en un componente que tiene acceso a `useAuth()`, usar `user?.email` o `user?.user_metadata?.nombre` si existe.

```typescript
// En pdfUtils.ts — añadir parámetro opcional
export const generarPDFCorporativoBase = (
  datos: DatosPDF,
  opciones?: { responsable?: string }
) => {
  const responsable = opciones?.responsable ?? 'Director Técnico';
  // usar responsable en cabecera y pie
};

// En los componentes que llaman al PDF
const { user } = useAuth();
generarPDFCorporativoBase(datos, { responsable: user?.email ?? 'Director Técnico' });
```

---

### 2.4 — Corrección en texto de pantalla "Parte Personal JuanPe"

En `ParteDiario.tsx`, el bloque C muestra el título "PARTE PERSONAL JUANPE". Debe mostrar el nombre o email del usuario autenticado.

```typescript
// Obtener usuario en el componente
const { user } = useAuth();
const nombreUsuario = user?.user_metadata?.nombre ?? user?.email ?? 'Personal';

// En el JSX
<span>PARTE PERSONAL — {nombreUsuario.toUpperCase()}</span>
```

---

### 2.5 — Verificación final de la etapa 2

```bash
# Confirmar que no queda ninguna aparición de JuanPe
grep -rn "JuanPe" \
  /home/pedro/Escritorio/PC/fincasmarvic-main/src \
  --include="*.ts" --include="*.tsx"
# Resultado esperado: 0 coincidencias

# Compilación limpia
cd /home/pedro/Escritorio/PC/fincasmarvic-main
npm run build
npx tsc --noEmit
```

**Prueba en app:** Crear un trabajo, un viaje y un registro de inventario. Verificar en la base de datos que `created_by` muestra el email real, no 'JuanPe'.

---

## ETAPA 3 — DIVISIÓN DE ARCHIVOS GIGANTES

**Objetivo:** Dividir los 7 archivos con más de 1.000 líneas en subcomponentes más pequeños, sin cambiar ninguna lógica, para que los cambios futuros sean seguros.

**Duración estimada:** 4–6 horas.

**Principio absoluto:** La lógica no se toca. Los datos no se tocan. Solo se mueven bloques de JSX a archivos nuevos con sus props correctos. El comportamiento final debe ser idéntico al actual.

**Orden de ejecución** (de mayor a menor urgencia):

```
1. InventarioUbicacion.tsx — 1.910 líneas
2. Maquinaria.tsx — 1.878 líneas
3. Logistica.tsx — 1.717 líneas
4. Trabajos.tsx — 1.334 líneas
5. Inventario.tsx — 1.086 líneas
6. Personal.tsx — 1.038 líneas
7. ParteDiario.tsx — 1.011 líneas (ya tiene subcomponentes parciales)
```

---

### 3.1 — InventarioUbicacion.tsx (1.910 líneas)

**Paso previo:** Leer el archivo completo e identificar las secciones principales.

```bash
cat /home/pedro/Escritorio/PC/fincasmarvic-main/src/pages/InventarioUbicacion.tsx
```

**Estructura esperada para dividir:**
```
src/pages/InventarioUbicacion.tsx          ← Coordinador principal (~200 líneas)
src/components/Inventario/
  TabProductos.tsx                          ← Tab de productos de la ubicación
  TabMovimientos.tsx                        ← Tab de movimientos
  TabProveedores.tsx                        ← Tab de proveedores (si existe)
  PanelLateralUbicacion.tsx                 ← Panel lateral de detalle
  ModalNuevoProducto.tsx                    ← Modal de alta de producto
  ModalEditarProducto.tsx                   ← Modal de edición
```

**Instrucción de división:**
1. Identificar las secciones de JSX más grandes (buscar comentarios de sección o bloques de tabs)
2. Crear el archivo del subcomponente
3. Mover el JSX y sus dependencias locales (estados, funciones locales de ese bloque)
4. Las llamadas a hooks de datos (`useInventario`, etc.) permanecen en el coordinador y se pasan como props
5. Verificar compilación después de cada subcomponente extraído

---

### 3.2 — Maquinaria.tsx (1.878 líneas)

**Paso previo:** Leer el archivo completo.

**Corrección adicional en este archivo:** Hay una inserción directa a la base de datos dentro del componente (línea ~868). Moverla al hook correspondiente `useMaquinaria.ts` siguiendo el mismo patrón que el resto de mutaciones.

```
src/pages/Maquinaria.tsx                   ← Coordinador principal
src/components/Maquinaria/
  TabTractores.tsx
  TabAperos.tsx
  TabRegistrosUso.tsx
  TabRecorridos.tsx
  ModalNuevoUso.tsx
  ModalMantenimiento.tsx
```

---

### 3.3 — Logistica.tsx (1.717 líneas)

```
src/pages/Logistica.tsx                    ← Coordinador principal
src/components/Logistica/
  TabCamiones.tsx
  TabVehiculos.tsx
  TabConductores.tsx
  TabViajes.tsx
  TabMantenimiento.tsx
  TabCombustible.tsx
  PanelEstadoFlota.tsx
```

---

### 3.4 — Trabajos.tsx (1.334 líneas)

```
src/pages/Trabajos.tsx                     ← Coordinador principal
src/components/Trabajos/
  TabPlanificacionDiaria.tsx
  TabCampana.tsx
  TabIncidencias.tsx
  PanelCierreJornada.tsx
  ModalNuevoTrabajo.tsx
```

---

### 3.5 — Inventario.tsx (1.086 líneas)

```
src/pages/Inventario.tsx                   ← Coordinador principal
src/components/Inventario/
  GridUbicaciones.tsx
  PanelKPIs.tsx
  ModalInformeGlobal.tsx
```

---

### 3.6 — Personal.tsx (1.038 líneas)

```
src/pages/Personal.tsx                     ← Coordinador principal
src/components/Personal/
  TabOperarios.tsx
  TabEncargados.tsx
  TabMaquinaria.tsx
  TabCamion.tsx
  TabExterna.tsx
  FichaPersonal.tsx                        ← Ficha expandible reutilizable
  ModalNuevoPersonal.tsx
```

---

### 3.7 — ParteDiario.tsx (1.011 líneas)

Este archivo ya tiene subcomponentes. Verificar que todos están extraídos correctamente y que no queda lógica redundante en el coordinador.

```bash
# Verificar subcomponentes existentes
ls /home/pedro/Escritorio/PC/fincasmarvic-main/src/components/ParteDiario/
```

Si hay bloques grandes que no están en subcomponentes propios, extraerlos.

---

### 3.8 — Mover operaciones directas a base de datos a sus hooks

En estos archivos hay operaciones directas a Supabase que deben estar en hooks:

**`src/components/ParteDiario/FormLogisticaResiduos.tsx`** — líneas 109–114: la edición usa `supabase.from('parte_residuos_vegetales').update(...)` directamente. Mover al hook `useParteDiario.ts` como mutación con `invalidateQueries` al completarse.

**`src/pages/Trazabilidad.tsx`** — operación de actualización directa. Mover a `useTrazabilidad.ts`.

**`src/pages/Auditoria.tsx`** — operación de borrado directo. Mover a `useAuditoria.ts`.

**`src/pages/IntegracionERP.tsx`** — inserciones y borrados directos. Mover a un hook nuevo `useIntegracionERP.ts` siguiendo el patrón estándar del proyecto.

**`src/pages/Maquinaria.tsx`** — inserción directa (~línea 868). Mover a `useMaquinaria.ts`.

---

### 3.9 — Verificación final de la etapa 3

```bash
# Ningún archivo debe superar 600 líneas después de la división
find /home/pedro/Escritorio/PC/fincasmarvic-main/src -name "*.tsx" -o -name "*.ts" | \
  xargs wc -l | sort -rn | head -20

# Compilación limpia
npm run build
npx tsc --noEmit

# La app debe comportarse exactamente igual que antes
```

---

## ETAPA 4 — REDISEÑO VISUAL ACORDADO

**Objetivo:** Implementar el rediseño de pantalla de inicio y menú lateral acordado en sesión de Abril 2026, y aplicar el sistema de color corporativo verde en toda la app.

**Duración estimada:** 3–5 horas.

**Principio:** Solo CSS, JSX y configuración de navegación. Cero cambios en lógica de datos ni base de datos.

---

### 4.1 — Sistema de color corporativo

**Reemplazar** el color de acento azul `#38bdf8` por el verde corporativo en todo el sistema.

**Definir variables CSS globales en `src/index.css`:**

```css
:root {
  --marvic-verde: #1B4332;
  --marvic-verde-medio: #2D6A4F;
  --marvic-verde-claro: #40916C;
  --marvic-verde-suave: #74C69D;
  --marvic-verde-palido: #D8F3DC;
  --marvic-fondo-oscuro: #020617;
  --marvic-panel: #0f172a;
  --marvic-alerta: #EF4444;
  --marvic-aviso: #F59E0B;
}
```

**Reemplazar en todo el código** las referencias al color azul de acento:

```bash
# Localizar todas las referencias al azul actual
grep -rn "#38bdf8\|sky-400\|blue-400\|text-blue\|border-blue\|bg-blue" \
  /home/pedro/Escritorio/PC/fincasmarvic-main/src \
  --include="*.tsx" --include="*.ts" --include="*.css" \
  | grep -v "node_modules"
```

**Sustituciones sistemáticas:**
- `#38bdf8` → `var(--marvic-verde-claro)` o `#40916C`
- `text-sky-400` → `text-green-600`
- `border-sky-400` → `border-green-600`
- `bg-sky-400` → `bg-green-600`
- Clases Tailwind `blue-*` → `green-*` equivalentes

**Eliminar completamente** el color `#38bdf8` de `GlobalSidebar.tsx`, `navItems.ts` y `CLAUDE.md`.

---

### 4.2 — Pantalla de inicio (Dashboard.tsx) — Rediseño completo

**Estado actual:** Contadores a cero, meteorología grande, bloques vacíos, LIA forzado a cero.

**Estado objetivo:** 7 accesos directos, tiempo discreto, alerta urgente si la hay, verde corporativo, sin iconos, sin contadores inútiles.

**Estructura nueva de `Dashboard.tsx`:**

```tsx
// NUEVA ESTRUCTURA — mantener los hooks existentes para lo que sigue funcionando
// ELIMINAR: bloques de KPIs (parcelas, ha, trabajos, alertas como contadores grandes)
// ELIMINAR: bloque meteorológico grande
// ELIMINAR: bloque de maquinaria activa vacío
// ELIMINAR: bloque LIA forzado a cero
// MANTENER: hook de meteorología para datos (solo mostrar temperatura en franja pequeña)
// MANTENER: hook de alertas (para la franja de alerta urgente)

return (
  <div className="min-h-screen bg-[#020617] text-white">
    
    {/* CABECERA — compacta, sin superposiciones */}
    <header className="flex items-center justify-between px-4 pt-4 pb-3">
      <img src="/logo-marvic.png" alt="Agrícola Marvic" className="h-8" />
      <div className="text-right">
        <p className="text-xs text-slate-400">{fechaHoy}</p>
        <p className="text-sm font-medium text-white">{horaActual}</p>
      </div>
    </header>

    {/* FRANJA DE TIEMPO — mínima, solo temperatura y condición */}
    {datosMeteo && (
      <div className="mx-4 mb-2 px-3 py-1.5 bg-slate-900 rounded-lg
                      flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {datosMeteo.finca} · {datosMeteo.condicion}
        </span>
        <span className="text-sm font-medium text-white">
          {datosMeteo.temperatura}°C
        </span>
      </div>
    )}

    {/* FRANJA DE ALERTA URGENTE — solo aparece si hay alertas */}
    {hayAlertasUrgentes && (
      <div className="mx-4 mb-3 px-3 py-2 bg-red-950 border border-red-800
                      rounded-lg flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
        <span className="text-xs text-red-300">
          {textoAlerta}
        </span>
      </div>
    )}

    {/* 7 ACCESOS DIRECTOS — cuerpo principal */}
    <main className="px-4 pb-8">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest
                    mb-3 mt-1">Acceso rápido</p>
      <div className="grid grid-cols-2 gap-3">

        {[
          { label: 'Registrar trabajo en campo', ruta: '/parte-diario?bloque=B' },
          { label: 'Registrar incidencia',        ruta: '/trabajos?tab=incidencias' },
          { label: 'Movimiento de personal',      ruta: '/personal' },
          { label: 'Maquinaria activa',           ruta: '/maquinaria?tab=uso' },
          { label: 'Logística y viajes',          ruta: '/logistica?tab=viajes' },
          { label: 'Parte diario de hoy',         ruta: '/parte-diario' },
          { label: 'Presencia',                   ruta: '/presencia' },
        ].map(({ label, ruta }) => (
          <button
            key={ruta}
            onClick={() => navigate(ruta)}
            className="bg-slate-900 border border-slate-800
                       hover:border-green-800 hover:bg-slate-800
                       rounded-xl px-4 py-4 text-left
                       transition-colors duration-150
                       active:scale-[0.98]"
          >
            <span className="text-sm font-medium text-white leading-tight">
              {label}
            </span>
          </button>
        ))}

      </div>
    </main>
  </div>
);
```

**Nota sobre el 7º botón:** Presencia ocupa la posición extra (impar). Centrarla o hacer que ocupe el ancho completo en la segunda fila.

---

### 4.3 — Menú lateral (GlobalSidebar.tsx + navItems.ts) — Rediseño completo

**Estado actual:** Acordeón solo en Campo e Inventario, resto plano, con iconos decorativos.

**Estado objetivo:** 15 apartados en orden correcto, todos con subaccesos desplegables, sin iconos.

**Paso 1 — Actualizar `src/constants/navItems.ts`:**

```typescript
export const NAV_ITEMS = [
  {
    id: 'campo',
    label: 'Campo',
    children: [
      { label: 'Ver todas las fincas', ruta: '/farm' },
      { label: 'La Concepción',   ruta: '/farm/La Concepcion' },
      { label: 'Lonsordo',        ruta: '/farm/Lonsordo' },
      { label: 'Brazo de la Virgen', ruta: '/farm/Brazo de la Virgen' },
      { label: 'Collados',        ruta: '/farm/Collados' },
      { label: 'El Carmen',       ruta: '/farm/El Carmen' },
      { label: 'Frances',         ruta: '/farm/Frances' },
      { label: 'La Almajaleta',   ruta: '/farm/La Almajaleta' },
      { label: 'La Barda',        ruta: '/farm/La Barda' },
      { label: 'La Nueva',        ruta: '/farm/La Nueva' },
      { label: 'Los Clérigos',    ruta: '/farm/Los Clerigos' },
      { label: 'Mayorazgo',       ruta: '/farm/Mayorazgo' },
      { label: 'Paso Lobo',       ruta: '/farm/Paso Lobo' },
      { label: 'Trigueros',       ruta: '/farm/Trigueros' },
    ],
  },
  {
    id: 'parte-diario',
    label: 'Parte diario',
    children: [
      { label: 'Parte diario completo',      ruta: '/parte-diario' },
      { label: 'Estado finca / parcela',     ruta: '/parte-diario?bloque=A' },
      { label: 'Trabajo en curso',           ruta: '/parte-diario?bloque=B' },
      { label: 'Parte personal',             ruta: '/parte-diario?bloque=C' },
      { label: 'Residuos vegetales',         ruta: '/parte-diario?bloque=D' },
    ],
  },
  {
    id: 'trabajos',
    label: 'Trabajos',
    children: [
      { label: 'Trabajos completo',      ruta: '/trabajos' },
      { label: 'Planificación diaria',   ruta: '/trabajos?tab=planificacion' },
      { label: 'Campaña',                ruta: '/trabajos?tab=campana' },
      { label: 'Incidencias',            ruta: '/trabajos?tab=incidencias' },
    ],
  },
  {
    id: 'personal',
    label: 'Personal',
    children: [
      { label: 'Personal completo',  ruta: '/personal' },
      { label: 'Operarios',          ruta: '/personal?tab=operarios' },
      { label: 'Encargados',         ruta: '/personal?tab=encargados' },
      { label: 'Maquinaria',         ruta: '/personal?tab=maquinaria' },
      { label: 'Camión',             ruta: '/personal?tab=camion' },
      { label: 'Externa',            ruta: '/personal?tab=externa' },
    ],
  },
  {
    id: 'presencia',
    label: 'Presencia',
    children: [
      { label: 'Panel de presencia',         ruta: '/presencia' },
      { label: 'Cuadrillas activas ahora',   ruta: '/presencia?vista=activas' },
      { label: 'Resumen de horas',           ruta: '/presencia?vista=horas' },
    ],
  },
  {
    id: 'maquinaria',
    label: 'Maquinaria',
    children: [
      { label: 'Maquinaria completo',  ruta: '/maquinaria' },
      { label: 'Tractores',            ruta: '/maquinaria?tab=tractores' },
      { label: 'Aperos',               ruta: '/maquinaria?tab=aperos' },
      { label: 'Registros de uso',     ruta: '/maquinaria?tab=uso' },
      { label: 'Recorridos GPS',       ruta: '/maquinaria?tab=recorridos' },
    ],
  },
  {
    id: 'logistica',
    label: 'Logística',
    children: [
      { label: 'Logística completo',  ruta: '/logistica' },
      { label: 'Camiones',            ruta: '/logistica?tab=camiones' },
      { label: 'Vehículos',           ruta: '/logistica?tab=vehiculos' },
      { label: 'Conductores',         ruta: '/logistica?tab=conductores' },
      { label: 'Viajes',              ruta: '/logistica?tab=viajes' },
      { label: 'Mantenimiento',       ruta: '/logistica?tab=mantenimiento' },
      { label: 'Combustible',         ruta: '/logistica?tab=combustible' },
    ],
  },
  {
    id: 'materiales',
    label: 'Materiales',
    children: [
      { label: 'Materiales completo',      ruta: '/materiales' },
      { label: 'Fitosanitarios y abonos',  ruta: '/materiales?tab=fitosanitarios' },
      { label: 'Material de riego',        ruta: '/materiales?tab=riego' },
      { label: 'Registrar entrada / salida', ruta: '/materiales?accion=registro' },
    ],
  },
  {
    id: 'inventario',
    label: 'Inventario',
    children: [
      { label: 'Inventario completo',                               ruta: '/inventario' },
      { label: 'Almacén fitosanitarios Finca La Barda',            ruta: '/inventario/1' },
      { label: 'Almacén semilleros',                                ruta: '/inventario/2' },
      { label: 'Nave Finca La Barda',                               ruta: '/inventario/3' },
      { label: 'Nave Finca La Concepción',                          ruta: '/inventario/4' },
      { label: 'Nave Polígono San Isidro',                          ruta: '/inventario/5' },
      { label: 'Nave y Cabezales Collados y Brazo de la Virgen',   ruta: '/inventario/6' },
      { label: 'Entradas de stock',     ruta: '/inventario?tab=entradas' },
      { label: 'Proveedores',           ruta: '/inventario?tab=proveedores' },
    ],
  },
  {
    id: 'trazabilidad',
    label: 'Trazabilidad',
    children: [
      { label: 'Trazabilidad completo',  ruta: '/trazabilidad' },
      { label: 'Palots',                 ruta: '/trazabilidad?tab=palots' },
      { label: 'Cámaras de almacén',     ruta: '/trazabilidad?tab=camaras' },
      { label: 'Lector de código',       ruta: '/trazabilidad?tab=escaner' },
    ],
  },
  {
    id: 'estado-general',
    label: 'Estado general',
    children: [
      { label: 'Estado general completo', ruta: '/estado-general' },
      { label: 'Alertas críticas',        ruta: '/estado-general?nivel=critico' },
      { label: 'Alertas urgentes',        ruta: '/estado-general?nivel=urgente' },
      { label: 'Avisos',                  ruta: '/estado-general?nivel=aviso' },
    ],
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    children: [
      { label: 'Auditoría completa',   ruta: '/auditoria' },
      { label: 'Buscar por fecha',     ruta: '/auditoria?filtro=fecha' },
      { label: 'Buscar por módulo',    ruta: '/auditoria?filtro=modulo' },
      { label: 'Buscar por usuario',   ruta: '/auditoria?filtro=usuario' },
    ],
  },
  {
    id: 'historicos',
    label: 'Históricos',
    children: [
      { label: 'Históricos completo',  ruta: '/historicos' },
      { label: 'Buscar registros',     ruta: '/historicos' },
    ],
  },
  {
    id: 'exportar-pdf',
    label: 'Exportar informe',
    children: [
      { label: 'Exportar completo',       ruta: '/exportar-pdf' },
      { label: 'Informe global',          ruta: '/exportar-pdf?tipo=global' },
      { label: 'Informes agronómicos',    ruta: '/exportar-pdf?tipo=agronomico' },
    ],
  },
  {
    id: 'integracion-erp',
    label: 'Integración sistema externo',
    children: [
      { label: 'Integración completa',      ruta: '/integracion-erp' },
      { label: 'Producción y destinos',     ruta: '/integracion-erp?seccion=produccion' },
      { label: 'Costes de campo',           ruta: '/integracion-erp?seccion=costes' },
      { label: 'Activos biológicos',        ruta: '/integracion-erp?seccion=biologicos' },
      { label: 'Historial de exportaciones', ruta: '/integracion-erp?seccion=historial' },
    ],
  },
];
```

**Paso 2 — Actualizar `GlobalSidebar.tsx`:**

- Eliminar todos los iconos (`icon`, `Icon`, componentes de icono) de todas las entradas
- Extender el sistema de acordeón existente para que funcione en TODOS los módulos (no solo Campo e Inventario)
- El acordeón actualmente usa `openId` — cambiar a que pueda tener múltiples abiertos simultáneamente si el usuario quiere
- Al navegar a una ruta, el acordeón de ese módulo se abre automáticamente
- Los hijos del acordeón son enlaces directos a la ruta con los parámetros

**Estilo del menú:**
```css
/* Sin iconos. Solo texto. Verde corporativo. */
.nav-parent {
  font-size: 14px;
  font-weight: 500;
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.nav-parent:hover {
  background: rgba(64, 145, 108, 0.15); /* verde suave */
}

.nav-parent.active {
  color: #74C69D; /* verde claro */
}

.nav-child {
  font-size: 12px;
  color: #94a3b8; /* slate-400 */
  padding: 6px 16px 6px 28px;
  border-radius: 4px;
  cursor: pointer;
  display: block;
}

.nav-child:hover {
  color: white;
  background: rgba(255,255,255,0.05);
}

.nav-child.active {
  color: #74C69D;
}
```

---

### 4.4 — Navegación por parámetros de URL hacia pestañas

Los módulos que tienen tabs internas (Trabajos, Personal, Maquinaria, Logística, Materiales, ParteDiario, etc.) deben leer el parámetro `?tab=` o `?bloque=` de la URL y posicionarse en esa pestaña al cargar.

**Patrón a implementar en cada módulo con tabs:**

```typescript
import { useSearchParams } from 'react-router-dom';

// En el componente
const [searchParams] = useSearchParams();
const tabInicial = searchParams.get('tab') ?? 'planificacion'; // valor por defecto

const [tabActiva, setTabActiva] = useState(tabInicial);

// Efecto para sincronizar si cambia la URL
useEffect(() => {
  const tab = searchParams.get('tab');
  if (tab) setTabActiva(tab);
}, [searchParams]);
```

**Módulos que necesitan este cambio:**
- `Trabajos.tsx` — parámetro `?tab=` con valores: planificacion, campana, incidencias
- `Personal.tsx` — parámetro `?tab=` con valores: operarios, encargados, maquinaria, camion, externa
- `Maquinaria.tsx` — parámetro `?tab=` con valores: tractores, aperos, uso, recorridos
- `Logistica.tsx` — parámetro `?tab=` con valores: camiones, vehiculos, conductores, viajes, mantenimiento, combustible
- `Materiales.tsx` — parámetro `?tab=` con valores: fitosanitarios, riego
- `ParteDiario.tsx` — parámetro `?bloque=` con valores: A, B, C, D
- `Inventario.tsx` — parámetro `?tab=` con valores: entradas, proveedores
- `Trazabilidad.tsx` — parámetro `?tab=` con valores: palots, camaras, escaner
- `Auditoria.tsx` — parámetro `?filtro=` con valores: fecha, modulo, usuario
- `ExportarPDF.tsx` — parámetro `?tipo=` con valores: global, agronomico
- `IntegracionERP.tsx` — parámetro `?seccion=` con valores: produccion, costes, biologicos, historial
- `EstadoGeneral.tsx` — parámetro `?nivel=` con valores: critico, urgente, aviso
- `Presencia.tsx` — parámetro `?vista=` con valores: activas, horas

---

### 4.5 — Eliminación de iconos decorativos en toda la app

```bash
# Localizar todos los usos de iconos de Lucide React
grep -rn "from 'lucide-react'" \
  /home/pedro/Escritorio/PC/fincasmarvic-main/src \
  --include="*.tsx" | grep -v "// conservar"
```

**Criterio de eliminación:**
- Iconos en botones de navegación → eliminar, dejar solo texto
- Iconos decorativos en tarjetas y cabeceras → eliminar
- Iconos funcionales en acciones (añadir, editar, eliminar, cerrar, expandir) → **conservar** (tienen función, no son decorativos)
- Iconos en el menú lateral → **eliminar todos**
- Flechas de acordeón en el menú → **conservar** (son funcionales)

---

### 4.6 — Verificación final de la etapa 4

```bash
# Confirmar que no hay color azul de acento
grep -rn "#38bdf8\|sky-400\|blue-" \
  /home/pedro/Escritorio/PC/fincasmarvic-main/src \
  --include="*.tsx" --include="*.css"
# Resultado esperado: 0 coincidencias de color azul de acento

# Compilación limpia
npm run build
npx tsc --noEmit
```

**Prueba visual en app:**
- Dashboard muestra 7 botones correctamente
- Menú lateral muestra los 15 apartados en orden correcto
- Acordeón funciona en todos los módulos
- Pulsar un subacceso desde el menú lleva a la pestaña correcta
- No hay color azul visible en ningún punto
- No hay iconos decorativos en el menú ni en los botones de acceso directo

---

## ETAPA 5 — RENDIMIENTO, CONSISTENCIA Y PULIDO FINAL

**Objetivo:** Reducir el peso de carga inicial, añadir límites a las consultas que traen todos los datos, y verificar que la app funciona correctamente en las condiciones reales de campo.

**Duración estimada:** 2–3 horas.

---

### 5.1 — División de carga en partes más pequeñas (lazy loading)

El archivo principal pesa 2,7 MB. Dividirlo en partes que se cargan cuando el usuario navega a ese módulo.

**En `src/App.tsx`:**

```typescript
import { lazy, Suspense } from 'react';

// Reemplazar imports directos por imports diferidos
const FarmMap = lazy(() => import('./pages/FarmMap'));
const Inventario = lazy(() => import('./pages/Inventario'));
const InventarioUbicacion = lazy(() => import('./pages/InventarioUbicacion'));
const Maquinaria = lazy(() => import('./pages/Maquinaria'));
const Logistica = lazy(() => import('./pages/Logistica'));
const ExportarPDF = lazy(() => import('./pages/ExportarPDF'));
const Trazabilidad = lazy(() => import('./pages/Trazabilidad'));
const IntegracionERP = lazy(() => import('./pages/IntegracionERP'));
const Historicos = lazy(() => import('./pages/Historicos'));

// Componente de carga intermedia (mínimo, sin spinners elaborados)
const CargandoModulo = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#020617]">
    <p className="text-slate-500 text-sm">Cargando...</p>
  </div>
);

// Envolver las rutas en Suspense
<Route
  path="/farm/:farmName"
  element={
    <Suspense fallback={<CargandoModulo />}>
      <FarmMap />
    </Suspense>
  }
/>
// Repetir para cada módulo pesado listado arriba
```

---

### 5.2 — Límites en consultas sin límite

**Localizar consultas problemáticas:**

```bash
grep -rn "\.select(" \
  /home/pedro/Escritorio/PC/fincasmarvic-main/src/hooks \
  --include="*.ts" | grep -v "\.limit\|\.range" | head -30
```

**Añadir límites donde falten:**

```typescript
// ANTES
const { data } = await supabase
  .from('parcels')
  .select('*');

// DESPUÉS
const { data } = await supabase
  .from('parcels')
  .select('*')
  .limit(500); // suficiente para 135 sectores con margen
```

**Prioridad de corrección** (módulos más cargados primero):
- Dashboard — consulta de parcelas
- Históricos — ya tiene límite 200, verificar que se aplica a todas las tablas
- Maquinaria — registros de uso
- Logística — viajes
- Trabajos — registros de trabajo

---

### 5.3 — Activar TypeScript estricto gradualmente

Activar de forma progresiva sin romper la compilación actual:

**En `tsconfig.app.json`** — activar solo las reglas que ya se cumplen:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": true,        // activar primero
    "strictNullChecks": false,    // activar en segunda fase
    "noUnusedLocals": true,       // activa advertencias de variables no usadas
    "noUnusedParameters": false   // dejar en false por ahora
  }
}
```

Después de activar `noImplicitAny: true`:
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Si hay errores, corregirlos antes de continuar
```

---

### 5.4 — Verificación de la función de cierre de jornada

Confirmar que la función RPC está completa y devuelve los datos correctos:

```sql
-- Ver el código completo de la función
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'cerrar_jornada_atomica';
```

Verificar que:
- Acepta `p_fecha text` y `p_usuario text`
- Marca los trabajos del día como cerrados
- Devuelve confirmación de éxito

Si la función tiene algún problema, corregirla en Supabase antes de validar en campo.

---

### 5.5 — Prueba de carga completa en condiciones de campo

Simular condiciones reales:

```bash
# Construir para producción
npm run build

# Verificar tamaño de cada chunk tras el lazy loading
ls -lh /home/pedro/Escritorio/PC/fincasmarvic-main/dist/assets/

# El archivo principal debe estar por debajo de 800KB
# Cada módulo lazy debe ser independiente
```

**Lista de verificación manual en la app real:**

- [ ] Login funciona
- [ ] Dashboard carga en menos de 3 segundos con 4G
- [ ] Los 7 botones de acceso directo navegan al lugar correcto
- [ ] El menú lateral muestra los 15 módulos en orden correcto
- [ ] Cada acordeón se despliega y lleva a la pestaña correcta
- [ ] Parte diario: crear estado de finca, añadir trabajo, cerrar jornada
- [ ] Trabajos: crear trabajo, cambiar estado, crear incidencia
- [ ] Logística: añadir viaje, el `created_by` muestra email real (no JuanPe)
- [ ] Maquinaria: registrar uso de tractor, el `created_by` muestra email real
- [ ] Inventario: ver ubicaciones, los datos de `responsable` se guardan
- [ ] Personal: ver fichas, añadir operario
- [ ] Presencia: fichar con QR desde otro dispositivo sin sesión iniciada
- [ ] QR cuadrilla: funciona sin login desde móvil externo
- [ ] Exportar informe: generar PDF corporativo
- [ ] Auditoría: los registros muestran el email real del usuario

---

### 5.6 — Actualización del CLAUDE.md

Al completar todas las etapas, actualizar `CLAUDE.md` con:

- Estado real de cada módulo post-corrección
- Versión actualizada: v4.1
- Lista de cambios realizados en este plan
- Estado de seguridad: RLS corregido, JuanPe eliminado
- Rediseño visual: Dashboard y menú implementados
- Próximos pasos pendientes (si los hay)

```bash
git add -A
git commit -m "v4.1 — Plan completo producción piloto: seguridad, identidad usuario, rediseño visual, rendimiento"
git push
```

---

## RESUMEN EJECUTIVO DEL PLAN

| Etapa | Qué hace | Toca BD | Toca código | Toca visual | Tiempo |
|-------|----------|---------|-------------|-------------|--------|
| 1 — Seguridad | Cierra accesos abiertos, añade `responsable` | Sí | No | No | 1h |
| 2 — Identidad | Elimina JuanPe, usa usuario real | No | Sí | No | 3h |
| 3 — División | Rompe archivos gigantes en piezas | No | Sí | No | 6h |
| 4 — Visual | Dashboard, menú, color, sin iconos | No | Sí | Sí | 5h |
| 5 — Rendimiento | Lazy loading, límites, TypeScript | No | Sí | No | 3h |

**Total estimado: 18 horas de trabajo en Claude Code**

**Al completar este plan el sistema estará:**
- Sin datos expuestos a usuarios sin identificar
- Con auditoría real (quién hizo qué)
- Con archivos manejables y sin riesgo de regresión
- Con la interfaz acordada para uso en campo
- Con carga rápida en móvil con 4G débil
- Listo para prueba piloto de un mes en campo real

---

*Prompt generado en sesión de trabajo — 20 de abril de 2026*
*Sistema: Agrícola Marvic 360 · Versión 4.0 → 4.1*
*Basado en auditoría real del repositorio fincasmarvic-main*
*13 fincas · 135 sectores · 274 Ha · Murcia y Valencia*
