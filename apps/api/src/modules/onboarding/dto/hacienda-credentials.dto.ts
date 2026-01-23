import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetHaciendaCredentialsDto {
  @ApiProperty({ description: 'Usuario de Servicios en Línea MH (generalmente NIT sin guiones)' })
  @IsString()
  @MinLength(14, { message: 'Usuario debe tener al menos 14 caracteres' })
  haciendaUser: string;

  @ApiProperty({ description: 'Contraseña de Servicios en Línea MH' })
  @IsString()
  @MinLength(6, { message: 'Contraseña debe tener al menos 6 caracteres' })
  haciendaPassword: string;
}

export class VerifyHaciendaAccessDto {
  @ApiProperty({ description: 'Usuario de Servicios en Línea MH' })
  @IsString()
  haciendaUser: string;

  @ApiProperty({ description: 'Contraseña de Servicios en Línea MH' })
  @IsString()
  haciendaPassword: string;
}
