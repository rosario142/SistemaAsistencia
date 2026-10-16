import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService, UnauthorizedError } from '../../../shared';
import type { UserEntity } from '../domain/entities/user.entity';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/ports/password-hasher';
import { TOKEN_SERVICE, type TokenService } from '../domain/ports/token.service';
import { USER_REPOSITORY, type UserRepository } from '../domain/ports/user.repository';

export interface LoginResult {
  accessToken: string;
  user: UserEntity;
}

/**
 * Autentica a un usuario con email/contraseña y emite un JWT firmado.
 * Registra la acción LOGIN en el AuditLog.
 */
@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);

    // Mismo mensaje para usuario inexistente o contraseña incorrecta: no revelar cuál falló.
    const invalidCredentials = new UnauthorizedError('Credenciales inválidas');
    if (!user) throw invalidCredentials;

    const passwordMatches = await this.hasher.verify(user.passwordHash, password);
    if (!passwordMatches) throw invalidCredentials;

    if (!user.active) {
      throw new UnauthorizedError('La cuenta está desactivada; contacta al administrador');
    }

    const accessToken = await this.tokens.sign({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.name),
    });

    // Rastro de auditoría del inicio de sesión (no crítico: no interrumpe el login).
    try {
      await this.prisma.auditLog.create({
        data: { action: 'LOGIN', entityType: 'User', userId: user.id },
      });
    } catch (error) {
      this.logger.warn(`No se pudo registrar el audit LOGIN para el usuario ${user.id}: ${String(error)}`);
    }

    return { accessToken, user };
  }
}
