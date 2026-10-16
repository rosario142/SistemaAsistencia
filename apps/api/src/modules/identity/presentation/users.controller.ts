import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Page } from '../../../shared';
import { AssignRoleUseCase } from '../application/assign-role.use-case';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { USER_REPOSITORY, type UserRepository } from '../domain/ports/user.repository';
import { Roles } from './decorators/roles.decorator';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { toUserResponse, type UserResponse } from './responses/user.response';

@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly assignRoleUseCase: AssignRoleUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado de usuarios (ADMIN)' })
  async list(@Query() query: ListUsersQueryDto): Promise<Page<UserResponse>> {
    const page = await this.users.list({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      active: query.active,
    });
    return Page.from(
      page.items.map(toUserResponse),
      page.total,
      page.page,
      page.pageSize,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Crea un usuario con sus roles (ADMIN)' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    const user = await this.createUserUseCase.execute({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: dto.password,
      roleNames: dto.roleNames,
    });
    return toUserResponse(user);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Reemplaza los roles de un usuario (ADMIN)' })
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRoleDto): Promise<UserResponse> {
    const user = await this.assignRoleUseCase.execute(id, dto.roleNames);
    return toUserResponse(user);
  }
}
