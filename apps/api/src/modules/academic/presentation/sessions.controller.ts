import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Page } from '../../../shared';
import { CloseSessionUseCase } from '../application/close-session.use-case';
import { CreateSessionUseCase } from '../application/create-session.use-case';
import { ListSessionsUseCase } from '../application/list-sessions.use-case';
import { StartSessionUseCase } from '../application/start-session.use-case';
import { CurrentUser } from '../../identity/presentation/decorators/current-user.decorator';
import { Roles } from '../../identity/presentation/decorators/roles.decorator';
import type { AuthUser } from '../../identity/presentation/types/auth-user.type';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionsQueryDto } from './dto/sessions.query.dto';
import { toSessionResponse, type SessionResponse } from './responses/session.response';

@ApiTags('academic')
@ApiBearerAuth()
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly listSessionsUseCase: ListSessionsUseCase,
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly startSessionUseCase: StartSessionUseCase,
    private readonly closeSessionUseCase: CloseSessionUseCase,
  ) {}

  @Get()
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO', 'DOCENTE')
  @ApiOperation({ summary: 'Listado paginado de sesiones (DOCENTE: sólo las suyas)' })
  async list(
    @Query() query: SessionsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Page<SessionResponse>> {
    const page = await this.listSessionsUseCase.execute(
      {
        page: query.page,
        pageSize: query.pageSize,
        sectionId: query.sectionId,
        date: query.date,
        status: query.status,
      },
      user,
    );
    return Page.from(page.items.map(toSessionResponse), page.total, page.page, page.pageSize);
  }

  @Post()
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO')
  @ApiOperation({ summary: 'Programa una sesión de clase (ADMIN / COORDINADOR_ACADEMICO)' })
  async create(@Body() dto: CreateSessionDto): Promise<SessionResponse> {
    const session = await this.createSessionUseCase.execute(dto);
    return toSessionResponse(session);
  }

  @Post(':id/start')
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia una sesión programada (ADMIN / COORDINADOR_ACADEMICO)' })
  async start(@Param('id') id: string): Promise<SessionResponse> {
    const session = await this.startSessionUseCase.execute(id);
    return toSessionResponse(session);
  }

  @Post(':id/close')
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cierra una sesión y faltantes de asistencia (ADMIN / COORDINADOR_ACADEMICO)' })
  async close(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<SessionResponse> {
    const session = await this.closeSessionUseCase.execute(id, user.id);
    return toSessionResponse(session);
  }
}
