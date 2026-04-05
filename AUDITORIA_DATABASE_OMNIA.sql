/*
═══════════════════════════════════════════════════════════════════════════════════
  AUDITORIA_DATABASE_OMNIA.sql
═══════════════════════════════════════════════════════════════════════════════════

  MISIÓN: Dokumentation completa de la arquitectura relacional de la base de datos
          PostgreSQL/Supabase del ERP Agrícola MARVIC 360.

  ALCANCE: Tablas centrales en 5 módulos de negocio:
           1. PERSONAL — RH, operarios, conductores, externos
           2. MAQUINARIA — Tractores, aperos, mantenimiento
           3. INVENTARIO — Ubicaciones, productos, movimientos, registros
           4. TRABAJOS — Planificación, ejecución, incidencias
           5. LOGÍSTICA — Camiones, viajes, combustible, mantenimiento

  CONVENCIONES:
  • UUIDs generados por Supabase: gen_random_uuid() | uuid_generate_v4()
  • Timestamps: created_at, updated_at (WITHOUT TIME ZONE para UTC)
  • Estados: ENUM o CHECK constraints
  • Códigos automáticos: generarCodigoInterno() en trigger
  • RLS: Enabled anon role con políticas selectivas
  • Auditoría: Campos created_by, updated_by, deleted_at (soft delete)

  VERSIÓN: 1.0.0 (04/04/2026 — Rev. 17 — COMPLETADO)
  AUTOR: Copilot (GitHub)
  CLIENTE: Grupo MARVIC — 250 ha ecológicas, Murcia y Valencia

═══════════════════════════════════════════════════════════════════════════════════
*/

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 1: ENUMERACIONES Y TIPOS PERSONALIZADOS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Estados operativos para activos (tractores, aperos, camiones, vehículos)
CREATE TYPE estado_operativo AS ENUM ('operativo', 'mantenimiento', 'fuera_servicio', 'baja');

-- Categorías de personal para control de permisos y asignación de trabajos
CREATE TYPE categoria_personal AS ENUM ('operario_campo', 'encargado', 'conductor_maquinaria', 'conductor_camion');

-- Estados de planificación de trabajos (ciclo de vida)
CREATE TYPE estado_planificacion AS ENUM ('pendiente', 'planificado', 'en_ejecucion', 'completado', 'suspendido');

-- Prioridades de trabajos
CREATE TYPE prioridad_trabajo AS ENUM ('baja', 'normal', 'alta', 'critica');

-- Alertas de ITV (Inspección Técnica de Vehículos)
CREATE TYPE alerta_itv AS ENUM ('critica', 'urgente', 'normal');

-- Unidades de medida en inventario (Unit of Measure)
CREATE TYPE unidad_inventario AS ENUM ('kg', 'g', 'l', 'ml', 'm', 'cm', 'pz', 'caja', 'm_lineal');

-- Estados de certificación
CREATE TYPE estado_certificacion AS ENUM ('en_tramite', 'aprobada', 'denegada', 'vencida', 'renovacion');

-- Tipos de viaje en logística
CREATE TYPE tipo_viaje AS ENUM ('interno', 'externo', 'retirada_residuos', 'suministro');

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 2: TABLAS CATÁLOGO (MAESTRAS)
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  CATALOGO_TIPOS_TRABAJO
  ─────────────────────────────────────────────────────────────────────────────
  Maestro de tipos de trabajo: siembra, cosecha, riego, tratamiento, etc.
  
  RELACIONES:
    • personal_tipos_trabajo (N:N) — Tipos de trabajo que sabe hacer cada operario
    • trabajos_registro (1:N) — Trabajos registrados
    • maquinaria_mantenimiento (1:N) — Tipos de mantenimiento de máquinas
    • logistica_viajes (1:N) — Tipos de tareas en viajes
  
  INDEXACIÓN: Por tipo y categoría para filtrados rápidos
*/
CREATE TABLE catalogo_tipos_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  categoría categoria_personal NOT NULL,
  descripción TEXT,
  icono_emoji TEXT,
  activo BOOLEAN DEFAULT true NOT NULL,
  órden INTEGER DEFAULT 999,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  CONSTRAINT ck_catalogo_tipos_trabajo_nombre CHECK (char_length(nombre) > 0)
);

CREATE INDEX idx_catalogo_tipos_trabajo_categoria ON catalogo_tipos_trabajo(categoría, activo);
CREATE INDEX idx_catalogo_tipos_trabajo_activo ON catalogo_tipos_trabajo(activo);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 3: TABLA PERSONAL (CORE DE RH)
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  PERSONAL
  ─────────────────────────────────────────────────────────────────────────────
  Maestro de operarios, encargados, conductores de maquinaria y camión.
  
  LÓGICA ESPECIAL:
    • codigo_interno: OP/EN/CM/CC + padStart(3, '0') → OP001, OP002, EN001, etc.
    • Generado automáticamente en trigger al dar de alta (first time only)
    • categoría: Determina prefijo de código y tipos de trabajo asignables
    • finca_asignada: Finca base (multi-finca no soportado en v17)
    • carnet_tipo + carnet_caducidad: Alertas de caducidad en Estado General
    • tacografo: Solo para conductores de camión
  
  RELACIONES:
    ✓ personal_tipos_trabajo (N:N) → catalogo_tipos_trabajo — tipos que sabe hacer
    ✓ maquinaria_uso.personal_id (1:N) — Quién manejó cada activo
    ✓ maquinaria_mantenimiento.personal_id (1:N) — Técnico responsable
    ✓ trabajos_registro.personal_id (1:N) — Trabajos asignados
    ✓ logistica_viajes.personal_id (1:N) — Viajes realizados
    ✓ parte_residuos_vegetales.personal_id (1:N) — Acompañante en retira residuos
    ✓ vehiculos_empresa.conductor_habitual_id (1:N) — Conductor asignado a vehículo
  
  RLS: Anon lee operarios activos asignados a finca (JOIN partes_diarios)
  
  TRIGGERS:
    • tr_personal_auto_codigo: Genera código único al insertar (OP001, OP002, etc.)
    • tr_personal_updated_at: Actualiza updated_at en cada UPDATE
*/
CREATE TABLE personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo_interno TEXT UNIQUE,  -- Autogenerado: OP001, EN002, CM003, CC001
  nombre TEXT NOT NULL,
  apellidos TEXT,
  nif TEXT UNIQUE,
  email TEXT,
  teléfono TEXT,
  
  -- Clasificación laboral
  categoría categoria_personal NOT NULL DEFAULT 'operario_campo',
  finca_asignada TEXT,  -- Nombre de finca (FK a FINCAS_DATA.nombre en constants)
  
  -- Documentación
  carnet_tipo TEXT,  -- Tipo de carnet: B, B+E, C, C+E, D, AD, AE
  carnet_caducidad DATE,  -- Alertas en Estado General si ≤ 30 días
  tacografo BOOLEAN DEFAULT false,  -- Solo conductores camión: digital/analógico
  licencias TEXT,  -- JSON: ["B", "C", "C+E", "Digital", "Analógico"]
  
  -- Fechas
  fecha_alta DATE DEFAULT CURRENT_DATE,
  fecha_baja DATE,
  
  -- Otros datos
  foto_url TEXT,  -- PhotoAttachment: foto carnet o retrato
  notas TEXT,  -- AudioInput: disponibilidad, habilidades especiales
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  CONSTRAINT ck_personal_nombre CHECK (char_length(nombre) > 0),
  CONSTRAINT ck_personal_categoría_carnet CHECK (
    (categoría IN ('conductor_camion', 'conductor_maquinaria') AND carnet_tipo IS NOT NULL) OR
    categoría NOT IN ('conductor_camion', 'conductor_maquinaria')
  )
);

CREATE INDEX idx_personal_categoría ON personal(categoría, activo);
CREATE INDEX idx_personal_finca_asignada ON personal(finca_asignada, activo);
CREATE INDEX idx_personal_carnet_caducidad ON personal(carnet_caducidad) WHERE activo = true;
CREATE INDEX idx_personal_codigo_interno ON personal(codigo_interno);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA PUENTE: personal_tipos_trabajo (N:N)
-- ─────────────────────────────────────────────────────────────────────────────

/*
  PERSONAL_TIPOS_TRABAJO
  ─────────────────────────────────────────────────────────────────────────────
  Relación N:N: Qué tipos de trabajo sabe hacer cada operario.
  
  LÓGICA:
    • Un operario puede tener múltiples tipos de trabajo (Siembra, Riego, Poda, etc.)
    • Un tipo de trabajo puede ser realizado por múltiples operarios
    • Usado en selectores cascada en Trabajos.tsx
    • RLS: anon puede leer para filtrados en parte diario
  
  TRIGGERS:
    • tr_personal_tipos_trabajo_delete: Cascada si se elimina tipo de trabajo
*/
CREATE TABLE personal_tipos_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES personal(id) ON DELETE CASCADE,
  tipo_trabajo_id UUID NOT NULL REFERENCES catalogo_tipos_trabajo(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  
  UNIQUE (personal_id, tipo_trabajo_id)
);

CREATE INDEX idx_personal_tipos_trabajo_personal_id ON personal_tipos_trabajo(personal_id);
CREATE INDEX idx_personal_tipos_trabajo_tipo_id ON personal_tipos_trabajo(tipo_trabajo_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: personal_externo (Destajistas y contratistas)
-- ─────────────────────────────────────────────────────────────────────────────

/*
  PERSONAL_EXTERNO
  ─────────────────────────────────────────────────────────────────────────────
  Trabajadores eventuales, destajistas, contratistas (no empleados de Marvic).
  
  LÓGICA ESPECIAL:
    • codigo_interno: EX + padStart(3, '0') → EX001, EX002, ...
    • Opcional: persona_contacto (nombre para enlace con empresa contratista)
    • presupuesto: Coste por trabajo (en EUR)
    • trabajos_realiza: JSON lista de tipos de trabajo ["Siembra", "Cosecha", ...]
  
  RELACIONES:
    ✓ trabajos_registro.personal_externo_id (1:N) — Trabajos realizados
  
  RLS: No exportar datos personales a anon (solo nombre y teléfono)
*/
CREATE TABLE personal_externo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo_interno TEXT UNIQUE,  -- Autogenerado: EX001, EX002, ...
  nombre TEXT NOT NULL,
  persona_contacto TEXT,  -- Nombre de la empresa o responsable
  teléfono TEXT,
  email TEXT,
  
  -- Económico
  presupuesto NUMERIC(10,2),  -- Coste por trabajo en EUR
  trabajos_realiza TEXT,  -- JSON: ["Cosecha", "Transporte", "Limpieza nave"]
  
  -- Documentación
  nif TEXT UNIQUE,
  foto_url TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  CONSTRAINT ck_personal_externo_nombre CHECK (char_length(nombre) > 0)
);

