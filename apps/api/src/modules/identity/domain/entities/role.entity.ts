import type { RoleName } from '@prisma/client';

/** Permiso asociado a un rol (proyección de dominio de `Permission`). */
export interface PermissionEntity {
  id: string;
  code: string;
  description: string | null;
}

/** Rol de dominio con sus permisos. */
export interface RoleEntity {
  id: string;
  name: RoleName;
  description: string | null;
  permissions: PermissionEntity[];
}
