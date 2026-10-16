import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import appConfig from './shared/config/app.config';
import { validateEnv } from './shared/config/validation';
import { SharedModule } from './shared/shared.module';
import { PrismaModule } from './shared/prisma/prisma.module';

import { IdentityModule } from './modules/identity/identity.module';
import { AcademicModule } from './modules/academic/academic.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { JustificationModule } from './modules/justification/justification.module';
import { FollowupModule } from './modules/followup/followup.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { AuditModule } from './modules/audit/audit.module';

import { JwtAuthGuard } from './modules/identity/presentation/guards/jwt-auth.guard';
import { RolesGuard } from './modules/identity/presentation/guards/roles.guard';
import { AuditInterceptor } from './modules/audit/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    // Kernel compartido (global) + cliente Prisma (global)
    SharedModule,
    PrismaModule,
    // Módulos de dominio
    IdentityModule,
    AcademicModule,
    EnrollmentModule,
    AttendanceModule,
    JustificationModule,
    FollowupModule,
    ReportingModule,
    AuditModule,
  ],
  providers: [
    // Límite de peticiones por IP (rate limiting)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Autenticación JWT global; se omite con @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Autorización basada en roles (@Roles(...)); omite endpoints sin @Roles
    { provide: APP_GUARD, useClass: RolesGuard },
    // Toda mutación relevante queda registrada en AuditLog
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}