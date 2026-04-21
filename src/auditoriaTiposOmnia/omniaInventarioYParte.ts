import type { EstadoPlanificacion, PrioridadTrabajo, UnidadInventario } from './omniaEnums';

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: LOGISTICA_COMBUSTIBLE (Repostajes)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin logistica_combustible (tabla Supabase)
 *
 * @consumers
 *   - Página /logistica (Tab "Combustible")
 *   - useLogistica.ts
 *   - PDF exportar (resumen combustible diario)
 *
 * @logic
 *   - vehiculo_tipo: "camion" | "vehiculo_empresa"
 *   - vehiculo_id: FK variable según vehiculo_tipo
 *   - conductor_id: FK opcional hacia personal (quien repostó)
 *   - coste_unitario: coste_total / litros
 *
 * @fk
 *   - camiones.id (N:1) — si vehiculo_tipo = "camion"
 *   - vehiculos_empresa.id (N:1) — si vehiculo_tipo = "vehiculo_empresa"
 *   - personal.id (N:1) — conductor_id
 */
export interface LogisticaCombustible {
  /** UUID primaria */
  id: string;

  /** Tipo de vehículo: "camion" | "vehiculo_empresa" */
  vehiculo_tipo: string;

  /** ID del vehículo (FK variable) */
  vehiculo_id: string;

  /** Conductor que repostó (FK opcional) */
  conductor_id: string | null;

  /** Fecha del repostaje */
  fecha: string | null;

  /** Litros suministrados */
  litros: number | null;

  /** Costo total en euros */
  coste_total: number | null;

  /** Gasolinera / estación de servicio */
  gasolinera: string | null;

  /** Foto del recibo o factura */
  foto_url: string | null;

  /** Notas (octanaje, observaciones) */
  notas: string | null;

  /** Auditoría: creado el... */
  created_at: string;

  /** Auditoría: creado por */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: INVENTARIO_UBICACIONES (Almacenes, naves, sectores de almacenamiento)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin inventario_ubicaciones (tabla Supabase)
 *
 * @consumers
 *   - Página /inventario (grid 6 ubicaciones)
 *   - useInventario.ts
 *   - InventarioUbicacion.tsx (detalle ubicación)
 *   - inventario_registros.ubicacion_id (N:1) — stock en cada ubicación
 *   - inventario_movimientos.ubicacion_origen_id, ubicacion_destino_id (N:1)
 *
 * @logic
 *   - orden: Número para ordenar el grid de ubicaciones
 *   - activa: Controla si aparece en selectores
 *   - foto_url: Foto de la ubicación (Storage bucket: inventario-ubicaciones/)
 *
 * @fk
 *   - inventario_registros.ubicacion_id (1:N)
 *   - inventario_movimientos.ubicacion_origen_id (1:N)
 *   - inventario_movimientos.ubicacion_destino_id (1:N)
 *   - maquinaria_inventario_sync.ubicacion_id (1:N)
 *   - logistica_inventario_sync.ubicacion_id (1:N)
 */
export interface InventarioUbicacion {
  /** UUID primaria */
  id: string;

  /** Nombre de la ubicación (Nave Principal, Almacén Fitosanitarios, etc.) */
  nombre: string;

  /** Descripción o notas sobre la ubicación */
  descripcion: string | null;

  /** Orden visual en el grid (1-6) */
  orden: number;

  /** ¿Activa? Controla visibilidad en selectores. */
  activa: boolean | null;

  /** Foto de la ubicación (Storage URL) */
  foto_url: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: INVENTARIO_CATEGORIAS (Clasificación de productos)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin inventario_categorias (tabla Supabase)
 *
 * @consumers
 *   - InventarioUbicacion.tsx (7 tabs por categoría)
 *   - useInventario.ts
 *
 * @logic
 *   - slug: Identificador URL-safe (ej: "fitosanitarios", "semillas")
 *   - icono: Emoji o clase FontAwesome (ej: "🐛", "fa-vial")
 *   - orden: Número para ordenar tabs
 *
 * @fk
 *   - inventario_registros.categoria_id (1:N)
 *   - inventario_movimientos.categoria_id (1:N)
 *   - inventario_productos_catalogo.categoria_id (1:N)
 */
export interface InventarioCategoria {
  /** UUID primaria */
  id: string;

