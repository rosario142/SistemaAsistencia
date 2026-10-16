import { ApiProperty } from '@nestjs/swagger';
import type { RoleName } from '@prisma/client';
import type { UserEntity } from '../../domain/entities/user.entity';

/** Respuesta segura de usuario: nunca incluye `passwordHash`. */
export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'docente@sicae.edu' })
  email: string;

  @ApiProperty({ example: 'Ana' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  lastName: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ enum: RoleName, isArray: true, example: ['DOCENTE'] })
  roles: RoleName[];

  @ApiProperty()
  createdAt: Date;
}

export function toUserResponse(user: UserEntity): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    active: user.active,
    roles: user.roles.map((role) => role.name),
    createdAt: user.createdAt,
  };
}
