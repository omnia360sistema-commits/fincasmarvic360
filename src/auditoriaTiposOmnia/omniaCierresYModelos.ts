import {
  AlertaITV,
  CATEGORIA_PREFIJOS,
  CodigoInternoMaquinaria,
  type RolUsuario,
  type TipoTrabajoCategoria,
} from './omniaEnums';

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: CIERRES_JORNADA (KPI cierre diario)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin cierres_jornada (tabla Supabase)
 *
 * @consumers
 *   - ParteDiario.tsx (botón "Cerrar Jornada" → modal con 4 KPIs)
 *   - useParteDiario.ts (useCerrarJornada)
 *
 * @logic
 *   - KPIs calculados desde trabajos_registro de la fecha:
 *       • trabajos_ejecutados: COUNT WHERE estado_planificacion = 'completado'
 *       • trabajos_pendientes: COUNT WHERE estado_planificacion IN ('pendiente', 'planificado')
 *       • trabajos_arrastrados: Conteo manual (puede no haber completado)
 *   - Generar resumen con botón "Ver Planificación" → hoja de trabajo futuro
 *
 * @fk
 *   - partes_diarios.id (N:1) — parte_diario_id
 */
export interface CierreJornada {
  /** UUID primaria */
  id: string;

  /** Fecha del cierre (YYYY-MM-DD) */
  fecha: string;

  /** Parte diario relacionado */
  parte_diario_id: string | null;

  /** KPI: trabajos ejecutados hoy */
  trabajos_ejecutados: number | null;

  /** KPI: trabajos pendientes (arrastrados mañana) */
  trabajos_pendientes: number | null;

  /** KPI: trabajos que arrastramos de ayer */
  trabajos_arrastrados: number | null;

  /** Notas del cierre */
  notas: string | null;

  /** Auditoría: cerrado el... */
  cerrado_at: string;

