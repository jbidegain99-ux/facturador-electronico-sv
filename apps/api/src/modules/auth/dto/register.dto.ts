import { IsEmail, IsString, MinLength, IsOptional, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DireccionDto {
  @ApiProperty({ example: '06', description: 'Codigo de departamento' })
  @IsString()
  @IsNotEmpty()
  departamento: string;

  @ApiProperty({ example: '14', description: 'Codigo de municipio' })
  @IsString()
  @IsNotEmpty()
  municipio: string;

  @ApiProperty({ example: 'Calle Principal #123, Colonia Centro' })
  @IsString()
  @IsNotEmpty()
  complemento: string;
}

export class TenantRegistroDto {
  @ApiProperty({ example: 'Mi Empresa S.A. de C.V.' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: '0614-123456-123-4' })
  @IsString()
  @IsNotEmpty()
  nit: string;

  @ApiProperty({ example: '123456-7' })
  @IsString()
  @IsNotEmpty()
  nrc: string;

  @ApiProperty({ example: '62011', description: 'Codigo de actividad economica' })
  @IsString()
  @IsNotEmpty()
  actividadEcon: string;

  @ApiPropertyOptional({ example: 'Actividades de programacion informatica' })
  @IsString()
  @IsOptional()
  descActividad?: string;

  @ApiProperty({ example: '2222-3333' })
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @ApiProperty({ example: 'empresa@ejemplo.com' })
  @IsEmail()
  correo: string;

  @ApiPropertyOptional({ example: 'Mi Empresa' })
  @IsString()
  @IsOptional()
  nombreComercial?: string;

  @ApiProperty({ type: DireccionDto })
  @ValidateNested()
  @Type(() => DireccionDto)
  direccion: DireccionDto;
}

export class UserRegistroDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ type: TenantRegistroDto })
  @ValidateNested()
  @Type(() => TenantRegistroDto)
  tenant: TenantRegistroDto;

  @ApiProperty({ type: UserRegistroDto })
  @ValidateNested()
  @Type(() => UserRegistroDto)
  user: UserRegistroDto;
}
