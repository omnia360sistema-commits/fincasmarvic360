/**
 * Constantes de modo piloto — Fincas Marvic 360
 *
 * Flags que relajan restricciones durante el periodo de piloto.
 * Cuando el sistema pase a producción real, cambiar MODO_PILOTO a false
 * y todas las restricciones (fotos obligatorias, delete bloqueado, etc.)
 * se reactivarán automáticamente.
 */

// Master switch del modo piloto
export const MODO_PILOTO = true;

// Fotos son opcionales en piloto (warning pero no bloqueo)
export const FOTOS_OPCIONALES = MODO_PILOTO;

// Permitir edición/borrado de registros de auditoría en piloto
export const AUDITORIA_EDITABLE = MODO_PILOTO;

// Permitir borrar cierres de jornada en piloto
export const CIERRES_BORRABLES = MODO_PILOTO;
