import { Inject, Injectable } from '@nestjs/common';
import type { Career } from '@prisma/client';
import type { Page } from '../../../shared';
import { CAREER_REPOSITORY, type CareerListFilter, type CareerRepository } from '../domain/ports/career.repository';

/** Listado paginado de carreras (filtro libre `q` + `active`). */
@Injectable()
export class ListCareersUseCase {
  constructor(@Inject(CAREER_REPOSITORY) private readonly careers: CareerRepository) {}

  execute(filter: CareerListFilter): Promise<Page<Career>> {
    return this.careers.listCareers(filter);
  }
}
