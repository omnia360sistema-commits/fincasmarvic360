# FASE 1 — Plan de Seguridad y Auditoría — MARVIC ERP
# Versión final verificada contra código real

---

## CONTEXTO

Sistema ERP agrícola en producción interna mono-tenant. Auth ya existe y funciona:
- Login page (`src/pages/Login.tsx`), route guard en `App.tsx` (líneas 36-48)
- `AuthContext.tsx` funcional: `user`, `rol`, `loading`
- Tabla `usuario_roles` en BD
- QR tablet: confirmado que usa sesión activa → no hay acceso anon real

El problema real no es Auth. Son los datos de auditoría.

---

## HALLAZGO CRÍTICO — DOS TRACKS

### TRACK A — Sin cambio de esquema DB (ejecutable directamente)

Tablas con `created_by?: string | null` en types.ts (opcional):

| Tabla | types.ts aprox. | Estado actual |
|---|---|---|
| `camiones` | L367 | `'JuanPe'` hardcodeado en hook + página |
| `vehiculos_empresa` | L3279 | `'JuanPe'` hardcodeado en hook + página |
| `logistica_viajes` | L1546 | `'JuanPe'` hardcodeado en hook + página |
| `logistica_mantenimiento` | L1491 | `'JuanPe'` hardcodeado en hook + página |
| `logistica_combustible` | L1374 | `'JuanPe'` hardcodeado en hook + página |
| `maquinaria_tractores` | L1785 | NULL (ausente en hook) + `'JuanPe'` en página |
| `maquinaria_aperos` | L1620 | NULL (ausente en hook) + `'JuanPe'` en página |
| `maquinaria_uso` | (verificar) | NULL (ausente en hook) + `'JuanPe'` en página |
| `maquinaria_mantenimiento` | L1712 | NULL (ausente en hook) + `'JuanPe'` en página |
| `trabajos_registro` | L3040 | NULL (pass-through, caller en Trabajos.tsx ya lo pasa OK) |
| `trabajos_incidencias` | L2984 | NULL (pass-through) |
| `planificacion_campana` | L2465 | NULL (pass-through) |
| `inventario_registros` | L1064 | NULL o form input (pass-through) |
| `inventario_movimientos` | L948 | NULL (pass-through) |
| `inventario_entradas` | L820 | `record.receptor ?? record.created_by ?? null` |
| `proveedores` | L2636 | NULL (pass-through) |

### TRACK B — Requieren migración SQL + regenerar types.ts PRIMERO

⛔ No tocar en código hasta completar la migración:

| Tabla | Status |
|---|---|
| `parte_estado_finca` | Sin `created_by` en types.ts |
| `parte_trabajo` | Sin `created_by` en types.ts |
| `parte_personal` | Sin `created_by` en types.ts |
| `parte_residuos_vegetales` | Sin `created_by` en types.ts |
| `ganaderos` | Sin `created_by` en types.ts |
| `inventario_informes` | Sin `created_by` en types.ts |

---

## ARQUITECTURA DE HOOKS — DOS PATRONES (verificado en código)

### Patrón Override (hook sobreescribe created_by al final del spread)
```typescript
insert([{ ...camionPayload, codigo_interno, created_by: 'JuanPe' }])
// El hook GANA sobre el valor del caller
```
Hooks: useAddCamion (L156), useAddVehiculoEmpresa (L262), useAddViaje (L353),
       useAddMantenimientoCamion (L440), useAddCombustible (L516)
→ Fix en HOOK es suficiente (también limpiar la página por claridad)

### Patrón Pass-through (hook pasa payload intacto)
```typescript
insert([payload])  // lo que viene del caller llega a BD tal cual
```
Hooks: useAddTractor (L134), useAddApero (L233), useAddUsoMaquinaria (L311),
       useAddMantenimientoTractor (L357), y todos los de useInventario
→ Fix en PÁGINA que construye el payload, O inyección defensiva en hook

---

## DISEÑO TÉCNICO: useCreatedBy

Archivo: `src/hooks/useCreatedBy.ts` (nuevo)

```typescript
import { useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export const useCreatedBy = (): (() => string) => {
  const { user } = useAuth();
  const ref = useRef<string>('sistema');
  ref.current = user?.email ?? 'sistema'; // sin useEffect, actualiza en cada render
  return useCallback(() => ref.current, []); // función estable, lee ref en ejecución
};
```

Guard estándar en mutationFn:
```typescript
const cb = getCreatedBy();
if (cb === 'sistema') throw new Error('Sesión no activa. Recarga la página.');
```

