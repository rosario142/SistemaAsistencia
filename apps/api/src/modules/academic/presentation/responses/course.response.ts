import { ApiProperty } from '@nestjs/swagger';
import type { Course } from '@prisma/client';

export class CourseResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  careerId: string;

  @ApiProperty({ example: 'SW-301' })
  code: string;

  @ApiProperty({ example: 'Ingeniería de Requisitos' })
  name: string;

  @ApiProperty()
  credits: number;

  @ApiProperty()
  semester: number;
}

export function toCourseResponse(course: Course): CourseResponse {
  return {
    id: course.id,
    careerId: course.careerId,
    code: course.code,
    name: course.name,
    credits: course.credits,
    semester: course.semester,
  };
}
