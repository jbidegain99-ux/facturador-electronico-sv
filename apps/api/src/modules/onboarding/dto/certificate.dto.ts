import { IsString, IsOptional, IsDateString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CertificateUploadMode {
  COMBINED = 'combined',
  SEPARATE = 'separate',
}

export class UploadTestCertificateDto {
  @ApiProperty({ description: 'Certificado de pruebas en base64 (público para modo separado, combinado para .p12/.pfx)' })
  @IsString()
  certificate: string;

  @ApiPropertyOptional({ description: 'Contraseña del certificado (.p12/.pfx) o llave privada encriptada' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración del certificado' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Llave privada en base64 (solo para modo separado)' })
  @IsOptional()
  @IsString()
  privateKey?: string;

  @ApiPropertyOptional({ description: 'Modo de carga: combined (.p12/.pfx) o separate (.crt + .key)', enum: CertificateUploadMode })
  @IsOptional()
  @IsEnum(CertificateUploadMode)
  uploadMode?: CertificateUploadMode;
}

export class UploadProdCertificateDto {
  @ApiProperty({ description: 'Certificado productivo en base64 (público para modo separado, combinado para .p12/.pfx)' })
  @IsString()
  certificate: string;

  @ApiPropertyOptional({ description: 'Contraseña del certificado (.p12/.pfx) o llave privada encriptada' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración del certificado' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Llave privada en base64 (solo para modo separado)' })
  @IsOptional()
  @IsString()
  privateKey?: string;

  @ApiPropertyOptional({ description: 'Modo de carga: combined (.p12/.pfx) o separate (.crt + .key)', enum: CertificateUploadMode })
  @IsOptional()
  @IsEnum(CertificateUploadMode)
  uploadMode?: CertificateUploadMode;
}

export class SetApiCredentialsDto {
  @ApiProperty({ description: 'Contraseña API proporcionada por Hacienda' })
  @IsString()
  @MinLength(8, { message: 'La contraseña API debe tener al menos 8 caracteres' })
  apiPassword: string;

  @ApiPropertyOptional({ description: 'URL del ambiente (se configura automáticamente si no se provee)' })
  @IsOptional()
  @IsString()
  environmentUrl?: string;
}
