import { ApiProperty } from '@nestjs/swagger';
import type { Term } from '@prisma/client';

export class TermResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  careerId: string;

  @ApiProperty({ example: '2026-1' })
  name: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  isCurrent: boolean;
}

export function toTermResponse(term: Term): TermResponse {
  return {
    id: term.id,
    careerId: term.careerId,
    name: term.name,
    startDate: term.startDate,
    endDate: term.endDate,
    isCurrent: term.isCurrent,
  };
}
