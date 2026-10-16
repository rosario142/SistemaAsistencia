import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RoleName } from '@prisma/client';
import type { RoleEntity } from '../../domain/entities/role.entity';

export class PermissionResponse {
  @ApiProperty({ example: 'sessions.close' })
  code: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;
}

export class RoleResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: RoleName })
  name: RoleName;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ type: [PermissionResponse] })
  permissions: PermissionResponse[];
}

export function toRoleResponse(role: RoleEntity): RoleResponse {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map((permission) => ({
      code: permission.code,
      description: permission.description,
    })),
  };
}
