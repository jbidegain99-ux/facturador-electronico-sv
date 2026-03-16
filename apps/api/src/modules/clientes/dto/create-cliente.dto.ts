import { IsString, IsEmail, IsOptional, IsObject, ValidateNested, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DireccionClienteDto {
  @ApiProperty({ example: '06' })
  @IsString()
  @MaxLength(2, { message: 'El código de departamento no puede exceder 2 caracteres' })
  departamento: string;

  @ApiProperty({ example: '14' })
  @IsString()
  @MaxLength(2, { message: 'El código de municipio no puede exceder 2 caracteres' })
  municipio: string;

  @ApiProperty({ example: 'Colonia Centro, Calle Principal #456' })
  @IsString()
  @MaxLength(500, { message: 'El complemento de dirección no puede exceder 500 caracteres' })
  complemento: string;
}

export class CreateClienteDto {
  @ApiProperty({ example: '36', description: 'Tipo de documento: 36=NIT, 13=DUI, etc.' })
  @IsString()
  @MaxLength(3, { message: 'El tipo de documento no puede exceder 3 caracteres' })
  tipoDocumento: string;

  @ApiProperty({ example: '0614-123456-789-0' })
  @IsString()
  @MaxLength(20, { message: 'El número de documento no puede exceder 20 caracteres' })
  numDocumento: string;

  @ApiProperty({ example: 'Cliente Ejemplo S.A. de C.V.' })
  @IsString()
  @MaxLength(250, { message: 'El nombre no puede exceder 250 caracteres' })
  nombre: string;

  @ApiProperty({ example: '123456-7', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(9, { message: 'El NRC no puede exceder 9 caracteres' })
  @Matches(/^\d{1,7}-\d$/, { message: 'NRC debe tener formato 0000000-0' })
  nrc?: string;

  @ApiProperty({ example: 'cliente@ejemplo.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(100, { message: 'El correo no puede exceder 100 caracteres' })
  correo?: string;

  @ApiProperty({ example: '2200-1234', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(9, { message: 'El teléfono no puede exceder 9 caracteres' })
  @Matches(/^\d{4}-\d{4}$/, { message: 'Teléfono debe tener formato 0000-0000' })
  telefono?: string;

  @ApiProperty({ required: true })
  @IsObject()
  @ValidateNested()
  @Type(() => DireccionClienteDto)
  direccion: DireccionClienteDto;

  @ApiProperty({ example: '46510', required: false, description: 'Codigo de actividad economica' })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'La actividad económica no puede exceder 10 caracteres' })
  actividadEcon?: string;

  @ApiProperty({ example: 'Venta al por menor', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'La descripción de actividad no puede exceder 250 caracteres' })
  descActividad?: string;
}
