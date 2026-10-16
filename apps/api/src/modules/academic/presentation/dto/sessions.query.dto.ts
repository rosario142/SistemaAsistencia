import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClassSessionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../shared';

export class SessionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ example: '2026-03-09', description: 'Fecha exacta (ISO-8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiPropertyOptional({ enum: ClassSessionStatus })
  @IsOptional()
  @IsEnum(ClassSessionStatus)
  status?: ClassSessionStatus;
}
