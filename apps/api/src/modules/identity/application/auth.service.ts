import { Injectable } from '@nestjs/common';
import type { RoleName } from '@prisma/client';
import type { UserEntity } from '../domain/entities/user.entity';
import { AssignRoleUseCase } from './assign-role.use-case';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { type LoginResult, LoginUseCase } from './login.use-case';
import { ResetPasswordUseCase } from './reset-password.use-case';

/**
 * Fachada del dominio identity: contrato estable exportado por `IdentityModule`
 * para que otros módulos consuman autenticación/roles sin conocer los casos de uso.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly assignRoleUseCase: AssignRoleUseCase,
  ) {}

  login(email: string, password: string): Promise<LoginResult> {
    return this.loginUseCase.execute(email, password);
  }

  requestPasswordReset(email: string): Promise<{ ok: true }> {
    return this.forgotPasswordUseCase.execute(email);
  }

  resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    return this.resetPasswordUseCase.execute(token, newPassword);
  }

  assignRoles(userId: string, roleNames: RoleName[]): Promise<UserEntity> {
    return this.assignRoleUseCase.execute(userId, roleNames);
  }
}
