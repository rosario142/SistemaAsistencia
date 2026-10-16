import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CLOCK, PrismaService, type Clock } from '../../../shared';
import { MAILER, type Mailer } from '../domain/ports/mailer';
import { USER_REPOSITORY, type UserRepository } from '../domain/ports/user.repository';

const RESET_TOKEN_TTL_MINUTES = 30;

/**
 * Genera un token aleatorio de restablecimiento de contraseña.
 * Sólo se persiste su hash SHA-256; el token en claro va únicamente por correo.
 * Siempre responde `{ ok: true }` para no revelar si el email existe.
 */
@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async execute(email: string): Promise<{ ok: true }> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());

    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(this.clock.now().getTime() + RESET_TOKEN_TTL_MINUTES * 60_000);

      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const webOrigin = this.config.get<string>('app.webOrigin') ?? 'http://localhost:5173';
      const resetUrl = `${webOrigin}/reset-password?token=${token}`;
      await this.mailer.sendPasswordReset(user.email, resetUrl);
    }

    return { ok: true };
  }
}
