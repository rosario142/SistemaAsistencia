import { Inject, Injectable } from '@nestjs/common';
import type { Section } from '@prisma/client';
import type { Page } from '../../../shared';
import { SECTION_REPOSITORY, type SectionListFilter, type SectionRepository } from '../domain/ports/section.repository';

/** Listado paginado de secciones. */
@Injectable()
export class ListSectionsUseCase {
  constructor(@Inject(SECTION_REPOSITORY) private readonly sections: SectionRepository) {}

  execute(filter: SectionListFilter): Promise<Page<Section>> {
    return this.sections.listSections(filter);
  }
}
