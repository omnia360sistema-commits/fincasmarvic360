/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUDITORIA_TIPOS_OMNIA.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * MISIÓN CRÍTICA: Fuente única de verdad (SSOT) para la arquitectura de datos
 * del ERP Agrícola MARVIC 360.
 *
 * Este documento centraliza:
 * • Definiciones de entidades (interfaces TypeScript)
 * • Mapeo a tablas Supabase (rastreabilidad FK)
 * • Enumeraciones de estados y categorías
 * • Lógica computada (banderas de alerta, colores, validaciones)
 * • Consumidores de cada entidad (qué hooks/páginas la usan)
 *
 * CONVENCIONES:
 * - @origin: tabla Supabase de origen
 * - @consumers: páginas React que consumen esta entidad
 * - @logic: propiedades computadas o reglas de negocio
 * - @fk: relaciones foráneas explícitas
 *
 * Versión: 1.1.0 (07/04/2026 - FINAL PRODUCCIÓN)
 * Autor: Copilot (GitHub)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════════════════════
// ENUMERACIONES GLOBALES
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin catalogo_tipos_trabajo
 * @logic Categoría de trabajo para clasificación y permisos. Utilizadas en Personal
 *        para asignar responsabilidades y en trabajos_registro para trazabilidad.
 */
export enum TipoTrabajoCategoria {
  OPERARIO_CAMPO = 'operario_campo',
  ENCARGADO = 'encargado',
  CONDUCTOR_MAQUINARIA = 'conductor_maquinaria',
  CONDUCTOR_CAMION = 'conductor_camion',
}

export const TIPO_TRABAJO_CATEGORIA_LABELS: Record<TipoTrabajoCategoria, string> = {
  [TipoTrabajoCategoria.OPERARIO_CAMPO]: 'Operario de campo',
  [TipoTrabajoCategoria.ENCARGADO]: 'Encargado',
  [TipoTrabajoCategoria.CONDUCTOR_MAQUINARIA]: 'Conductor de maquinaria',
  [TipoTrabajoCategoria.CONDUCTOR_CAMION]: 'Conductor de camión',
};

export const TIPO_TRABAJO_CATEGORIA_COLORS: Record<TipoTrabajoCategoria, string> = {
  [TipoTrabajoCategoria.OPERARIO_CAMPO]: '#22c55e',     // green
  [TipoTrabajoCategoria.ENCARGADO]: '#6d9b7d',          // sky
  [TipoTrabajoCategoria.CONDUCTOR_MAQUINARIA]: '#fb923c', // orange
  [TipoTrabajoCategoria.CONDUCTOR_CAMION]: '#a78bfa',   // purple
};

/**
 * @origin personal.codigo_interno
 * @logic Prefijos de código interno para identificación única por categoría.
 *        Incrementa automático: OP001, OP002... EN001...
 */
export const CATEGORIA_PREFIJOS: Record<TipoTrabajoCategoria, string> = {
  [TipoTrabajoCategoria.OPERARIO_CAMPO]: 'OP',
  [TipoTrabajoCategoria.ENCARGADO]: 'EN',
  [TipoTrabajoCategoria.CONDUCTOR_MAQUINARIA]: 'CM',
  [TipoTrabajoCategoria.CONDUCTOR_CAMION]: 'CC',
};

/**
 * @origin maquinaria_tractores.codigo_interno, maquinaria_aperos.codigo_interno
 * @logic Prefijos específicos para maquinaria: tractores (TR), aperos (AP), externos (EX)
 */
export enum CodigoInternoMaquinaria {
  TRACTOR = 'TR',
  APERO = 'AP',
}

/**
 * @origin camiones.codigo_interno, vehiculos_empresa.codigo_interno
 * @logic Prefijos para logística: camiones (CM), vehículos empresa (VH)
 */
export enum CodigoInternoLogistica {
  CAMION = 'CM',
  VEHICULO = 'VH',
}

/**
 * @origin personal_externo.codigo_interno
 * @logic Prefijo único para personal externo (destajistas, contratistas)
 */
export const CODIGO_INTERNO_EXTERNO = 'EX';

/**
 * @origin maquinaria_tractores.estado_operativo, maquinaria_aperos.estado, etc.
 * @logic Estados de operatividad de activos: operativo, mantenimiento, fuera_servicio, baja
 */
export enum EstadoOperativo {
  OPERATIVO = 'operativo',
  MANTENIMIENTO = 'mantenimiento',
  FUERA_SERVICIO = 'fuera_servicio',
  BAJA = 'baja',
}

export const ESTADO_OPERATIVO_LABELS: Record<EstadoOperativo, string> = {
  [EstadoOperativo.OPERATIVO]: 'Operativo',
  [EstadoOperativo.MANTENIMIENTO]: 'En mantenimiento',
  [EstadoOperativo.FUERA_SERVICIO]: 'Fuera de servicio',
  [EstadoOperativo.BAJA]: 'Dado de baja',
};