Valor elegido: `user?.email` (no user.id) porque:
- created_by es TEXT sin FK a auth.users
- El módulo Auditoría muestra created_by al usuario directamente
- Datos históricos ya son strings (no UUID)

---

## VALIDACIONES PREVIAS (antes de tocar código)

### V1 — Verificar types.ts para maquinaria_uso
```bash
grep -n "created_by" src/integrations/supabase/types.ts | grep "maquinaria_uso"
```
Si no aparece → excluir useAddUsoMaquinaria de Track A, incluir en Track B

### V2 — Verificar usuario en auth
```sql
SELECT id, email, last_sign_in_at, email_confirmed_at FROM auth.users;
```
STOP si vacío o email_confirmed_at es null

### V3 — Verificar build limpio
```bash
~/.nvm/versions/node/v20.20.1/bin/node ./node_modules/.bin/vite build 2>&1 | tail -5
```
STOP si hay errores

### V4 — Punto de rollback git
```bash
git log --oneline -3  # confirmar commit 71b25ec como base
git stash             # guardar si hay WIP
```

### V5 — Cuantificar contaminación actual
```sql
SELECT 
  'camiones' tabla, COUNT(*) total,
  SUM(CASE WHEN created_by = 'JuanPe' THEN 1 ELSE 0 END) juanpe,
  SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END) nulos
FROM camiones
UNION ALL SELECT 'maquinaria_tractores', COUNT(*),
  SUM(CASE WHEN created_by = 'JuanPe' THEN 1 ELSE 0 END),
  SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END) FROM maquinaria_tractores
UNION ALL SELECT 'trabajos_registro', COUNT(*),
  SUM(CASE WHEN created_by = 'JuanPe' THEN 1 ELSE 0 END),
  SUM(CASE WHEN created_by IS NULL THEN 1 ELSE 0 END) FROM trabajos_registro;
```

---

## PLAN DE EJECUCIÓN PASO A PASO

### PASO 0 — Ejecutar V1-V5 arriba. No continuar si alguna falla.
Riesgo: ninguno. Rollback: n/a

---

### PASO 1 — Crear src/hooks/useCreatedBy.ts

Archivo nuevo, no modifica nada existente.
Contenido: ver sección "DISEÑO TÉCNICO" arriba.

Validar: `vite build` → 0 errores
Rollback: `rm src/hooks/useCreatedBy.ts`

---

### PASO 2 — Fix useLogistica.ts (Pattern Override, 5 mutations)

ARCHIVO: src/hooks/useLogistica.ts
DEPENDENCIA: PASO 1 completado

Cambios exactos:
- Añadir import: `import { useCreatedBy } from './useCreatedBy';`
- En cada función añadir: `const getCreatedBy = useCreatedBy();`
- En mutationFn: `const cb = getCreatedBy(); if (cb === 'sistema') throw ...`
- Reemplazar `created_by: 'JuanPe'` por `created_by: cb`

Líneas afectadas: 156, 262, 353, 440, 516
QUÉ NO TOCAR: lógica de codigo_interno, sync inventario, invalidateQueries

Validar:
```bash
vite build  # 0 errores
```
```sql
-- Crear camión desde UI, luego:
SELECT created_by FROM camiones ORDER BY created_at DESC LIMIT 1;
-- Esperado: email real, NO 'JuanPe'
```
Rollback: `git checkout HEAD -- src/hooks/useLogistica.ts`

---

### PASO 3 — Fix Logistica.tsx (limpiar fuente, 5 ocurrencias)

ARCHIVO: src/pages/Logistica.tsx
Logistica.tsx NO importa useAuth actualmente.

Cambios:
- Añadir import: `import { useAuth } from '@/context/AuthContext';`
- Al inicio del componente: `const { user } = useAuth();`
- Reemplazar en líneas 178, 363, 538, 719, 871:
  `created_by: 'JuanPe'` → `created_by: user?.email ?? 'sistema'`

QUÉ NO TOCAR: tabs, formularios, PDF, toda la lógica de negocio

Validar: build OK + crear viaje en UI
Rollback: `git checkout HEAD -- src/pages/Logistica.tsx`

---

### PASO 4A — Fix Maquinaria.tsx (Pass-through, 4 ocurrencias)

ARCHIVO: src/pages/Maquinaria.tsx
Maquinaria.tsx NO importa useAuth actualmente.

