import { Inject, Injectable } from '@nestjs/common';
import type { RoleName } from '@prisma/client';
import { NotFoundError } from '../../../shared';
import type { UserEntity } from '../domain/entities/user.entity';
import { USER_REPOSITORY, type UserRepository } from '../domain/ports/user.repository';

/**
 * Reemplaza el conjunto completo de roles de un usuario por `roleNames`.
 * Valida que el usuario y todos los roles indicados existan.
 */
@Injectable()
export class AssignRoleUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(userId: string, roleNames: RoleName[]): Promise<UserEntity> {
    const user = await this.users.findByIdWithRoles(userId);
    if (!user) throw new NotFoundError('Usuario', userId);

    const uniqueNames = [...new Set(roleNames)];
    const existingRoles = await this.users.findRolesByNames(uniqueNames);
    const existingNames = new Set(existingRoles.map((role) => role.name));
    const missing = uniqueNames.find((name) => !existingNames.has(name));
    if (missing) throw new NotFoundError('Rol', missing);

    return this.users.updateRoles(userId, uniqueNames);
  }
}
