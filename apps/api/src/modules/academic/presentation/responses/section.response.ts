import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Section } from '@prisma/client';

export class SectionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  termId: string;

  @ApiPropertyOptional({ nullable: true })
  teacherId: string | null;

  @ApiProperty({ example: 'Sección 1' })
  name: string;

  @ApiProperty()
  capacity: number;
}

export function toSectionResponse(section: Section): SectionResponse {
  return {
    id: section.id,
    courseId: section.courseId,
    termId: section.termId,
    teacherId: section.teacherId,
    name: section.name,
    capacity: section.capacity,
  };
}
