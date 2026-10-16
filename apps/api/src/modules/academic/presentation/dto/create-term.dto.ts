import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateTermDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  careerId: string;

  @ApiProperty({ example: '2026-1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2026-03-02', description: 'Fecha de inicio (ISO-8601)' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-07-10', description: 'Fecha de fin (ISO-8601)' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}
