import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { RolUsuario } from '@/AUDITORIA_TIPOS_OMNIA';

interface AuthContextType {
  user: User | null;
  rol: RolUsuario | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Obtener sesión inicial
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUser(data.session.user);
          await obtenerRolUsuario(data.session.user.id);
        } else {
          setUser(null);
          setRol(null);
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        setUser(null);
        setRol(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await obtenerRolUsuario(session.user.id);
        // Invalidar queries de React Query
        queryClient.invalidateQueries();
      } else {
        setUser(null);
        setRol(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [queryClient]);

  const obtenerRolUsuario = async (userId: string) => {
    try {
      const { data } = await (supabase as unknown as any)
        .from('usuario_roles')
        .select('rol')
        .eq('user_id', userId)
        .eq('activo', true)
        .limit(1)
        .maybeSingle();

      if (data?.rol) {
        setRol(data.rol as RolUsuario);
      } else {
        // Si no existe rol, asumir 'admin' temporalmente
        setRol('admin' as RolUsuario);
      }
    } catch (error) {
      console.error('Error al obtener rol del usuario:', error);
      // Por defecto, asumir admin sino falla
      setRol('admin' as RolUsuario);
    }
  };

  return (
    <AuthContext.Provider value={{ user, rol, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
