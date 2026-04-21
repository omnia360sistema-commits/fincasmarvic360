import type { EstadoOperativo, TipoTrabajoCategoria } from './omniaEnums';

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: PERSONAL (Fijo)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin personal (tabla Supabase)
 *
 * @consumers
 *   - Página /personal (5 tabs: Operarios, Encargados, Maquinaria, Camión, Externa)
 *   - usePersonal.ts (10+ hooks)
 *   - Logística (filtro conductor_id)
 *   - Maquinaria (filtro personal_id en maquinaria_uso)
 *   - Parte Diario (bloque residuos vegetales)
 *   - Trabajos (trabajos_registro.nombres_operarios)
 *
 * @logic
 *   - codigo_interno: Generado automático (OP/EN/CM/CC + padStart 3)
 *   - qr_code: Generada con librería qrcode (200px) — descargar PNG desde ficha
 *   - carnet_caducidad: Alerta roja si < 30 días
 *   - ITV: Derivado de carnet de conducir (conductor_camion + conductor_maquinaria)
 *
 * @fk
 *   - catalogo_tipos_trabajo (N:N vía personal_tipos_trabajo)
 *   - vehiculos_empresa.conductor_habitual_id (1:N)
 *   - logistica_viajes.personal_id (1:N)
 *   - maquinaria_uso.personal_id (1:N)
 *   - parte_residuos_vegetales.personal_id (1:N)
 *   - logistica_combustible.conductor_id (1:N)
 */
export interface Personal {
  /** UUID primaria */
  id: string;

  /** Nombre completo */
  nombre: string;

  /** DNI/NIF (puede ser null para personal sin doc formalizado) */
  dni: string | null;

  /** Teléfono de contacto */
  telefono: string | null;

  /** Categoría laboral (operario, encargado, conductor_maquinaria, conductor_camion) */
  categoria: TipoTrabajoCategoria;

  /** ¿Activo? Controla visibilidad en selectores. */
  activo: boolean;

  /** URL a foto de perfil (Storage bucket: personal-fotos/) */
  foto_url: string | null;

  /** Código interno automático (OP001, EN002, etc.) */
  codigo_interno: string | null;

  /** Notas internas / observaciones */
  notas: string | null;

  /** Registro QR único (valor numérico o UUID para escaneo en campo) */
  qr_code: string;

  /** Fecha de alta en MARVIC */
  fecha_alta: string | null;

  /** Tipo de carnet de conducir (B, BTP, CAP, etc.) */
  carnet_tipo: string | null;

  /** Fecha de caducidad del carnet (alerta si ≤ 30 días) */
  carnet_caducidad: string | null;

  /** ¿Tiene tacógrafo? (solo para conductores_camion) */
  tacografo: boolean | null;

  /** Finca asignada habitualmente (para operarios campo) */
  finca_asignada: string | null;

  /** Licencias acumuladas (JSON string: ["manipulador fitosanitario", "PRL", ...]) */
  licencias: string | null;

  /** Auditoría: creado el... */
  created_at: string;

  /** Auditoría: creado por (user ID) */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: PERSONAL_EXTERNO (Contratistas, destajistas)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin personal_externo (tabla Supabase)
 *
 * @consumers
 *   - Página /personal (Tab "Externa")
 *   - usePersonal.ts (hooks específicos)
 *
 * @logic
 *   - codigo_interno: Generado automático (EX + padStart 3)
 *   - tipo: "destajo" o "jornal_servicio" (clasificación de contratación)
 *   - presupuesto: Monto declarado en JSON (ej: "{ EUR: 5000 }")
 *
 * @fk
 *   - Relación N:N con personal_tipos_trabajo (no es directo en esta tabla)
 */
export interface PersonalExterno {
  /** UUID primaria */
  id: string;

  /** Nombre de la empresa / razón social */
  nombre_empresa: string;

  /** NIF/CIF de la empresa */
  nif: string | null;

  /** Teléfono de contacto principal */
  telefono_contacto: string | null;

  /** Tipo de contratación: "destajo" o "jornal_servicio" */
  tipo: 'destajo' | 'jornal_servicio';

  /** ¿Activo? Controla visibilidad. */
  activo: boolean;

  /** Código interno automático (EX001, EX002, etc.) */
  codigo_interno: string | null;

  /** Persona de contacto (nombre) */
  persona_contacto: string | null;

