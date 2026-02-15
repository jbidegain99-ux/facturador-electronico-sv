import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recibido por correo' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'nuevaPassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
