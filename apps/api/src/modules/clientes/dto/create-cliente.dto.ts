import { IsString, IsEmail, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DireccionClienteDto {
  @ApiProperty({ example: '06' })
  @IsString()
  departamento: string;

  @ApiProperty({ example: '14' })
  @IsString()
  municipio: string;

  @ApiProperty({ example: 'Colonia Centro, Calle Principal #456' })
  @IsString()
  complemento: string;
}

export class CreateClienteDto {
  @ApiProperty({ example: '36', description: 'Tipo de documento: 36=NIT, 13=DUI, etc.' })
  @IsString()
  tipoDocumento: string;

  @ApiProperty({ example: '06141234567890' })
  @IsString()
  numDocumento: string;

  @ApiProperty({ example: 'Cliente Ejemplo S.A. de C.V.' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: '1234567', required: false })
  @IsOptional()
  @IsString()
  nrc?: string;

  @ApiProperty({ example: 'cliente@ejemplo.com', required: false })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiProperty({ example: '22001234', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ required: true })
  @IsObject()
  @ValidateNested()
  @Type(() => DireccionClienteDto)
  direccion: DireccionClienteDto;

  @ApiProperty({ example: '46510', required: false, description: 'Codigo de actividad economica' })
  @IsOptional()
  @IsString()
  actividadEcon?: string;

  @ApiProperty({ example: 'Venta al por menor', required: false })
  @IsOptional()
  @IsString()
  descActividad?: string;
}
