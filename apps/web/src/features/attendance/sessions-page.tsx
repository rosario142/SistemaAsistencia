import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Table, type Column } from '@/shared/ui/Table';
import { Pagination } from '@/shared/ui/Pagination';
import { Badge, sessionBadge } from '@/shared/ui/Badge';
import { SpinnerOverlay } from '@/shared/ui/Spinner';
import { ApiError } from '@/shared/api-client/client';
import type { ClassSession, ClassSessionStatus } from '@/shared/api-client/types';
import { formatDate } from '@/shared/utils/format-date';
import { useSessions } from './use-attendance';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<{ value: ClassSessionStatus; label: string }> = [
  { value: 'SCHEDULED', label: 'Programadas' },
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'CLOSED', label: 'Cerradas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

/** Listado paginado de sesiones con filtros de fecha y estado. */
export function SessionsPage() {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<ClassSessionStatus | ''>('');

  const params = {
    page,
    pageSize: PAGE_SIZE,
    ...(date ? { date } : {}),
    ...(status ? { status } : {}),
  };
  const sessionsQuery = useSessions(params, { keepPrevious: true });

  useEffect(() => {
    setPage(1);
  }, [date, status]);

  const columns: Array<Column<ClassSession>> = [
    {
      key: 'date',
      header: 'Fecha',
      width: '130px',
      render: (session) => formatDate(session.date),
    },
    {
      key: 'course',
      header: 'Curso',
      render: (session) => session.section?.course?.name ?? '—',
    },
    {
      key: 'section',
      header: 'Sección',
      render: (session) => session.section?.name ?? '—',
    },
    {
      key: 'topic',
      header: 'Tema',
      render: (session) => session.topic || <span className="muted">Sin tema asignado</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      width: '130px',
      render: (session) => <Badge {...sessionBadge(session.status)} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '170px',
      align: 'right',
      render: (session) => (
        <Link
          className="btn btn--secondary btn--sm"
          to={`/attendance/session/${session.id}`}
          state={{ session }}
          data-testid="session-open"
        >
          Abrir marcado
        </Link>
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Sesiones de clase</h1>
          <p className="muted">
            Consulta las sesiones programadas y accede al marcado de asistencia de cada una.
          </p>
        </div>
      </header>

      <Card title="Filtros">
        <div className="toolbar">
          <Input
            label="Fecha"
            type="date"
            value={date}
            data-testid="sessions-filter-date"
            onChange={(event) => setDate(event.target.value)}
          />
          <Select
            label="Estado"
            placeholder="Todos los estados"
            value={status}
            options={STATUS_OPTIONS}
            data-testid="sessions-filter-status"
            onChange={(event) => setStatus(event.target.value as ClassSessionStatus | '')}
          />
          {date || status ? (
            <button
              type="button"
              className="btn btn--ghost toolbar__clear"
              onClick={() => {
                setDate('');
                setStatus('');
              }}
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      </Card>

      <Card title="Listado" flush>
        {sessionsQuery.isFetching && sessionsQuery.isLoading ? <SpinnerOverlay /> : null}

        {sessionsQuery.isError ? (
          <div className="alert alert--error" role="alert">
            {sessionsQuery.error instanceof ApiError
              ? sessionsQuery.error.message
              : 'No se pudieron cargar las sesiones.'}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              rows={sessionsQuery.data?.items ?? []}
              rowKey={(session) => session.id}
              emptyMessage="No hay sesiones que coincidan con los filtros."
              caption="Sesiones de clase"
            />
            <Pagination
              page={sessionsQuery.data?.page ?? page}
              pageSize={PAGE_SIZE}
              total={sessionsQuery.data?.total}
              totalPages={sessionsQuery.data?.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
