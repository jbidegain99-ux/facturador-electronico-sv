import {
  IsString,
  IsEmail,
  IsOptional,
  Matches,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyInfoDto {
  @ApiProperty({ description: 'NIT del contribuyente', example: '0614-123456-123-0' })
  @IsString()
  @Matches(/^\d{4}-\d{6}-\d{3}-\d$/, { message: 'NIT debe tener formato 0000-000000-000-0' })
  nit: string;

  @ApiPropertyOptional({ description: 'NRC del contribuyente', example: '123456-7' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,7}-\d$/, { message: 'NRC debe tener formato 0000000-0' })
  nrc?: string;

  @ApiProperty({ description: 'Razón social' })
  @IsString()
  @Length(1, 250)
  razonSocial: string;

  @ApiPropertyOptional({ description: 'Nombre comercial' })
  @IsOptional()
  @IsString()
  @Length(1, 250)
  nombreComercial?: string;

  @ApiProperty({ description: 'Código de actividad económica' })
  @IsString()
  actividadEconomica: string;

  @ApiProperty({ description: 'Email registrado en Hacienda' })
  @IsEmail()
  emailHacienda: string;

  @ApiPropertyOptional({ description: 'Teléfono registrado en Hacienda' })
  @IsOptional()
  @IsString()
  telefonoHacienda?: string;
}
