const SUBNAV_PARAMS = ['tab', 'bloque', 'vista', 'nivel', 'filtro', 'tipo', 'seccion', 'accion'] as const;

/** Comprueba si la ubicación actual coincide con un destino de menú (path + query). */
export function isNavTargetActive(pathname: string, search: string, targetRuta: string): boolean {
  const q = targetRuta.indexOf('?');
  const rawPath = (q === -1 ? targetRuta : targetRuta.slice(0, q)).replace(/\/+$/, '') || '/';
  const have = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

  if (pathname !== rawPath && !pathname.startsWith(`${rawPath}/`)) return false;

  if (q === -1) {
    return !SUBNAV_PARAMS.some(p => have.has(p));
  }

  const want = new URLSearchParams(targetRuta.slice(q + 1));
  for (const [k, v] of want) {
    if (have.get(k) !== v) return false;
  }
  return true;
}