CREATE INDEX idx_personal_externo_activo ON personal_externo(activo);
CREATE INDEX idx_personal_externo_codigo_interno ON personal_externo(codigo_interno);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 4: TABLA MAQUINARIA
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  MAQUINARIA_TRACTORES
  ─────────────────────────────────────────────────────────────────────────────
  Maestro de tractores y máquinas autopropulsadas.
  
  LÓGICA ESPECIAL:
    • codigo_interno: TR + padStart(3, '0') → TR001, TR002, ...
    • estado_operativo: operativo | mantenimiento | fuera_servicio | baja
    • fecha_proxima_itv: Alertas en rojo si < 30 días (alerta_itv calculada)
    • km_actual: Odómetro actual (para planificación mantenimiento)
    • horas_motor: Horas de funcionamiento (alternativa a km)
    • tractorista: LEGACY (deprecated) — usar personal_id en maquinaria_uso
  
  RELACIONES:
    ✓ maquinaria_aperos (1:N) — Aperos asignados / enganchados
    ✓ maquinaria_uso (1:N) — Historial de uso (quién, cuándo, dónde, horas)
    ✓ maquinaria_mantenimiento (1:N) — Reparaciones, cambios de aceite, etc.
    ✓ maquinaria_inventario_sync (1:N) — Ubicación actual (nave, parcela)
    ✓ trabajos_registro.tractor_id (1:N) — Trabajos planificados con este tractor
  
  RLS: Anon puede leer estado operativo, no exposiciones técnicas
  
  TRIGGERS:
    • tr_maquinaria_tractores_auto_codigo: Genera TR001, TR002, ...
    • tr_maquinaria_tractores_updated_at: Actualiza timestamp
*/
CREATE TABLE maquinaria_tractores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo_interno TEXT UNIQUE,  -- Autogenerado: TR001, TR002, ...
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  matrícula TEXT UNIQUE,
  año INTEGER,
  
  -- Condición técnica
  estado_operativo estado_operativo DEFAULT 'operativo' NOT NULL,
  km_actual NUMERIC(10,2),  -- Odómetro
  horas_motor NUMERIC(10,2),  -- Alternativa a km (para motobombas, etc.)
  fecha_proxima_revision DATE,  -- Mantenimiento preventivo
  km_proximo_mantenimiento NUMERIC(10,2),
  
  -- Inspección Técnica
  fecha_itv DATE,  -- Última inspección
  fecha_proxima_itv DATE,  -- Próxima inspección obligatoria
  número_itv TEXT,
  
  -- Especificaciones
  potencia_cv NUMERIC(6,2),  -- Potencia en CV
  motor_cc NUMERIC(6,2),  -- Cilindrada en cc
  ancho_trabajo_cm INTEGER,
  velocidad_máx_kmh NUMERIC(5,2),
  
  -- Adjuntos
  foto_url TEXT,  -- PhotoAttachment
  ficha_técnica_url TEXT,
  
  -- DEPRECATED: usar personal_id en maquinaria_uso para historial
  tractorista TEXT,
  
  -- Notas y gestión
  notas TEXT,  -- AudioInput
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  CONSTRAINT ck_maquinaria_tractores_marca CHECK (char_length(marca) > 0),
  CONSTRAINT ck_maquinaria_tractores_modelo CHECK (char_length(modelo) > 0)
);

CREATE INDEX idx_maquinaria_tractores_estado_operativo ON maquinaria_tractores(estado_operativo, activo);
CREATE INDEX idx_maquinaria_tractores_proxima_itv ON maquinaria_tractores(fecha_proxima_itv) WHERE estado_operativo = 'operativo';
CREATE INDEX idx_maquinaria_tractores_codigo_interno ON maquinaria_tractores(codigo_interno);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  MAQUINARIA_APEROS
  ─────────────────────────────────────────────────────────────────────────────
  Maestro de aperos (arados, sembradoras, pulverizadores, etc.).
  
  LÓGICA ESPECIAL:
    • codigo_interno: AP + padStart(3, '0') → AP001, AP002, ...
    • estado: operativo | mantenimiento | fuera_servicio | baja
    • tractor_id: Tractor al que está acoplado/asignado (NULL = disponible)
    • ancho_trabajo_cm: Anchura de trabajo (usado en cálculos de rendimiento)
  
  RELACIONES:
    ✓ maquinaria_tractores.id (N:1) — Tractor al que está enganchado
    ✓ maquinaria_uso (1:N) — Historial de uso
    ✓ maquinaria_mantenimiento (1:N) — Reparaciones
    ✓ inventario_ubicacion_activo (1:N) — Ubicación actual en nave
    ✓ trabajos_registro.apero_id (1:N) — Trabajos planificados con este apero
  
  TRIGGERS:
    • tr_maquinaria_aperos_auto_codigo: Genera AP001, AP002, ...
    • tr_maquinaria_aperos_updated_at: Actualiza timestamp
*/
CREATE TABLE maquinaria_aperos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo_interno TEXT UNIQUE,  -- Autogenerado: AP001, AP002, ...
  nombre TEXT NOT NULL,  -- Denominación: Arado, Sembradora, Pulverizador, etc.
  marca TEXT,
  modelo TEXT,
  año INTEGER,
  serie TEXT,
  
  -- Asignación y estado
  tractor_id UUID REFERENCES maquinaria_tractores(id) ON DELETE SET NULL,  -- NULL si disponible
  estado estado_operativo DEFAULT 'operativo' NOT NULL,
  
  -- Especificaciones operativas
  ancho_trabajo_cm INTEGER,  -- Ancho de labor
  profundidad_cm INTEGER,
  capacidad_litros NUMERIC(10,2),  -- Para pulverizadores, sembradoras, etc.
  rendimiento_ha_hora NUMERIC(8,2),  -- Estimación de superficie/hora
  
  -- Mantenimiento preventivo
  fecha_proxima_revisión DATE,
  horas_uso_totales NUMERIC(10,2),
  horas_proxima_revisión NUMERIC(10,2),
  
  -- Adjuntos y documentación
  foto_url TEXT,  -- PhotoAttachment
  ficha_técnica_url TEXT,
  manual_url TEXT,
  
  -- Notas
  notas TEXT,  -- AudioInput
  descripción TEXT,  -- Descripción técnica libre
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  CONSTRAINT ck_maquinaria_aperos_nombre CHECK (char_length(nombre) > 0)
);

CREATE INDEX idx_maquinaria_aperos_tractor_id ON maquinaria_aperos(tractor_id);
CREATE INDEX idx_maquinaria_aperos_estado ON maquinaria_aperos(estado, activo);
CREATE INDEX idx_maquinaria_aperos_codigo_interno ON maquinaria_aperos(codigo_interno);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  MAQUINARIA_USO (Historial de uso)
  ─────────────────────────────────────────────────────────────────────────────
  Registro de cada vez que se utiliza un tractor o apero.
  
  LÓGICA:
    • tractor_id: Máquina usada
    • apero_id: Apero usado (NULL si solo tractor)
    • personal_id: Quién manejó
    • fecha_inicio, fecha_fin: Período de uso
    • horas_trabajo: Duración del trabajo (calculado si es posible)
    • trabajo_realizado: Descripción de qué se hizo
    • parcela: Ubicación de la tarea (nombre de parcela)
  
  RELACIONES:
    ✓ maquinaria_tractores.id (N:1)
    ✓ maquinaria_aperos.id (N:1)
    ✓ personal.id (N:1)
  
  INDEXACIÓN: Por fecha y máquina para listados rápidos
*/
CREATE TABLE maquinaria_uso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Máquinas
  tractor_id UUID NOT NULL REFERENCES maquinaria_tractores(id) ON DELETE CASCADE,
  apero_id UUID REFERENCES maquinaria_aperos(id) ON DELETE SET NULL,
  
  -- Operador
  personal_id UUID REFERENCES personal(id) ON DELETE SET NULL,
  
  -- Período de uso
  fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITHOUT TIME ZONE,
  horas_trabajo NUMERIC(6,2),  -- Duración estimada en horas
  
  -- Trabajo realizado
  trabajo_realizado TEXT,  -- Denominación: Laboreo, Siembra, Riego, etc.
  parcela TEXT,  -- Nombre de la parcela donde se realizó
  notas TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT ck_maquinaria_uso_fecha CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_maquinaria_uso_tractor_id ON maquinaria_uso(tractor_id, fecha_inicio DESC);
CREATE INDEX idx_maquinaria_uso_personal_id ON maquinaria_uso(personal_id, fecha_inicio DESC);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  MAQUINARIA_MANTENIMIENTO (Reparaciones y mantenimiento preventivo)
  ─────────────────────────────────────────────────────────────────────────────
  Registro de mantenimientos, reparaciones y cambios de consumibles.
  
  LÓGICA:
    • tractor_id OR apero_id: Máquina que se mantiene
    • tipo_mantenimiento: Cambio aceite, Reparación motor, ITV, etc.
    • km_odometro: Odómetro al momento del mantenimiento (tractor)
    • horas_motor: Horas de motor al momento (para máquinas con contador horas)
    • coste: Importe de la reparación
    • Alertas: Mantenimiento urgente si:
      • actual ≤ próximo_mantenimiento (km o horas)
      • Basado en catalogo_tipos_mantenimiento WHERE modulo='maquinaria'
  
  RELACIONES:
    ✓ maquinaria_tractores.id (1:N)
    ✓ maquinaria_aperos.id (1:N)
    ✓ personal.id (N:1) — Técnico responsable
    ✓ catalogo_tipos_trabajo (1:N) — Tipo de mantenimiento (FK calculada en app)
  
  INDEXACIÓN: Próximos mantenimientos pendientes
*/
CREATE TABLE maquinaria_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Máquina a mantener (una de las dos)
  tractor_id UUID REFERENCES maquinaria_tractores(id) ON DELETE CASCADE,
  apero_id UUID REFERENCES maquinaria_aperos(id) ON DELETE CASCADE,
  
  -- Tipo de mantenimiento
  tipo_mantenimiento TEXT NOT NULL,  -- Cambio aceite, Revisión motor, Ajuste embrague, etc.
  descripción TEXT,  -- AudioInput: qué se encontró, qué se hizo
  
  -- Técnico responsable
  personal_id UUID REFERENCES personal(id) ON DELETE SET NULL,
  
  -- Lecturas de máquina
  km_odometro NUMERIC(10,2),  -- Para tractores
  horas_motor NUMERIC(10,2),  -- Alternativa a km
  
  -- Planificación
  fecha_realizado DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_próximo TIMESTAMP WITHOUT TIME ZONE,  -- Cuándo revisitar
  km_próximo NUMERIC(10,2),  -- Próxima revisión en km
  horas_próximas NUMERIC(10,2),  -- Próxima revisión en horas
  
  -- Económico
  coste NUMERIC(10,2),
  repuestos_utilizados TEXT,  -- JSON o texto libre
  
  -- Adjuntos
  foto_url TEXT,
  factura_url TEXT,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT ck_maquinaria_mantenimiento_máquina CHECK (
    (tractor_id IS NOT NULL AND apero_id IS NULL) OR
    (tractor_id IS NULL AND apero_id IS NOT NULL)
  ),
  CONSTRAINT ck_maquinaria_mantenimiento_tipo CHECK (char_length(tipo_mantenimiento) > 0)
);

