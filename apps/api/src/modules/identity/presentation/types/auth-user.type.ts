import type { RoleName } from '@prisma/client';

/** Usuario autenticado que `JwtAuthGuard` inyecta en `request.user`. */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleName[];
}
