import type { ClassSession, ClassSessionStatus, Prisma } from '@prisma/client';
import type { Page } from '../../../../shared';

/** Token de inyección del repositorio de sesiones de clase. */
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

/** Sesión con su sección y nombre del curso (forma de respuesta del contrato HTTP). */
export type SessionWithSection = Prisma.ClassSessionGetPayload<{
  include: { section: { include: { course: { select: { name: true } } } } };
}>;

export interface CreateSessionData {
  sectionId: string;
  date: Date;
  topic?: string;
}

export interface SessionListFilter {
  sectionId?: string;
  date?: Date;
  status?: ClassSessionStatus;
  /** Restringe a las sesiones de las secciones que imparte este docente. */
  teacherId?: string;
  page: number;
  pageSize: number;
}

/** Puerto de persistencia de sesiones de clase. */
export interface SessionRepository {
  findConflictingSession(sectionId: string, date: Date): Promise<ClassSession | null>;
  createSession(data: CreateSessionData): Promise<SessionWithSection>;
  listSessions(filter: SessionListFilter): Promise<Page<SessionWithSection>>;
  findSessionById(id: string): Promise<ClassSession | null>;
  findSessionWithSectionById(id: string): Promise<SessionWithSection | null>;
  startSession(id: string, startedAt: Date): Promise<SessionWithSection>;
  /**
   * Cierra la sesión y, en la MISMA transacción, registra como ABSENT
   * a todo estudiante inscrito ACTIVE sin AttendanceRecord en la sesión.
   */
  closeSession(id: string, closedAt: Date, closedById: string): Promise<SessionWithSection>;
}
