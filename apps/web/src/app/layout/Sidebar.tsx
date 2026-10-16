import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { cn } from '@/shared/utils/cn';

interface NavItem {
  to: string;
  label: string;
  testId: string;
  /** Coincidencia exacta (para la raíz `/`). */
  end?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Inicio', testId: 'nav-home', end: true },
  { to: '/attendance', label: 'Asistencia', testId: 'nav-attendance' },
  { to: '/justifications', label: 'Justificaciones', testId: 'nav-justifications' },
  { to: '/reports', label: 'Reportes', testId: 'nav-reports' },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/users', label: 'Usuarios', testId: 'nav-admin-users' },
  { to: '/admin/policies', label: 'Políticas de asistencia', testId: 'nav-admin-policies' },
];

function NavList({ items }: { items: NavItem[] }) {
  return (
    <ul className="nav__list">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            end={item.end}
            data-testid={item.testId}
            className={({ isActive }) => cn('nav__link', isActive && 'nav__link--active')}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/** Barra lateral de navegación; la sección de administración solo es visible para ADMIN. */
export function Sidebar() {
  const { hasRole } = useAuth();
  const showAdminSection = hasRole('ADMIN');

  return (
    <aside className="layout__sidebar sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          S
        </span>
        <span className="sidebar__name">SICAE</span>
      </div>

      <nav className="sidebar__nav" aria-label="Navegación principal">
        <p className="nav__section-title">General</p>
        <NavList items={MAIN_NAV} />

        {showAdminSection ? (
          <>
            <p className="nav__section-title">Administración</p>
            <NavList items={ADMIN_NAV} />
          </>
        ) : null}
      </nav>

      <p className="sidebar__footer muted">Asistencia Estudiantil</p>
    </aside>
  );
}
