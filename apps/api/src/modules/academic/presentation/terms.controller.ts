import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Page } from '../../../shared';
import { CreateTermUseCase } from '../application/create-term.use-case';
import { ListTermsUseCase } from '../application/list-terms.use-case';
import { Roles } from '../../identity/presentation/decorators/roles.decorator';
import { CreateTermDto } from './dto/create-term.dto';
import { ListTermsQueryDto } from './dto/list-terms.query.dto';
import { toTermResponse, type TermResponse } from './responses/term.response';

@ApiTags('academic')
@ApiBearerAuth()
@Controller('terms')
export class TermsController {
  constructor(
    private readonly createTermUseCase: CreateTermUseCase,
    private readonly listTermsUseCase: ListTermsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado de periodos académicos' })
  async list(@Query() query: ListTermsQueryDto): Promise<Page<TermResponse>> {
    const page = await this.listTermsUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      careerId: query.careerId,
    });
    return Page.from(page.items.map(toTermResponse), page.total, page.page, page.pageSize);
  }

  @Post()
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO')
  @ApiOperation({ summary: 'Crea un periodo académico (ADMIN / COORDINADOR_ACADEMICO)' })
  async create(@Body() dto: CreateTermDto): Promise<TermResponse> {
    const term = await this.createTermUseCase.execute(dto);
    return toTermResponse(term);
  }
}
