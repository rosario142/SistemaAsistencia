import type { Schedule, Section } from '@prisma/client';
import type { Page } from '../../../../shared';

/** Token de inyección del repositorio de secciones. */
export const SECTION_REPOSITORY = Symbol('SECTION_REPOSITORY');

export interface CreateSectionData {
  courseId: string;
  termId: string;
  name: string;
  capacity: number;
  teacherId?: string;
}

export interface SectionListFilter {
  courseId?: string;
  termId?: string;
  teacherId?: string;
  page: number;
  pageSize: number;
}

export interface CreateScheduleData {
  dayOfWeek: number;
  /** Hora como Date sobre 1970-01-01 UTC (columna TIME de Prisma). */
  startTime: Date;
  endTime: Date;
  room?: string;
}

/** Puerto de persistencia de secciones y horarios. */
export interface SectionRepository {
  sectionExists(id: string): Promise<boolean>;
  courseExists(id: string): Promise<boolean>;
  termExists(id: string): Promise<boolean>;
  teacherExists(id: string): Promise<boolean>;
  findSection(courseId: string, termId: string, name: string): Promise<Section | null>;
  createSection(data: CreateSectionData): Promise<Section>;
  listSections(filter: SectionListFilter): Promise<Page<Section>>;
  addSchedule(sectionId: string, data: CreateScheduleData): Promise<Schedule>;
  listSchedules(sectionId: string): Promise<Schedule[]>;
}
