import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  careerId: string;

  @ApiProperty({ example: 'SW-301', description: 'Código del curso dentro de la carrera' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Ingeniería de Requisitos' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ default: 4, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  credits: number;

  @ApiProperty({ example: 5, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  semester: number;
}
