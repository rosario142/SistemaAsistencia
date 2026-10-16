import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '@/shared/api-client/client';
import type { AttendanceStatus, ClassSession } from '@/shared/api-client/types';
import { attendanceBadge, Badge, sessionBadge, statusLabel } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Select, type SelectOption } from '@/shared/ui/Select';
import { SpinnerOverlay } from '@/shared/ui/Spinner';
import { Table, type Column } from '@/shared/ui/Table';
import { formatDate } from '@/shared/utils/format-date';
import {
  useAttendance,
  useCloseSession,
  useEnrollments,
  useMarkBulk,
  useSession,
  useStudentsLookup,
} from './use-attendance';

const MARK_OPTIONS: SelectOption[] = [
  { value: 'PRESENT', label: 'Presente' },
  { value: 'ABSENT', label: 'Ausente' },
  { value: 'LATE', label: 'Tardanza' },
  { value: 'JUSTIFIED', label: 'Justificado' },
  { value: 'EXCUSED', label: 'Dispensado' },
];

interface StudentRow {
  studentId: string;
  enrollmentId: string;
  code: string;
  name: string;
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

/**
 * Marcado de asistencia de una sesión: lista a los matriculados en la sección,
 * permite ajustar el estado por fila y guardar en lote (`POST /attendance/bulk`).
 */
export function SessionPage() {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const initialSession = (location.state as { session?: ClassSession } | null)?.session;

  const sessionQuery = useSession(sessionId, initialSession);
  const session = sessionQuery.data ?? null;

  const enrollmentsQuery = useEnrollments(session?.sectionId, Boolean(session));
  const enrollments = useMemo(
    () => enrollmentsQuery.data?.items ?? [],
    [enrollmentsQuery.data],
  );
  // Solo consulta /students si alguna matrícula no trae la relación incluida.
  const needsStudentLookup = enrollments.some((enrollment) => !enrollment.student);
  const studentsQuery = useStudentsLookup(needsStudentLookup);
  const recordsQuery = useAttendance({ sessionId, page: 1, pageSize: 500 }, Boolean(sessionId));

  const rows = useMemo<StudentRow[]>(() => {
    const studentsById = new Map(
      (studentsQuery.data?.items ?? []).map((student) => [student.id, student]),
    );
    return enrollments
      .map((enrollment) => {
        const student = enrollment.student ?? studentsById.get(enrollment.studentId);
        return {
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          code: student?.code ?? '—',
          name: student ? `${student.lastName}, ${student.firstName}` : enrollment.studentId,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [enrollments, studentsQuery.data]);

  const recordByStudent = useMemo(() => {
    const map = new Map(recordsQuery.data?.items.map((record) => [record.studentId, record]) ?? []);
    return map;
  }, [recordsQuery.data]);

  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const markBulk = useMarkBulk();
  const closeSession = useCloseSession();

  // Precarga los estados existentes (o PRESENT por defecto) hasta que el usuario edite.
  const initKey = `${sessionId}|${rows.map((row) => row.studentId).join(',')}|${[
    ...recordByStudent.values(),
  ]
    .map((record) => `${record.studentId}:${record.status}`)
    .join(',')}`;

  useEffect(() => {
    if (dirty || rows.length === 0) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const row of rows) {
      next[row.studentId] = recordByStudent.get(row.studentId)?.status ?? 'PRESENT';
    }
    setMarks(next);
  }, [initKey, dirty, rows, recordByStudent]);

  const isOpen =
    session?.status === 'SCHEDULED' || session?.status === 'IN_PROGRESS';
  const isClosed = session?.status === 'CLOSED' || session?.status === 'CANCELLED';

  const counts = useMemo(() => {
    const tally = { PRESENT: 0, ABSENT: 0, LATE: 0, JUSTIFIED: 0, EXCUSED: 0 };
    for (const row of rows) {
      const status = marks[row.studentId];
      if (status) tally[status] += 1;
    }
    return tally;
  }, [rows, marks]);

  function handleMarkChange(studentId: string, status: AttendanceStatus): void {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
    setDirty(true);
    setNotice(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (rows.length === 0) return;
    setActionError(null);
    try {
      const result = await markBulk.mutateAsync({
        sessionId,
        marks: rows.map((row) => ({
          studentId: row.studentId,
          status: marks[row.studentId] ?? 'PRESENT',
        })),
      });
      setDirty(false);
      setNotice(
        `Marcado guardado: ${result.created} registro(s) nuevo(s) y ${result.updated} actualizado(s).`,
      );
    } catch (cause) {
      setActionError(errorMessage(cause, 'No se pudo guardar el marcado.'));
    }
  }

  async function handleClose(): Promise<void> {
    const confirmed = window.confirm(
      '¿Cerrar la sesión de clase? Los registros pendientes se marcarán como ausentes y ya no se podrá editar el marcado.',
    );
    if (!confirmed) return;
    setActionError(null);
    try {
      await closeSession.mutateAsync(sessionId);
      setNotice('Sesión de clase cerrada correctamente.');
    } catch (cause) {
      setActionError(errorMessage(cause, 'No se pudo cerrar la sesión.'));
    }
  }

  if (sessionQuery.isLoading) return <SpinnerOverlay label="Cargando sesión…" />;

  if (!session) {
    return (
      <div className="page">
        <div className="alert alert--error" role="alert" data-testid="session-missing">
          No se encontró la sesión solicitada. Vuelve al listado para elegir otra.
        </div>
        <Link className="btn btn--primary" to="/attendance">
          Volver a sesiones
        </Link>
      </div>
    );
  }

  const columns: Array<Column<StudentRow>> = [
    { key: 'code', header: 'Código', width: '120px', render: (row) => row.code },
    { key: 'name', header: 'Estudiante', render: (row) => row.name },
    {
      key: 'record',
      header: 'Registro previo',
      width: '150px',
      render: (row) => {
        const record = recordByStudent.get(row.studentId);
        return record ? <Badge {...attendanceBadge(record.status)} /> : <span className="muted">—</span>;
      },
    },
    {
      key: 'mark',
      header: 'Marcado',
      width: '180px',
      render: (row) => (
        <Select
          options={MARK_OPTIONS}
          value={marks[row.studentId] ?? 'PRESENT'}
          disabled={!isOpen}
          aria-label={`Estado de ${row.name}`}
          data-testid="attendance-status"
          data-student-id={row.studentId}
          onChange={(event) =>
            handleMarkChange(row.studentId, event.target.value as AttendanceStatus)
          }
        />
      ),
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="page-header__back">
            <Link to="/attendance">← Volver a sesiones</Link>
          </p>
          <h1 className="page-title">Marcado de asistencia</h1>
          <p className="muted">
            {session.section?.course?.name ?? 'Curso'} · {session.section?.name ?? 'Sección'} ·{' '}
            {formatDate(session.date)}
          </p>
        </div>
        <div className="page-header__badges">
          <Badge {...sessionBadge(session.status)} />
          {session.topic ? <Badge variant="neutral">{session.topic}</Badge> : null}
        </div>
      </header>

      {notice ? (
        <div className="alert alert--success" role="status" data-testid="attendance-notice">
          {notice}
        </div>
      ) : null}
      {actionError ? (
        <div className="alert alert--error" role="alert" data-testid="attendance-error">
          {actionError}
        </div>
      ) : null}
      {isClosed ? (
        <div className="alert alert--info" role="status">
          Esta sesión está cerrada: el marcado es de solo lectura.
        </div>
      ) : null}

      <Card title="Estudiantes de la sección" flush>
        {enrollmentsQuery.isLoading ? (
          <SpinnerOverlay label="Cargando estudiantes…" />
        ) : (
          <form onSubmit={(event) => void handleSave(event)}>
            <Table
              columns={columns}
              rows={rows}
              rowKey={(row) => row.enrollmentId}
              emptyMessage="Esta sección no tiene estudiantes matriculados."
              caption={`Estudiantes de ${session.section?.name ?? 'la sección'}`}
            />

            <div className="mark-summary" aria-label="Resumen del marcado">
              <span className="mark-summary__item">
                <Badge variant="success">Presentes</Badge> {counts.PRESENT}
              </span>
              <span className="mark-summary__item">
                <Badge variant="danger">Ausentes</Badge> {counts.ABSENT}
              </span>
              <span className="mark-summary__item">
                <Badge variant="warning">Tardanzas</Badge> {counts.LATE}
              </span>
              <span className="mark-summary__item">
                <Badge variant="info">Justificados</Badge> {counts.JUSTIFIED}
              </span>
              <span className="mark-summary__item">
                <Badge variant="neutral">Dispensados</Badge> {counts.EXCUSED}
              </span>
            </div>

            <div className="btn-row btn-row--footer">
              <Button
                type="submit"
                variant="primary"
                data-testid="attendance-save"
                loading={markBulk.isPending}
                loadingText="Guardando…"
                disabled={!isOpen || rows.length === 0}
              >
                Guardar marcado
              </Button>
              <Button
                type="button"
                variant="danger"
                data-testid="attendance-close"
                loading={closeSession.isPending}
                loadingText="Cerrando…"
                disabled={!isOpen}
                onClick={() => void handleClose()}
              >
                Cerrar sesión de clase
              </Button>
              <span className="muted mark-summary__hint">
                {dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'} ·{' '}
                {rows.length} estudiante(s)
              </span>
            </div>
          </form>
        )}
      </Card>

      {session.startedAt || session.closedAt ? (
        <Card title="Trazabilidad">
          <dl className="meta-list">
            <div>
              <dt>Iniciada</dt>
              <dd>{session.startedAt ? formatDate(session.startedAt) : '—'}</dd>
            </div>
            <div>
              <dt>Cerrada</dt>
              <dd>{session.closedAt ? formatDate(session.closedAt) : '—'}</dd>
            </div>
          </dl>
        </Card>
      ) : null}

      <p className="muted">
        Los estados disponibles son: {MARK_OPTIONS.map((option) => statusLabel(option.value)).join(', ')}
        .
      </p>
    </div>
  );
}
