import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PASSWORD_HASHER } from './domain/ports/password-hasher';
import { MAILER } from './domain/ports/mailer';
import { TOKEN_SERVICE } from './domain/ports/token.service';
import { USER_REPOSITORY } from './domain/ports/user.repository';
import { AssignRoleUseCase } from './application/assign-role.use-case';
import { AuthService } from './application/auth.service';
import { CreateUserUseCase } from './application/create-user.use-case';
import { ForgotPasswordUseCase } from './application/forgot-password.use-case';
import { LoginUseCase } from './application/login.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { ConsoleMailerService } from './infrastructure/console-mailer.service';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { AuthController } from './presentation/auth.controller';
import { RolesController } from './presentation/roles.controller';
import { UsersController } from './presentation/users.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';

/**
 * Módulo de identidad y acceso (IAM).
 * Exporta `JwtAuthGuard`, `RolesGuard` y `AuthService` como contrato para el resto de módulos.
 */
@Module({
  imports: [
    // JwtService global: lo consumen el guard global (AppModule) y JwtTokenService.
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwtSecret') ?? 'dev-secret-cambiar',
        signOptions: { expiresIn: config.get<string>('app.jwtExpiresIn') ?? '8h' },
      }),
    }),
  ],
  controllers: [AuthController, UsersController, RolesController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: MAILER, useClass: ConsoleMailerService },
    LoginUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    AssignRoleUseCase,
    CreateUserUseCase,
    AuthService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, AuthService],
})
export class IdentityModule {}
