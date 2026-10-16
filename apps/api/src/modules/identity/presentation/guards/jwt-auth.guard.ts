import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService, UnauthorizedError } from '../../../../shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { TokenPayload } from '../domain/ports/token.service';
import type { AuthUser } from '../types/auth-user.type';

interface RequestWithAuth extends Request {
  user?: AuthUser;
}

/**
 * Guard global de autenticación JWT.
 * - `@Public()` permite el acceso sin token.
 * - En caso contrario valida el Bearer token y recarga el usuario con roles
 *   desde la BD (un token firmado no basta si la cuenta fue desactivada).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    const token = this.extractBearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedError('Token ausente');

    let payload: TokenPayload;
    try {
      payload = this.jwt.verify<TokenPayload>(token);
    } catch {
      throw new UnauthorizedError('Token inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: true },
    });
    if (!user || !user.active) throw new UnauthorizedError('Token inválido o expirado');

    request.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((role) => role.name),
    };
    return true;
  }

  private extractBearerToken(authorization: string | undefined): string | null {
    if (!authorization) return null;
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
  }
}