  /** Nombre visible (Fitosanitarios, Semillas, Plásticos, etc.) */
  nombre: string;

  /** Slug único (URL-safe) */
  slug: string;

  /** Icono (emoji o class) */
  icono: string;

  /** Orden visual en tabs (1-7) */
  orden: number;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: INVENTARIO_REGISTROS (Movimientos de stock por ubicación/categoría)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin inventario_registros (tabla Supabase)
 *
 * @consumers
 *   - InventarioUbicacion.tsx (tab por categoría)
 *   - useInventario.ts (useRegistros, useUltimoRegistro, useResumenUbicacion)
 *
 * @logic
 *   - cantidad: Positiva en entrada, se resta en salida (UI logic)
 *   - precio_unitario: Para calcular valor total del stock
 *   - unidad: UOM (kg, l, m, pz, etc.)
 *   - El "último registro" por categoría = estado actual (cantidad disponible)
 *   - Entrada reciente: badge si created_at < 7 días
 *
 * @fk
 *   - inventario_ubicaciones.id (N:1)
 *   - inventario_categorias.id (N:1)
 *   - inventario_productos_catalogo.id (N:1) — opcional
 */
export interface InventarioRegistro {
  /** UUID primaria */
  id: string;

  /** Ubicación donde se almacena */
  ubicacion_id: string;

  /** Categoría del producto */
  categoria_id: string;

  /** Producto del catálogo (FK opcional) */
  producto_id: string | null;

  /** Cantidad en unidad */
  cantidad: number;

  /** Unidad de medida (kg, l, m, pz, etc.) */
  unidad: UnidadInventario | string;

  /** Precio unitario para cálculo de valor total */
  precio_unitario: number | null;

  /** Descripción adicional del lote o entrada */
  descripcion: string | null;

  /** Fotos del lote (URL Storage) */
  foto_url: string | null;
  foto_url_2: string | null;

  /** Notas específicas */
  notas: string | null;

  /** Auditoría: creado el... */
  created_at: string | null;

  /** Auditoría: creado por */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: TRABAJOS_REGISTRO (Núcleo transaccional: trabajos ejecutados)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin trabajos_registro (tabla Supabase)
 *
 * @consumers
 *   - Página /trabajos (4 sub-bloques + incidencias)
 *   - useTrabajos.ts (hooks CRUD)
 *   - ParteDiario.tsx (bloque B: resumen de trabajos del día)
 *   - PDF exportar (Trabajos)
 *   - cierres_jornada (KPI: trabajos ejecutados, pendientes, arrastrados)
 *
 * @logic
 *   - tipo_bloque: Clasificación interna (A, B, C, D) para parte diario
 *   - tipo_trabajo: Nombre del trabajo (Siembra, Cosecha, Riego, etc.)
 *   - estado_planificacion: PENDIENTE → PLANIFICADO → EN_EJECUCION → COMPLETADO
 *   - prioridad: BAJA, NORMAL, ALTA, CRITICA
 *   - fecha_planificada vs fecha_original: fecha_original = fecha del parte; fecha_planificada = cuándo se va a hacer
 *   - tractor_id, apero_id: FK opcionales si utiliza maquinaria
 *   - names_operarios: Lista de nombres operarios (no es FK normalizado)
 *
 * @fk
 *   - parcels.parcel_id (N:1) — parcela donde se realiza
 *   - maquinaria_tractores.id (N:1) — si aplica
 *   - maquinaria_aperos.id (N:1) — si aplica
 *   - catalogo_tipos_trabajo.id (N:1) — tipo de trabajo
 */
export interface TrabajosRegistro {
  /** UUID primaria */
  id: string;

  /** Tipo de bloque en parte diario (A, B, C, D) */
  tipo_bloque: string;

  /** Tipo de trabajo (Siembra, Riego, Cosecha, etc.) */
  tipo_trabajo: string;

  /** Finca donde se realiza */
  finca: string | null;

  /** Parcela (FK opcional) */
  parcel_id: string | null;

  /** Número de operarios involucrados */
  num_operarios: number | null;

  /** Nombres de operarios (lista separada por comas o JSON) */
  nombres_operarios: string | null;

  /** Fecha original del parte diario */
  fecha_original: string | null;

  /** Fecha planificada para ejecución */
  fecha_planificada: string | null;

