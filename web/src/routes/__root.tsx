import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import type { AuthContextType } from '@core/auth-context';
import { useThemeStore } from '@core/theme-store';
import { Toaster } from 'sonner';

interface MyRouterContext {
  auth: AuthContextType;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const theme = useThemeStore((state) => state.theme);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center font-sans">
      <Outlet />
      <Toaster theme={theme} position="bottom-right" richColors />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </div>
  );
}