Cambios idénticos al Paso 3:
- Añadir import useAuth
- `const { user } = useAuth();`
- Líneas 211, 466, 655, 887: `'JuanPe'` → `user?.email ?? 'sistema'`

Rollback: `git checkout HEAD -- src/pages/Maquinaria.tsx`

---

### PASO 4B — Fix useMaquinaria.ts (inyección defensiva, 4 hooks)

ARCHIVO: src/hooks/useMaquinaria.ts
DEPENDENCIA: PASO 1, PASO 4A

VERIFICACIÓN PREVIA:
```bash
grep -n "created_by" src/integrations/supabase/types.ts | grep "maquinaria"
# Debe aparecer: maquinaria_tractores, maquinaria_aperos, maquinaria_mantenimiento
# maquinaria_uso: si no aparece → SKIP este hook, mover a Track B
```

Cambios en useAddTractor (L134), useAddApero (L233), useAddMantenimientoTractor (L357):
```typescript
const getCreatedBy = useCreatedBy();
// En mutationFn:
const cb = getCreatedBy();
insert([{ ...rest, codigo_interno, created_by: cb }])
```

Cambio en useAddUsoMaquinaria (L311) — defensivo (no sobreescribe si caller ya pasa):
```typescript
insert([{ ...payload, created_by: payload.created_by ?? cb }])
```

Rollback: `git checkout HEAD -- src/hooks/useMaquinaria.ts`
Validar SQL: `SELECT created_by FROM maquinaria_uso ORDER BY created_at DESC LIMIT 1;`

---

### PASO 5 — Fix useTrabajos.ts + useInventario.ts (inyección defensiva)

ARCHIVO: src/hooks/useTrabajos.ts
NOTA: Trabajos.tsx YA pasa created_by correctamente en sus llamadas (líneas 271, 600, 749, 770).
El fix en el hook es defensivo para otros callers futuros.

Funciones a modificar:
- useAddTrabajoRegistro (L114): `insert([{ ...payload, created_at: ..., created_by: payload.created_by ?? cb }])`
- useAddIncidencia (L162): igual
- useAddTrabajoPlanificado (L280): igual
- useAddPlanificacionCampana (L383): igual

QUÉ NO TOCAR: useCerrarJornada (L514, usa RPC con auth propio), useAddCierreJornada

ARCHIVO: src/hooks/useInventario.ts

Funciones: useAddRegistro, useAddMovimiento, useAddProveedor, useAddPrecioProveedor,
           useAssignActivoUbicacion, useAddProductoCatalogo
Patrón: `insert({ ...record, created_by: record.created_by ?? cb })`

Caso especial useAddEntrada (L732-775) — segundo insert en inventario_registros:
```typescript
// ANTES:
created_by: record.receptor ?? record.created_by ?? null
// DESPUÉS:
created_by: record.receptor ?? record.created_by ?? (cb !== 'sistema' ? cb : null)
```

Rollback: `git checkout HEAD -- src/hooks/useTrabajos.ts src/hooks/useInventario.ts`

---

### PASO 6 — Track B: Parte Diario (requiere migración SQL previa)

⛔ NO EMPEZAR sin completar 6A y 6B primero

#### PASO 6A — Migración SQL
```sql
ALTER TABLE parte_estado_finca ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE parte_trabajo ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE parte_personal ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE parte_residuos_vegetales ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE ganaderos ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE inventario_informes ADD COLUMN IF NOT EXISTS created_by TEXT;
```

Verificar:
```sql
SELECT table_name, column_name FROM information_schema.columns
WHERE column_name = 'created_by'
AND table_name IN ('parte_estado_finca','parte_trabajo','parte_personal',
                   'parte_residuos_vegetales','ganaderos','inventario_informes');
-- Esperado: 6 filas
```

#### PASO 6B — Regenerar types.ts
```bash
# Opción A (CLI):
npx supabase gen types typescript --project-id fsjvwquudybjxjnpgkom > src/integrations/supabase/types.ts

# Opción B (manual): añadir `created_by?: string | null` en Insert type de cada tabla
```

Verificar: `vite build` → 0 errores

#### PASO 6C — Fix useParteDiario.ts
ARCHIVO: src/hooks/useParteDiario.ts

Funciones a modificar:
- useAddEstadoFinca (L99): `insert({ ...record, created_by: cb })`
- useAddTrabajo (L156): igual
- useAddPersonal (L207): igual
- useAddResiduos (L258): igual
- useAddGanadero (L383): igual

QUÉ NO TOCAR: useEnsureParteHoy (usa `responsable`), useCerrarJornada (RPC, ya tiene auth)