CREATE INDEX idx_maquinaria_mantenimiento_tractor_id ON maquinaria_mantenimiento(tractor_id, fecha_próximo);
CREATE INDEX idx_maquinaria_mantenimiento_apero_id ON maquinaria_mantenimiento(apero_id, fecha_próximo);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  MAQUINARIA_INVENTARIO_SYNC (Ubicación actual de máquinas)
  ─────────────────────────────────────────────────────────────────────────────
  Tabla de sincronización: Dónde están los tractores y aperos (nave, campo, taller).
  
  LÓGICA:
    • maquinaria_id: UUID + tipo (tractor o apero)
    • ubicacion_id: FK a inventario_ubicaciones
    • estado_operativo: Copia del estado actual
    • Sincronización automática: trigger al dar de alta maquinaria
  
  RELACIONES:
    ✓ maquinaria_tractores.id (1:1 optional)
    ✓ maquinaria_aperos.id (1:1 optional)
    ✓ inventario_ubicaciones.id (1:N)
*/
CREATE TABLE maquinaria_inventario_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Máquina
  maquinaria_id UUID NOT NULL,  -- UUID de tractor o apero
  tipo_maquinaria TEXT CHECK (tipo_maquinaria IN ('tractor', 'apero')),
  
  -- Ubicación
  ubicacion_id UUID,  -- FK a inventario_ubicaciones
  
  -- Estado
  estado_operativo estado_operativo DEFAULT 'operativo',
  
  -- Auditoría
  last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  UNIQUE (maquinaria_id, tipo_maquinaria)
);

CREATE INDEX idx_maquinaria_inventario_sync_ubicacion_id ON maquinaria_inventario_sync(ubicacion_id);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  VEHICLE_POSITIONS (Telemetría GPS en tiempo real)
  ─────────────────────────────────────────────────────────────────────────────
  Registro de la posición de la maquinaria y vehículos logísticos (Teltonika FMC920).
*/
CREATE TABLE vehicle_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL,
  vehicle_tipo TEXT CHECK (vehicle_tipo IN ('tractor','camion','vehiculo')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitud NUMERIC(10,7) NOT NULL,
  longitud NUMERIC(10,7) NOT NULL,
  velocidad_kmh NUMERIC(6,2),
  parcel_id_detectada TEXT REFERENCES parcels(parcel_id),
  estado TEXT DEFAULT 'activo'
);

ALTER TABLE vehicle_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full access" ON vehicle_positions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX idx_vehicle_positions_vehicle_time ON vehicle_positions(vehicle_id, timestamp DESC);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 5: TABLA LOGÍSTICA
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  CAMIONES
  ─────────────────────────────────────────────────────────────────────────────
  Maestro de vehículos de transporte pesado propios o contratados.
  
  LÓGICA ESPECIAL:
    • codigo_interno: CM + padStart(3, '0') → CM001, CM002, ...
    • estado_operativo: operativo | mantenimiento | fuera_servicio | baja
    • tipo: propio | contratado
    • GPS: Preparado para conexión futura (campo gps_info: JSON)
    • Alertas ITV: < 30 días en naranja, < 0 días en rojo
  
  RELACIONES:
    ✓ logistica_viajes (1:N) — Viajes realizados con este camión
    ✓ logistica_mantenimiento (1:N) — Reparaciones
    ✓ logistica_combustible (1:N) — Repostajes
    ✓ tickets_pesaje.camion_id (1:N) — Cosechas transportadas
    ✓ logistica_inventario_sync (1:N) — Ubicación actual
  
  RLS: Anon puede leer estado operativo, no datos técnicos sensibles
  
  TRIGGERS:
    • tr_camiones_auto_codigo: Genera CM001, CM002, ...
    • tr_camiones_updated_at: Actualiza timestamp
*/
CREATE TABLE camiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo_interno TEXT UNIQUE,  -- Autogenerado: CM001, CM002, ...
  matrícula TEXT UNIQUE NOT NULL,
  empresa_transporte TEXT,  -- Si es contratado
  
  -- Propietario
  tipo TEXT CHECK (tipo IN ('propio', 'contratado')) DEFAULT 'propio',
  
  -- Especificaciones
  marca TEXT,
  modelo TEXT,
  año INTEGER,
  capacidad_kg NUMERIC(12,2),
  volumen_m3 NUMERIC(8,2),
  
  -- Condición técnica
  estado_operativo estado_operativo DEFAULT 'operativo' NOT NULL,
  km_actuales NUMERIC(10,2),
  fecha_itv DATE,
  fecha_próxima_itv DATE,
  número_itv TEXT,
  fecha_próxima_revisión DATE,
  km_próximo_mantenimiento NUMERIC(10,2),
  
  -- GPS (futuro)
  gps_info TEXT,  -- JSON: {lat, lon, timestamp, velocidad}
  
  -- Adjuntos
  foto_url TEXT,  -- PhotoAttachment
  
  -- Notas
  notas_mantenimiento TEXT,  -- AudioInput
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT ck_camiones_matrícula CHECK (char_length(matrícula) > 0),
  CONSTRAINT ck_camiones_marca CHECK (marca IS NULL OR char_length(marca) > 0)
);

CREATE INDEX idx_camiones_estado_operativo ON camiones(estado_operativo, activo);
CREATE INDEX idx_camiones_proxima_itv ON camiones(fecha_próxima_itv) WHERE estado_operativo = 'operativo';
CREATE INDEX idx_camiones_código_interno ON camiones(codigo_interno);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  VEHICULOS_EMPRESA
  ─────────────────────────────────────────────────────────────────────────────
  Vehículos ligeros de la empresa: furgonetas, pick-up, turismos.
  
  LÓGICA ESPECIAL:
    • codigo_interno: VH + padStart(3, '0') → VH001, VH002, ...
    • conductor_habitual_id: Personal FK a tabla personal (categoría: conductor_camion, conductor_maquinaria)
    • estado_operativo: operativo | mantenimiento | fuera_servicio | baja
  
  RELACIONES:
    ✓ personal.id (N:1) — Conductor habitual
    ✓ logistica_combustible (1:N) — Repostajes
    ✓ logistica_inventario_sync (1:N) — Ubicación actual
  
  TRIGGERS:
    • tr_vehiculos_empresa_auto_codigo: Genera VH001, VH002, ...
*/
CREATE TABLE vehiculos_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  codigo_interno TEXT UNIQUE,  -- Autogenerado: VH001, VH002, ...
  matrícula TEXT UNIQUE NOT NULL,
  
  -- Especificaciones
  marca TEXT,
  modelo TEXT,
  año INTEGER,
  tipo TEXT CHECK (tipo IN ('furgoneta', 'pick-up', 'turismo', 'otro')),
  
  -- Asignación
  conductor_habitual_id UUID REFERENCES personal(id) ON DELETE SET NULL,
  
  -- Condición técnica
  estado_operativo estado_operativo DEFAULT 'operativo' NOT NULL,
  km_actuales NUMERIC(10,2),
  fecha_itv DATE,
  fecha_próxima_itv DATE,
  
  -- Adjuntos
  foto_url TEXT,
  
  -- Notas
  notas TEXT,
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_vehiculos_empresa_conductor_habitual_id ON vehiculos_empresa(conductor_habitual_id);
CREATE INDEX idx_vehiculos_empresa_estado_operativo ON vehiculos_empresa(estado_operativo, activo);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  LOGISTICA_VIAJES
  ─────────────────────────────────────────────────────────────────────────────
  Registro de viajes y transportes.
  
  LÓGICA:
    • camion_id OR vehiculo_id: Vehículo utilizado
    • tipo_viaje: interno | externo | retirada_residuos | suministro
    • personal_id: Conductor/operador
    • ruta, destino: Información de la tarea
    • km_inicio, km_fin: Odómetro registrado
    • tipo_carga: Descripción de la carga transportada
  
  RELACIONES:
    ✓ camiones.id (N:1)
    ✓ vehiculos_empresa.id (N:1)
    ✓ personal.id (N:1)
  
  INDEXACIÓN: Por fecha y vehículo para historial
*/
CREATE TABLE logistica_viajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehículos
  camion_id UUID REFERENCES camiones(id) ON DELETE SET NULL,
  vehiculo_id UUID REFERENCES vehiculos_empresa(id) ON DELETE SET NULL,
  
  -- Operador
  personal_id UUID REFERENCES personal(id) ON DELETE SET NULL,
  
  -- Tarea
  tipo_viaje tipo_viaje DEFAULT 'interno',
  fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITHOUT TIME ZONE,
  
  -- Ruta
  ruta TEXT,  -- AudioInput: descripción del recorrido
  destino TEXT,
  origen TEXT,
  
  -- Carga
  tipo_carga TEXT,  -- Que se transportó
  cantidad_kg NUMERIC(12,2),
  
  -- Odómetro
  km_inicio NUMERIC(10,2),
  km_fin NUMERIC(10,2),
  
  -- Notas
  notas TEXT,  -- AudioInput
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT ck_logistica_viajes_vehículo CHECK (
    (camion_id IS NOT NULL AND vehiculo_id IS NULL) OR
    (camion_id IS NULL AND vehiculo_id IS NOT NULL)
  )
);

CREATE INDEX idx_logistica_viajes_camion_id ON logistica_viajes(camion_id, fecha_inicio DESC);
CREATE INDEX idx_logistica_viajes_vehiculo_id ON logistica_viajes(vehiculo_id, fecha_inicio DESC);
CREATE INDEX idx_logistica_viajes_personal_id ON logistica_viajes(personal_id, fecha_inicio DESC);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  LOGISTICA_COMBUSTIBLE (Control de combustible)
  ─────────────────────────────────────────────────────────────────────────────
  Registro de repostajes, gasolina, gasóleo, consumo de combustible.
  
  LÓGICA:
    • vehiculo_id: UUID genérico (camión o vehículo empresa)
    • vehiculo_tipo: 'camion' | 'vehiculo_empresa' (para filtrado)
    • conductor_id: FK a personal
    • gasolinera: Nombre o ID de gasolinera
    • litros: Cantidad repostada
    • precio_total: Importe en EUR
    • km_odometro: Odómetro al repostaje (para cálculo consumo L/100km)
  
  RELACIONES:
    ✓ personal.id (N:1)
  
  INDEXACIÓN: Por vehículo y fecha para análisis de consumo
