import { Inject, Injectable } from '@nestjs/common';
import type { Term } from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared';
import { CAREER_REPOSITORY, type CareerRepository } from '../domain/ports/career.repository';

export interface CreateTermCommand {
  careerId: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

/** Alta de periodos académicos. Valida carrera, orden de fechas y duplicados. */
@Injectable()
export class CreateTermUseCase {
  constructor(@Inject(CAREER_REPOSITORY) private readonly careers: CareerRepository) {}

  async execute(command: CreateTermCommand): Promise<Term> {
    if (!(await this.careers.careerExists(command.careerId))) {
      throw new NotFoundError('Carrera', command.careerId);
    }
    if (command.startDate.getTime() >= command.endDate.getTime()) {
      throw new ValidationError('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    const name = command.name.trim();
    const existing = await this.careers.findTermByName(command.careerId, name);
    if (existing) throw new ConflictError(`Ya existe el periodo '${name}' para esta carrera`);

    return this.careers.createTerm({
      careerId: command.careerId,
      name,
      startDate: command.startDate,
      endDate: command.endDate,
    });
  }
}
