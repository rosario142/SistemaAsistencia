import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Parámetros estándar de paginación para todos los listados. */
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Página (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ description: 'Elementos por página (máx. 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  /** Desplazamiento calculado para las consultas Prisma (`skip`). */
  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  /** Límite calculado para las consultas Prisma (`take`). */
  get take(): number {
    return this.pageSize;
  }
}