*/
CREATE TABLE logistica_combustible (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehículo
  vehiculo_id UUID NOT NULL,  -- UUID de camión o vehículo empresa
  vehiculo_tipo TEXT CHECK (vehiculo_tipo IN ('camion', 'vehiculo_empresa')) NOT NULL,
  
  -- Conductor
  conductor_id UUID REFERENCES personal(id) ON DELETE SET NULL,
  
  -- Combustible
  fecha TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  litros NUMERIC(8,2) NOT NULL,
  precio_unitario NUMERIC(8,2),
  precio_total NUMERIC(10,2),
  
  -- Ubicación
  gasolinera TEXT,
  ubicación TEXT,
  
  -- Odómetro
  km_odometro NUMERIC(10,2),
  km_anterior NUMERIC(10,2),  -- Para cálculo de consumo
  
  -- Consumo calculado
  consumo_l_100km NUMERIC(8,2),  -- Calculado: (litros / (km_odometro - km_anterior)) * 100
  
  -- Notas
  notas TEXT,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT ck_logistica_combustible_litros CHECK (litros > 0)
);

CREATE INDEX idx_logistica_combustible_vehiculo_id ON logistica_combustible(vehiculo_id, fecha DESC);
CREATE INDEX idx_logistica_combustible_conductor_id ON logistica_combustible(conductor_id, fecha DESC);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  LOGISTICA_MANTENIMIENTO (Reparaciones de vehículos)
  ─────────────────────────────────────────────────────────────────────────────
  Registro de mantenimientos preventivos y reparaciones de camiones.
  
  LÓGICA:
    • camion_id OR vehiculo_id: Vehículo a mantener
    • tipo_mantenimiento: Cambio aceite, Revisión, Reparación, etc.
    • km_odometro: Odómetro al momento del mantenimiento
    • coste: Importe de la reparación en EUR
  
  RELACIONES:
    ✓ camiones.id (N:1)
    ✓ vehiculos_empresa.id (N:1)
*/
CREATE TABLE logistica_mantenimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehículos (una de las dos)
  camion_id UUID REFERENCES camiones(id) ON DELETE CASCADE,
  vehiculo_id UUID REFERENCES vehiculos_empresa(id) ON DELETE CASCADE,
  
  -- Tipo
  tipo_mantenimiento TEXT NOT NULL,
  descripción TEXT,
  
  -- Técnico
  personal_id UUID REFERENCES personal(id) ON DELETE SET NULL,
  
  -- Lecturas
  km_odometro NUMERIC(10,2),
  fecha_realizado DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_próximo TIMESTAMP WITHOUT TIME ZONE,
  km_próximo NUMERIC(10,2),
  
  -- Económico
  coste NUMERIC(10,2),
  repuestos_utilizados TEXT,
  
  -- Adjuntos
  foto_url TEXT,
  factura_url TEXT,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT ck_logistica_mantenimiento_vehículo CHECK (
    (camion_id IS NOT NULL AND vehiculo_id IS NULL) OR
    (camion_id IS NULL AND vehiculo_id IS NOT NULL)
  )
);

CREATE INDEX idx_logistica_mantenimiento_camion_id ON logistica_mantenimiento(camion_id, fecha_próximo);
CREATE INDEX idx_logistica_mantenimiento_vehiculo_id ON logistica_mantenimiento(vehiculo_id, fecha_próximo);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  LOGISTICA_INVENTARIO_SYNC (Ubicación de vehículos)
  ─────────────────────────────────────────────────────────────────────────────
  Tabla de sincronización: Dónde está cada vehículo (nave, taller, en ruta).
*/
CREATE TABLE logistica_inventario_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vehículo
  vehiculo_id UUID NOT NULL,  -- UUID de camión o vehículo empresa
  vehiculo_tipo TEXT CHECK (vehiculo_tipo IN ('camion', 'vehiculo_empresa')) NOT NULL,
  
  -- Ubicación
  ubicacion_id UUID,
  
  -- Estado
  estado_operativo estado_operativo DEFAULT 'operativo',
  
  -- Auditoría
  last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  UNIQUE (vehiculo_id, vehiculo_tipo)
);

CREATE INDEX idx_logistica_inventario_sync_ubicacion_id ON logistica_inventario_sync(ubicacion_id);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 6: TABLA INVENTARIO
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  INVENTARIO_UBICACIONES (Almacenes)
  ─────────────────────────────────────────────────────────────────────────────
  Maestro de ubicaciones de almacenamiento: Nave 1, Nave 2, Campo, Taller, etc.
  
  LÓGICA:
    • nombre: Identificador único (Nave Principal, Nave Secundaria, etc.)
    • orden: Posición en UI (orden de visualización)
    • activa: Soft delete (si = false, no mostrar en nuevos movimientos)
  
  RELACIONES:
    ✓ inventario_registros (1:N) — Stock actual en esta ubicación
    ✓ inventario_movimientos.ubicacion_origen_id (1:N) — Salidas
    ✓ inventario_movimientos.ubicacion_destino_id (1:N) — Entradas
    ✓ maquinaria_inventario_sync (1:N) — Máquinas almacenadas
    ✓ logistica_inventario_sync (1:N) — Vehículos parqueados
  
  INDEXACIÓN: Por orden para selectores UI
*/
CREATE TABLE inventario_ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  nombre TEXT NOT NULL UNIQUE,
  descripción TEXT,
  foto_url TEXT,
  
  -- Gestión
  activa BOOLEAN DEFAULT true NOT NULL,
  orden INTEGER NOT NULL DEFAULT 999,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_inventario_ubicaciones_activa_orden ON inventario_ubicaciones(activa DESC, orden ASC);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  INVENTARIO_CATEGORIAS (Clasificación de productos)
  ─────────────────────────────────────────────────────────────────────────────
  Maestro de categorías: Semillas, Abonos, Productos fitosanitarios, Plásticos, etc.
  
  LÓGICA:
    • slug: Identificador URL-safe: "semillas", "abonos", "fitosanitarios"
    • icono: Emoji o nombre de icono: 🌾, 🧴, 🧪, etc.
    • orden: Posición en UI
  
  RELACIONES:
    ✓ inventario_registros (1:N) — Registros de este tipo
    ✓ inventario_movimientos (1:N) — Movimientos de este tipo
    ✓ inventario_productos_catalogo (1:N) — Productos en catálogo
  
  INDEXACIÓN: Por orden para selectores UI
*/
CREATE TABLE inventario_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  nombre TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icono TEXT NOT NULL,  -- Emoji o nombre icono: 🌾, 🧴, 🧪, etc.
  
  -- Orden
  orden INTEGER NOT NULL DEFAULT 999,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_inventario_categorias_orden ON inventario_categorias(orden ASC);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  INVENTARIO_PRODUCTOS_CATALOGO (Maestro de productos)
  ─────────────────────────────────────────────────────────────────────────────
  Catálogo centralizado de productos para referencias rápidas y precios.
  
  LÓGICA:
    • categoria_id: Clasificación del producto
    • precio_unitario: Precio en EUR para cálculos
    • unidad_defecto: UOM por defecto: kg, l, m, pz, etc.
    • activo: Soft delete para productos descontinuados
  
  RELACIONES:
    ✓ inventario_categorias.id (N:1)
    ✓ inventario_registros.producto_id (1:N) — Registros de este producto
    ✓ proveedores_precios (1:N) — Precios por proveedor
  
  INDEXACIÓN: Por categoría para filtrados
*/
CREATE TABLE inventario_productos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  nombre TEXT NOT NULL UNIQUE,
  categoria_id UUID NOT NULL REFERENCES inventario_categorias(id) ON DELETE RESTRICT,
  
  -- Económico
  precio_unitario NUMERIC(10,2),
  unidad_defecto unidad_inventario DEFAULT 'kg',
  
  -- Gestión
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_inventario_productos_catalogo_categoria_id ON inventario_productos_catalogo(categoria_id, activo);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  INVENTARIO_REGISTROS (Stock actual)
  ─────────────────────────────────────────────────────────────────────────────
  Registros de cantidad actual de producto en cada ubicación.
  
  LÓGICA:
    • ubicacion_id + categoria_id: Localización del stock
    • cantidad: Cantidad actual almacenada
    • unidad: Unidad de medida (kg, l, m, pz, etc.)
    • descripción: Para identificación libre (marca, lote, etc.)
    • producto_id: Opcional — referencia a catálogo de productos
    • precio_unitario: Precio unitario pagado (puede diferir del catálogo)
    • Cálculo de coste: cantidad * precio_unitario
  
  RELACIONES:
    ✓ inventario_ubicaciones.id (N:1)
    ✓ inventario_categorias.id (N:1)
    ✓ inventario_productos_catalogo.id (N:1) — Opcional
  
  RLS: Anon puede leer ubicaciones y cantidades (necesario para Maquinaria)
  
  INDEXACIÓN: Por ubicación y categoría para listados rápidos
*/
CREATE TABLE inventario_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ubicación
  ubicacion_id UUID NOT NULL REFERENCES inventario_ubicaciones(id) ON DELETE CASCADE,
  
  -- Clasificación
  categoria_id UUID NOT NULL REFERENCES inventario_categorias(id) ON DELETE RESTRICT,
  producto_id UUID REFERENCES inventario_productos_catalogo(id) ON DELETE SET NULL,
  
  -- Cantidad
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 0,
  unidad unidad_inventario NOT NULL DEFAULT 'kg',
  
  -- Identificación
  descripción TEXT,  -- Marca, lote, procedencia, etc.
  
  -- Económico
  precio_unitario NUMERIC(10,2),
  
  -- Adjuntos
  foto_url TEXT,
  foto_url_2 TEXT,  -- Segunda foto para detalle
  
  -- Notas
  notas TEXT,
  
  -- Auditoría
  created_by TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  CONSTRAINT ck_inventario_registros_cantidad CHECK (cantidad >= 0)
);

CREATE INDEX idx_inventario_registros_ubicacion_categoria ON inventario_registros(ubicacion_id, categoria_id);
CREATE INDEX idx_inventario_registros_ubicacion_id ON inventario_registros(ubicacion_id);
CREATE INDEX idx_inventario_registros_categoria_id ON inventario_registros(categoria_id);
CREATE INDEX idx_inventario_registros_producto_id ON inventario_registros(producto_id);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  INVENTARIO_MOVIMIENTOS (Historial de movimientos)
  ─────────────────────────────────────────────────────────────────────────────
  Trazabilidad completa: todas las entradas, salidas, transferencias.
  
  LÓGICA:
    • ubicacion_origen_id, ubicacion_destino_id: Movimiento entre naves
    • categoria_id: Clasificación del producto
    • producto_id: Referencia al catálogo (opcional)
    • cantidad: Cantidad movida
    • unidad: Unidad de medida
    • fecha: Cuándo ocurrió el movimiento
    • responsable: Quién registró
  
  RELACIONES:
    ✓ inventario_ubicaciones (N:1) — origen
    ✓ inventario_ubicaciones (N:1) — destino
    ✓ inventario_categorias (N:1)
    ✓ inventario_productos_catalogo (N:1)
  
  CHECK CONSTRAINTS:
    • origen_id ≠ destino_id (no transferencia a sí mismo)
    • cantidad > 0
  
  INDEXACIÓN: Por fecha y ubicación para auditoría
