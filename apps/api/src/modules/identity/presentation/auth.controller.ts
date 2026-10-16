import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotFoundError } from '../../../shared';
import { ForgotPasswordUseCase } from '../application/forgot-password.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { USER_REPOSITORY, type UserRepository } from '../domain/ports/user.repository';
import type { AuthUser } from './types/auth-user.type';
import { toUserResponse, type UserResponse } from './responses/user.response';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticación con email/contraseña; devuelve un JWT' })
  async login(@Body() dto: LoginDto): Promise<{ accessToken: string; user: UserResponse }> {
    const result = await this.loginUseCase.execute(dto.email, dto.password);
    return { accessToken: result.accessToken, user: toUserResponse(result.user) };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicita un enlace de recuperación de contraseña' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ ok: true }> {
    return this.forgotPasswordUseCase.execute(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablece la contraseña usando el token recibido por correo' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ ok: true }> {
    return this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del usuario autenticado' })
  async me(@CurrentUser() authUser: AuthUser): Promise<UserResponse> {
    const user = await this.users.findByIdWithRoles(authUser.id);
    if (!user) throw new NotFoundError('Usuario', authUser.id);
    return toUserResponse(user);
  }
}
