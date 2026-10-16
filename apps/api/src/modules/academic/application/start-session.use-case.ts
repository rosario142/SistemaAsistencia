import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, NotFoundError, ValidationError, type Clock } from '../../../shared';
import { SESSION_REPOSITORY, type SessionRepository, type SessionWithSection } from '../domain/ports/session.repository';

/**
 * Inicia una sesión: SCHEDULED → IN_PROGRESS (fija `startedAt`).
 * Sesiones cerradas o canceladas no pueden iniciarse; IN_PROGRESS es idempotente.
 */
@Injectable()
export class StartSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(sessionId: string): Promise<SessionWithSection> {
    const session = await this.sessions.findSessionWithSectionById(sessionId);
    if (!session) throw new NotFoundError('Sesión', sessionId);
    if (session.status === 'CLOSED') {
      throw new ValidationError('La sesión ya fue cerrada y no puede iniciarse');
    }
    if (session.status === 'CANCELLED') {
      throw new ValidationError('La sesión fue cancelada y no puede iniciarse');
    }
    if (session.status === 'IN_PROGRESS') return session;

    return this.sessions.startSession(sessionId, this.clock.now());
  }
}
