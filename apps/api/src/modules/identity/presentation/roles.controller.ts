import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USER_REPOSITORY, type UserRepository } from '../domain/ports/user.repository';
import { Roles } from './decorators/roles.decorator';
import { toRoleResponse, type RoleResponse } from './responses/role.response';

@ApiTags('roles')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('roles')
export class RolesController {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  @Get()
  @ApiOperation({ summary: 'Lista los roles del sistema con sus permisos (ADMIN)' })
  async list(): Promise<RoleResponse[]> {
    const roles = await this.users.listRoles();
    return roles.map(toRoleResponse);
  }
}