*/
CREATE TABLE inventario_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Movimiento
  ubicacion_origen_id UUID NOT NULL REFERENCES inventario_ubicaciones(id) ON DELETE RESTRICT,
  ubicacion_destino_id UUID NOT NULL REFERENCES inventario_ubicaciones(id) ON DELETE RESTRICT,
  
  -- Clasificación
  categoria_id UUID NOT NULL REFERENCES inventario_categorias(id) ON DELETE RESTRICT,
  producto_id UUID REFERENCES inventario_productos_catalogo(id) ON DELETE SET NULL,
  
  -- Cantidad
  cantidad NUMERIC(10,2) NOT NULL,
  unidad unidad_inventario NOT NULL DEFAULT 'kg',
  
  -- Cuándo y quién
  fecha TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  responsable TEXT,  -- Nombre o FK a personal
  created_by TEXT,
  
  -- Notas
  notas TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT ck_inventario_movimientos_cantidad CHECK (cantidad > 0),
  CONSTRAINT ck_no_mismo_origen_destino CHECK (ubicacion_origen_id <> ubicacion_destino_id)
);

CREATE INDEX idx_inventario_movimientos_origen_id ON inventario_movimientos(ubicacion_origen_id, fecha DESC);
CREATE INDEX idx_inventario_movimientos_destino_id ON inventario_movimientos(ubicacion_destino_id, fecha DESC);
CREATE INDEX idx_inventario_movimientos_categoria_id ON inventario_movimientos(categoria_id, fecha DESC);
CREATE INDEX idx_inventario_movimientos_fecha ON inventario_movimientos(fecha DESC);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  INVENTARIO_INFORMES (Snapshots de informes)
  ─────────────────────────────────────────────────────────────────────────────
  Almacenamiento de informes generados (PDF snapshot en JSONB).
  
  LÓGICA:
    • tipo: mensual_auto | manual | comparativa
    • fecha_inicio, fecha_fin: Rango del informe
    • contenido: JSONB con datos del informe (estructura flexible)
    • Usado para auditoría y comparativas históricas
  
  INDEXACIÓN: Por tipo y fecha para búsquedas
*/
CREATE TABLE inventario_informes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de informe
  tipo TEXT NOT NULL CHECK (tipo IN ('mensual_auto', 'manual', 'comparativa')),
  
  -- Período
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  
  -- Filtros
  ubicacion_id UUID REFERENCES inventario_ubicaciones(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES inventario_categorias(id) ON DELETE SET NULL,
  
  -- Contenido
  contenido JSONB NOT NULL,  -- { "total_articulos": N, "categorias": {...}, ... }
  
  -- Auditoría
  generado_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  generado_by TEXT DEFAULT 'JuanPe'
);

CREATE INDEX idx_inventario_informes_tipo_fecha ON inventario_informes(tipo, fecha_inicio DESC);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 7: TABLA TRABAJOS
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  TRABAJOS_REGISTRO (Registro de trabajos realizados)
  ─────────────────────────────────────────────────────────────────────────────
  Registro exhaustivo de cada trabajo realizado en las fincas.
  
  LÓGICA ESPECIAL:
    • estado_planificacion: pendiente | planificado | en_ejecucion | completado | suspendido
    • prioridad: baja | normal | alta | critica
    • fecha_planificada, fecha_original: Trabajo previsto vs real
    • tractor_id, apero_id: Máquinas utilizadas (asignación)
    • personal_id, personal_externo_id: Quién realizó el trabajo
    • Cálculo: horas_reales = fin_real - inicio_real si ambas presentes
    • Alertas: Trabajos sin completar → "Arrastra pendientes" en Cierre Jornada
  
  RELACIONES:
    ✓ trabajos_incidencias (1:N) — Incidencias durante el trabajo
    ✓ maquinaria_tractores.id (N:1) — Tractor asignado
    ✓ maquinaria_aperos.id (N:1) — Apero asignado
    ✓ personal.id (N:1) — Operario responsable
    ✓ personal_externo.id (N:1) — Externo realizado
    ✓ cierres_jornada (N:1) — Incluido en cierre diario
  
  INDEXACIÓN: Por estado y fecha para listados operativos
*/
CREATE TABLE trabajos_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  nombre TEXT NOT NULL,  -- Denominación del trabajo
  tipo_trabajo TEXT,  -- Siembra, Riego, Cosecha, etc.
  
  -- Planificación
  fecha_planificada DATE,
  fecha_original DATE,  -- Cuando se registró el trabajo
  prioridad prioridad_trabajo DEFAULT 'normal' NOT NULL,
  estado_planificacion estado_planificacion DEFAULT 'pendiente' NOT NULL,
  
  -- Realización
  fecha_inicio DATE,
  hora_inicio TIME,
  fecha_fin DATE,
  hora_fin TIME,
  inicio_real TIMESTAMP WITHOUT TIME ZONE,  -- Cuándo empezó realmente
  fin_real TIMESTAMP WITHOUT TIME ZONE,  -- Cuándo terminó realmente
  horas_reales NUMERIC(6,2),  -- Calculado: fin_real - inicio_real
  
  -- Ubicación
  finca TEXT,  -- Nombre de finca
  parcela TEXT,  -- Nombre de parcela
  
  -- Asignación de máquinas
  tractor_id UUID REFERENCES maquinaria_tractores(id) ON DELETE SET NULL,
  apero_id UUID REFERENCES maquinaria_aperos(id) ON DELETE SET NULL,
  
  -- Asignación de personal
  personal_id UUID REFERENCES personal(id) ON DELETE SET NULL,
  personal_externo_id UUID REFERENCES personal_externo(id) ON DELETE SET NULL,
  
  -- Descripción
  descripción TEXT,  -- AudioInput
  notas TEXT,
  
  -- Adjuntos
  foto_url TEXT,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  CONSTRAINT ck_trabajos_registro_personal CHECK (
    (personal_id IS NOT NULL AND personal_externo_id IS NULL) OR
    (personal_id IS NULL AND personal_externo_id IS NOT NULL) OR
    (personal_id IS NOT NULL AND personal_externo_id IS NOT NULL)
  )
);

CREATE INDEX idx_trabajos_registro_estado_planificacion ON trabajos_registro(estado_planificacion, fecha_planificada DESC);
CREATE INDEX idx_trabajos_registro_finca_parcela ON trabajos_registro(finca, parcela);
CREATE INDEX idx_trabajos_registro_personal_id ON trabajos_registro(personal_id, fecha_inicio DESC);
CREATE INDEX idx_trabajos_registro_tractor_id ON trabajos_registro(tractor_id, fecha_inicio DESC);
CREATE INDEX idx_trabajos_registro_fecha ON trabajos_registro(fecha_inicio DESC);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  TRABAJOS_INCIDENCIAS (Incidencias durante trabajos)
  ─────────────────────────────────────────────────────────────────────────────
  Registro de problemas o eventos especiales durante ejecución.
  
  LÓGICA:
    • tipo: rotura_máquina | fallo_riego | plaga | falta_personal | otro
    • severidad: info | advertencia | urgente | critica
    • resuelto: boolean — si se solucionó durante la jornada
    • resolución: Cómo se solucionó
  
  RELACIONES:
    ✓ trabajos_registro.id (N:1)
*/
CREATE TABLE trabajos_incidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  trabajo_id UUID NOT NULL REFERENCES trabajos_registro(id) ON DELETE CASCADE,
  
  -- Clasificación
  tipo TEXT NOT NULL,  -- rotura_máquina, fallo_riego, plaga, falta_personal, otro
  severidad TEXT DEFAULT 'advertencia' CHECK (severidad IN ('info', 'advertencia', 'urgente', 'critica')),
  
  -- Descripción
  descripción TEXT NOT NULL,
  foto_url TEXT,
  
  -- Resolución
  resuelto BOOLEAN DEFAULT false NOT NULL,
  resolución TEXT,
  
  -- Auditoría
  creado_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  resuelto_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_trabajos_incidencias_trabajo_id ON trabajos_incidencias(trabajo_id, severidad);
CREATE INDEX idx_trabajos_incidencias_resuelto ON trabajos_incidencias(resuelto) WHERE resuelto = false;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 8: TABLA PARTE DIARIO
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  PARTES_DIARIOS (Parte diario: documento central)
  ─────────────────────────────────────────────────────────────────────────────
  Documento maestro que contiene los 4 bloques (A/B/C/D) del parte diario.
  
  LÓGICA:
    • fecha: Fecha del parte (YYYY-MM-DD)
    • finca: Finca principal a la que pertenece el parte
    • notas_generales: Observaciones adicionales del responsable
    • PDF: Generarr menú ejecutivo con 5 variantes (vía generarPDFCorporativo)
  
  RELACIONES:
    ✓ parte_estado_finca (1:N) — Bloque A
    ✓ parte_trabajo (1:N) — Bloque B
    ✓ parte_personal (1:N) — Bloque C
    ✓ parte_residuos_vegetales (1:N) — Bloque D
    ✓ cierres_jornada (N:1) — Si fue cerrado hoy
  
  RLS: Anon puede leer partes abiertos (fecha = hoy)
  
  TRIGGERS:
    • tr_partes_diarios_updated_at: Actualiza timestamp
*/
CREATE TABLE partes_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  fecha DATE NOT NULL UNIQUE,  -- Clave: un parte por día
  finca TEXT NOT NULL,  -- Nombre de finca
  
  -- Contenido
  notas_generales TEXT,  -- AudioInput: observaciones del día
  
  -- Estado
  cerrado BOOLEAN DEFAULT false NOT NULL,
  cerrado_at TIMESTAMP WITHOUT TIME ZONE,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_partes_diarios_fecha ON partes_diarios(fecha DESC);
CREATE INDEX idx_partes_diarios_finca ON partes_diarios(finca, fecha DESC);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  PARTE_ESTADO_FINCA (Bloque A: Estado de la finca)
  ─────────────────────────────────────────────────────────────────────────────
  Estado general de las parcelas de la finca (riego, plagas, anomalías).
  
  RELACIONES:
    ✓ partes_diarios.id (N:1)
*/
CREATE TABLE parte_estado_finca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  parte_id UUID NOT NULL REFERENCES partes_diarios(id) ON DELETE CASCADE,
  
  -- Datos
  parcela TEXT,  -- Nombre de la parcela
  cultivo TEXT,  -- Tipo de cultivo
  estado_observado TEXT,  -- Descripción observación
  problema_detectado BOOLEAN DEFAULT false,
  tipo_problema TEXT,  -- plagas, enfermedad, sequía, encharcamiento, otro
  foto_url TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_parte_estado_finca_parte_id ON parte_estado_finca(parte_id);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  PARTE_TRABAJO (Bloque B: Trabajos realizados)
  ─────────────────────────────────────────────────────────────────────────────
  Cada fila es un trabajo ejecutado hoy en la finca.
  
  RELACIONES:
    ✓ partes_diarios.id (N:1)
