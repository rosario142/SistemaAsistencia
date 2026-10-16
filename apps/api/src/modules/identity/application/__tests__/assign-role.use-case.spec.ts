import type { RoleName } from '@prisma/client';
import { NotFoundError } from '../../../../shared';
import type { UserEntity } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/ports/user.repository';
import { AssignRoleUseCase } from '../assign-role.use-case';

describe('AssignRoleUseCase', () => {
  const users = {
    findByIdWithRoles: jest.fn(),
    findRolesByNames: jest.fn(),
    updateRoles: jest.fn(),
  };

  let useCase: AssignRoleUseCase;

  const baseUser: UserEntity = {
    id: 'user-1',
    email: 'ana@sicae.edu',
    passwordHash: '$argon2id$fake',
    firstName: 'Ana',
    lastName: 'Pérez',
    active: true,
    mustChangePassword: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    roles: [{ id: 'role-docente', name: 'DOCENTE' }],
  };

  const adminRole = { id: 'role-admin', name: 'ADMIN', description: null, permissions: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AssignRoleUseCase(users as unknown as UserRepository);
  });

  it('reemplaza el conjunto completo de roles del usuario', async () => {
    users.findByIdWithRoles.mockResolvedValue(baseUser);
    users.findRolesByNames.mockResolvedValue([adminRole]);
    users.updateRoles.mockResolvedValue({ ...baseUser, roles: [{ id: 'role-admin', name: 'ADMIN' }] });

    const result = await useCase.execute('user-1', ['ADMIN']);

    expect(users.findRolesByNames).toHaveBeenCalledWith(['ADMIN']);
    expect(users.updateRoles).toHaveBeenCalledWith('user-1', ['ADMIN']);
    expect(result.roles.map((role) => role.name)).toEqual(['ADMIN']);
  });

  it('deduplica los roles indicados antes de persistirlos', async () => {
    users.findByIdWithRoles.mockResolvedValue(baseUser);
    users.findRolesByNames.mockResolvedValue([adminRole]);
    users.updateRoles.mockResolvedValue({ ...baseUser, roles: [{ id: 'role-admin', name: 'ADMIN' }] });

    await useCase.execute('user-1', ['ADMIN', 'ADMIN']);

    expect(users.findRolesByNames).toHaveBeenCalledWith(['ADMIN']);
    expect(users.updateRoles).toHaveBeenCalledWith('user-1', ['ADMIN']);
  });

  it('lanza NotFoundError si el usuario no existe', async () => {
    users.findByIdWithRoles.mockResolvedValue(null);

    await expect(useCase.execute('missing-user', ['ADMIN'])).rejects.toBeInstanceOf(NotFoundError);
    expect(users.updateRoles).not.toHaveBeenCalled();
  });

  it('lanza NotFoundError con el nombre del rol inexistente', async () => {
    users.findByIdWithRoles.mockResolvedValue(baseUser);
    users.findRolesByNames.mockResolvedValue([]);

    const error = await useCase
      .execute('user-1', ['DIRECTOR' as unknown as RoleName])
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(NotFoundError);
    expect((error as NotFoundError).message).toContain('DIRECTOR');
    expect(users.updateRoles).not.toHaveBeenCalled();
  });
});