  /** Auditoría: cerrado por */
  cerrado_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// RESUMEN DE RELACIONES (ENTITY-RELATIONSHIP MAPPING)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * RELACIONES CLAVE — Vista de arquitectura de datos:
 *
 * PERSONAL (Core de RH)
 * ├─→ personal_tipos_trabajo (N:N) → catalogo_tipos_trabajo
 * ├─→ maquinaria_uso.personal_id (1:N)
 * ├─→ logistica_viajes.personal_id (1:N)
 * ├─→ logistica_combustible.conductor_id (1:N)
 * ├─→ vehiculos_empresa.conductor_habitual_id (1:N)
 * └─→ parte_residuos_vegetales.personal_id (1:N)
 *
 * MAQUINARIA (Activos agrícolas)
 * ├─ TRACTORES
 * │  ├─→ maquinaria_aperos.tractor_id (1:N) — aperos asignados
 * │  ├─→ maquinaria_uso.tractor_id (1:N) — historial de uso
 * │  ├─→ maquinaria_mantenimiento.tractor_id (1:N) — reparaciones
 * │  ├─→ maquinaria_inventario_sync.maquinaria_id (1:N) — ubicación
 * │  └─→ trabajos_registro.tractor_id (1:N) — trabajos planificados
 * │
 * └─ APEROS
 *    ├─→ maquinaria_uso.apero_id (1:N)
 *    ├─→ maquinaria_inventario_sync.maquinaria_id (1:N)
 *    ├─→ trabajos_registro.apero_id (1:N)
 *    └─→ inventario_ubicacion_activo.maquinaria_apero_id (1:N)
 *
 * LOGÍSTICA (Transporte)
 * ├─ CAMIONES
 * │  ├─→ logistica_viajes.camion_id (1:N)
 * │  ├─→ logistica_mantenimiento.camion_id (1:N)
 * │  ├─→ logistica_combustible.vehiculo_id (1:N) — si vehiculo_tipo='camion'
 * │  ├─→ tickets_pesaje.camion_id (1:N) — cosechas transportadas
 * │  └─→ logistica_inventario_sync.vehiculo_id (1:N)
 * │
 * └─ VEHÍCULOS EMPRESA
 *    ├─→ vehiculos_empresa.conductor_habitual_id (N:1) → personal
 *    ├─→ logistica_combustible.vehiculo_id (1:N) — si vehiculo_tipo='vehiculo_empresa'
 *    └─→ logistica_inventario_sync.vehiculo_id (1:N)
 *
 * INVENTARIO (Almacenamiento)
 * ├─ UBICACIONES
 * │  ├─→ inventario_registros.ubicacion_id (1:N) — stock actual
 * │  ├─→ inventario_movimientos.ubicacion_origen_id (1:N) — salidas
 * │  ├─→ inventario_movimientos.ubicacion_destino_id (1:N) — entradas
 * │  ├─→ maquinaria_inventario_sync.ubicacion_id (1:N) — activos almacenados
 * │  └─→ logistica_inventario_sync.ubicacion_id (1:N) — vehículos parqueados
 * │
 * ├─ CATEGORÍAS
 * │  ├─→ inventario_registros.categoria_id (1:N)
 * │  ├─→ inventario_movimientos.categoria_id (1:N)
 * │  └─→ inventario_productos_catalogo.categoria_id (1:N)
 * │
 * └─ REGISTROS
 *    ├─→ inventario_productos_catalogo.id (N:1) — catálogo
 *    └─→ inventario_informes (snapshots históricos)
 *
 * TRABAJOS (Transaccional — Núcleo de operaciones)
 * ├─ TRABAJOS_REGISTRO
 * │  ├─→ parcels.parcel_id (N:1)
 * │  ├─→ maquinaria_tractores.id (N:1) — tractor_id
 * │  ├─→ maquinaria_aperos.id (N:1) — apero_id
 * │  ├─→ catalogo_tipos_trabajo.id (N:1) — clasificación
 * │  └─→ cierres_jornada (agregaciones)
 * │
 * └─ PARTES DIARIOS
 *    ├─→ parte_estado_finca (1:N) — Bloque A
 *    ├─→ parte_trabajo (1:N) — Bloque B
 *    ├─→ parte_personal (1:N) — Bloque C
 *    ├─→ parte_residuos_vegetales (1:N) — Bloque D
 *    └─→ cierres_jornada.parte_diario_id (1:N)
 *
 * AUDITORÍA TRANSVERSAL
 * • Todas las tablas tienen: created_at, created_by
 * • Todas tienen: id (UUID PK)
 * • Campos booleanos "activo" controlan visibilidad (soft delete)
 */

// ════════════════════════════════════════════════════════════════════════════════
// LÓGICA COMPUTADA — Funciones de negocio clave
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Calcula alerta de ITV basada en fecha de próxima ITV
 *
 * @param fechaProximaITV - Fecha de próxima ITV (ISO 8601)
 * @returns Tipo de alerta: CRITICA | URGENTE | NORMAL
 *
 * @logic
 *   - CRÍTICA: fecha < hoy (vencida)
 *   - URGENTE: 0 días ≤ (fecha - hoy) ≤ 30 días
 *   - NORMAL: > 30 días
 */
export function calcularAlertaITV(fechaProximaITV: string | null | undefined): AlertaITV {
  if (!fechaProximaITV) return AlertaITV.NORMAL;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaProximaITV);
  fecha.setHours(0, 0, 0, 0);
  const diasRestantes = Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diasRestantes < 0) return AlertaITV.CRITICA;
  if (diasRestantes <= 30) return AlertaITV.URGENTE;
  return AlertaITV.NORMAL;
}

/**
 * Genera código interno automático basado en categoría y correlativo
 *
 * @param categoria - Categoría de personal o maquinaria
 * @param siguienteNumero - Número correlativo (1-indexed)
 * @returns Código con formato: PREFIX + padStart(3, '0')
 */
export function generarCodigoInterno(
  categoria: TipoTrabajoCategoria | CodigoInternoMaquinaria,
  siguienteNumero: number
): string {
  let prefijo = '';
  if (categoria in CATEGORIA_PREFIJOS) {
    prefijo = CATEGORIA_PREFIJOS[categoria as TipoTrabajoCategoria];
  } else if (Object.values(CodigoInternoMaquinaria).includes(categoria as CodigoInternoMaquinaria)) {
    prefijo = categoria as string;
  }
  return `${prefijo}${String(siguienteNumero).padStart(3, '0')}`;
}

