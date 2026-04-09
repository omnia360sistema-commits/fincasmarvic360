import { useAuth } from '@/context/AuthContext';

/**
 * Hook centralizado para obtener el usuario que crea registros (auditoría)
 *
 * PROPÓSITO:
 * - Devolver email del usuario autenticado para campo created_by
 * - Fallback a 'sistema' si no hay usuario (sesión expirada)
 * - Centralizar lógica para fácil testing y cambios futuros
 *
 * USO EN HOOKS:
 * const createdBy = useCreatedBy();
 * await supabase.from('trabajos_registro').insert({
 *   ...payload,
 *   created_by: createdBy  // Aquí va el email real
 * })
 *
 * @returns {string} Email del usuario o 'sistema'
 */
export const useCreatedBy = (): string => {
  const { user } = useAuth();
  return user?.email ?? 'sistema';
};