  /** Presupuesto estimado (JSON: "{ EUR: 1500 }" o texto) */
  presupuesto: string | null;

  /** Trabajos que realizan (separados por comas o JSON array) */
  trabajos_realiza: string | null;

  /** Notas internas */
  notas: string | null;

  /** Código QR de identificación */
  qr_code: string;

  /** Auditoría: creado el... */
  created_at: string;

  /** Auditoría: creado por */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: MAQUINARIA_TRACTORES (Vehículos agrícolas)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin maquinaria_tractores (tabla Supabase)
 *
 * @consumers
 *   - Página /maquinaria (Tab "Tractores")
 *   - useMaquinaria.ts (hooks CRUD)
 *   - InventarioUbicacion.ts (view v_tractores_en_inventario)
 *   - maquinaria_uso (trabajos con tractor)
 *   - maquinaria_mantenimiento (historial de reparos)
 *   - maquinaria_inventario_sync (asignación ubicación)
 *
 * @logic
 *   - codigo_interno: Generado automático (TR + padStart 3)
 *   - estado_operativo: Enum (operativo, mantenimiento, fuera_servicio, baja)
 *   - fecha_proxima_itv: Alerta CRÍTICA si < 0, URGENTE si ≤ 30 días
 *   - horas_motor: Métrica de desgaste; alerta si ≥ horas_proximo_mantenimiento
 *   - gps_info: Preparado para integración futura de GPS/telemática
 *
 * @fk
 *   - maquinaria_aperos.tractor_id (1:N) — aperos asignados
 *   - maquinaria_uso.tractor_id (1:N) — historial de usos
 *   - maquinaria_mantenimiento.tractor_id (1:N) — reparaciones
 *   - maquinaria_inventario_sync.maquinaria_id (1:N) — ubicación actual
 *   - trabajos_registro.tractor_id (1:N) — trabajos ejecutados
 */
export interface MaquinariaTractor {
  /** UUID primaria */
  id: string;

  /** Matrícula del tractor (identificador legal) */
  matricula: string;

  /** Marca (CLAAS, Deutz, New Holland, etc.) */
  marca: string | null;

  /** Modelo específico */
  modelo: string | null;

  /** Año de fabricación */
  anio: number | null;

  /** Código interno automático (TR001, TR002, etc.) */
  codigo_interno: string | null;

  /** Estado operativo: operativo | mantenimiento | fuera_servicio | baja */
  estado_operativo: EstadoOperativo | null;

  /** Horas de motor acumuladas */
  horas_motor: number | null;

  /** Horas de motor para próximo mantenimiento preventivo */
  horas_proximo_mantenimiento: number | null;

  /** Fecha de próxima ITV obligatoria (alerta si ≤ 30 días) */
  fecha_proxima_itv: string | null;

  /** Fecha de próxima revisión técnica interna */
  fecha_proxima_revision: string | null;

  /** Ficha técnica / especificaciones (URL Storage o texto) */
  ficha_tecnica: string | null;

  /** URL a foto del tractor (Storage bucket: maquinaria-fotos/) */
  foto_url: string | null;

  /** Datos GPS para seguimiento (JSON: { lat, lng, last_update }) */
  gps_info: string | null;

  /** Notas de mantenimiento / incidencias */
  notas: string | null;

  /** ¿Activo? Controla visibilidad. */
  activo: boolean;

  /** Auditoría: creado el... */
  created_at: string | null;

  /** Auditoría: creado por */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: MAQUINARIA_APEROS (Implementos agrícolas)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin maquinaria_aperos (tabla Supabase)
 *
 * @consumers
 *   - Página /maquinaria (Tab "Aperos")
 *   - useMaquinaria.ts
 *   - maquinaria_uso.apero_id (historial de trabajos con apero)
 *   - InventarioUbicacion.ts (v_maquinaria_aperos_en_inventario)
 *
 * @logic
 *   - codigo_interno: Generado automático (AP + padStart 3)
 *   - estado: Enum (operativo, mantenimiento, fuera_servicio, baja)
 *   - tractor_id: FK hacia maquinaria_tractores (apero asignado a tractor)
 *
 * @fk
 *   - maquinaria_tractores.id (N:1) — tractor asignado
 *   - maquinaria_uso.apero_id (1:N) — trabajos ejecutados
 *   - maquinaria_inventario_sync.maquinaria_id (1:N) — ubicación
 *   - trabajos_registro.apero_id (1:N) — trabajos planificados
 */
export interface MaquinariaApero {
  /** UUID primaria */
  id: string;