*/
CREATE TABLE parte_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  parte_id UUID NOT NULL REFERENCES partes_diarios(id) ON DELETE CASCADE,
  
  -- Datos
  parcela TEXT,
  tipo_trabajo TEXT,  -- Siembra, Riego, Tratamiento, etc.
  personal_responsable TEXT,
  horas_estimadas NUMERIC(6,2),
  completado BOOLEAN DEFAULT false,
  observaciones TEXT,
  foto_url TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_parte_trabajo_parte_id ON parte_trabajo(parte_id);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  PARTE_PERSONAL (Bloque C: Anotaciones personales)
  ─────────────────────────────────────────────────────────────────────────────
  Notas, reuniones, comunicaciones del responsable.
  
  RELACIONES:
    ✓ partes_diarios.id (N:1)
*/
CREATE TABLE parte_personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  parte_id UUID NOT NULL REFERENCES partes_diarios(id) ON DELETE CASCADE,
  
  -- Datos
  texto TEXT NOT NULL,  -- AudioInput
  con_quien TEXT,  -- Personas involucradas
  donde TEXT,  -- Ubicación
  fecha_hora TIMESTAMP WITHOUT TIME ZONE,
  foto_url TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_parte_personal_parte_id ON parte_personal(parte_id);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  PARTE_RESIDUOS_VEGETALES (Bloque D: Retirada de residuos)
  ─────────────────────────────────────────────────────────────────────────────
  Registro de retirada de residuos por ganadero.
  
  LÓGICA:
    • hora_salida_nave → hora_llegada_ganadero → hora_regreso_nave
    • ganadero_id: Ganadero que retira
    • personal_id: FK a personal (conductor que acompañó)
  
  RELACIONES:
    ✓ partes_diarios.id (N:1)
    ✓ personal.id (N:1) — Acompañante
*/
CREATE TABLE parte_residuos_vegetales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  parte_id UUID NOT NULL REFERENCES partes_diarios(id) ON DELETE CASCADE,
  
  -- Ganadero
  ganadero_id UUID,  -- FK a ganaderos (si existe tabla)
  nombre_ganadero TEXT,
  
  -- Horarios
  hora_salida_nave TIME,
  hora_llegada_ganadero TIME,
  hora_regreso_nave TIME,
  
  -- Personal
  nombre_conductor TEXT,  -- LEGACY
  personal_id UUID REFERENCES personal(id) ON DELETE SET NULL,  -- Acompañante moderno
  
  -- Registro
  notas_descarga TEXT,
  foto_url TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

CREATE INDEX idx_parte_residuos_vegetales_parte_id ON parte_residuos_vegetales(parte_id);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  CIERRES_JORNADA (KPIs del cierre diario)
  ─────────────────────────────────────────────────────────────────────────────
  Resumen de indicadores al cerrar la jornada.
  
  LÓGICA:
    • Calculados desde trabajos_registro de fecha = hoy
    • trabajos_ejecutados: COUNT WHERE estado_planificacion = 'completado'
    • trabajos_pendientes: COUNT WHERE estado_planificacion IN ('pendiente', 'planificado')
    • trabajos_arrastrados: Pendientes que se arrastran a mañana
    • Usado para navegación: Botón "Ver Planificación" → próximos trabajos
  
  RELACIONES:
    ✓ partes_diarios.id (N:1)
*/
CREATE TABLE cierres_jornada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  fecha DATE NOT NULL UNIQUE,
  parte_diario_id UUID REFERENCES partes_diarios(id) ON DELETE SET NULL,
  
  -- KPIs
  trabajos_ejecutados INTEGER DEFAULT 0,
  trabajos_pendientes INTEGER DEFAULT 0,
  trabajos_arrastrados INTEGER DEFAULT 0,
  
  -- Notas
  notas TEXT,
  
  -- Auditoría
  cerrado_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  cerrado_by TEXT
);

CREATE INDEX idx_cierres_jornada_fecha ON cierres_jornada(fecha DESC);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 9: TABLAS DE PROVEEDORES E INVENTARIO AUXILIARES
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  PROVEEDORES
  ─────────────────────────────────────────────────────────────────────────────
  Maestro de proveedores de productos.
  
  RELACIONES:
    ✓ proveedores_precios (1:N) — Lista de precios
    ✓ inventario_entradas (N:1) — Entradas de stock desde este proveedor
*/
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  nombre TEXT NOT NULL UNIQUE,
  contacto TEXT,
  teléfono TEXT,
  email TEXT,
  web TEXT,
  
  -- Económico
  plazo_pago_dias INTEGER DEFAULT 30,
  
  -- Gestión
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- Notas
  notas TEXT,
  
  -- Auditoría
  created_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_proveedores_activo ON proveedores(activo);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  PROVEEDORES_PRECIOS (Lista de precios por proveedor)
  ─────────────────────────────────────────────────────────────────────────────
  Precios específicos de cada proveedor por producto.
  
  RELACIONES:
    ✓ proveedores.id (N:1)
    ✓ inventario_productos_catalogo.id (N:1)
*/
CREATE TABLE proveedores_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES inventario_productos_catalogo(id) ON DELETE CASCADE,
  
  -- Precio
  precio_unitario NUMERIC(10,2) NOT NULL,
  unidad unidad_inventario DEFAULT 'kg',
  cantidad_mínima NUMERIC(10,2),
  plazo_entrega_dias INTEGER,
  
  -- Vigencia
  vigente BOOLEAN DEFAULT true NOT NULL,
  fecha_actualizacion TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  UNIQUE (proveedor_id, producto_id)
);

CREATE INDEX idx_proveedores_precios_proveedor_id ON proveedores_precios(proveedor_id, vigente);

-- ─────────────────────────────────────────────────────────────────────────────

/*
  INVENTARIO_ENTRADAS (Registro de entradas de stock)
  ─────────────────────────────────────────────────────────────────────────────
  Cada entrada de producto al inventario desde un proveedor.
  
  LÓGICA:
    • Al crear nueva entrada: trigger crea registro automático en inventario_registros
    • proveedor_id: De dónde viene
    • ubicacion_destino_id: Dónde se almacena
    • fecha_recepción: Cuándo llegó
    • observaciones: Estado, anomalías
  
  RELACIONES:
    ✓ proveedores.id (N:1)
    ✓ inventario_ubicaciones.id (N:1)
    ✓ inventario_categorias.id (N:1)
    ✓ inventario_productos_catalogo.id (N:1)
*/
CREATE TABLE inventario_entradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origen
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  
  -- Destino
  ubicacion_destino_id UUID NOT NULL REFERENCES inventario_ubicaciones(id) ON DELETE RESTRICT,
  
  -- Producto
  categoria_id UUID NOT NULL REFERENCES inventario_categorias(id) ON DELETE RESTRICT,
  producto_id UUID REFERENCES inventario_productos_catalogo(id) ON DELETE SET NULL,
  
  -- Cantidad
  cantidad NUMERIC(10,2) NOT NULL,
  unidad unidad_inventario DEFAULT 'kg',
  precio_unitario NUMERIC(10,2),
  
  -- Fechas
  fecha_pedido DATE,
  fecha_recepción DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Verificación
  documentación_url TEXT,  -- Factura, albarán
  observaciones TEXT,
  
  -- Auditoría
  recibido_by TEXT DEFAULT 'JuanPe',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT ck_inventario_entradas_cantidad CHECK (cantidad > 0)
);

CREATE INDEX idx_inventario_entradas_proveedor_id ON inventario_entradas(proveedor_id, fecha_recepción DESC);
CREATE INDEX idx_inventario_entradas_ubicacion_id ON inventario_entradas(ubicacion_destino_id, fecha_recepción DESC);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 10: TRIGGERS (Automatización de lógica)
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  TRIGGER: Generar código_interno automático
  ─────────────────────────────────────────────────────────────────────────────
  Al insertar personal nuevo: genera OP/EN/CM/CC + padStart(3, '0')
  Al insertar maquinaria: genera TR/AP + padStart(3, '0')
  Al insertar camión: genera CM + padStart(3, '0')
  Al insertar vehículo empresa: genera VH + padStart(3, '0')
  Al insertar personal externo: genera EX + padStart(3, '0')
  
  LÓGICA:
    • Si codigo_interno IS NULL: calcular automáticamente
    • Leer último código con prefijo_año, extraer número, incrementar
    • Formato: prefijo + padStart(3, '0')
*/

CREATE OR REPLACE FUNCTION fn_generar_codigo_interno_personal()
RETURNS TRIGGER AS $$
DECLARE
  v_prefijo TEXT;
  v_numero INTEGER;
  v_nuevo_codigo TEXT;
BEGIN
  IF NEW.codigo_interno IS NULL THEN
    -- Determinar prefijo por categoría
    CASE NEW.categoría
      WHEN 'operario_campo' THEN v_prefijo := 'OP';
      WHEN 'encargado' THEN v_prefijo := 'EN';
      WHEN 'conductor_maquinaria' THEN v_prefijo := 'CM';
      WHEN 'conductor_camion' THEN v_prefijo := 'CC';
      ELSE v_prefijo := 'OP';
    END CASE;
    
    -- Obtener último número con este prefijo
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_interno FROM 3) AS INTEGER)), 0) + 1
    INTO v_numero
    FROM personal
    WHERE codigo_interno LIKE v_prefijo || '%'
    AND codigo_interno IS NOT NULL;
    
    -- Generar código: OP001, OP002, etc.
    v_nuevo_codigo := v_prefijo || LPAD(CAST(v_numero AS TEXT), 3, '0');
    NEW.codigo_interno := v_nuevo_codigo;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_personal_auto_codigo
  BEFORE INSERT ON personal
  FOR EACH ROW
  EXECUTE FUNCTION fn_generar_codigo_interno_personal();

