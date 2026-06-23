import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { AuthProvider, useAuth } from '@core/auth-provider';
import { Loader2 } from 'lucide-react';

// Importa a árvore de rotas gerada pelo TanStack Router.
// Observação: ela será criada dinamicamente na primeira compilação/execução.
// @ts-ignore
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Cria a instância do roteador
const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // Será sobrescrita no RouterProvider abaixo
    queryClient: undefined!,
  },
  defaultPreload: 'intent',
});

// Tipagem para segurança de rotas
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuth();

  // Enquanto a sessão está sendo checada/inicializada (ex: /auth/me), exibe tela de carregamento
  if (!auth.isInitialized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Loader2 className="absolute h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-muted-foreground mt-6 animate-pulse">
          Inicializando seu Life OS...
        </p>
      </div>
    );
  }

  return <RouterProvider router={router} context={{ auth, queryClient }} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