  /** Fecha real de ejecución registrada */
  fecha: string;

  /** Hora de inicio (HH:MM) */
  hora_inicio: string | null;

  /** Hora de fin (HH:MM) */
  hora_fin: string | null;

  /** Estado de planificación: PENDIENTE | PLANIFICADO | EN_EJECUCION | COMPLETADO */
  estado_planificacion: EstadoPlanificacion | null;

  /** Prioridad: BAJA | NORMAL | ALTA | CRITICA */
  prioridad: PrioridadTrabajo | null;

  /** Tractor utilizado (FK opcional) */
  tractor_id: string | null;

  /** Apero utilizado (FK opcional) */
  apero_id: string | null;

  /** URL a foto del trabajo */
  foto_url: string | null;

  /** Entrada vía escaneo QR (TIMESTAMPTZ) */
  qr_scan_entrada: string | null;

  /** Salida vía escaneo QR (TIMESTAMPTZ) */
  qr_scan_salida: string | null;

  /** Horas calculadas automáticamente por el sistema QR */
  horas_calculadas: number | null;

  /** Notas / observaciones */
  notas: string | null;

  /** Auditoría: creado el... */
  created_at: string | null;

  /** Auditoría: creado por */
  created_by: string | null;
}

/**
 * @origin presencia_tiempo_real
 * @logic Registro de presencia en tiempo real para cuadrillas.
 */
export interface PresenciaTiempoReal {
  /** UUID primaria */
  id: string;
  /** ID de la cuadrilla (FK) */
  cuadrilla_id: string;
  /** ID de la parcela (TEXT FK) */
  parcel_id: string | null;
  /** ID del registro de trabajo vinculado (FK) */
  work_record_id: string | null;
  hora_entrada: string;
  hora_salida: string | null;
  activo: boolean;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: PARTES_DIARIOS (Agregación diaria de trabajos, estados, residuos)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin partes_diarios (tabla Supabase)
 *
 * @consumers
 *   - Página /parte-diario
 *   - useParteDiario.ts (10+ hooks)
 *   - PDF exportar (Parte Diario ejecutivo corporativo)
 *   - cierres_jornada.parte_diario_id (1:N)
 *
 * @logic
 *   - fecha: Índice único (una parte por día)
 *   - responsable: Usuario/operario que cierra la parte
 *   - notas_generales: Observaciones del día (AudioInput)
 *   - 4 bloques (A, B, C, D) ligados vía FK a tablas específicas:
 *       A: parte_estado_finca (1:N)
 *       B: parte_trabajo (1:N)
 *       C: parte_personal (1:N)
 *       D: parte_residuos_vegetales (1:N)
 *
 * @fk
 *   - parte_estado_finca.parte_id (1:N)
 *   - parte_trabajo.parte_id (1:N)
 *   - parte_personal.parte_id (1:N)
 *   - parte_residuos_vegetales.parte_id (1:N)
 *   - cierres_jornada.parte_diario_id (1:N)
 */
export interface ParteDiario {
  /** UUID primaria */
  id: string;

  /** Fecha del parte (YYYY-MM-DD) — índice único */
  fecha: string;

  /** Responsable de cierre (nombre o ID) */
  responsable: string;

  /** Notas generales del día (AudioInput transcrito) */
  notas_generales: string | null;

  /** Auditoría: creado el... */
  created_at: string | null;
}

/**
 * @origin parte_estado_finca (Bloque A del parte diario)
 *
 * @consumers
 *   - ParteDiario.tsx (Bloque A: Estado de Fincas)
 *   - useParteDiario.ts
 *
 * @logic
 *   - estado: "saludable" | "alerta" | "critica" | "preparacion" (visual badge)
 *   - num_operarios: Contar en tiempo real desde UI
 *   - nombres_operarios: Lista de nombres (no normalizado)
 *
 * @fk
 *   - partes_diarios.id (N:1)
 *   - parcels.parcel_id (N:1) — opcional
 */
export interface ParteEstadoFinca {
  /** UUID primaria */
  id: string;

  /** Parte diario (FK) */
  parte_id: string;

  /** Finca */
  finca: string;

  /** Parcela (opcional) */
  parcel_id: string | null;

  /** Estado general (saludable, alerta, crítica, preparación) */
  estado: string | null;

