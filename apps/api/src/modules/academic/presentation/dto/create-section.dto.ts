import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  termId: string;

  @ApiProperty({ example: 'Sección 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Docente asignado (id de usuario)' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiProperty({ default: 30, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;
}
