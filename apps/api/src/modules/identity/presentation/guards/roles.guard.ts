import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RoleName } from '@prisma/client';
import { ForbiddenError } from '../../../../shared';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from '../types/auth-user.type';

interface RequestWithAuth {
  user?: AuthUser;
}

/**
 * Guard global de autorización: si el endpoint declara `@Roles(...)`,
 * exige intersección con los roles del usuario autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Sin @Roles(...) el endpoint sólo exige autenticación (JwtAuthGuard global).
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const user = request.user;
    if (!user) throw new ForbiddenError('No autenticado');

    if (!user.roles.some((role) => requiredRoles.includes(role))) {
      throw new ForbiddenError(`Se requiere uno de los roles: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
}
