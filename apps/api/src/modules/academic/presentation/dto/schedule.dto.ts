import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMatches, IsOptional, IsString, Max, Min } from 'class-validator';

/** Formato de hora aceptado por la API para columnas TIME: `HH:mm`. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleDto {
  @ApiProperty({ description: '0 = lunes … 6 = domingo', minimum: 0, maximum: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '08:00', description: 'Hora de inicio (HH:mm)' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'La hora de inicio debe tener formato HH:mm' })
  startTime: string;

  @ApiProperty({ example: '10:00', description: 'Hora de fin (HH:mm)' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'La hora de fin debe tener formato HH:mm' })
  endTime: string;

  @ApiPropertyOptional({ example: 'A-101' })
  @IsOptional()
  @IsString()
  room?: string;
}
