import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Page } from '../../../shared';
import { CreateCourseUseCase } from '../application/create-course.use-case';
import { ListCoursesUseCase } from '../application/list-courses.use-case';
import { Roles } from '../../identity/presentation/decorators/roles.decorator';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses.query.dto';
import { toCourseResponse, type CourseResponse } from './responses/course.response';

@ApiTags('academic')
@ApiBearerAuth()
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly listCoursesUseCase: ListCoursesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado de cursos' })
  async list(@Query() query: ListCoursesQueryDto): Promise<Page<CourseResponse>> {
    const page = await this.listCoursesUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      careerId: query.careerId,
      semester: query.semester,
    });
    return Page.from(page.items.map(toCourseResponse), page.total, page.page, page.pageSize);
  }

  @Post()
  @Roles('ADMIN', 'COORDINADOR_ACADEMICO')
  @ApiOperation({ summary: 'Crea un curso (ADMIN / COORDINADOR_ACADEMICO)' })
  async create(@Body() dto: CreateCourseDto): Promise<CourseResponse> {
    const course = await this.createCourseUseCase.execute(dto);
    return toCourseResponse(course);
  }
}