  /** Número de operarios */
  num_operarios: number | null;

  /** Nombres de operarios */
  nombres_operarios: string | null;

  /** Notas (AudioInput) */
  notas: string | null;

  /** Foto 1 */
  foto_url: string | null;

  /** Foto 2 */
  foto_url_2: string | null;

  /** Auditoría: creado el... */
  created_at: string | null;
}

/**
 * @origin parte_trabajo (Bloque B del parte diario)
 *
 * @consumers
 *   - ParteDiario.tsx (Bloque B: Trabajos realizados)
 *   - useParteDiario.ts
 *
 * @logic
 *   - tipo_trabajo: Siembra, Riego, Cosecha, etc.
 *   - ambito: "Bloque" | "Línea" | "Finca completa"
 *   - parcelas: Array JSON de parcel_id
 *
 * @fk
 *   - partes_diarios.id (N:1)
 */
export interface ParteTrabajo {
  /** UUID primaria */
  id: string;

  /** Parte diario (FK) */
  parte_id: string;

  /** Tipo de trabajo */
  tipo_trabajo: string;

  /** Finca */
  finca: string | null;

  /** Ámbito (Bloque, Línea, Finca completa) */
  ambito: string | null;

  /** Parcelas afectadas (JSON array de parcel_id) */
  parcelas: string[] | null;

  /** Número de operarios */
  num_operarios: number | null;

  /** Nombres de operarios */
  nombres_operarios: string | null;

  /** Hora de inicio */
  hora_inicio: string | null;

  /** Hora de fin */
  hora_fin: string | null;

  /** Notas (AudioInput) */
  notas: string | null;

  /** Foto 1 */
  foto_url: string | null;

  /** Foto 2 */
  foto_url_2: string | null;

  /** Auditoría: creado el... */
  created_at: string | null;
}

/**
 * @origin parte_personal (Bloque C del parte diario)
 *
 * @consumers
 *   - ParteDiario.tsx (Bloque C: Anotaciones personales)
 *   - useParteDiario.ts
 *
 * @logic
 *   - Anotaciones personales del responsable (reuniones, comunicaciones)
 *   - fecha_hora: Timestamp de la anotación
 *
 * @fk
 *   - partes_diarios.id (N:1)
 */
export interface PartePersonal {
  /** UUID primaria */
  id: string;

  /** Parte diario (FK) */
  parte_id: string;

  /** Texto de la anotación (AudioInput) */
  texto: string;

  /** Con quién */
  con_quien: string | null;

  /** Dónde */
  donde: string | null;

  /** Fecha y hora */
  fecha_hora: string | null;

  /** Foto */
  foto_url: string | null;

  /** Auditoría: creado el... */
  created_at: string | null;
}

/**
 * @origin parte_residuos_vegetales (Bloque D del parte diario)
 *
 * @consumers
 *   - ParteDiario.tsx (Bloque D: Residuos vegetales — retirada)
 *   - useParteDiario.ts
 *
 * @logic
 *   - Registro de retirada de residuos vegetales por ganadero
 *   - hora_salida_nave → hora_llegada_ganadero → hora_regreso_nave
 *   - personal_id: Conductor/responsable que acompañó la retirada
 *
 * @fk
 *   - partes_diarios.id (N:1)
 *   - ganaderos.id (N:1) — ganadero_id
 *   - personal.id (N:1) — personal_id
 */
export interface ParteResiduosVegetales {
  /** UUID primaria */
  id: string;

  /** Parte diario (FK) */
  parte_id: string;

  /** Ganadero que retira los residuos (FK) */
  ganadero_id: string | null;

  /** Nombre del ganadero (para UI sin FK) */
  nombre_ganadero: string | null;

  /** Hora de salida de la nave */
  hora_salida_nave: string | null;

  /** Hora de llegada del ganadero */
  hora_llegada_ganadero: string | null;

  /** Hora de regreso a la nave */
  hora_regreso_nave: string | null;

  /** Nombre del conductor del camión (legacy) */
  nombre_conductor: string | null;

  /** Personal que acompañó (FK) */
  personal_id: string | null;

  /** Notas de descarga */
  notas_descarga: string | null;

  /** Foto */
  foto_url: string | null;

  /** Auditoría: creado el... */
  created_at: string | null;
}
