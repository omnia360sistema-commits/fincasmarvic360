---
# 🚀 FASE 2 — MULTI-USUARIO + AUDITORÍA COMPLETA
## Plan de implementación post-FASE 1
**Elaborado:** 09/04/2026  
**Status:** 📋 PLANIFICADO (No iniciado)  
**Duración estimada:** 2–3 semanas

---

## 🎯 OBJETIVO FASE 2

Con FASE 1 completada, el sistema ahora está listo para evolucionar de:
- ✅ Sistema monousuario (un usuario = JuanPe)
- ➡️ **Sistema multi-usuario con auditoría real**

---

## 📊 COMPONENTES DE FASE 2

### 1. ROLES Y PERMISOS ⏳
**Estado:** Diseñado pero no implementado

#### Estructura de roles:
```typescript
enum UserRole {
  ADMIN = 'admin',           // Acceso total + auditoría
  ENCARGADO = 'encargado',   // Gestión operativa
  OPERARIO = 'operario',     // Lectura + entrada datos
  SOLO_LECTURA = 'solo_lectura' // Auditor, cliente final
}
```

#### Cambios a implementar:
- ✅ Nueva tabla: `user_roles`
- ✅ Crear relación `users` ↔ `user_roles` (muchos a muchos)
- ✅ RLS por rol (read, write, delete según role)
- ✅ Hook: `useUserRole()` — devuelve rol del usuario autenticado
- ✅ Componente: `RoleGuard` — controla acceso por ruta

#### Tablas a crear:
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL, -- ENUM: admin, encargado, operario, solo_lectura
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL,
  resource TEXT NOT NULL, -- 'trabajos', 'logistica', 'inventario', etc.
  action TEXT NOT NULL,   -- 'read', 'write', 'delete', 'admin'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role, resource, action)
);
```

#### Impacto en UI:
- [ ] NavBar — mostrar rol del usuario actual
- [ ] Dashboard — restringir widgets por rol
- [ ] Páginas — mostrar/ocultar botones de edición según rol
- [ ] Modales — restringir acciones según rol

---

### 2. AUDIT LOG (Historial de cambios) ⏳
**Estado:** Estructura definida, no implementada

#### Nueva tabla:
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX(user_id, created_at),
  INDEX(table_name, created_at)
);
```

#### RPC para registrar cambios:
```sql
CREATE OR REPLACE FUNCTION log_audit_change(
  p_user_id UUID,
  p_table_name TEXT,
  p_record_id UUID,
  p_action TEXT,
  p_old_values JSONB,
  p_new_values JSONB,
  p_ip_address INET,
  p_user_agent TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO audit_log (user_id, table_name, record_id, action, old_values, new_values, ip_address, user_agent)
  VALUES (p_user_id, p_table_name, p_record_id, p_action, p_old_values, p_new_values, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql;
```

#### Hook para auditoría:
```typescript
// src/hooks/useAuditLog.ts
export const useAuditLog = () => {
  const { user } = useAuth();
  
  const logChange = async (tableName, recordId, action, oldValues, newValues) => {
    // Registra en audit_log vía RPC
  };
  
  return { logChange };
};
```

#### UI para auditoría:
- [ ] Nueva página: `Auditoría/Historial`
- [ ] Buscar por usuario, tabla, fecha
- [ ] Ver cambios antes/después (diff viewer)
- [ ] Exportar CSV para auditor externo

---

### 3. GESTIÓN DE USUARIOS ⏳
**Estado:** Login existe, pero sin gestión de usuarios

#### Nueva tabla:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  department TEXT, -- 'operaciones', 'logistica', 'maquinaria', etc.
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'deleted'
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Funcionalidades a implementar:
- [ ] CRUD de usuarios (solo admin)
- [ ] Asignar roles a usuarios
- [ ] Cambio de contraseña
- [ ] Recuperación de contraseña
- [ ] Desactivación de usuarios (soft delete)
- [ ] Import de usuarios en bulk (CSV)

