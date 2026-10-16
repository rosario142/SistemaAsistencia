import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '@/shared/api-client/client';
import type { Justification, JustificationStatus, ReviewDecision } from '@/shared/api-client/types';
import { Badge, justificationBadge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Modal } from '@/shared/ui/Modal';
import { Pagination } from '@/shared/ui/Pagination';
import { Select } from '@/shared/ui/Select';
import { SpinnerOverlay } from '@/shared/ui/Spinner';
import { Table, type Column } from '@/shared/ui/Table';
import { useAuth } from '@/features/auth/use-auth';
import { formatDateTime } from '@/shared/utils/format-date';
import { SubmitJustificationForm } from './submit-justification-form';
import { useJustifications, useReviewJustification } from './use-justifications';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: Array<{ value: JustificationStatus; label: string }> = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'REJECTED', label: 'Rechazadas' },
];

interface ReviewTarget {
  justification: Justification;
  decision: ReviewDecision;
}

/**
 * Gestión de justificaciones: listado con filtro por estado, revisión
 * (aprobar/rechazar con comentario en modal) y envío de una nueva.
 */
export function JustificationsPage() {
  const { hasRole } = useAuth();
  const canReview =
    hasRole('ADMIN') || hasRole('COORDINADOR_ACADEMICO') || hasRole('DOCENTE');

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<JustificationStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const listQuery = useJustifications({ page, pageSize: PAGE_SIZE, ...(status ? { status } : {}) });
  const reviewMutation = useReviewJustification();

  useEffect(() => {
    setPage(1);
  }, [status]);

  function openReview(justification: Justification, decision: ReviewDecision): void {
    setTarget({ justification, decision });
    setComment('');
    setCommentError(null);
  }

  function closeReview(): void {
    setTarget(null);
    setComment('');
    setCommentError(null);
  }

  async function handleConfirmReview(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!target) return;
    // El comentario es obligatorio al rechazar para dejar constancia del motivo.
    if (target.decision === 'REJECTED' && !comment.trim()) {
      setCommentError('Añade un comentario indicando el motivo del rechazo.');
      return;
    }
    try {
      await reviewMutation.mutateAsync({
        justificationId: target.justification.id,
        body: { decision: target.decision, ...(comment.trim() ? { comment: comment.trim() } : {}) },
      });
      setFeedback({
        kind: 'success',
        text:
          target.decision === 'APPROVED'
            ? 'Justificación aprobada: el registro de asistencia pasa a JUSTIFIED.'
            : 'Justificación rechazada.',
      });
      closeReview();
    } catch (cause) {
      setFeedback({
        kind: 'error',
        text: cause instanceof ApiError ? cause.message : 'No se pudo revisar la justificación.',
      });
      closeReview();
    }
  }

  const columns: Array<Column<Justification>> = [
    {
      key: 'student',
      header: 'Estudiante',
      width: '220px',
      render: (item) => <code>{item.studentId}</code>,
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (item) => <span title={item.reason}>{item.reason}</span>,
    },
    {
      key: 'submitted',
      header: 'Enviada',
      width: '160px',
      render: (item) => formatDateTime(item.submittedAt),
    },
    {
      key: 'attachments',
      header: 'Adjuntos',
      width: '110px',
      align: 'center',
      render: (item) =>
        item.attachments.length === 0 ? (
          <span className="muted">—</span>
        ) : (
          <ul className="attachment-list">
            {item.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a href={attachment.url} target="_blank" rel="noreferrer">
                  {attachment.fileName}
                </a>
              </li>
            ))}
          </ul>
        ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: '130px',
      render: (item) => <Badge {...justificationBadge(item.status)} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '210px',
      align: 'right',
      render: (item) =>
        canReview && item.status === 'PENDING' ? (
          <div className="btn-row btn-row--inline">
            <Button
              variant="primary"
              className="btn--sm"
              onClick={() => openReview(item, 'APPROVED')}
              data-testid="justification-approve"
            >
              Aprobar
            </Button>
            <Button
              variant="danger"
              className="btn--sm"
              onClick={() => openReview(item, 'REJECTED')}
              data-testid="justification-reject"
            >
              Rechazar
            </Button>
          </div>
        ) : (
          <span className="muted">Sin acciones</span>
        ),
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Justificaciones</h1>
          <p className="muted">
            Revisa las solicitudes de justificación o envía una nueva con sus adjuntos.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? 'Ocultar formulario' : 'Nueva justificación'}
        </Button>
      </header>

      {feedback ? (
        <div
          className={`alert alert--${feedback.kind}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          data-testid="justification-feedback"
        >
          {feedback.text}
        </div>
      ) : null}

      {showForm ? (
        <Card title="Enviar una justificación">
          <SubmitJustificationForm />
        </Card>
      ) : null}

      <Card title="Filtros">
        <div className="toolbar">
          <Select
            label="Estado"
            placeholder="Todos los estados"
            value={status}
            options={STATUS_OPTIONS}
            data-testid="justifications-filter-status"
            onChange={(event) => setStatus(event.target.value as JustificationStatus | '')}
          />
        </div>
      </Card>

      <Card title="Solicitudes" flush>
        {listQuery.isLoading ? <SpinnerOverlay /> : null}

        {listQuery.isError ? (
          <div className="alert alert--error" role="alert">
            {listQuery.error instanceof ApiError
              ? listQuery.error.message
              : 'No se pudieron cargar las justificaciones.'}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              rows={listQuery.data?.items ?? []}
              rowKey={(item) => item.id}
              emptyMessage="No hay justificaciones que coincidan con el filtro."
              caption="Solicitudes de justificación"
            />
            <Pagination
              page={listQuery.data?.page ?? page}
              pageSize={PAGE_SIZE}
              total={listQuery.data?.total}
              totalPages={listQuery.data?.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <Modal
        open={target !== null}
        title={target?.decision === 'REJECTED' ? 'Rechazar justificación' : 'Aprobar justificación'}
        onClose={closeReview}
        footer={
          <>
            <Button variant="ghost" onClick={closeReview}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="review-form"
              variant={target?.decision === 'REJECTED' ? 'danger' : 'primary'}
              loading={reviewMutation.isPending}
              loadingText="Guardando…"
              data-testid="justification-confirm"
            >
              {target?.decision === 'REJECTED' ? 'Confirmar rechazo' : 'Confirmar aprobación'}
            </Button>
          </>
        }
      >
        <form id="review-form" onSubmit={(event) => void handleConfirmReview(event)} noValidate>
          <p className="muted">
            Justificación de <code>{target?.justification.studentId}</code> registrada el{' '}
            {target ? formatDateTime(target.justification.submittedAt) : ''}.
          </p>
          <div className="form-field">
            <label className="form-field__label" htmlFor="review-comment">
              Comentario {target?.decision === 'REJECTED' ? '(obligatorio)' : '(opcional)'}
            </label>
            <textarea
              id="review-comment"
              className="input textarea"
              rows={3}
              placeholder={
                target?.decision === 'REJECTED'
                  ? 'Indica el motivo del rechazo…'
                  : 'Añade observaciones…'
              }
              value={comment}
              data-testid="justification-comment"
              aria-invalid={commentError ? true : undefined}
              onChange={(event) => {
                setComment(event.target.value);
                setCommentError(null);
              }}
            />
            {commentError ? (
              <p className="form-field__error" role="alert">
                {commentError}
              </p>
            ) : null}
          </div>
        </form>
      </Modal>
    </div>
  );
}