Rollback: `git checkout HEAD -- src/hooks/useParteDiario.ts`

---

### PASO 7 — Inicializar usuario_roles

```sql
-- Solo si verificación V2 muestra usuario_roles vacío
INSERT INTO usuario_roles (user_id, rol, activo)
SELECT id, 'admin', true FROM auth.users
WHERE email = 'EMAIL_REAL_DE_JUANPE';

-- Verificar:
SELECT ur.rol, au.email FROM usuario_roles ur
JOIN auth.users au ON au.id = ur.user_id;
```

---

### PASO 8 — RLS: De USING(true) a USING(auth.uid() IS NOT NULL)

⛔ SOLO después de que todos los pasos 1-7 estén completados y validados.
⛔ NUNCA aplicar RLS antes de que el código use usuario real.

#### Pre-verificación del cliente Supabase
En consola del navegador con sesión activa:
```javascript
const { data } = await supabase.auth.getSession();
console.log(!!data.session?.access_token); // debe ser TRUE
```
Si es false → STOP total en RLS.

#### Verificación especial: inventario_registros tiene RLS habilitado?
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'inventario_registros';
```
Si `rowsecurity = false` → `ALTER TABLE inventario_registros ENABLE ROW LEVEL SECURITY;` primero.

#### Orden de aplicación (secuencial, validar entre bloques)

**BLOQUE 1 — Catálogos** (bajo riesgo):
```sql
-- Verificar nombre exacto de política actual antes del DROP:
SELECT policyname FROM pg_policies WHERE tablename = 'cultivos_catalogo';
DROP POLICY "<nombre_exacto>" ON cultivos_catalogo;
CREATE POLICY "Require auth cultivos_catalogo" ON cultivos_catalogo
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
```
Validar en app: FarmMap carga cultivos en selector.

**BLOQUE 2 — Personas y cuadrillas**:
Tablas: `personal`, `personal_externo`, `cuadrillas`, `ganaderos`
Patrón idéntico. Validar: Personal carga lista.

**BLOQUE 3 — Activos**:
Tablas: `maquinaria_tractores`, `maquinaria_aperos`, `camiones`, `vehiculos_empresa`
Validar: Maquinaria y Logística cargan.

**BLOQUE 4 — Operativas**:
Tablas: `trabajos_registro`, `trabajos_incidencias`, `planificacion_campana`,
        `maquinaria_uso`, `maquinaria_mantenimiento`,
        `logistica_viajes`, `logistica_mantenimiento`, `logistica_combustible`
Validar: crear trabajo, crear viaje.

**BLOQUE 5 — Parte diario** (ALTA CRITICIDAD):
Tablas: `partes_diarios`, `parte_estado_finca`, `parte_trabajo`,
        `parte_personal`, `parte_residuos_vegetales`
Validar exhaustivamente: parte diario completo funciona.

**BLOQUE 6 — Inventario**:
Tablas: `inventario_registros`, `inventario_movimientos`, `inventario_entradas`,
        `proveedores`, `inventario_ubicaciones`, `inventario_categorias`
Validar: inventario carga y acepta nuevos registros.

**BLOQUE 7 — QR**:
Tablas: `work_records`, `work_records_cuadrillas`
Validar: QR tablet funciona con sesión activa.

#### Rollback de cualquier política RLS:
```sql
-- Identificar nombre de política problemática:
SELECT policyname FROM pg_policies WHERE tablename = '<tabla>';
DROP POLICY "<nombre>" ON <tabla>;
CREATE POLICY "Temp open" ON <tabla> FOR ALL USING (true) WITH CHECK (true);
```

#### Estrategia multi-tenant futura (preparación sin romper datos)
FASE 1: `USING (auth.uid() IS NOT NULL)` — mono-tenant, cualquier auth pasa
FASE 2 (SaaS): añadir `organization_id TEXT DEFAULT 'marvic'` a todas las tablas
               + policy: `USING (organization_id = get_user_org())`
               Los datos actuales no se pierden: todos tienen 'marvic' como org.

---

## ORDEN BLOQUEANTE

```
PASO 0 (verificaciones)
  ├── STOP si auth.users vacío
  ├── STOP si build con errores
  │
PASO 1 (useCreatedBy.ts — PREREQUISITO para 2, 4B, 5, 6C)
  │
