import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Mi Empresa S.A. de C.V.' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: '06141234567890' })
  @IsString()
  nit: string;

  @ApiProperty({ example: '1234567' })
  @IsString()
  nrc: string;

  @ApiProperty({ example: '46510' })
  @IsString()
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

  @ApiProperty({ example: '22001234' })
  @IsString()
  telefono: string;

  @ApiProperty({ example: 'empresa@ejemplo.com' })
  @IsEmail()
  correo: string;

  @ApiProperty({ example: 'Mi Tienda', required: false })
  @IsOptional()
  @IsString()
  nombreComercial?: string;
}