export const ESTADO_OPERATIVO_COLORS: Record<EstadoOperativo, string> = {
  [EstadoOperativo.OPERATIVO]: '#22c55e',       // green
  [EstadoOperativo.MANTENIMIENTO]: '#f97316',   // orange
  [EstadoOperativo.FUERA_SERVICIO]: '#ef4444',  // red
  [EstadoOperativo.BAJA]: '#6b7280',            // gray
};

/**
 * @origin maquinaria_tractores.fecha_proxima_itv, camiones.fecha_proxima_itv
 * @logic Alerta de ITV: CRÍTICA (< 0 días), URGENTE (≤ 30 días)
 */
export enum AlertaITV {
  CRITICA = 'critica',    // < 0 días = vencida
  URGENTE = 'urgente',    // ≤ 30 días
  NORMAL = 'normal',      // > 30 días
}

export const ALERTA_ITV_COLORS: Record<AlertaITV, string> = {
  [AlertaITV.CRITICA]: '#dc2626',   // red-600
  [AlertaITV.URGENTE]: '#f59e0b',   // amber-500
  [AlertaITV.NORMAL]: '#22c55e',    // green-500
};

/**
 * @origin usuario_roles.rol
 * @logic Roles de usuario para control de acceso: admin (full), encargado (supervisión), operario (operativo)
 */
export enum RolUsuario {
  ADMIN = 'admin',
  ENCARGADO = 'encargado',
  OPERARIO = 'operario',
}

export const ROL_USUARIO_LABELS: Record<RolUsuario, string> = {
  [RolUsuario.ADMIN]: 'Administrador',
  [RolUsuario.ENCARGADO]: 'Encargado',
  [RolUsuario.OPERARIO]: 'Operario',
};

/**
 * @origin inventario_registros.unidad (UOM — Unit of Measure)
 * @logic Unidades de medida soportadas en inventario
 */
export enum UnidadInventario {
  KILOGRAMO = 'kg',
  GRAMO = 'g',
  LITRO = 'l',
  MILILITRO = 'ml',
  METRO = 'm',
  CENTIMETRO = 'cm',
  PIEZA = 'pz',
  CAJA = 'caja',
  METRO_LINEAL = 'm_lineal',
}

export const UNIDAD_INVENTARIO_LABELS: Record<UnidadInventario, string> = {
  [UnidadInventario.KILOGRAMO]: 'Kg',
  [UnidadInventario.GRAMO]: 'g',
  [UnidadInventario.LITRO]: 'L',
  [UnidadInventario.MILILITRO]: 'ml',
  [UnidadInventario.METRO]: 'm',
  [UnidadInventario.CENTIMETRO]: 'cm',
  [UnidadInventario.PIEZA]: 'pz',
  [UnidadInventario.CAJA]: 'caja',
  [UnidadInventario.METRO_LINEAL]: 'm lineal',
};

/**
 * @origin parte_diario.estado_planificacion, trabajos_registro.estado_planificacion
 * @logic Estados de planificación de trabajos
 */
export enum EstadoPlanificacion {
  PENDIENTE = 'pendiente',
  PLANIFICADO = 'planificado',
  EN_EJECUCION = 'en_ejecucion',
  COMPLETADO = 'completado',
  SUSPENDIDO = 'suspendido',
}

export const ESTADO_PLANIFICACION_LABELS: Record<EstadoPlanificacion, string> = {
  [EstadoPlanificacion.PENDIENTE]: 'Pendiente',
  [EstadoPlanificacion.PLANIFICADO]: 'Planificado',
  [EstadoPlanificacion.EN_EJECUCION]: 'En ejecución',
  [EstadoPlanificacion.COMPLETADO]: 'Completado',
  [EstadoPlanificacion.SUSPENDIDO]: 'Suspendido',
};

/**
 * @origin trabajos_registro.prioridad
 * @logic Niveles de prioridad para trabajos
 */
export enum PrioridadTrabajo {
  BAJA = 'baja',
  NORMAL = 'normal',
  ALTA = 'alta',
  CRITICA = 'critica',
}

export const PRIORIDAD_TRABAJO_LABELS: Record<PrioridadTrabajo, string> = {
  [PrioridadTrabajo.BAJA]: 'Baja',
  [PrioridadTrabajo.NORMAL]: 'Normal',
  [PrioridadTrabajo.ALTA]: 'Alta',
  [PrioridadTrabajo.CRITICA]: 'Crítica',
};

export const PRIORIDAD_TRABAJO_COLORS: Record<PrioridadTrabajo, string> = {
  [PrioridadTrabajo.BAJA]: '#3b82f6',      // blue
  [PrioridadTrabajo.NORMAL]: '#22c55e',    // green
  [PrioridadTrabajo.ALTA]: '#f97316',      // orange
  [PrioridadTrabajo.CRITICA]: '#dc2626',   // red
};
