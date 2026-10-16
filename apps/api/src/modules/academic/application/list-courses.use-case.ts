import { Inject, Injectable } from '@nestjs/common';
import type { Course } from '@prisma/client';
import type { Page } from '../../../shared';
import { CAREER_REPOSITORY, type CareerRepository, type CourseListFilter } from '../domain/ports/career.repository';

/** Listado paginado de cursos. */
@Injectable()
export class ListCoursesUseCase {
  constructor(@Inject(CAREER_REPOSITORY) private readonly careers: CareerRepository) {}

  execute(filter: CourseListFilter): Promise<Page<Course>> {
    return this.careers.listCourses(filter);
  }
}
