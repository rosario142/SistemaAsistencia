import type { RoleName } from '@prisma/client';
import type { Page } from '../../../../shared';
import type { RoleEntity } from '../entities/role.entity';
import type { UserEntity } from '../entities/user.entity';

/** Token de inyección del repositorio de usuarios. */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  roleNames: RoleName[];
}

export interface ListUsersFilter {
  /** Búsqueda libre por email / nombre / apellido. */
  q?: string;
  active?: boolean;
  page: number;
  pageSize: number;
}

/** Puerto de persistencia de usuarios y roles del dominio identity. */
export interface UserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByIdWithRoles(id: string): Promise<UserEntity | null>;
  create(data: CreateUserInput): Promise<UserEntity>;
  /** Reemplaza el conjunto completo de roles del usuario. */
  updateRoles(id: string, roleNames: RoleName[]): Promise<UserEntity>;
  list(filter: ListUsersFilter): Promise<Page<UserEntity>>;
  findRolesByNames(roleNames: RoleName[]): Promise<RoleEntity[]>;
  listRoles(): Promise<RoleEntity[]>;
}
