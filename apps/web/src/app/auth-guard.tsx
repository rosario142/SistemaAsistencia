import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/use-auth';
import { SpinnerOverlay } from '@/shared/ui/Spinner';

/**
 * Protege rutas privadas:
 * - sin token → redirige a `/login` guardando la ruta original en `state.from`,
 * - con token pero perfil aún sin validar → spinner,
 * - sesión invalidada (401) → vuelve a `/login`.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;

  if (!token) {
    return <Navigate to="/login" replace state={{ from }} />;
  }
  if (isLoading) {
    return <SpinnerOverlay label="Validando sesión…" />;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <>{children}</>;
}
