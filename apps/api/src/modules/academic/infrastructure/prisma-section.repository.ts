import { Injectable } from '@nestjs/common';
import type { Prisma, Schedule, Section } from '@prisma/client';
import { Page, PrismaService } from '../../../shared';
import {
  type CreateScheduleData,
  type CreateSectionData,
  type SectionListFilter,
  type SectionRepository,
} from '../domain/ports/section.repository';

/** Implementación Prisma del puerto `SectionRepository` (secciones y horarios). */
@Injectable()
export class PrismaSectionRepository implements SectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async sectionExists(id: string): Promise<boolean> {
    const count = await this.prisma.section.count({ where: { id } });
    return count > 0;
  }

  async courseExists(id: string): Promise<boolean> {
    const count = await this.prisma.course.count({ where: { id } });
    return count > 0;
  }

  async termExists(id: string): Promise<boolean> {
    const count = await this.prisma.term.count({ where: { id } });
    return count > 0;
  }

  async teacherExists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { id, active: true } });
    return count > 0;
  }

  findSection(courseId: string, termId: string, name: string): Promise<Section | null> {
    return this.prisma.section.findUnique({
      where: { courseId_termId_name: { courseId, termId, name } },
    });
  }

  createSection(data: CreateSectionData): Promise<Section> {
    return this.prisma.section.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        course: { connect: { id: data.courseId } },
        term: { connect: { id: data.termId } },
        ...(data.teacherId ? { teacher: { connect: { id: data.teacherId } } } : {}),
      },
    });
  }

  listSections(filter: SectionListFilter): Promise<Page<Section>> {
    const where: Prisma.SectionWhereInput = {
      ...(filter.courseId ? { courseId: filter.courseId } : {}),
      ...(filter.termId ? { termId: filter.termId } : {}),
      ...(filter.teacherId ? { teacherId: filter.teacherId } : {}),
    };

    return Page.build(
      filter.page,
      filter.pageSize,
      (args) => this.prisma.section.findMany({ where, orderBy: { name: 'asc' }, ...args }),
      () => this.prisma.section.count({ where }),
    );
  }

  addSchedule(sectionId: string, data: CreateScheduleData): Promise<Schedule> {
    return this.prisma.schedule.create({
      data: {
        section: { connect: { id: sectionId } },
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      },
    });
  }

  listSchedules(sectionId: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { sectionId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }
}
