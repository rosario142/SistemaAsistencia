import { Outlet } from 'react-router-dom';
import { AuthGuard } from '@/app/auth-guard';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * Estructura general de las rutas autenticadas:
 * barra lateral + (barra superior + contenido con `<Outlet />`).
 * Toda la carga pasa por `AuthGuard`.
 */
export function AppLayout() {
  return (
    <AuthGuard>
      <div className="layout">
        <Sidebar />
        <div className="layout__main">
          <Topbar />
          <main className="layout__content">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
