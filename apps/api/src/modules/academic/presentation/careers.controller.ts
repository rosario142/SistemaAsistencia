import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Career } from '@prisma/client';
import { Page } from '../../../shared';
import { CreateCareerUseCase } from '../application/create-career.use-case';
import { ListCareersUseCase } from '../application/list-careers.use-case';
import { Roles } from '../../identity/presentation/decorators/roles.decorator';
import { CreateCareerDto } from './dto/create-career.dto';
import { ListCareersQueryDto } from './dto/list-careers.query.dto';
import { toCareerResponse, type CareerResponse } from './responses/career.response';

@ApiTags('academic')
@ApiBearerAuth()
@Controller('careers')
export class CareersController {
  constructor(
    private readonly createCareerUseCase: CreateCareerUseCase,
    private readonly listCareersUseCase: ListCareersUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado de carreras' })
  async list(@Query() query: ListCareersQueryDto): Promise<Page<CareerResponse>> {
    const page = await this.listCareersUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      active: query.active,
    });
    return this.toPage(page);
  }

  @Post()
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO')
  @ApiOperation({ summary: 'Crea una carrera (ADMIN / COORDINADOR_ACADEMICO)' })
  async create(@Body() dto: CreateCareerDto): Promise<CareerResponse> {
    const career: Career = await this.createCareerUseCase.execute(dto);
    return toCareerResponse(career);
  }

  private toPage(page: Page<Career>): Page<CareerResponse> {
    return Page.from(page.items.map(toCareerResponse), page.total, page.page, page.pageSize);
  }
}
