import { Inject, Injectable } from '@nestjs/common';
import type { Schedule } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../../shared';
import { SECTION_REPOSITORY, type SectionRepository } from '../domain/ports/section.repository';

export interface AddScheduleCommand {
  dayOfWeek: number;
  /** Hora en formato HH:mm. */
  startTime: string;
  /** Hora en formato HH:mm. */
  endTime: string;
  room?: string;
}

/** Agrega un bloque de horario a una sección (día 0–6, inicio < fin). */
@Injectable()
export class AddScheduleUseCase {
  constructor(@Inject(SECTION_REPOSITORY) private readonly sections: SectionRepository) {}

  async execute(sectionId: string, command: AddScheduleCommand): Promise<Schedule> {
    if (!(await this.sections.sectionExists(sectionId))) {
      throw new NotFoundError('Sección', sectionId);
    }
    if (command.dayOfWeek < 0 || command.dayOfWeek > 6) {
      throw new ValidationError('El día de la semana debe estar entre 0 (lunes) y 6 (domingo)');
    }

    const startTime = this.toTimeDate(command.startTime);
    const endTime = this.toTimeDate(command.endTime);
    if (startTime.getTime() >= endTime.getTime()) {
      throw new ValidationError('La hora de inicio debe ser anterior a la hora de fin');
    }

    return this.sections.addSchedule(sectionId, {
      dayOfWeek: command.dayOfWeek,
      startTime,
      endTime,
      room: command.room?.trim() || undefined,
    });
  }

  /** Convierte `HH:mm` a Date UTC sobre 1970-01-01 (columna TIME de Prisma). */
  private toTimeDate(value: string): Date {
    return new Date(`1970-01-01T${value}:00.000Z`);
  }
}
