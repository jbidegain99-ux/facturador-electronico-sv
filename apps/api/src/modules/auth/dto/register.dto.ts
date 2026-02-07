import { IsEmail, IsString, MinLength, MaxLength, IsOptional, ValidateNested, IsNotEmpty, Matches } from 'class-validator';
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
  @MaxLength(500, { message: 'La direccion no puede exceder 500 caracteres' })
  complemento: string;
}

export class TenantRegistroDto {
  @ApiProperty({ example: 'Mi Empresa S.A. de C.V.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  nombre: string;

  @ApiProperty({ example: '0614-123456-123-4' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(17, { message: 'El NIT no puede exceder 17 caracteres' })
  @Matches(/^\d{4}-\d{6}-\d{3}-\d$/, { message: 'El NIT debe tener el formato 0000-000000-000-0' })
  nit: string;

  @ApiProperty({ example: '123456-7' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(9, { message: 'El NRC no puede exceder 9 caracteres' })
  @Matches(/^\d{1,6}-\d$/, { message: 'El NRC debe tener el formato 000000-0' })
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
  @MaxLength(20, { message: 'El telefono no puede exceder 20 caracteres' })
  @Matches(/^\d{4}-\d{4}$/, { message: 'El telefono debe tener el formato 0000-0000' })
  telefono: string;

  @ApiProperty({ example: 'empresa@ejemplo.com' })
  @IsEmail({}, { message: 'El correo de la empresa debe ser un email valido' })
  @MaxLength(100, { message: 'El correo no puede exceder 100 caracteres' })
  correo: string;

  @ApiPropertyOptional({ example: 'Mi Empresa' })
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'El nombre comercial no puede exceder 200 caracteres' })
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
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  @IsEmail({}, { message: 'El correo del administrador debe ser un email valido' })
  @MaxLength(100, { message: 'El correo no puede exceder 100 caracteres' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contrasena no puede exceder 128 caracteres' })
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
