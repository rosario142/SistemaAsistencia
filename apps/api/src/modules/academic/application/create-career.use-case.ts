import { Inject, Injectable } from '@nestjs/common';
import type { Career } from '@prisma/client';
import { ConflictError } from '../../../shared';
import { CAREER_REPOSITORY, type CareerRepository, type CreateCareerData } from '../domain/ports/career.repository';

/** Alta de carreras. Código duplicado → ConflictError. */
@Injectable()
export class CreateCareerUseCase {
  constructor(@Inject(CAREER_REPOSITORY) private readonly careers: CareerRepository) {}

  async execute(dto: CreateCareerData): Promise<Career> {
    const code = dto.code.trim();
    const existing = await this.careers.findCareerByCode(code);
    if (existing) throw new ConflictError(`Ya existe una carrera con el código '${code}'`);

    return this.careers.createCareer({
      code,
      name: dto.name.trim(),
      degree: dto.degree?.trim() || undefined,
    });
  }
}
