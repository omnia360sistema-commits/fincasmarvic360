/**
 * validation.ts — Validaciones de formulario compartidas para todos los módulos
 *
 * Uso:
 *   const errors = validateForm(rules, values)
 *   if (errors.length) { setError(errors[0]); return }
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface ValidationRule {
  field:   string
  label:   string
  type:    'required' | 'foto_required' | 'min_length' | 'positive_number' | 'date'
  value?:  number          // para min_length, positive_number
}

export type FormValues = Record<string, unknown>

// ── Validador principal ──────────────────────────────────────────────────────

export function validateForm(rules: ValidationRule[], values: FormValues): string[] {
  const errors: string[] = []

  for (const rule of rules) {
    const val = values[rule.field]

    switch (rule.type) {
      case 'required': {
        const empty = val === null || val === undefined || String(val).trim() === ''
        if (empty) errors.push(`${rule.label} es obligatorio`)
        break
      }
      case 'foto_required': {
        if (!val) errors.push(`La foto de ${rule.label} es obligatoria`)
        break
      }
      case 'min_length': {
        const len = rule.value ?? 1
        if (typeof val !== 'string' || val.trim().length < len) {
          errors.push(`${rule.label} debe tener al menos ${len} caracteres`)
        }
        break
      }
      case 'positive_number': {
        const n = Number(val)
        if (isNaN(n) || n <= 0) errors.push(`${rule.label} debe ser un número positivo`)
        break
      }
      case 'date': {
        if (!val || isNaN(Date.parse(String(val)))) {
          errors.push(`${rule.label} debe ser una fecha válida`)
        }
        break
      }
    }
  }

  return errors
}

// ── Helpers de validación rápida ─────────────────────────────────────────────

/** Devuelve true si el string no está vacío tras trim */
export function isNonEmpty(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0
}

/** Devuelve true si el valor es un número positivo */
export function isPositive(v: unknown): boolean {
  const n = Number(v)
  return !isNaN(n) && n > 0
}

/** Convierte un número de operarios de string a number | null (0 → null) */
export function parseOperarios(v: string): number | null {
  const n = parseInt(v, 10)
  return isNaN(n) || n <= 0 ? null : n
}

/** Convierte un número decimal de string a number | null */
export function parseDecimal(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

/** Convierte un coste de string a number | null */
export function parseCoste(v: string): number | null {
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) || n < 0 ? null : n
}

// ── Clase de error de formulario ─────────────────────────────────────────────

/**
 * Construye un mensaje de error para mostrar en UI.
 * Devuelve el primer error si hay varios.
 */
export function firstError(errors: string[]): string | null {
  return errors.length > 0 ? errors[0] : null
}