PASO 2 (useLogistica.ts)  ←── depende de PASO 1
PASO 3 (Logistica.tsx)    ←── independiente, lógicamente va con PASO 2
PASO 4A (Maquinaria.tsx)  ←── independiente
PASO 4B (useMaquinaria.ts)←── depende de PASO 1 + V1 types.ts
PASO 5 (useTrabajos + useInventario) ←── depende de PASO 1
  │
PASO 6A (ALTER TABLE SQL) ←── independiente de código
PASO 6B (regenerar types) ←── depende de PASO 6A
PASO 6C (useParteDiario)  ←── depende de PASO 6A + 6B + PASO 1
  │
PASO 7 (usuario_roles) ←── en cualquier momento
  │
PASO 8 (RLS) ←── SOLO después de que TODOS los pasos anteriores estén validados
```

---

## RIESGOS EXPLÍCITOS

| # | Riesgo | Prob | Impacto | Detectar | Revertir |
|---|---|---|---|---|---|
| R1 | maquinaria_uso sin created_by en types.ts | Media | Build falla en PASO 4B | Error TypeScript en build | Excluir del insert, mover a Track B |
| R2 | Parte diario deja de funcionar tras BLOQUE 5 RLS | Media | Rompe operativa diaria | Tabla vacía en UI, 403 en Network | DROP POLICY + recrear USING(true) en 2min |
| R3 | inventario_registros sin RLS habilitado | Alta | No hay protección en tabla crítica | rowsecurity=false en pg_tables | ALTER TABLE ENABLE ROW LEVEL SECURITY |
| R4 | regenerar types.ts sobreescribe cambios manuales previos | Media | Build con múltiples errores | Muchos errors TypeScript | git checkout -- types.ts + rehacer con CLI |
| R5 | Aplicar RLS antes de que código use email real | Alta | Mutations fallan en cascada | 403 masivo en Network DevTools | Revertir RLS a USING(true) PRIMERO, luego código |
| R6 | created_by = 'sistema' en datos nuevos | Baja | Audit trail degradado | SQL: WHERE created_by = 'sistema' | No rompe app, indica sesión expirada al insertar |
| R7 | usuario_roles vacío = rol fallback 'admin' para todos | Alta | Sin control de acceso real | Cualquier user tiene acceso total | Insertar roles correctos en PASO 7 |

---

## CHECKLIST FINAL

Pre-ejecución:
[ ] V1: maquinaria_uso tiene created_by en types.ts
[ ] V2: auth.users con email confirmado
[ ] V3: build 0 errores
[ ] V4: git en commit limpio 71b25ec
[ ] V5: SQL cuantificación ejecutado

Por paso:
[ ] PASO 1: useCreatedBy.ts → build OK
[ ] PASO 2: useLogistica.ts → build OK → SQL camión OK
[ ] PASO 3: Logistica.tsx → build OK → viaje test OK
[ ] PASO 4A: Maquinaria.tsx → build OK
[ ] PASO 4B: useMaquinaria.ts → build OK → SQL maquinaria_uso OK
[ ] PASO 5: useTrabajos + useInventario → build OK → SQL trabajos OK
[ ] PASO 6A: ALTER TABLE 6 tablas → SQL verificación OK
[ ] PASO 6B: types.ts regenerado → build OK
[ ] PASO 6C: useParteDiario.ts → build OK → SQL parte_estado_finca OK
[ ] PASO 7: usuario_roles con datos reales

Validación created_by (nuevos registros):
[ ] camiones.created_by = email real
[ ] vehiculos_empresa.created_by = email real
[ ] logistica_viajes.created_by = email real
[ ] maquinaria_tractores.created_by = email real
[ ] maquinaria_uso.created_by = email real
[ ] trabajos_registro.created_by = email real
[ ] inventario_registros.created_by = email real
[ ] parte_estado_finca.created_by = email real (post PASO 6)

Módulos funcionales (test manual completo):
[ ] Parte Diario: crear → añadir estado → añadir trabajo → cerrar jornada
[ ] Trabajos: crear planificado → cambiar estado
[ ] Logística: crear camión → crear viaje
[ ] Maquinaria: registrar uso tractor
[ ] Inventario: añadir registro stock
[ ] Dashboard: carga sin errores de consola

RLS (solo después de todo lo anterior):
[ ] Acceso anon bloqueado (curl sin JWT = 0 rows)
[ ] App funciona con sesión activa en todos los módulos
[ ] No hay errores 403 en DevTools durante uso normal

---

## ARCHIVO A CREAR EN EJECUCIÓN

Crear en raíz del proyecto: FASE1_PLAN_SEGURIDAD_MARVIC_FINAL.txt
(contenido: este documento completo)
