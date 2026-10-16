import { useState, type FormEvent } from 'react';
import { ApiError } from '@/shared/api-client/client';
import type { AttendancePolicy, CreatePolicyRequest, ListPoliciesParams } from '@/shared/api-client/types';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Pagination } from '@/shared/ui/Pagination';
import { Select } from '@/shared/ui/Select';
import { SpinnerOverlay } from '@/shared/ui/Spinner';
import { Table, type Column } from '@/shared/ui/Table';
import { useAuth } from '@/features/auth/use-auth';
import { formatPercentage } from '@/shared/utils/format-percentage';
import { usePolicies, useCreatePolicy } from './use-policies';

const PAGE_SIZE = 10;

export function PoliciesPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN') || hasRole('COORDINADOR_ACADEMICO');

  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AttendancePolicy | null>(null);
  const [formData, setFormData] = useState<CreatePolicyRequest>({
    name: '',
    maxAbsences: 3,
    absencePercentageThreshold: 25,
    toleranceMinutes: 10,
    careerId: undefined,
    active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const params: ListPoliciesParams = { page, pageSize: PAGE_SIZE };
  const listQuery = usePolicies(params);
  const createMutation = useCreatePolicy();

  function resetForm() {
    setFormData({
      name: '',
      maxAbsences: 3,
      absencePercentageThreshold: 25,
      toleranceMinutes: 10,
      careerId: undefined,
      active: true,
    });
    setFormError(null);
  }

  function openCreate() {
    setEditingPolicy(null);
    resetForm();
    setShowForm(true);
  }

  function openEdit(policy: AttendancePolicy) {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      maxAbsences: policy.maxAbsences,
      absencePercentageThreshold: policy.absencePercentageThreshold,
      toleranceMinutes: policy.toleranceMinutes,
      careerId: policy.careerId ?? undefined,
      active: policy.active,
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPolicy(null);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    try {
      if (editingPolicy) {
        setFormError('Edición no implementada: el backend solo tiene creación de políticas.');
        return;
      } else {
        await createMutation.mutateAsync(formData);
        setFeedback({ kind: 'success', text: 'Política creada correctamente.' });
        closeForm();
        listQuery.refetch();
      }
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : 'No se pudo guardar la política.');
    }
  }

  const columns: Column<AttendancePolicy>[] = [
    { key: 'name', header: 'Nombre', render: (p) => p.name },
    { key: 'maxAbsences', header: 'Máx. inasistencias', width: '140px', align: 'center', render: (p) => p.maxAbsences },
    { key: 'threshold', header: 'Umbral %', width: '100px', align: 'center', render: (p) => formatPercentage(p.absencePercentageThreshold) },
    { key: 'tolerance', header: 'Tolerancia (min)', width: '140px', align: 'center', render: (p) => p.toleranceMinutes },
    { key: 'career', header: 'Carrera', width: '180px', render: (p) => p.careerId ? `ID: ${p.careerId}` : 'Global' },
    { key: 'active', header: 'Estado', width: '100px', align: 'center', render: (p) => p.active ? <Badge variant="success">Activa</Badge> : <Badge variant="neutral">Inactiva</Badge> },
    {
      key: 'actions',
      header: 'Acciones',
      width: '140px',
      align: 'right',
      render: (p) => canManage ? (
        <Button variant="secondary" className="btn--sm" onClick={() => openEdit(p)} data-testid="policy-edit">
          Editar
        </Button>
      ) : <span className="muted">—</span>,
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Políticas de asistencia</h1>
          <p className="muted">Define reglas de inasistencias, umbrales de alerta y tolerancias por carrera o globalmente.</p>
        </div>
        {canManage && <Button variant="secondary" onClick={openCreate}>Nueva política</Button>}
      </header>

      {feedback ? (
        <div className={`alert alert--${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      ) : null}

      {showForm ? (
        <Card title={editingPolicy ? 'Editar política' : 'Nueva política'}>
          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              required
              error={formError}
            />
            <div className="form-row">
              <Input
                label="Máx. inasistencias permitidas"
                type="number"
                min="0"
                value={formData.maxAbsences}
                onChange={(e) => setFormData((f) => ({ ...f, maxAbsences: parseInt(e.target.value) || 0 }))}
                required
              />
              <Input
                label="Umbral de inasistencia (%)"
                type="number"
                min="0"
                max="100"
                value={formData.absencePercentageThreshold}
                onChange={(e) => setFormData((f) => ({ ...f, absencePercentageThreshold: parseInt(e.target.value) || 0 }))}
                required
              />
              <Input
                label="Tolerancia de llegada (minutos)"
                type="number"
                min="0"
                value={formData.toleranceMinutes}
                onChange={(e) => setFormData((f) => ({ ...f, toleranceMinutes: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
            <Input
              label="Carrera (ID, opcional para global)"
              value={formData.careerId ?? ''}
              onChange={(e) => setFormData((f) => ({ ...f, careerId: e.target.value || undefined }))}
              hint="Deja vacío para política global"
            />
            <div className="form-field">
              <label className="form-field__label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData((f) => ({ ...f, active: e.target.checked }))}
                />
                Activa
              </label>
            </div>
            {formError && <div className="alert alert--error" role="alert">{formError}</div>}
            <div className="modal__footer">
              <Button type="button" variant="ghost" onClick={closeForm}>Cancelar</Button>
              <Button type="submit" variant="primary" loading={createMutation.isPending}>
                {editingPolicy ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card title="Políticas configuradas" flush>
        {listQuery.isLoading ? <SpinnerOverlay /> : null}

        {listQuery.isError ? (
          <div className="alert alert--error" role="alert">
            {listQuery.error instanceof ApiError ? listQuery.error.message : 'No se pudieron cargar las políticas.'}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              rows={listQuery.data?.items ?? []}
              rowKey={(p) => p.id}
              emptyMessage="No hay políticas configuradas."
              caption="Políticas de asistencia"
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
    </div>
  );
}