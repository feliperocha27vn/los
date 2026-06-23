import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './auth-context';
export type { AuthContextType } from './auth-context';
import { useGetAuthMe, getAuthMeQueryKey } from './api/gen/hooks/useGetAuthMe';
import { usePostAuthLogin } from './api/gen/hooks/usePostAuthLogin';
import { usePostAuthLogout } from './api/gen/hooks/usePostAuthLogout';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Query reativa para obter o perfil do usuário atual
  // Sem useEffect! O TanStack Query resolve a chamada inicial e gerencia o ciclo de vida.
  const { data, isLoading, refetch } = useGetAuthMe({
    query: {
      retry: false,
      staleTime: Infinity, // Mantém a sessão em cache até invalidarmos explicitamente
    },
  });

  const loginMutation = usePostAuthLogin();
  const logoutMutation = usePostAuthLogout();

  const user = data?.user || null;
  const isAuthenticated = !!user;
  const isInitialized = !isLoading;

  const login = async (email: string, password: string) => {
    const response = await loginMutation.mutateAsync({
      data: { email, password },
    });
    // Atualiza o cache do React Query com os dados de login retornados com sucesso
    queryClient.setQueryData(getAuthMeQueryKey(), response);
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Caso dê algum erro de rede ou similar, ainda assim deslogamos localmente
    } finally {
      // Limpa os dados do cache de autenticação
      queryClient.setQueryData(getAuthMeQueryKey(), null);
      queryClient.clear(); // Limpa todo o cache
    }
  };

  const checkSession = async () => {
    await refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitialized,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
