import { Injectable } from '@nestjs/common';
import type { Career, Course, Prisma, Term } from '@prisma/client';
import { Page, PrismaService } from '../../../shared';
import {
  type CareerListFilter,
  type CareerRepository,
  type CourseListFilter,
  type CreateCareerData,
  type CreateCourseData,
  type CreateTermData,
  type TermListFilter,
} from '../domain/ports/career.repository';

/** Implementación Prisma del puerto `CareerRepository` (carreras, periodos y cursos). */
@Injectable()
export class PrismaCareerRepository implements CareerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async careerExists(id: string): Promise<boolean> {
    const count = await this.prisma.career.count({ where: { id } });
    return count > 0;
  }

  findCareerByCode(code: string): Promise<Career | null> {
    return this.prisma.career.findUnique({ where: { code } });
  }

  createCareer(data: CreateCareerData): Promise<Career> {
    return this.prisma.career.create({
      data: { code: data.code, name: data.name, degree: data.degree },
    });
  }

  listCareers(filter: CareerListFilter): Promise<Page<Career>> {
    const q = filter.q?.trim();
    const where: Prisma.CareerWhereInput = {
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filter.active !== undefined ? { active: filter.active } : {}),
    };

    return Page.build(
      filter.page,
      filter.pageSize,
      (args) => this.prisma.career.findMany({ where, orderBy: { code: 'asc' }, ...args }),
      () => this.prisma.career.count({ where }),
    );
  }

  findTermByName(careerId: string, name: string): Promise<Term | null> {
    return this.prisma.term.findUnique({ where: { careerId_name: { careerId, name } } });
  }

  createTerm(data: CreateTermData): Promise<Term> {
    return this.prisma.term.create({
      data: {
        career: { connect: { id: data.careerId } },
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  }

  listTerms(filter: TermListFilter): Promise<Page<Term>> {
    const where: Prisma.TermWhereInput = {
      ...(filter.careerId ? { careerId: filter.careerId } : {}),
    };

    return Page.build(
      filter.page,
      filter.pageSize,
      (args) => this.prisma.term.findMany({ where, orderBy: { startDate: 'desc' }, ...args }),
      () => this.prisma.term.count({ where }),
    );
  }

  findCourseByCode(careerId: string, code: string): Promise<Course | null> {
    return this.prisma.course.findUnique({ where: { careerId_code: { careerId, code } } });
  }

  createCourse(data: CreateCourseData): Promise<Course> {
    return this.prisma.course.create({
      data: {
        career: { connect: { id: data.careerId } },
        code: data.code,
        name: data.name,
        credits: data.credits,
        semester: data.semester,
      },
    });
  }

  listCourses(filter: CourseListFilter): Promise<Page<Course>> {
    const where: Prisma.CourseWhereInput = {
      ...(filter.careerId ? { careerId: filter.careerId } : {}),
      ...(filter.semester !== undefined ? { semester: filter.semester } : {}),
    };

    return Page.build(
      filter.page,
      filter.pageSize,
      (args) => this.prisma.course.findMany({ where, orderBy: [{ semester: 'asc' }, { code: 'asc' }], ...args }),
      () => this.prisma.course.count({ where }),
    );
  }
}
