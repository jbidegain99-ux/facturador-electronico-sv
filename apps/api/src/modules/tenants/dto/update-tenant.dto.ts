import { IsString, IsEmail, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DireccionDto {
  @ApiProperty({ example: '06' })
  @IsString()
  departamento: string;

  @ApiProperty({ example: '14' })
  @IsString()
  municipio: string;

  @ApiProperty({ example: 'Colonia Escalon, Calle Principal #123' })
  @IsString()
  complemento: string;
}

export class UpdateTenantDto {
  @ApiProperty({ example: 'Mi Empresa S.A. de C.V.', required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ example: '1234567', required: false })
  @IsOptional()
  @IsString()
  nrc?: string;

  @ApiProperty({ example: '46510', required: false })
  @IsOptional()
  @IsString()
  actividadEcon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DireccionDto)
  direccion?: DireccionDto;

  @ApiProperty({ example: '22001234', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ example: 'empresa@ejemplo.com', required: false })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiProperty({ example: 'Mi Tienda', required: false })
  @IsOptional()
  @IsString()
  nombreComercial?: string;
}
