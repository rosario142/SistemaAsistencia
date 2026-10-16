import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/api-client/client';
import { followupApi, justificationApi } from '@/shared/api-client/endpoints';
import { Card } from '@/shared/ui/Card';
import { Spinner } from '@/shared/ui/Spinner';
import { toInputDate } from '@/shared/utils/format-date';
import { useSessionsByDate } from './use-attendance';

interface KpiCardProps {
  title: string;
  value: number | null;
  isLoading: boolean;
  isError: boolean;
  to: string;
  linkLabel: string;
}

function KpiCard({ title, value, isLoading, isError, to, linkLabel }: KpiCardProps) {
  return (
    <article className="kpi-card card">
      <p className="kpi-card__title">{title}</p>
      <p className="kpi-card__value" aria-busy={isLoading || undefined}>
        {isLoading ? <Spinner size="md" label="Calculando…" /> : isError ? '—' : (value ?? 0)}
      </p>
      <Link className="kpi-card__link" to={to}>
        {linkLabel} →
      </Link>
    </article>
  );
}

/** Panel de inicio: sesiones de hoy, justificaciones pendientes y alertas abiertas. */
export function DashboardResumen() {
  const today = toInputDate();

  const sessionsToday = useSessionsByDate(today, 1);
  const pendingJustifications = useQuery<number, ApiError>({
    queryKey: ['dashboard', 'justifications-pending'],
    queryFn: async () => {
      const page = await justificationApi.list({ page: 1, pageSize: 1, status: 'PENDING' });
      return page.total;
    },
  });
  const openAlerts = useQuery<number, ApiError>({
    queryKey: ['dashboard', 'alerts-open'],
    queryFn: async () => {
      const page = await followupApi.listAlerts({ page: 1, pageSize: 1, status: 'OPEN' });
      return page.total;
    },
  });

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Inicio</h1>
          <p className="muted">Resumen operativo del día: asistencia, justificaciones y alertas.</p>
        </div>
      </header>

      <div className="grid grid--cards">
        <KpiCard
          title="Sesiones de hoy"
          value={sessionsToday.data?.total ?? null}
          isLoading={sessionsToday.isLoading}
          isError={sessionsToday.isError}
          to="/attendance"
          linkLabel="Ver sesiones"
        />
        <KpiCard
          title="Justificaciones pendientes"
          value={pendingJustifications.data ?? null}
          isLoading={pendingJustifications.isLoading}
          isError={pendingJustifications.isError}
          to="/justifications"
          linkLabel="Revisar justificaciones"
        />
        <KpiCard
          title="Alertas abiertas"
          value={openAlerts.data ?? null}
          isLoading={openAlerts.isLoading}
          isError={openAlerts.isError}
          to="/reports"
          linkLabel="Ver reportes"
        />
      </div>

      <Card title="Accesos rápidos">
        <ul className="quick-links">
          <li>
            <Link to="/attendance">Abrir marcado de asistencia</Link>
          </li>
          <li>
            <Link to="/justifications">Gestionar justificaciones</Link>
          </li>
          <li>
            <Link to="/reports">Exportar reportes XLSX / PDF</Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
