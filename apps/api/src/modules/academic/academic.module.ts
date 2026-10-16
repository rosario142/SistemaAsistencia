import { Module } from '@nestjs/common';
import { CAREER_REPOSITORY } from './domain/ports/career.repository';
import { SECTION_REPOSITORY } from './domain/ports/section.repository';
import { SESSION_REPOSITORY } from './domain/ports/session.repository';
import { PrismaCareerRepository } from './infrastructure/prisma-career.repository';
import { PrismaSectionRepository } from './infrastructure/prisma-section.repository';
import { PrismaSessionRepository } from './infrastructure/prisma-session.repository';
import { AddScheduleUseCase } from './application/add-schedule.use-case';
import { CloseSessionUseCase } from './application/close-session.use-case';
import { CreateCareerUseCase } from './application/create-career.use-case';
import { CreateCourseUseCase } from './application/create-course.use-case';
import { CreateSectionUseCase } from './application/create-section.use-case';
import { CreateSessionUseCase } from './application/create-session.use-case';
import { CreateTermUseCase } from './application/create-term.use-case';
import { ListCareersUseCase } from './application/list-careers.use-case';
import { ListCoursesUseCase } from './application/list-courses.use-case';
import { ListSectionSchedulesUseCase } from './application/list-section-schedules.use-case';
import { ListSectionsUseCase } from './application/list-sections.use-case';
import { ListSessionsUseCase } from './application/list-sessions.use-case';
import { ListTermsUseCase } from './application/list-terms.use-case';
import { StartSessionUseCase } from './application/start-session.use-case';
import { CareersController } from './presentation/careers.controller';
import { CoursesController } from './presentation/courses.controller';
import { SectionsController } from './presentation/sections.controller';
import { SessionsController } from './presentation/sessions.controller';
import { TermsController } from './presentation/terms.controller';

/**
 * Módulo académico: carreras, periodos, cursos, secciones (con horarios)
 * y sesiones de clase. `PrismaModule` y `SharedModule` son globales.
 */
@Module({
  controllers: [CareersController, TermsController, CoursesController, SectionsController, SessionsController],
  providers: [
    { provide: CAREER_REPOSITORY, useClass: PrismaCareerRepository },
    { provide: SECTION_REPOSITORY, useClass: PrismaSectionRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    CreateCareerUseCase,
    ListCareersUseCase,
    CreateTermUseCase,
    ListTermsUseCase,
    CreateCourseUseCase,
    ListCoursesUseCase,
    CreateSectionUseCase,
    ListSectionsUseCase,
    AddScheduleUseCase,
    ListSectionSchedulesUseCase,
    CreateSessionUseCase,
    ListSessionsUseCase,
    StartSessionUseCase,
    CloseSessionUseCase,
  ],
})
export class AcademicModule {}
