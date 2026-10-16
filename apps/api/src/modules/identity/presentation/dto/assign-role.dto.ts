import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ enum: RoleName, isArray: true, example: ['ADMIN'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RoleName)
  roleNames: RoleName[];
}
