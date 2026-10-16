import { Inject, Injectable } from '@nestjs/common';
import type { Page } from '../../../shared';
import type { AuthUser } from '../../identity/presentation/types/auth-user.type';
import { SESSION_REPOSITORY, type SessionListFilter, type SessionRepository, type SessionWithSection } from '../domain/ports/session.repository';

/**
 * Listado paginado de sesiones.
 * Un usuario con rol DOCENTE (y sin rol administrativo) sólo ve las sesiones
 * de las secciones que imparte (`section.teacherId = user.id`).
 */
@Injectable()
export class ListSessionsUseCase {
  constructor(@Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository) {}

  execute(filter: SessionListFilter, user: AuthUser): Promise<Page<SessionWithSection>> {
    const isDocenteOnly = user.roles.length > 0 && user.roles.every((role) => role === 'DOCENTE');
    return this.sessions.listSessions({
      ...filter,
      teacherId: isDocenteOnly ? user.id : filter.teacherId,
    });
  }
}
