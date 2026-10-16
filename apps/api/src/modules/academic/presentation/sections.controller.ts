import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Page } from '../../../shared';
import { AddScheduleUseCase } from '../application/add-schedule.use-case';
import { CreateSectionUseCase } from '../application/create-section.use-case';
import { ListSectionSchedulesUseCase } from '../application/list-section-schedules.use-case';
import { ListSectionsUseCase } from '../application/list-sections.use-case';
import { Roles } from '../../identity/presentation/decorators/roles.decorator';
import { CreateSectionDto } from './dto/create-section.dto';
import { ListSectionsQueryDto } from './dto/list-sections.query.dto';
import { ScheduleDto } from './dto/schedule.dto';
import { toScheduleResponse, type ScheduleResponse } from './responses/schedule.response';
import { toSectionResponse, type SectionResponse } from './responses/section.response';

@ApiTags('academic')
@ApiBearerAuth()
@Controller('sections')
export class SectionsController {
  constructor(
    private readonly createSectionUseCase: CreateSectionUseCase,
    private readonly listSectionsUseCase: ListSectionsUseCase,
    private readonly addScheduleUseCase: AddScheduleUseCase,
    private readonly listSectionSchedulesUseCase: ListSectionSchedulesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado de secciones' })
  async list(@Query() query: ListSectionsQueryDto): Promise<Page<SectionResponse>> {
    const page = await this.listSectionsUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      courseId: query.courseId,
      termId: query.termId,
    });
    return Page.from(page.items.map(toSectionResponse), page.total, page.page, page.pageSize);
  }

  @Post()
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO')
  @ApiOperation({ summary: 'Crea una sección (ADMIN / COORDINADOR_ACADEMICO)' })
  async create(@Body() dto: CreateSectionDto): Promise<SectionResponse> {
    const section = await this.createSectionUseCase.execute({
      courseId: dto.courseId,
      termId: dto.termId,
      name: dto.name,
      teacherId: dto.teacherId,
      capacity: dto.capacity,
    });
    return toSectionResponse(section);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Horarios de una sección' })
  async listSchedules(@Param('id') id: string): Promise<ScheduleResponse[]> {
    const schedules = await this.listSectionSchedulesUseCase.execute(id);
    return schedules.map(toScheduleResponse);
  }

  @Post(':id/schedules')
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO')
  @ApiOperation({ summary: 'Agrega un horario a la sección (ADMIN / COORDINADOR_ACADEMICO)' })
  async addSchedule(@Param('id') id: string, @Body() dto: ScheduleDto): Promise<ScheduleResponse> {
    const schedule = await this.addScheduleUseCase.execute(id, dto);
    return toScheduleResponse(schedule);
  }
}
