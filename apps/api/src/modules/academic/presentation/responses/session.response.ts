import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassSessionStatus } from '@prisma/client';
import type { SessionWithSection } from '../../domain/ports/session.repository';

export class SessionSectionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Sección 1' })
  name: string;

  @ApiProperty({ description: 'Curso al que pertenece la sección', example: { name: 'Ingeniería de Requisitos' } })
  course: { name: string };
}

export class SessionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional({ nullable: true })
  topic: string | null;

  @ApiProperty({ enum: ClassSessionStatus })
  status: ClassSessionStatus;

  @ApiPropertyOptional({ nullable: true })
  startedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  closedAt: Date | null;

  @ApiProperty({ type: SessionSectionResponse })
  section: SessionSectionResponse;
}

export function toSessionResponse(session: SessionWithSection): SessionResponse {
  return {
    id: session.id,
    sectionId: session.sectionId,
    date: session.date,
    topic: session.topic,
    status: session.status,
    startedAt: session.startedAt,
    closedAt: session.closedAt,
    section: {
      id: session.section.id,
      name: session.section.name,
      course: { name: session.section.course.name },
    },
  };
}