#### Hook:
```typescript
// src/hooks/useUserManagement.ts
export const useUserManagement = () => {
  const addUser = async (email, fullName, role) => { };
  const updateUser = async (userId, updates) => { };
  const deleteUser = async (userId) => { }; // Soft delete
  const assignRole = async (userId, role) => { };
  const getUsers = async (filters) => { };
  
  return { addUser, updateUser, deleteUser, assignRole, getUsers };
};
```

#### Página:
- [ ] `Administración/Usuarios`
- [ ] Tabla con usuarios actuales
- [ ] Botones: Añadir, Editar, Eliminar, Cambiar role
- [ ] Búsqueda y filtros

---

### 4. SESIONES Y LOGIN MEJORADO ⏳
**Estado:** Login básico funciona, sin sesiones

#### Mejoras:
- [ ] Registrar inicio de sesión en tabla `user_sessions`
- [ ] Detectar intentos fallidos
- [ ] 2FA (autenticación de dos factores) — opcional
- [ ] Cierre de sesión en múltiples dispositivos
- [ ] Timeout de sesión (15 min inactividad)
- [ ] "Recuerda este dispositivo"

#### Tabla:
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  login_at TIMESTAMP DEFAULT NOW(),
  logout_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'active' -- 'active', 'expired', 'logged_out'
);
```

---

## 🗺️ ROADMAP DETALLADO

### FASE 2.1 — Roles y permisos (Semana 1)
1. ✅ Crear tablas `user_roles` + `role_permissions`
2. ✅ Implementar RLS por rol
3. ✅ Crear hook `useUserRole()`
4. ✅ Crear componente `RoleGuard`
5. ✅ Actualizar `NavBar` para mostrar rol
6. ✅ Restringir botones en UI por rol
7. ✅ Validar en todos los hooks

**Riesgos:** RLS puede romper queries existentes si no se configura bien  
**Mitigation:** Validar cada query en Supabase console antes de deploy

---

### FASE 2.2 — Audit log (Semana 1-2)
1. ✅ Crear tabla `audit_log`
2. ✅ Crear RPC `log_audit_change()`
3. ✅ Integrar en cada mutation (trabajos, logística, etc.)
4. ✅ Crear página de auditoría
5. ✅ Implementar búsqueda y filtros
6. ✅ Exportar a CSV/PDF

**Riesgos:** Performance si audit_log crece mucho (millones de registros)  
**Mitigation:** Índices + particionamiento por fecha

---

### FASE 2.3 — Gestión de usuarios (Semana 2)
1. ✅ Crear tabla `user_profiles`
2. ✅ CRUD de usuarios (hook `useUserManagement`)
3. ✅ Página de administración
4. ✅ Asignación de roles en UI
5. ✅ Import bulk de usuarios

**Riesgos:** Cambio de email podría romper auth  
**Mitigation:** Email es inmutable (solo crear/deprecar)

---

### FASE 2.4 — Sesiones y login mejorado (Semana 3)
1. ✅ Crear tabla `user_sessions`
2. ✅ Registrar login/logout
3. ✅ Detectar intentos fallidos
4. ✅ Timeout automático
5. ✅ Dashboard de sesiones activas

**Riesgos:** Timeout podría desloguear al usuario durante operaciones largas  
**Mitigation:** Refresh automático de sesión cada 10 min

---

## 📊 MATRIZ DE PRIORIDADES

| Feature | Prioridad | Esfuerzo | Impacto | FASE 2.X |
|---------|-----------|----------|--------|----------|
| Roles y permisos | 🔴 Crítico | 5 días | Alto | 2.1 |
| Audit log | 🔴 Crítico | 5 días | Alto | 2.2 |
| Gestión usuarios | 🟠 Alta | 4 días | Alto | 2.3 |
| Sesiones mejorado | 🟠 Alta | 3 días | Medio | 2.4 |
| 2FA | 🟢 Opcional | 3 días | Medio | Futuro |

---

## 🔐 CAMBIOS EN RLS

### Estado actual (FASE 1)
```sql
-- RLS permisiva (cualquier usuario autenticado ve todo)
CREATE POLICY "Autenticado lee trabajos"
  ON trabajos FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### Con FASE 2 (Roles y permisos)
