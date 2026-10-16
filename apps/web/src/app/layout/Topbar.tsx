import { useAuth } from '@/features/auth/use-auth';
import { statusLabel } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';

/** Barra superior: identidad del usuario, roles y cierre de sesión. */
export function Topbar() {
  const { user, logout } = useAuth();

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

  return (
    <header className="layout__topbar topbar">
      <div className="topbar__user">
        <span className="topbar__avatar" aria-hidden="true">
          {fullName ? fullName.charAt(0).toUpperCase() : '?'}
        </span>
        <div className="topbar__user-info">
          <span className="topbar__name">{fullName || 'Usuario'}</span>
          <span className="topbar__roles">
            {user?.roles.map((role) => statusLabel(role)).join(' · ') ?? ''}
          </span>
        </div>
      </div>

      <div className="topbar__actions">
        <Button variant="ghost" onClick={logout} data-testid="logout">
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
