import { ApiProperty } from '@nestjs/swagger';
import type { Career } from '@prisma/client';

export class CareerResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'ING-SW' })
  code: string;

  @ApiProperty({ example: 'Ingeniería de Software' })
  name: string;

  @ApiProperty({ nullable: true, required: false })
  degree: string | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;
}

export function toCareerResponse(career: Career): CareerResponse {
  return {
    id: career.id,
    code: career.code,
    name: career.name,
    degree: career.degree,
    active: career.active,
    createdAt: career.createdAt,
  };
}
