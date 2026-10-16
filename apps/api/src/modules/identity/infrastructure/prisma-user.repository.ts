import { Injectable } from '@nestjs/common';
import type { Prisma, RoleName } from '@prisma/client';
import { Page, PrismaService } from '../../../shared';
import type { RoleEntity } from '../domain/entities/role.entity';
import type { UserEntity, UserRoleRef } from '../domain/entities/user.entity';
import {
  type CreateUserInput,
  type ListUsersFilter,
  type UserRepository,
} from '../domain/ports/user.repository';

/** Proyección mínima del modelo Prisma `User` necesaria para mapear la entidad. */
interface UserWithRoles {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  roles: { id: string; name: RoleName }[];
}

function toUserEntity(user: UserWithRoles): UserEntity {
  const roles: UserRoleRef[] = user.roles.map((role) => ({ id: role.id, name: role.name }));
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    roles,
  };
}

function toRoleEntity(role: {
  id: string;
  name: RoleName;
  description: string | null;
  permissions: { id: string; code: string; description: string | null }[];
}): RoleEntity {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      description: permission.description,
    })),
  };
}

const USER_INCLUDE = { roles: true } satisfies Prisma.UserInclude;

/** Implementación Prisma del puerto `UserRepository`. */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: USER_INCLUDE,
    });
    return user ? toUserEntity(user) : null;
  }

  async findByIdWithRoles(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });
    return user ? toUserEntity(user) : null;
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: data.passwordHash,
        roles: { connect: data.roleNames.map((name) => ({ name })) },
      },
      include: USER_INCLUDE,
    });
    return toUserEntity(user);
  }

  async updateRoles(id: string, roleNames: RoleName[]): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { roles: { set: roleNames.map((name) => ({ name })) } },
      include: USER_INCLUDE,
    });
    return toUserEntity(user);
  }

  async list(filter: ListUsersFilter): Promise<Page<UserEntity>> {
    const q = filter.q?.trim();
    const where: Prisma.UserWhereInput = {
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filter.active !== undefined ? { active: filter.active } : {}),
    };

    const page = await Page.build(
      filter.page,
      filter.pageSize,
      (args) =>
        this.prisma.user.findMany({
          where,
          include: USER_INCLUDE,
          orderBy: [{ createdAt: 'desc' }],
          ...args,
        }),
      () => this.prisma.user.count({ where }),
    );

    return Page.from(page.items.map(toUserEntity), page.total, page.page, page.pageSize);
  }

  async findRolesByNames(roleNames: RoleName[]): Promise<RoleEntity[]> {
    if (roleNames.length === 0) return [];
    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
      include: { permissions: true },
    });
    return roles.map(toRoleEntity);
  }

  async listRoles(): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
    return roles.map(toRoleEntity);
  }
}
