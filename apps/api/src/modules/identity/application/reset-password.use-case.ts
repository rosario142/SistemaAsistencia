import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, PrismaService, ValidationError, type Clock } from '../../../shared';
import { PASSWORD_HASHER, type PasswordHasher } from '../domain/ports/password-hasher';

/**
 * Restablece la contraseña de un usuario a partir de un token válido
 * (hash correcto, sin usar y no expirado). Marca el token como usado.
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly prisma: PrismaService,
  ) {}

  async execute(token: string, newPassword: string): Promise<{ ok: true }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const record = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: this.clock.now() } },
    });
    if (!record) {
      throw new ValidationError('El enlace de recuperación es inválido o ha expirado');
    }

    const passwordHash = await this.hasher.hash(newPassword);
    const usedAt = this.clock.now();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, mustChangePassword: false },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt },
      }),
    ]);

    return { ok: true };
  }
}