-- Trigger similar para maquinaria_tractores (TR001, TR002, ...)
CREATE OR REPLACE FUNCTION fn_generar_codigo_interno_tractor()
RETURNS TRIGGER AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  IF NEW.codigo_interno IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_interno FROM 3) AS INTEGER)), 0) + 1
    INTO v_numero
    FROM maquinaria_tractores
    WHERE codigo_interno IS NOT NULL;
    
    NEW.codigo_interno := 'TR' || LPAD(CAST(v_numero AS TEXT), 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_maquinaria_tractores_auto_codigo
  BEFORE INSERT ON maquinaria_tractores
  FOR EACH ROW
  EXECUTE FUNCTION fn_generar_codigo_interno_tractor();

-- Trigger para maquinaria_aperos (AP001, AP002, ...)
CREATE OR REPLACE FUNCTION fn_generar_codigo_interno_apero()
RETURNS TRIGGER AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  IF NEW.codigo_interno IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_interno FROM 3) AS INTEGER)), 0) + 1
    INTO v_numero
    FROM maquinaria_aperos
    WHERE codigo_interno IS NOT NULL;
    
    NEW.codigo_interno := 'AP' || LPAD(CAST(v_numero AS TEXT), 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_maquinaria_aperos_auto_codigo
  BEFORE INSERT ON maquinaria_aperos
  FOR EACH ROW
  EXECUTE FUNCTION fn_generar_codigo_interno_apero();

-- Trigger para camiones (CM001, CM002, ...)
CREATE OR REPLACE FUNCTION fn_generar_codigo_interno_camion()
RETURNS TRIGGER AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  IF NEW.codigo_interno IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_interno FROM 3) AS INTEGER)), 0) + 1
    INTO v_numero
    FROM camiones
    WHERE codigo_interno IS NOT NULL;
    
    NEW.codigo_interno := 'CM' || LPAD(CAST(v_numero AS TEXT), 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_camiones_auto_codigo
  BEFORE INSERT ON camiones
  FOR EACH ROW
  EXECUTE FUNCTION fn_generar_codigo_interno_camion();

-- Trigger para vehiculos_empresa (VH001, VH002, ...)
CREATE OR REPLACE FUNCTION fn_generar_codigo_interno_vehiculo()
RETURNS TRIGGER AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  IF NEW.codigo_interno IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_interno FROM 3) AS INTEGER)), 0) + 1
    INTO v_numero
    FROM vehiculos_empresa
    WHERE codigo_interno IS NOT NULL;
    
    NEW.codigo_interno := 'VH' || LPAD(CAST(v_numero AS TEXT), 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_vehiculos_empresa_auto_codigo
  BEFORE INSERT ON vehiculos_empresa
  FOR EACH ROW
  EXECUTE FUNCTION fn_generar_codigo_interno_vehiculo();

-- Trigger para personal_externo (EX001, EX002, ...)
CREATE OR REPLACE FUNCTION fn_generar_codigo_interno_externo()
RETURNS TRIGGER AS $$
DECLARE
  v_numero INTEGER;
BEGIN
  IF NEW.codigo_interno IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_interno FROM 3) AS INTEGER)), 0) + 1
    INTO v_numero
    FROM personal_externo
    WHERE codigo_interno IS NOT NULL;
    
    NEW.codigo_interno := 'EX' || LPAD(CAST(v_numero AS TEXT), 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_personal_externo_auto_codigo
  BEFORE INSERT ON personal_externo
  FOR EACH ROW
  EXECUTE FUNCTION fn_generar_codigo_interno_externo();

-- ─────────────────────────────────────────────────────────────────────────────

/*
  TRIGGER: Actualizar updated_at automáticamente
  ─────────────────────────────────────────────────────────────────────────────
  En UPDATE: actualizar timestamp de modificación
*/

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_personal_updated_at
  BEFORE UPDATE ON personal
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_personal_externo_updated_at
  BEFORE UPDATE ON personal_externo
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_maquinaria_tractores_updated_at
  BEFORE UPDATE ON maquinaria_tractores
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_maquinaria_aperos_updated_at
  BEFORE UPDATE ON maquinaria_aperos
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_camiones_updated_at
  BEFORE UPDATE ON camiones
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_vehiculos_empresa_updated_at
  BEFORE UPDATE ON vehiculos_empresa
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_inventario_registros_updated_at
  BEFORE UPDATE ON inventario_registros
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_trabajos_registro_updated_at
  BEFORE UPDATE ON trabajos_registro
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER tr_partes_diarios_updated_at
  BEFORE UPDATE ON partes_diarios
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION fn_update_timestamp();

-- ─────────────────────────────────────────────────────────────────────────────

/*
  TRIGGER: Sincronización automática al dar de alta máquina
  ─────────────────────────────────────────────────────────────────────────────
  Al insertar tractor/apero: crear fila en maquinaria_inventario_sync
  Al insertar camión/vehículo: crear fila en logistica_inventario_sync
*/

CREATE OR REPLACE FUNCTION fn_sync_maquinaria_alta()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO maquinaria_inventario_sync (maquinaria_id, tipo_maquinaria, estado_operativo)
  VALUES (NEW.id, TG_ARGV[0]::TEXT, NEW.estado_operativo);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_tractor_alta
  AFTER INSERT ON maquinaria_tractores
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_maquinaria_alta('tractor');

CREATE TRIGGER tr_sync_apero_alta
  AFTER INSERT ON maquinaria_aperos
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_maquinaria_alta('apero');

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 11: ROW LEVEL SECURITY (RLS) — Políticas de acceso
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  TABLA: personal
  RLS POLICY: Anon puede leer operarios activos (solo nombre, categoría, teléfono)
  Nota: En producción, usar JWT claims para mayor granularidad
*/
-- ALTER TABLE personal ENABLE ROW LEVEL SECURITY;

-- Policy: Anon lee operarios básicos
-- CREATE POLICY pol_personal_anon_read ON personal
--   FOR SELECT
--   USING (auth.role() = 'anon' AND activo = true);

-- Policy: Authenticated completo acceso
-- CREATE POLICY pol_personal_auth_all ON personal
--   FOR ALL
--   USING (auth.role() <> 'anon');

/*
  TABLA: inventario_registros
  RLS POLICY: Anon puede leer stock (necesario para módulo Maquinaria)
  Nota: Campos sensibles (precio) no se exponen
*/
-- ALTER TABLE inventario_registros ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY pol_inventario_registros_anon_read ON inventario_registros
--   FOR SELECT
--   USING (auth.role() = 'anon');

/*
  TABLA: personal_tipos_trabajo
  RLS POLICY: Anon puede leer (para selectores en parte diario)
*/
-- ALTER TABLE personal_tipos_trabajo ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY pol_personal_tipos_trabajo_anon_read ON personal_tipos_trabajo
--   FOR SELECT
--   USING (auth.role() = 'anon');

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 12: ÍNDICES DE RENDIMIENTO (Indexing Strategy)
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  ÍNDICES CRÍTICOS PARA BÚSQUEDA Y FILTRADO
  ─────────────────────────────────────────────────────────────────────────────
  
  TABLA: trabajos_registro
  ─────────────────────────────────────────────────────────────────────────────
  Consultas típicas en módulo Trabajos:
    1. SELECT * FROM trabajos_registro 
       WHERE estado_planificacion IN ('pendiente', 'planificado')
       ORDER BY fecha_planificada
    → INDEX: idx_trabajos_registro_estado_planificacion
    
    2. SELECT * FROM trabajos_registro
       WHERE finca = ? AND parcela = ?
       ORDER BY fecha_inicio DESC
    → INDEX: idx_trabajos_registro_finca_parcela
    
    3. SELECT * FROM trabajos_registro
       WHERE tractor_id = ? OR apero_id = ?
       ORDER BY fecha_inicio DESC
    → INDEX: idx_trabajos_registro_tractor_id
    → INDEX: idx_trabajos_registro_apero_id (implicit via FK)
    
  TABLA: inventario_registros
  ─────────────────────────────────────────────────────────────────────────────
  Consultas típicas en módulo Inventario:
    1. SELECT * FROM inventario_registros
       WHERE ubicacion_id = ? AND categoria_id = ?
       ORDER BY created_at DESC
    → INDEX: idx_inventario_registros_ubicacion_categoria (composite)
    
    2. SELECT SUM(cantidad) FROM inventario_registros
       WHERE categoria_id = ?
    → INDEX: idx_inventario_registros_categoria_id
    
    3. SELECT * FROM inventario_registros
       WHERE producto_id = ?
    → INDEX: idx_inventario_registros_producto_id
    
  TABLA: logistica_viajes
  ─────────────────────────────────────────────────────────────────────────────
  Consultas típicas:
    1. SELECT * FROM logistica_viajes
       WHERE camion_id = ? AND fecha_inicio >= ? AND fecha_inicio <= ?
    → INDEX: idx_logistica_viajes_camion_id (ya creado)
    
    2. SELECT COUNT(*) FROM logistica_viajes
       WHERE fecha_inicio >= CURRENT_DATE AND fecha_inicio < CURRENT_DATE + 1
    → INDEX: idx_logistica_viajes_fecha (puede requerir PARTIAL INDEX)
*/

-- Índices adicionales para análisis histórico
CREATE INDEX idx_trabajos_registro_fecha_rango ON trabajos_registro(fecha_inicio, estado_planificacion);
CREATE INDEX idx_inventario_movimientos_rango ON inventario_movimientos(fecha, categoria_id);

-- Partial indexes para queries de "próximas tareas urgentes"
CREATE INDEX idx_trabajos_pendientes ON trabajos_registro(fecha_planificada)
  WHERE estado_planificacion IN ('pendiente', 'planificado')
  AND fecha_planificada >= CURRENT_DATE;

CREATE INDEX idx_maquinaria_mantenimiento_urgente ON maquinaria_mantenimiento(fecha_próximo)
  WHERE fecha_próximo IS NOT NULL
  AND fecha_próximo <= CURRENT_DATE + INTERVAL '30 days';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 12: PLANIFICACIÓN DE CAMPAÑA
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  PLANIFICACION_CAMPANA (Planificación estratégica de cultivos)
  ─────────────────────────────────────────────────────────────────────────────
  Planificación anual de siembras y cosechas por parcela.
  
  LÓGICA:
    • Un registro por parcela-cultivo-variedad
    • Fechas estimadas para planificación de recursos
    • Producción estimada para cálculo de ingresos
    • Usado en dashboard y reportes estratégicos
  
  RELACIONES:
    ✓ parcelas (N:1) — parcela TEXT FK
*/
CREATE TABLE planificacion_campana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ubicación
  finca TEXT NOT NULL,
  parcela TEXT,
  
  -- Cultivo
  cultivo TEXT NOT NULL,
  variedad TEXT,
  
  -- Fechas
  fecha_siembra DATE,
  fecha_cosecha_estimada DATE,
  
  -- Estimaciones
  produccion_estimada_kg NUMERIC,
  precio_venta_estimado NUMERIC,
  
  -- Notas
  notas TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
  created_by TEXT DEFAULT 'JuanPe'
);

-- RLS
ALTER TABLE planificacion_campana ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon full access" ON planificacion_campana;
CREATE POLICY "anon full access" ON planificacion_campana FOR ALL USING (true);

-- Índices
CREATE INDEX idx_planificacion_campana_finca ON planificacion_campana(finca);
CREATE INDEX idx_planificacion_campana_fecha_siembra ON planificacion_campana(fecha_siembra);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 13: VISTAS (OPCIONAL)
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  VISTA: v_trabajos_pendientes
  ─────────────────────────────────────────────────────────────────────────────
  Trabajos no completados (para ParteDiario.tsx "Cerrar Jornada")
