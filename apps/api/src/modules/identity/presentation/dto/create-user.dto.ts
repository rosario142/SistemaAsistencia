import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'docente@sicae.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ minLength: 8, example: 'Secreto123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: RoleName, isArray: true, example: ['DOCENTE'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RoleName)
  roleNames: RoleName[];
}
