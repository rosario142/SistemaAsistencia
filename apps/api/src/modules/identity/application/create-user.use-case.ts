import { Inject, Injectable } from '@nestjs/common';
import type { RoleName } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../../shared';
import type { UserEntity } from '../domain/entities/user.entity';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/ports/password-hasher';
import { USER_REPOSITORY, type UserRepository } from '../domain/ports/user.repository';

export interface CreateUserCommand {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleNames: RoleName[];
}

/** Carga inicial de usuarios (ADMIN). Email duplicado → ConflictError. */
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserEntity> {
    const email = command.email.trim().toLowerCase();

    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictError(`Ya existe un usuario con el email '${email}'`);

    const roleNames = [...new Set(command.roleNames)];
    const existingRoles = await this.users.findRolesByNames(roleNames);
    const existingNames = new Set(existingRoles.map((role) => role.name));
    const missing = roleNames.find((name) => !existingNames.has(name));
    if (missing) throw new NotFoundError('Rol', missing);

    const passwordHash = await this.hasher.hash(command.password);
    return this.users.create({
      email,
      firstName: command.firstName.trim(),
      lastName: command.lastName.trim(),
      passwordHash,
      roleNames,
    });
  }
}
