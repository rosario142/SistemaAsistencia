import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, NotFoundError, ValidationError, type Clock } from '../../../shared';
import { SESSION_REPOSITORY, type SessionRepository, type SessionWithSection } from '../domain/ports/session.repository';

/**
 * Cierra una sesión: → CLOSED (fija `closedAt` y `closedById`) y, en la misma
 * transacción, marca como ABSENT a los estudiantes inscritos ACTIVE sin registro
 * de asistencia en la sesión.
 */
@Injectable()
export class CloseSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(sessionId: string, closedById: string): Promise<SessionWithSection> {
    const session = await this.sessions.findSessionById(sessionId);
    if (!session) throw new NotFoundError('Sesión', sessionId);
    if (session.status === 'CLOSED') {
      throw new ValidationError('La sesión ya fue cerrada');
    }
    if (session.status === 'CANCELLED') {
      throw new ValidationError('La sesión fue cancelada y no puede cerrarse');
    }

    return this.sessions.closeSession(sessionId, this.clock.now(), closedById);
  }
}
