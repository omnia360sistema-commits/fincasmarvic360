/**
 * HH:MM — para timestamps ISO o null
 * Ej: formatHora('2026-03-27T09:30:00') → '09:30'
 */
export function formatHora(ts: string | null | undefined): string {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

/**
 * dd/mm/yyyy HH:MM — para campos created_at y registros con hora
 * Ej: formatFecha('2026-03-27T09:30:00') → '27/03/2026, 09:30'
 */
export function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * dd/mm/yyyy — solo fecha
 * Ej: formatFechaCompleta('2026-03-27') → '27/03/2026'
 */
export function formatFechaCompleta(fecha: string): string {
  try { return new Date(fecha).toLocaleDateString('es-ES') }
  catch { return fecha }
}

/**
 * "15 mar" — día y mes corto, para listas compactas
 * Ej: formatFechaCorta('2026-03-27') → '27 mar'
 */
export function formatFechaCorta(fecha: string): string {
  try {
    return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  } catch { return fecha }
}

/**
 * "JUEVES, 27 DE MARZO DE 2026" — para cabeceras de parte diario
 */
export function formatFechaLarga(fecha: string): string {
  try {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }).toUpperCase()
  } catch { return fecha }
}

/**
 * "JUE 27 MAR" — para el navegador de fechas
 */
export function formatFechaNav(fecha: string): string {
  try {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'short', day: '2-digit', month: 'short',
    }).toUpperCase()
  } catch { return fecha }
}
