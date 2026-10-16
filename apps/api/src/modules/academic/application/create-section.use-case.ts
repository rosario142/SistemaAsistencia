import { Inject, Injectable } from '@nestjs/common';
import type { Section } from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared';
import { SECTION_REPOSITORY, type CreateSectionData, type SectionRepository } from '../domain/ports/section.repository';

/** Alta de secciones. Valida curso, periodo, docente (opcional) y capacidad. */
@Injectable()
export class CreateSectionUseCase {
  constructor(@Inject(SECTION_REPOSITORY) private readonly sections: SectionRepository) {}

  async execute(dto: CreateSectionData): Promise<Section> {
    if (!(await this.sections.courseExists(dto.courseId))) {
      throw new NotFoundError('Curso', dto.courseId);
    }
    if (!(await this.sections.termExists(dto.termId))) {
      throw new NotFoundError('Periodo', dto.termId);
    }
    if (dto.capacity <= 0) {
      throw new ValidationError('La capacidad de la sección debe ser mayor a 0');
    }
    if (dto.teacherId && !(await this.sections.teacherExists(dto.teacherId))) {
      throw new NotFoundError('Usuario', dto.teacherId);
    }

    const name = dto.name.trim();
    const existing = await this.sections.findSection(dto.courseId, dto.termId, name);
    if (existing) throw new ConflictError(`Ya existe la sección '${name}' para este curso y periodo`);

    return this.sections.createSection({ ...dto, name });
  }
}