```sql
-- RLS estricta (solo tu rol puede acceder)
CREATE POLICY "Encargado escribe trabajos"
  ON trabajos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'encargado'
    )
  );
```

**⚠️ RIESGO CRÍTICO:** Esto puede bloquear acceso a datos actuales  
**Mitigation:** Migración gradual + testing exhaustivo antes de deploy

---

## 📋 DEPENDENCIES

FASE 2 depende de:
- ✅ FASE 1 completada (created_by real)
- ✅ AuthContext funcionando
- ✅ useAuth() integrado globalmente
- ✅ RLS basada en auth.uid()

---

## ⚠️ RIESGOS DE FASE 2

| Riesgo | Probabilidad | Impacto | Mitigation |
|--------|-------------|--------|-----------|
| RLS rompe queries | 🟠 Media | 🔴 Crítico | Test exhaustivo en staging |
| Performance de audit_log | 🟡 Baja | 🟠 Alto | Índices + particionamiento |
| Breaking changes en API | 🟡 Baja | 🔴 Crítico | Versionado de API |
| Datos huérfanos tras soft delete | 🟡 Baja | 🟠 Alto | Cascade automático |
| Email inmutable causa fricción | 🟡 Baja | 🟢 Bajo | UX mejorada |

---

## 📅 TIMELINE

```
FASE 1 [████████] ✅ Completada (09/04/2026)
       ↓
FASE 2 [ ░░░░░░░░] 📅 Planificada
       ├─ 2.1: Roles [░░░░░] 5 días
       ├─ 2.2: Audit [░░░░░] 5 días
       ├─ 2.3: Usuarios [░░░░] 4 días
       └─ 2.4: Sesiones [░░░] 3 días
       
       Total: 17 días (2.4 semanas)
```

---

## 🎓 CAPACITACIÓN PARA FASE 2

Cuando se inicie FASE 2, el equipo debe:
- ✅ Entender RLS en Supabase
- ✅ Conocer políticas de auditoría
- ✅ Aprender gestión de roles
- ✅ Testing de RLS exhaustivamente

---

## ✅ CRITERIOS DE ACEPTACIÓN FASE 2

Una vez completada, el sistema debe cumplir:

- [ ] Solo ADMIN puede ver auditoría completa
- [ ] ENCARGADO ve solo sus departamentos
- [ ] OPERARIO solo escribe datos (no lee auditoría)
- [ ] SOLO_LECTURA no puede escribir nada
- [ ] Cada cambio queda registrado en audit_log
- [ ] Histórico de cambios visible para ADMIN
- [ ] Gestión de usuarios funcional
- [ ] Sesiones timeout en 15 min inactividad
- [ ] 0 breaking changes en APIs actuales
- [ ] Performance sin degradación

---

## 🎯 SIGUIENTE PASO

Una vez aprobada esta FASE 2:

1. Crear rama de desarrollo: `feature/phase-2-users`
2. Dividir tareas en 4 sub-ramas:
   - `feature/phase-2.1-roles`
   - `feature/phase-2.2-audit`
   - `feature/phase-2.3-users`
   - `feature/phase-2.4-sessions`
3. PR por cada sub-rama
4. Deploy a staging para testing
5. Validación externa
6. Merge a main

---

## 📞 CONTACTO

Para cuestiones sobre FASE 2:
- **Responsable técnico:** CTO Senior
- **Equipo de auditoría:** Disponible para validaciones
- **Cliente (MARVIC):** A ser informado antes de iniciar

---

**Documento de planificación — FASE 2 LISTA PARA INICIAR**

*Última actualización: 09/04/2026*

