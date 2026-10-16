/**
 * Barrel del kernel compartido.
 * Uso desde un módulo: `import { Page, PaginationQueryDto, NotFoundError, CLOCK } from '../../shared';`
 */
export { default as appConfig } from './config/app.config';
export type { AppConfigShape } from './config/app.config';
export { validateEnv } from './config/validation';
export * from './errors/domain.errors';
export { AllExceptionsFilter } from './errors/all-exceptions.filter';
export type { ErrorResponseBody } from './errors/all-exceptions.filter';
export { CLOCK, SystemClock } from './clock/clock';
export type { Clock } from './clock/clock';
export { PaginationQueryDto } from './pagination/pagination.dto';
export { Page } from './pagination/page';
export { PrismaService } from './prisma/prisma.service';
export { PrismaModule } from './prisma/prisma.module';
export { SharedModule } from './shared.module';