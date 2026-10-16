import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/auth-provider';

/**
 * Contextos globales de la aplicación:
 * - `QueryClientProvider` (TanStack Query v5) para el estado de servidor.
 * - `AuthProvider` (token + perfil en `localStorage`) para la sesión.
 *
 * El `RouterProvider` se monta como hijo desde `main.tsx`.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Un reintento corto evita parpadeos por fallos transitorios.
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
