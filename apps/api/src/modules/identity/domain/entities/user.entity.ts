import type { RoleName } from '@prisma/client';

/** Rol básico asociado a un usuario (proyección de dominio de `Role`). */
export interface UserRoleRef {
  id: string;
  name: RoleName;
}

/**
 * Entidad de dominio de usuario.
 * Conserva `passwordHash` porque es necesaria para la autenticación, pero
 * NUNCA se expone en respuestas HTTP (usar `toUserResponse` en presentation).
 */
export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  roles: UserRoleRef[];
}
