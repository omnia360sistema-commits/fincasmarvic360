import { useState, useCallback, useMemo, useEffect } from 'react'

/**
 * Hook para gestionar catálogos locales persistidos en localStorage.
 *
 * Uso:
 *   const { opciones, addOpcion } = useCatalogoLocal('marcas_camion', ['MAN', 'Volvo', 'Scania'])
 *
 *   <SelectWithOther
 *     options={opciones}
 *     value={marca}
 *     onChange={setMarca}
 *     onCreateNew={(v) => { addOpcion(v); setMarca(v); }}
 *   />
 *
 * Los valores añadidos vía `addOpcion` se guardan en localStorage bajo la clave
 * `marvic_catalogo_<key>` y se recuperan automáticamente en la siguiente sesión.
 * Perfecto para modo piloto donde no queremos crear tablas de catálogo por cada tipo.
 *
 * Para migrar a persistencia en DB en el futuro, reemplazar este hook por uno
 * que consulte una tabla de catálogo genérica en Supabase.
 */

const STORAGE_PREFIX = 'marvic_catalogo_'

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`
}

function loadFromStorage(key: string): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(key))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(v => typeof v === 'string') : []
  } catch {
    return []
  }
}

function saveToStorage(key: string, values: string[]): void {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(values))
  } catch {
    // silent fail (quota exceeded, etc.)
  }
}

interface UseCatalogoLocalResult {
  /** Opciones base + opciones locales, sin duplicados */
  opciones: string[]
  /** Añade una opción al catálogo local (persistida en localStorage) */
  addOpcion: (valor: string) => void
  /** Elimina una opción del catálogo local (no afecta a las base) */
  removeOpcion: (valor: string) => void
  /** Limpia todas las opciones locales */
  clearLocal: () => void
}

export function useCatalogoLocal(
  key: string,
  initialOptions: string[] = [],
): UseCatalogoLocalResult {
  const [localOpts, setLocalOpts] = useState<string[]>(() => loadFromStorage(key))

  // Sincronizar entre pestañas del mismo navegador
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === getStorageKey(key)) {
        setLocalOpts(loadFromStorage(key))
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key])

  const opciones = useMemo(() => {
    const combined = [...initialOptions, ...localOpts]
    return Array.from(new Set(combined.filter(Boolean)))
  }, [initialOptions, localOpts])

  const addOpcion = useCallback(
    (valor: string) => {
      const trimmed = valor.trim()
      if (!trimmed) return
      setLocalOpts(prev => {
        if (prev.includes(trimmed) || initialOptions.includes(trimmed)) return prev
        const next = [...prev, trimmed]
        saveToStorage(key, next)
        return next
      })
    },
    [key, initialOptions],
  )

  const removeOpcion = useCallback(
    (valor: string) => {
      setLocalOpts(prev => {
        const next = prev.filter(v => v !== valor)
        saveToStorage(key, next)
        return next
      })
    },
    [key],
  )

  const clearLocal = useCallback(() => {
    setLocalOpts([])
    saveToStorage(key, [])
  }, [key])

  return { opciones, addOpcion, removeOpcion, clearLocal }
}
