import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { NotFoundPage } from './not-found-page';
import { LoginPage } from '@/features/auth/login-page';
import { DashboardResumen } from '@/features/attendance/dashboard-resumen';
import { SessionPage } from '@/features/attendance/session-page';
import { SessionsPage } from '@/features/attendance/sessions-page';
import { JustificationsPage } from '@/features/justifications/justifications-page';
import { ReportsPage } from '@/features/reports/reports-page';
import { PoliciesPage } from '@/features/admin/policies-page';
import { UsersPage } from '@/features/admin/users-page';

/**
 * Árbol de rutas (react-router-dom v7):
 * - `/login` es pública.
 * - El resto vive bajo `AppLayout`, que envuelve todo en `AuthGuard`.
 * - `*` renderiza el 404 dentro del layout.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardResumen /> },
      { path: 'attendance', element: <SessionsPage /> },
      { path: 'attendance/session/:sessionId', element: <SessionPage /> },
      { path: 'justifications', element: <JustificationsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'admin/users', element: <UsersPage /> },
      { path: 'admin/policies', element: <PoliciesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