/**
 * Calcula urgencia de mantenimiento basada en horas de motor o km
 *
 * @param actual - Horas/km actuales
 * @param proximo - Horas/km para próximo mantenimiento
 * @returns boolean — true si urgente mantenimiento
 */
export function esMantenimientoUrgente(actual: number | null, proximo: number | null): boolean {
  if (!actual || !proximo) return false;
  return actual >= proximo;
}

/**
 * Calcula días de entrada reciente en inventario
 *
 * @param createdAt - Timestamp de creación del registro
 * @returns boolean — true si entrada < 7 días
 */
export function esEntradaReciente(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const hoy = new Date();
  const fecha = new Date(createdAt);
  const diasTranscurridos = Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
  return diasTranscurridos < 7;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: PLANIFICACION_CAMPANA (Planificación estratégica de cultivos)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin planificacion_campana (tabla Supabase)
 *
 * @consumers
 *   - Página /trabajos (tab Planificación de Campaña)
 *   - useTrabajos.ts (hooks CRUD para planificación)
 *   - PDF exportar (Planificación de Campaña)
 *
 * @logic
 *   - Planificación estratégica por finca y parcela
 *   - Estado: PLANIFICADO → EN_CURSO → COMPLETADO
 *   - Recursos estimados: texto libre con necesidades de maquinaria, personal, etc.
 *   - Fechas: prevista plantación vs estimada cosecha
 *
 * @fk
 *   - parcels.parcel_id (N:1) — parcela planificada
 */
export interface PlanificacionCampana {
  /** UUID primaria */
  id: string;

  /** Finca donde se planifica */
  finca: string;

  /** Parcela específica (FK opcional) */
  parcel_id: string | null;

  /** Cultivo a plantar */
  cultivo: string;

  /** Fecha prevista para plantación */
  fecha_prevista_plantacion: string | null;

  /** Fecha estimada de cosecha */
  fecha_estimada_cosecha: string | null;

  /** Recursos estimados (maquinaria, personal, etc.) */
  recursos_estimados: string | null;

  /** Observaciones adicionales */
  observaciones: string | null;

  /** Estado: PLANIFICADO | EN_CURSO | COMPLETADO | CANCELADO */
  estado: string;

  /** Auditoría: creado el... */
  created_at: string;

  /** Auditoría: creado por */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: CIERRES_JORNADA (Cierre diario con KPIs de productividad)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin cierres_jornada (tabla Supabase)
 *
 * @consumers
 *   - Página /parte-diario (botón Cerrar Jornada)
 *   - useParteDiario.ts (useCerrarJornada hook)
 *   - EstadoGeneral.tsx (KPIs de productividad)
 *   - PDF exportar (Resumen de cierres)
 *
 * @logic
 *   - Cierre diario obligatorio al finalizar jornada
 *   - KPIs calculados: ejecutados, pendientes, arrastrados
 *   - Arrastre: trabajos pendientes pasan al día siguiente
 *   - Solo un cierre por fecha
 *
 * @fk
 *   - partes_diarios.id (N:1) — parte diario del día
 */
export interface CierresJornada {
  /** UUID primaria */
  id: string;

  /** Fecha del cierre (única) */
  fecha: string;

  /** Parte diario asociado (FK opcional) */
  parte_diario_id: string | null;

  /** Número de trabajos ejecutados */
  trabajos_ejecutados: number;

  /** Número de trabajos pendientes */
  trabajos_pendientes: number;

  /** Número de trabajos arrastrados al día siguiente */
  trabajos_arrastrados: number;

  /** Notas del cierre */
  notas: string | null;

  /** Timestamp del cierre */
  cerrado_at: string;

  /** Usuario que cerró la jornada */
  cerrado_by: string;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: USUARIO_ROLES (Control de acceso y roles de usuario)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin usuario_roles (tabla Supabase)
 *
 * @consumers
 *   - AuthContext.tsx (hook useAuth para obtener rol del usuario)
 *   - Login.tsx (pantalla de autenticación)
 *   - Dashboard.tsx (mostrar email y botón cerrar sesión)
 *   - App.tsx (envolver rutas con AuthProvider)
 *
 * @logic
 *   - Control de acceso básico: admin (full), encargado (supervisión), operario (operativo)
 *   - Un usuario puede tener múltiples roles activos
 *   - Si no existe rol, asumir 'admin' temporalmente
 *   - RLS: anon full access (igual que otras tablas)
 *
 * @fk
 *   - auth.users.id (N:1) — user_id de Supabase Auth
 */
export interface UsuarioRol {
  /** UUID primaria */
  id: string;

  /** ID del usuario en Supabase Auth */
  user_id: string;

  /** Rol asignado: admin | encargado | operario */
  rol: RolUsuario;

  /** Estado activo del rol */
  activo: boolean;

  /** Timestamp de creación */
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════════
// FOTOS CAMPO — rev. 28 (05/04/2026)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tipo de foto de campo — clasifica la foto en la galería
 * - 'general'    : foto estándar subida desde UploadParcelPhoto
 * - 'inspeccion' : foto de inspección estructurada (InspeccionForm)
 * - 'estado'     : foto de estado de parcela
 * - 'trabajo'    : foto de trabajo registrado
 */
export type TipoFotoCampo = 'general' | 'inspeccion' | 'estado' | 'trabajo';

/**
 * Resultado de inspección de campo
 */
export type ResultadoInspeccion = 'OK' | 'Alerta' | 'Crítico';

/**
 * Registro de fotos_campo con geolocalización (rev. 28)
 *
 * @table fotos_campo
 * @columns id, parcel_id, url_imagen, descripcion, fecha, latitud, longitud, tipo
 *
 * @usage
 *   - UploadParcelPhoto.tsx — sube foto con tipo='general' + coords GPS
 *   - InspeccionForm.tsx    — sube foto con tipo='inspeccion' + resultado embed en descripcion
 *   - ParcelHistory.tsx     — tab GALERÍA lee y filtra por tipo
 */
export interface FotoCampo {
  id: string;
  parcel_id: string;
  url_imagen: string | null;
  descripcion: string | null;
  fecha: string | null;
  /** Latitud GPS (NUMERIC 10,7) */
  latitud: number | null;
  /** Longitud GPS (NUMERIC 10,7) */
  longitud: number | null;
  /** Tipo de foto para filtrado en galería */
  tipo: TipoFotoCampo | null;
}

/**
 * InspeccionForm — datos del formulario de inspección
 * Guarda en fotos_campo con tipo='inspeccion'
 * La descripcion embedea: "[Resultado] Tipo — Observaciones"
 */
export interface InspeccionFormData {
  tipo: string;
  resultado: ResultadoInspeccion;
  observaciones: string;
  fotoFile: File;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDADES DE SOPORTE FINAL (MATERIALES Y AUDITORÍA)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin inventario_registros (tabla Supabase)
 * @logic Extensión específica de stock de campo (Fitosanitarios, Plásticos, Riego)
 *        Filtra el historial de movimientos usando un Map interno por `ubicacion_id_producto_id`
 *        para obtener exclusivamente el último stock neto actual.
 */
export interface MaterialStockRow {
  id: string;
  cantidad: number;
  unidad: string;
  descripcion: string | null;
  precio_unitario: number | null;
  ubicacion_id: string;
  categoria_id: string;
  producto_id: string | null;
  inventario_productos_catalogo: { nombre: string; precio_unitario: number | null } | null;
  inventario_ubicaciones: { nombre: string } | null;
}

/**
 * @origin Multi-tabla (trabajos, inventario, logística, personal)
 * @logic Unifica los eventos más críticos del sistema generados en el rango de fechas.
 *        Se ordenan en memoria (React Query) para trazar la línea temporal de auditoría.
 */
export interface AuditEntry {
  id: string;
  timestamp: string;
  modulo: string;
  usuario: string;
  accion: string;
  detalle: string;
  url?: string;
}

// ════════════════════════════════════════════════════════════════════════════════
// NOTA: Todos los tipos e interfaces anteriores ya están exportados directamente
// en sus declaraciones. Este archivo es la fuente única de verdad para la
// arquitectura de datos del sistema MARVIC 360.
// ════════════════════════════════════════════════════════════════════════════════