  /** Tipo/denominación (arado, desbrozadora, sembradora, etc.) */
  tipo: string;

  /** Descripción detallada */
  descripcion: string | null;

  /** Código interno automático (AP001, AP002, etc.) */
  codigo_interno: string | null;

  /** Estado operativo: operativo | mantenimiento | fuera_servicio | baja */
  estado: EstadoOperativo | null;

  /** Tractor al cual está usualmente asignado (FK) */
  tractor_id: string | null;

  /** URL a foto del apero */
  foto_url: string | null;

  /** Notas técnicas / incidencias */
  notas: string | null;

  /** ¿Activo? */
  activo: boolean;

  /** Auditoría: creado el... */
  created_at: string | null;

  /** Auditoría: creado por */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: CAMIONES (Vehículos de transporte propio)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin camiones (tabla Supabase)
 *
 * @consumers
 *   - Página /logistica (Tab "Camiones")
 *   - useLogistica.ts
 *   - logistica_viajes.camion_id (N:1) — viajes realizados
 *   - logistica_mantenimiento.camion_id (1:N) — reparaciones
 *   - logistica_inventario_sync.vehiculo_id (1:N) — ubicación actual
 *   - tickets_pesaje.camion_id (1:N) — transportes de cosecha
 *   - logistica_combustible.vehiculo_id (1:N) — carburante
 *
 * @logic
 *   - codigo_interno: Generado automático (CM + padStart 3)
 *   - estado_operativo: Enum (operativo, mantenimiento, fuera_servicio, baja)
 *   - fecha_proxima_itv: Alerta CRÍTICA si < 0, URGENTE si ≤ 30 días
 *   - kilometros_actuales: Métrica de desgaste
 *   - km_proximo_mantenimiento: Alerta si kilometros ≥ este valor
 *   - empresa_transporte: Contratista externo (si tipo = "contratado")
 *
 * @fk
 *   - logistica_viajes.camion_id (1:N)
 *   - logistica_mantenimiento.camion_id (1:N)
 *   - tickets_pesaje.camion_id (1:N)
 */
export interface Camion {
  /** UUID primaria */
  id: string;

  /** Matrícula (identificador legal) */
  matricula: string;

  /** Código interno automático (CM001, CM002, etc.) */
  codigo_interno: string | null;

  /** Marca (Volvo, Scania, MAN, etc.) */
  marca: string | null;

  /** Modelo específico */
  modelo: string | null;

  /** Año de fabricación */
  anio: number | null;

  /** Tipo de vehículo: "propio" | "contratado" | null */
  tipo: string | null;

  /** Empresa de transporte (si es "contratado") */
  empresa_transporte: string | null;

  /** Capacidad de carga en Kg */
  capacidad_kg: number | null;

  /** Estado operativo: operativo | mantenimiento | fuera_servicio | baja */
  estado_operativo: EstadoOperativo | null;

  /** Kilómetros actuales del vehículo */
  kilometros_actuales: number | null;

  /** Kilómetros para próximo mantenimiento preventivo */
  km_proximo_mantenimiento: number | null;

  /** Fecha de última ITV */
  fecha_itv: string | null;

  /** Fecha de próxima ITV obligatoria (alerta si ≤ 30 días) */
  fecha_proxima_itv: string | null;

  /** Fecha de próxima revisión técnica */
  fecha_proxima_revision: string | null;

  /** Notas de mantenimiento / incidencias */
  notas_mantenimiento: string | null;

  /** URL a foto del camión */
  foto_url: string | null;

  /** Datos GPS para seguimiento */
  gps_info: string | null;

  /** ¿Activo? */
  activo: boolean | null;

  /** Auditoría: creado el... */
  created_at: string | null;

  /** Auditoría: creado por */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: VEHICULOS_EMPRESA (Turismos, furgonetas, pick-up corporativos)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin vehiculos_empresa (tabla Supabase)
 *
 * @consumers
 *   - Página /logistica (Tab "Vehículos")
 *   - useLogistica.ts
 *   - logistica_combustible.vehiculo_id (1:N) — carburante
 *
 * @logic
 *   - codigo_interno: Generado automático (VH + padStart 3)
 *   - estado_operativo: Enum (operativo, mantenimiento, fuera_servicio, baja)
 *   - conductor_habitual_id: FK hacia personal (N:1) — conductor asignado
 *   - fecha_proxima_itv: Alerta si ≤ 30 días
 *
 * @fk
 *   - personal.id (N:1) — conductor_habitual_id
 *   - logistica_combustible.vehiculo_id (1:N)
 */
export interface VehiculoEmpresa {
  /** UUID primaria */
  id: string;

