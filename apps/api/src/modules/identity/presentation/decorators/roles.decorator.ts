import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '@prisma/client';

/** Clave de metadatos con los roles requeridos por un endpoint. */
export const ROLES_KEY = 'roles';

/** Exige que el usuario autenticado tenga al menos uno de los roles indicados. */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
