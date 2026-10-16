import { Inject, Injectable } from '@nestjs/common';
import type { Schedule } from '@prisma/client';
import { NotFoundError } from '../../../shared';
import { SECTION_REPOSITORY, type SectionRepository } from '../domain/ports/section.repository';

/** Listado de horarios de una sección. */
@Injectable()
export class ListSectionSchedulesUseCase {
  constructor(@Inject(SECTION_REPOSITORY) private readonly sections: SectionRepository) {}

  async execute(sectionId: string): Promise<Schedule[]> {
    if (!(await this.sections.sectionExists(sectionId))) {
      throw new NotFoundError('Sección', sectionId);
    }
    return this.sections.listSchedules(sectionId);
  }
}
