import { Inject, Injectable } from '@nestjs/common';
import type { Term } from '@prisma/client';
import type { Page } from '../../../shared';
import { CAREER_REPOSITORY, type CareerRepository, type TermListFilter } from '../domain/ports/career.repository';

/** Listado paginado de periodos académicos. */
@Injectable()
export class ListTermsUseCase {
  constructor(@Inject(CAREER_REPOSITORY) private readonly careers: CareerRepository) {}

  execute(filter: TermListFilter): Promise<Page<Term>> {
    return this.careers.listTerms(filter);
  }
}
