import { IsString, IsEmail, IsOptional, IsObject, ValidateNested, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DireccionDto {
  @ApiProperty({ example: '06' })
  @IsString()
  @MaxLength(2, { message: 'El código de departamento no puede exceder 2 caracteres' })
  departamento: string;

  @ApiProperty({ example: '14' })
  @IsString()
  @MaxLength(2, { message: 'El código de municipio no puede exceder 2 caracteres' })
  municipio: string;

  @ApiProperty({ example: 'Colonia Escalon, Calle Principal #123' })
  @IsString()
  @MaxLength(500, { message: 'El complemento de dirección no puede exceder 500 caracteres' })
  complemento: string;
}

export class UpdateTenantDto {
  @ApiProperty({ example: 'Mi Empresa S.A. de C.V.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'El nombre no puede exceder 250 caracteres' })
  nombre?: string;

  @ApiProperty({ example: '123456-7', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(9, { message: 'El NRC no puede exceder 9 caracteres' })
  @Matches(/^\d{1,7}-\d$/, { message: 'NRC debe tener formato 0000000-0' })
  nrc?: string;

  @ApiProperty({ example: '46510', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'La actividad económica no puede exceder 10 caracteres' })
  actividadEcon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DireccionDto)
  direccion?: DireccionDto;

  @ApiProperty({ example: '2200-1234', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(9, { message: 'El teléfono no puede exceder 9 caracteres' })
  @Matches(/^\d{4}-\d{4}$/, { message: 'Teléfono debe tener formato 0000-0000' })
  telefono?: string;

  @ApiProperty({ example: 'empresa@ejemplo.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(100, { message: 'El correo no puede exceder 100 caracteres' })
  correo?: string;

  @ApiProperty({ example: 'Mi Tienda', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'El nombre comercial no puede exceder 250 caracteres' })
  nombreComercial?: string;
}