*/
CREATE OR REPLACE VIEW v_trabajos_pendientes AS
SELECT
  id,
  nombre,
  finca,
  parcela,
  estado_planificacion,
  prioridad,
  fecha_planificada,
  fecha_inicio
FROM trabajos_registro
WHERE estado_planificacion IN ('pendiente', 'planificado', 'en_ejecucion')
ORDER BY prioridad DESC, fecha_planificada ASC;

/*
  VISTA: v_alertas_itv
  ─────────────────────────────────────────────────────────────────────────────
  Máquinas con ITV próxima a vencer (EstadoGeneral.tsx)
*/
CREATE OR REPLACE VIEW v_alertas_itv AS
SELECT
  'tractor' AS tipo,
  id,
  codigo_interno,
  marca || ' ' || modelo AS descripción,
  fecha_próxima_itv,
  CASE
    WHEN fecha_próxima_itv < CURRENT_DATE THEN 'critica'
    WHEN fecha_próxima_itv <= CURRENT_DATE + INTERVAL '30 days' THEN 'urgente'
    ELSE 'normal'
  END AS alerta
FROM maquinaria_tractores
WHERE estado_operativo = 'operativo' AND activo = true
UNION ALL
SELECT
  'camion',
  id,
  codigo_interno,
  marca || ' ' || modelo AS descripción,
  fecha_próxima_itv,
  CASE
    WHEN fecha_próxima_itv < CURRENT_DATE THEN 'critica'
    WHEN fecha_próxima_itv <= CURRENT_DATE + INTERVAL '30 days' THEN 'urgente'
    ELSE 'normal'
  END AS alerta
FROM camiones
WHERE estado_operativo = 'operativo' AND activo = true;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- SECCIÓN 14: COMENTARIOS Y NOTAS FINALES
-- ═══════════════════════════════════════════════════════════════════════════════════

/*
  ARQUITECTURA RELACIONAL MARVIC 360 — RESUMEN
  ─────────────────────────────────────────────────────────────────────────────
  
  5 NÚCLEOS DE NEGOCIO:
  
  1. PERSONAL (Core RH)
     • personal: Operarios, encargados, conductores
     • personal_externo: Destajistas, contratistas
     • personal_tipos_trabajo: N:N con tipos de trabajo
     • Código automático: OP/EN/CM/CC/EX + padStart(3, '0')
     • Alertas: Carnets caducados, licencias próximas
  
  2. MAQUINARIA (Activos agrícolas)
     • maquinaria_tractores: Máquinas autopropulsadas
     • maquinaria_aperos: Herramientas enganchables
     • maquinaria_uso: Historial de operaciones
     • maquinaria_mantenimiento: Reparaciones y preventivo
     • maquinaria_inventario_sync: Ubicación actual
     • Código automático: TR/AP + padStart(3, '0')
     • Alertas: ITV < 30 días, mantenimiento urgente
  
  3. LOGÍSTICA (Transporte y flota)
     • camiones: Vehículos pesados
     • vehiculos_empresa: Vehículos ligeros
     • logistica_viajes: Registro de transportes
     • logistica_combustible: Control de combustible
     • logistica_mantenimiento: Reparaciones
     • Código automático: CM/VH + padStart(3, '0')
     • Alertas: ITV vencida, consumo anómalo
  
  4. INVENTARIO (Almacenamiento)
     • inventario_ubicaciones: Maestro de almacenes
     • inventario_categorias: Clasificación de productos
     • inventario_productos_catalogo: Catálogo centralizado
     • inventario_registros: Stock actual
     • inventario_movimientos: Trazabilidad de movimientos
     • inventario_entradas: Albaranes de entrada
     • proveedores: Maestro de proveedores
     • Alertas: Stock bajo, entradas recientes
  
  5. TRABAJOS (Planificación y ejecución)
     • trabajos_registro: Registro de trabajos
     • trabajos_incidencias: Problemas durante ejecución
     • partes_diarios: Documento central del día
     • parte_*: 4 bloques (estado finca, trabajos, personal, residuos)
     • cierres_jornada: Resumen KPIs del cierre
     • planificacion_campana: Planificación estratégica de cultivos
     • Alertas: Trabajos pendientes, incidencias urgentes
  
  CONTRAINTS CLAVE:
  • CHECK: Estados válidos en ENUM
  • FK: Relaciones foráneas con ON DELETE en cascada o SET NULL
  • UNIQUE: Códigos internos, matrículas, NIFs
  • NOT NULL: Campos obligatorios según dominio
  
  RLS: Configurado en comentarios (descomentar en producción)
  • Anon: Lee solo datos públicos (stock, operarios activos)
  • Authenticated: Acceso completo
  
  TRIGGERS:
  • Generación automática de código_interno (OP001, OP002, ...)
  • updated_at automático en UPDATE
  • Sincronización a inventario_*_sync al dar de alta máquina
  
  INDEXACIÓN:
  • Composite indexes para filtrados comunes
  • Partial indexes para búsquedas urgentes
  • Foreign keys auto-indexan
  • Índices en campos de búsqueda frecuente (fecha, estado, categoría)
  
  PERFORMANCE CONSIDERACIONES:
  • Usar EXPLAIN ANALYZE antes de cambios en triggers
  • Mantener índices sobre campos de JOIN frecuentes
  • Monitorear tamaño de tablas históricas (partes_diarios, trabajos_registro)
  • Considerar particionado por fecha si >10M filas/tabla
  
  AUDITORÍA:
  • created_at, updated_at: Timestamps automáticos
  • created_by, updated_by: Usuario responsable
  • deleted_at: Para soft delete (opcional, implementar si se necesita)
  
  PRÓXIMAS MEJORAS:
  • Tabla de sincronización de datos (queue de cambios a Supabase)
  • Particionado de tablas históricas por año
  • Replicación para backup automático
  • Bitácora de auditoría para cumplimiento normativo
  
  FIN DE DOCUMENTACIÓN.
  ═══════════════════════════════════════════════════════════════════════════════════
*/

-- ════════════════════════════════════════════════════════════════
-- MIGRACIONES APLICADAS (05/04/2026 — rev. 28)
-- ════════════════════════════════════════════════════════════════

-- Geolocalización en fotos de campo + campo tipo para clasificación
ALTER TABLE fotos_campo
  ADD COLUMN IF NOT EXISTS latitud   NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitud  NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS tipo      TEXT DEFAULT 'general';

-- Valores válidos para tipo: 'general' | 'inspeccion' | 'estado' | 'trabajo'
-- UploadParcelPhoto.tsx inserta tipo='general'
-- InspeccionForm.tsx inserta tipo='inspeccion'

-- ════════════════════════════════════════════════════════════════
-- FUNCIÓN RPC: Cierre de jornada atómico (Fase 13)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION cerrar_jornada_atomica(p_fecha DATE, p_usuario TEXT)
RETURNS json AS $$
DECLARE
  v_parte_id UUID;
  v_fecha_manana DATE;
  v_ejecutados INT := 0;
  v_pendientes INT := 0;
  v_arrastrados INT := 0;
  v_incidencias INT := 0;
  v_cierre_id UUID;
BEGIN
  -- 1. Buscar parte_id del día
  SELECT id INTO v_parte_id FROM partes_diarios WHERE fecha = p_fecha LIMIT 1;
  v_fecha_manana := p_fecha + 1;

  -- 2. Marcar como ejecutados
  WITH actualizados AS (
    UPDATE trabajos_registro tr
    SET estado_planificacion = 'ejecutado', updated_at = NOW()
    WHERE fecha_planificada = p_fecha AND estado_planificacion != 'cancelado'
      AND EXISTS (
        SELECT 1 FROM parte_trabajo pt
        WHERE pt.parte_id = v_parte_id AND pt.tipo_trabajo = tr.tipo_trabajo
          AND COALESCE(pt.finca, '') = COALESCE(tr.finca, '')
      )
    RETURNING id
  ) SELECT count(*) INTO v_ejecutados FROM actualizados;

  -- 3. Marcar y copiar pendientes
  WITH actualizados AS (
    UPDATE trabajos_registro SET estado_planificacion = 'pendiente', updated_at = NOW()
    WHERE fecha_planificada = p_fecha AND estado_planificacion NOT IN ('cancelado', 'ejecutado')
    RETURNING id, tipo_bloque, finca, parcel_id, tipo_trabajo, num_operarios, nombres_operarios, notas, fecha_original, recursos_personal, tractor_id, apero_id, materiales_previstos
  ),
  insertados AS (
    INSERT INTO trabajos_registro (tipo_bloque, fecha, finca, parcel_id, tipo_trabajo, num_operarios, nombres_operarios, notas, created_by, estado_planificacion, prioridad, fecha_planificada, fecha_original, recursos_personal, tractor_id, apero_id, materiales_previstos)
    SELECT tipo_bloque, v_fecha_manana, finca, parcel_id, tipo_trabajo, num_operarios, nombres_operarios, notas, p_usuario, 'borrador', 'alta', v_fecha_manana, COALESCE(fecha_original, p_fecha), recursos_personal, tractor_id, apero_id, materiales_previstos FROM actualizados RETURNING id
  ) SELECT count(*) INTO v_arrastrados FROM insertados;

  SELECT count(*) INTO v_pendientes FROM trabajos_registro WHERE fecha_planificada = p_fecha AND estado_planificacion = 'pendiente';

  -- 4. Copiar incidencias urgentes
  WITH insertados AS (
    INSERT INTO trabajos_registro (tipo_bloque, fecha, finca, parcel_id, tipo_trabajo, notas, created_by, estado_planificacion, prioridad, fecha_planificada)
    SELECT 'mano_obra_interna', v_fecha_manana, finca, parcel_id, 'Incidencia: ' || titulo, descripcion, p_usuario, 'borrador', 'alta', v_fecha_manana
    FROM trabajos_incidencias WHERE urgente = true AND fecha = p_fecha AND estado != 'resuelta' RETURNING id
  ) SELECT count(*) INTO v_incidencias FROM insertados;

  -- 5. Crear registro final
  INSERT INTO cierres_jornada (fecha, parte_diario_id, trabajos_ejecutados, trabajos_pendientes, trabajos_arrastrados, cerrado_by, cerrado_at)
  VALUES (p_fecha, v_parte_id, v_ejecutados, v_pendientes, v_arrastrados, p_usuario, NOW()) RETURNING id INTO v_cierre_id;

  RETURN json_build_object('ejecutados', v_ejecutados, 'arrastrados', v_arrastrados, 'incidenciasNuevasTrabajo', v_incidencias, 'pendientes', v_pendientes, 'fechaMañana', v_fecha_manana, 'cierre', json_build_object('id', v_cierre_id));
END;
$$ LANGUAGE plpgsql;
