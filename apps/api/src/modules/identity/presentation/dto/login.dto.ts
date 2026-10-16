import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'docente@sicae.edu' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '**********' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
