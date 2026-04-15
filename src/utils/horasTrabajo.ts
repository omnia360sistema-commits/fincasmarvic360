/** Horas entre dos marcas horarias ISO (o parseables por Date). */
export function horasEntreMarcasISO(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  if (a == null || b == null || a === '' || b === '') return null
  const t0 = new Date(a).getTime()
  const t1 = new Date(b).getTime()
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) return null
  return Math.round(((t1 - t0) / (1000 * 60 * 60)) * 100) / 100
}

/** Etiqueta para UI/PDF: prioriza hours_worked, luego horas_calculadas, luego rango entrada/salida. */
export function horasTrabajoLabel(opts: {
  hours_worked?: number | null
  horas_calculadas?: number | null
  hora_entrada?: string | null
  hora_salida?: string | null
}): string {
  const hw = opts.hours_worked
  if (typeof hw === 'number' && Number.isFinite(hw) && hw > 0) return `${hw}h`
  const hc = opts.horas_calculadas
  if (typeof hc === 'number' && Number.isFinite(hc) && hc > 0) return `${hc}h`
  const between = horasEntreMarcasISO(opts.hora_entrada, opts.hora_salida)
  if (between != null && between > 0) return `${between}h`
  if (typeof hw === 'number' && Number.isFinite(hw)) return `${hw}h`
  if (typeof hc === 'number' && Number.isFinite(hc)) return `${hc}h`
  return '—'
}
