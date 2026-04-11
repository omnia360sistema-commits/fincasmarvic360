import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { RolUsuario } from '@/AUDITORIA_TIPOS_OMNIA';

interface AuthContextType {
  user: User | null;
  rol: RolUsuario | null;
  companyId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Obtener sesión inicial
    const initializeAuth = async () => {
      try {
        // 1. Verificamos rápido si hay token local. Si no hay, no perdemos tiempo.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUser(null);
          setRol(null);
          return;
        }
        
        // 2. Validamos contra el servidor con un Timeout de 4 segundos para evitar que se cuelgue en F5
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000));
        
        const { data, error } = await Promise.race([getUserPromise, timeoutPromise]) as any;

        if (error || !data?.user) {
          await supabase.auth.signOut().catch(() => {});
          setUser(null);
          setRol(null);
          setCompanyId(null);
        } else {
          setUser(data.user);
          await obtenerRolUsuario(data.user.id);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        await supabase.auth.signOut().catch(() => {});
        setUser(null);
        setRol(null);
        setCompanyId(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRol(null);
        setCompanyId(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        await obtenerRolUsuario(session.user.id);
        // Invalidar queries de React Query
        queryClient.invalidateQueries();
      } else {
        setUser(null);
        setRol(null);
        setCompanyId(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [queryClient]);

  const PILOT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

  const obtenerRolUsuario = async (userId: string) => {
    try {
      // 1. Intentar user_profiles (sistema nuevo multi-tenant)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, company_id, status')
        .eq('id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (profile?.role) {
        setRol(profile.role as RolUsuario);
        setCompanyId(profile.company_id ?? PILOT_COMPANY_ID);
        return;
      }

      // 2. Fallback: usuario_roles (sistema legacy)
      const { data: legacy } = await supabase
        .from('usuario_roles')
        .select('rol')
        .eq('user_id', userId)
        .eq('activo', true)
        .limit(1)
        .maybeSingle();

      if (legacy?.rol) {
        setRol(legacy.rol as RolUsuario);
        setCompanyId(PILOT_COMPANY_ID);
        return;
      }

      // 3. Modo piloto: admin por defecto (usuario único)
      setRol('admin' as RolUsuario);
      setCompanyId(PILOT_COMPANY_ID);
    } catch (error) {
      console.error('Error al obtener rol del usuario:', error);
      // Modo piloto: admin por defecto para no bloquear
      setRol('admin' as RolUsuario);
      setCompanyId(PILOT_COMPANY_ID);
    }
  };

  return (
    <AuthContext.Provider value={{ user, rol, companyId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
