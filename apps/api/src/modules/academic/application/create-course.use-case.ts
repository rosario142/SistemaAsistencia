import { Inject, Injectable } from '@nestjs/common';
import type { Course } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../../shared';
import {
  CAREER_REPOSITORY,
  type CareerRepository,
  type CreateCourseData,
} from '../domain/ports/career.repository';

/** Alta de cursos. Valida carrera y código duplicado dentro de la carrera. */
@Injectable()
export class CreateCourseUseCase {
  constructor(@Inject(CAREER_REPOSITORY) private readonly careers: CareerRepository) {}

  async execute(dto: CreateCourseData): Promise<Course> {
    if (!(await this.careers.careerExists(dto.careerId))) {
      throw new NotFoundError('Carrera', dto.careerId);
    }

    const code = dto.code.trim();
    const existing = await this.careers.findCourseByCode(dto.careerId, code);
    if (existing) throw new ConflictError(`Ya existe un curso con el código '${code}' en esta carrera`);

    return this.careers.createCourse({
      careerId: dto.careerId,
      code,
      name: dto.name.trim(),
      credits: dto.credits,
      semester: dto.semester,
    });
  }
}