  /** Matrícula */
  matricula: string;

  /** Código interno automático (VH001, VH002, etc.) */
  codigo_interno: string | null;

  /** Marca (Renault, Peugeot, IVECO, etc.) */
  marca: string | null;

  /** Modelo */
  modelo: string | null;

  /** Año de fabricación */
  anio: number | null;

  /** Tipo de vehículo (turismo, furgoneta, pick-up, etc.) */
  tipo: string | null;

  /** Conductor habitual asignado (FK personal) */
  conductor_habitual_id: string | null;

  /** Kilómetros actuales */
  km_actuales: number | null;

  /** Estado operativo: operativo | mantenimiento | fuera_servicio | baja */
  estado_operativo: EstadoOperativo | null;

  /** Fecha de próxima ITV */
  fecha_proxima_itv: string | null;

  /** Fecha de próxima revisión */
  fecha_proxima_revision: string | null;

  /** URL a foto del vehículo */
  foto_url: string | null;

  /** Notas internas */
  notas: string | null;

  /** GPS info (JSON) */
  gps_info: string | null;

  /** Auditoría: creado el... */
  created_at: string;

  /** Auditoría: creado por */
  created_by: string | null;
}

// ════════════════════════════════════════════════════════════════════════════════
// ENTIDAD: LOGISTICA_VIAJES (Movimientos de transporte)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * @origin vehicle_positions
 * @logic Posición GPS en tiempo real e histórica para maquinaria y camiones
 */
export interface VehiclePosition {
  /** UUID primaria */
  id: string;
  /** ID del vehículo (tractor o camión) */
  vehicle_id: string;
  /** Tipo de vehículo: 'tractor' | 'camion' | 'vehiculo' */
  vehicle_tipo: 'tractor' | 'camion' | 'vehiculo' | null;
  /** Fecha y hora exacta del registro GPS */
  timestamp: string;
  latitud: number;
  longitud: number;
  velocidad_kmh: number | null;
  parcel_id_detectada: string | null;
  estado: string | null;
}

/**
 * @origin logistica_viajes (tabla Supabase)
 *
 * @consumers
 *   - Página /logistica (Tab "Viajes")
 *   - useLogistica.ts
 *   - PDF exportar (resumen viajes diarios)
 *
 * @logic
 *   - conductor_id: Legacy (solo lectura histórica) → usar personal_id
 *   - personal_id: FK moderno hacia personal (categoria=conductor_camion)
 *   - camion_id: FK hacia camiones (1:N)
 *   - km_recorridos: Calculado desde origen/destino (si GPS disponible)
 *   - gasto_gasolina_euros: Derivado de gasto_gasolina_litros * precio/litro
 *
 * @fk
 *   - camiones.id (N:1)
 *   - personal.id (N:1) — personal_id
 *   - logistica_conductores.id (N:1) — conductor_id (legacy)
 */
export interface LogisticaViaje {
  /** UUID primaria */
  id: string;

  /** Camión utilizado (FK) */
  camion_id: string | null;

  /** Conductor moderno (FK personal, categoria=conductor_camion) */
  personal_id: string | null;

  /** Conductor legacy (solo lectura) */
  conductor_id: string | null;

  /** Finca de origen */
  finca: string | null;

  /** Destino del viaje */
  destino: string | null;

  /** Descripción del trabajo realizado */
  trabajo_realizado: string | null;

  /** Ruta seguida o referencia geográfica */
  ruta: string | null;

  /** Hora de salida (HH:MM) */
  hora_salida: string | null;

  /** Hora de llegada */
  hora_llegada: string | null;

  /** Litros de gasolina consumidos */
  gasto_gasolina_litros: number | null;

  /** Costo total en euros */
  gasto_gasolina_euros: number | null;

  /** Kilómetros recorridos */
  km_recorridos: number | null;

  /** Notas del viaje */
  notas: string | null;

  /** Auditoría: creado el... */
  created_at: string | null;

  /** Auditoría: creado por */
  created_by: string | null;
}
