import { Injectable } from '@nestjs/common';
import type { ClassSession, Prisma } from '@prisma/client';
import { Page, PrismaService } from '../../../shared';
import {
  type CreateSessionData,
  type SessionListFilter,
  type SessionRepository,
  type SessionWithSection,
} from '../domain/ports/session.repository';

/** Include de sesión con sección y nombre del curso (forma de respuesta del contrato). */
const SESSION_INCLUDE = {
  section: { include: { course: { select: { name: true } } } },
} satisfies Prisma.ClassSessionInclude;

/** Implementación Prisma del puerto `SessionRepository`. */
@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findConflictingSession(sectionId: string, date: Date): Promise<ClassSession | null> {
    return this.prisma.classSession.findFirst({ where: { sectionId, date } });
  }

  createSession(data: CreateSessionData): Promise<SessionWithSection> {
    return this.prisma.classSession.create({
      data: {
        section: { connect: { id: data.sectionId } },
        date: data.date,
        topic: data.topic,
      },
      include: SESSION_INCLUDE,
    });
  }

  listSessions(filter: SessionListFilter): Promise<Page<SessionWithSection>> {
    const where: Prisma.ClassSessionWhereInput = {
      ...(filter.sectionId ? { sectionId: filter.sectionId } : {}),
      ...(filter.date ? { date: filter.date } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      // Docente: sólo sesiones de las secciones que imparte.
      ...(filter.teacherId ? { section: { teacherId: filter.teacherId } } : {}),
    };

    return Page.build(
      filter.page,
      filter.pageSize,
      (args) =>
        this.prisma.classSession.findMany({
          where,
          include: SESSION_INCLUDE,
          orderBy: [{ date: 'desc' }],
          ...args,
        }),
      () => this.prisma.classSession.count({ where }),
    );
  }

  findSessionById(id: string): Promise<ClassSession | null> {
    return this.prisma.classSession.findUnique({ where: { id } });
  }

  findSessionWithSectionById(id: string): Promise<SessionWithSection | null> {
    return this.prisma.classSession.findUnique({ where: { id }, include: SESSION_INCLUDE });
  }

  startSession(id: string, startedAt: Date): Promise<SessionWithSection> {
    return this.prisma.classSession.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt },
      include: SESSION_INCLUDE,
    });
  }

  closeSession(id: string, closedAt: Date, closedById: string): Promise<SessionWithSection> {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.classSession.update({
        where: { id },
        data: { status: 'CLOSED', closedAt, closedById },
        include: SESSION_INCLUDE,
      });

      // Cierre de asistencia: los inscritos activos sin registro quedan ABSENT.
      const [enrollments, records] = await Promise.all([
        tx.enrollment.findMany({
          where: { sectionId: session.sectionId, status: 'ACTIVE' },
          select: { studentId: true },
        }),
        tx.attendanceRecord.findMany({
          where: { sessionId: id },
          select: { studentId: true },
        }),
      ]);

      const recordedStudentIds = new Set(records.map((record) => record.studentId));
      const missingStudents = enrollments.filter(
        (enrollment) => !recordedStudentIds.has(enrollment.studentId),
      );

      if (missingStudents.length > 0) {
        await tx.attendanceRecord.createMany({
          data: missingStudents.map((enrollment) => ({
            sessionId: id,
            studentId: enrollment.studentId,
            status: 'ABSENT',
            source: 'MANUAL',
            markedAt: closedAt,
          })),
        });
      }

      return session;
    });
  }
}
