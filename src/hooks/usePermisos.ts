import { useAuth } from '@/context/AuthContext';

/**
 * Hook de permisos RBAC — MODO PILOTO
 *
 * En modo piloto, puede() siempre retorna true.
 * Para activar RBAC real: cambiar MODO_PILOTO a false.
 *
 * Jerarquía de roles: admin > encargado > operario
 */

type Accion = 'ver' | 'crear' | 'editar' | 'borrar' | 'exportar';

type Modulo =
  | 'campo' | 'inventario' | 'trabajos' | 'logistica' | 'maquinaria'
  | 'personal' | 'parte_diario' | 'presencia' | 'trazabilidad'
  | 'materiales' | 'auditoria' | 'erp' | 'admin';

// ━━━ CAMBIAR A false PARA ACTIVAR RBAC ━━━
const MODO_PILOTO = true;

export function usePermisos() {
  const { rol } = useAuth();

  const puede = (_modulo: Modulo, _accion: Accion): boolean => {
    if (MODO_PILOTO) return true;
    // RBAC real se implementará aquí cuando se active
    return false;
  };

  return { puede, rol, esPiloto: MODO_PILOTO };
}
