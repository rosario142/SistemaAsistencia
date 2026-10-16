import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../shared';
import { SECTION_REPOSITORY, type SectionRepository } from '../domain/ports/section.repository';
import { SESSION_REPOSITORY, type SessionRepository, type SessionWithSection } from '../domain/ports/session.repository';

export interface CreateSessionCommand {
  sectionId: string;
  date: Date;
  topic?: string;
}

/** Programa una sesión. No puede existir otra sesión para la sección en la misma fecha. */
@Injectable()
export class CreateSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: SessionRepository,
    @Inject(SECTION_REPOSITORY) private readonly sections: SectionRepository,
  ) {}

  async execute(command: CreateSessionCommand): Promise<SessionWithSection> {
    if (!(await this.sections.sectionExists(command.sectionId))) {
      throw new NotFoundError('Sección', command.sectionId);
    }

    const conflict = await this.sessions.findConflictingSession(command.sectionId, command.date);
    if (conflict) {
      throw new ConflictError('Ya existe una sesión programada para esta sección en la fecha indicada');
    }

    return this.sessions.createSession({
      sectionId: command.sectionId,
      date: command.date,
      topic: command.topic?.trim() || undefined,
    });
  }
}
