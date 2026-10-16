import { useState, type FormEvent } from 'react';
import { ApiError } from '@/shared/api-client/client';
import type { RoleName, User, CreateUserRequest, AssignRolesRequest, ListUsersParams } from '@/shared/api-client/types';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Pagination } from '@/shared/ui/Pagination';
import { Select } from '@/shared/ui/Select';
import { SpinnerOverlay } from '@/shared/ui/Spinner';
import { Table, type Column } from '@/shared/ui/Table';
import { useAuth } from '@/features/auth/use-auth';
import { useUsers, useCreateUser, useAssignRoles } from './use-users';

const PAGE_SIZE = 10;

const ROLE_OPTIONS: Array<{ value: RoleName; label: string }> = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'COORDINADOR_ACADEMICO', label: 'Coordinador académico' },
  { value: 'DOCENTE', label: 'Docente' },
  { value: 'ESTUDIANTE', label: 'Estudiante' },
];

const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: 'Administrador',
  COORDINADOR_ACADEMICO: 'Coordinador académico',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
};

function shallowEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

export function UsersPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN');

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleNames: [] as RoleName[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const params: ListUsersParams = { page, pageSize: PAGE_SIZE, q, active: activeFilter === '' ? undefined : activeFilter };
  const listQuery = useUsers(params);
  const createMutation = useCreateUser();
  const assignRolesMutation = useAssignRoles();

  function resetForm() {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      roleNames: [] as RoleName[],
    });
    setFormError(null);
  }

  function openCreate() {
    setEditingUser(null);
    resetForm();
    setShowForm(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      roleNames: user.roles,
    });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingUser(null);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    try {
      if (editingUser) {
        const currentRoles = new Set(editingUser.roles);
        const newRoles = new Set(formData.roleNames);
        if (!shallowEqual(currentRoles, newRoles)) {
          await assignRolesMutation.mutateAsync({ userId: editingUser.id, body: { roleNames: formData.roleNames } });
        }
        setFeedback({ kind: 'success', text: 'Roles actualizados. Otros campos requieren endpoints adicionales.' });
        closeForm();
        listQuery.refetch();
      } else {
        if (!formData.password) {
          setFormError('La contraseña es obligatoria para nuevos usuarios.');
          return;
        }
        await createMutation.mutateAsync(formData);
        setFeedback({ kind: 'success', text: 'Usuario creado correctamente.' });
        closeForm();
        listQuery.refetch();
      }
    } catch (cause) {
      setFormError(cause instanceof ApiError ? cause.message : 'No se pudo guardar el usuario.');
    }
  }

  async function handleToggleActive(user: User) {
    setFeedback({ kind: 'error', text: 'Cambiar estado activo/inactivo requiere endpoint PATCH /users/:id no implementado.' });
  }

  const columns: Column<User>[] = [
    { key: 'email', header: 'Email', width: '220px', render: (u) => u.email },
    { key: 'name', header: 'Nombre', width: '200px', render: (u) => `${u.firstName} ${u.lastName}` },
    { key: 'roles', header: 'Roles', width: '200px', render: (u) => u.roles.map((r) => <Badge key={r} variant="primary">{ROLE_LABELS[r]}</Badge>) },
    { key: 'active', header: 'Estado', width: '100px', align: 'center', render: (u) => u.active ? <Badge variant="success">Activo</Badge> : <Badge variant="neutral">Inactivo</Badge> },
    { key: 'createdAt', header: 'Creado', width: '160px', render: (u) => new Date(u.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      header: 'Acciones',
      width: '200px',
      align: 'right',
      render: (u) => canManage ? (
        <div className="btn-row btn-row--inline">
          <Button variant="secondary" className="btn--sm" onClick={() => openEdit(u)} data-testid="user-edit">
            Editar roles
          </Button>
          <Button variant="ghost" className="btn--sm" onClick={() => handleToggleActive(u)} data-testid="user-toggle">
            {u.active ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      ) : <span className="muted">—</span>,
    },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="muted">Gestiona cuentas de usuario y asignación de roles.</p>
        </div>
        {canManage && <Button variant="secondary" onClick={openCreate}>Nuevo usuario</Button>}
      </header>

      {feedback ? (
        <div className={`alert alert--${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      ) : null}

      <Card title="Filtros">
        <div className="toolbar">
          <Input
            label="Buscar"
            placeholder="Email o nombre"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="users-filter-q"
          />
          <Select
            label="Estado"
            placeholder="Todos"
            value={activeFilter}
            options={[
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
            ]}
            onChange={(e) => setActiveFilter(e.target.value as boolean | '')}
            data-testid="users-filter-active"
          />
          {q || activeFilter !== '' ? (
            <button type="button" className="btn btn--ghost toolbar__clear" onClick={() => { setQ(''); setActiveFilter(''); }}>
              Limpiar
            </button>
          ) : null}
        </div>
      </Card>

      {showForm ? (
        <Card title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}>
          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              required
              disabled={!!editingUser}
            />
            <div className="form-row">
              <Input
                label="Nombre"
                value={formData.firstName}
                onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
              <Input
                label="Apellido"
                value={formData.lastName}
                onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))}
                required
              />
            </div>
            <Input
              label={editingUser ? 'Nueva contraseña (deja vacío para no cambiar)' : 'Contraseña'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
              required={!editingUser}
              hint={editingUser ? 'Mínimo 8 caracteres' : 'Mínimo 8 caracteres'}
            />
            <div className="form-field">
              <label className="form-field__label">Roles</label>
              <div className="checkbox-group">
                {ROLE_OPTIONS.map((role) => (
                  <label key={role.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.roleNames.includes(role.value)}
                      onChange={(e) => setFormData((f) => ({
                        ...f,
                        roleNames: e.target.checked
                          ? [...f.roleNames, role.value]
                          : f.roleNames.filter((r) => r !== role.value),
                      }))}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
            {formError && <div className="alert alert--error" role="alert">{formError}</div>}
            <div className="modal__footer">
              <Button type="button" variant="ghost" onClick={closeForm}>Cancelar</Button>
              <Button type="submit" variant="primary" loading={createMutation.isPending || assignRolesMutation.isPending}>
                {editingUser ? 'Actualizar roles' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card title="Listado de usuarios" flush>
        {listQuery.isLoading ? <SpinnerOverlay /> : null}

        {listQuery.isError ? (
          <div className="alert alert--error" role="alert">
            {listQuery.error instanceof ApiError ? listQuery.error.message : 'No se pudieron cargar los usuarios.'}
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              rows={listQuery.data?.items ?? []}
              rowKey={(u) => u.id}
              emptyMessage="No hay usuarios que coincidan con los filtros."
              caption="Usuarios del sistema"
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