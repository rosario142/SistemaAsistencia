import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCareerDto {
  @ApiProperty({ example: 'ING-SW', description: 'Código único de la carrera' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Ingeniería de Software' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Ingeniería', description: 'Título/grado que otorga' })
  @IsOptional()
  @IsString()
  degree?: string;
}
