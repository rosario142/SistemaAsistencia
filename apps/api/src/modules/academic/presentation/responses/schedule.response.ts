import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Schedule } from '@prisma/client';

/** Formatea una columna TIME de Prisma (Date sobre 1970-01-01 UTC) como `HH:mm`. */
export function formatTime(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export class ScheduleResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sectionId: string;

  @ApiProperty({ description: '0 = lunes … 6 = domingo' })
  dayOfWeek: number;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio (HH:mm)' })
  startTime: string;

  @ApiProperty({ example: '10:00', description: 'Hora de fin (HH:mm)' })
  endTime: string;

  @ApiPropertyOptional({ example: 'A-101', nullable: true })
  room: string | null;
}

export function toScheduleResponse(schedule: Schedule): ScheduleResponse {
  return {
    id: schedule.id,
    sectionId: schedule.sectionId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: formatTime(schedule.startTime),
    endTime: formatTime(schedule.endTime),
    room: schedule.room,
  };
}
