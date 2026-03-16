import { IsString, IsEmail, IsOptional, IsObject, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Mi Empresa S.A. de C.V.' })
  @IsString()
  @MaxLength(250, { message: 'El nombre no puede exceder 250 caracteres' })
  nombre: string;

  @ApiProperty({ example: '0614-123456-789-0' })
  @IsString()
  @MaxLength(17, { message: 'El NIT no puede exceder 17 caracteres' })
  @Matches(/^\d{4}-\d{6}-\d{3}-\d$/, { message: 'NIT debe tener formato 0000-000000-000-0' })
  nit: string;

  @ApiProperty({ example: '123456-7' })
  @IsString()
  @MaxLength(9, { message: 'El NRC no puede exceder 9 caracteres' })
  @Matches(/^\d{1,7}-\d$/, { message: 'NRC debe tener formato 0000000-0' })
  nrc: string;

  @ApiProperty({ example: '46510' })
  @IsString()
  @MaxLength(10, { message: 'La actividad económica no puede exceder 10 caracteres' })
  actividadEcon: string;

  @ApiProperty({
    example: {
      departamento: '06',
      municipio: '14',
      complemento: 'Colonia Escalon, Calle Principal #123',
    },
  })
  @IsObject()
  direccion: {
    departamento: string;
    municipio: string;
    complemento: string;
  };

  @ApiProperty({ example: '2200-1234' })
  @IsString()
  @MaxLength(9, { message: 'El teléfono no puede exceder 9 caracteres' })
  @Matches(/^\d{4}-\d{4}$/, { message: 'Teléfono debe tener formato 0000-0000' })
  telefono: string;

  @ApiProperty({ example: 'empresa@ejemplo.com' })
  @IsEmail()
  @MaxLength(100, { message: 'El correo no puede exceder 100 caracteres' })
  correo: string;

  @ApiProperty({ example: 'Mi Tienda', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'El nombre comercial no puede exceder 250 caracteres' })
  nombreComercial?: string;
}
