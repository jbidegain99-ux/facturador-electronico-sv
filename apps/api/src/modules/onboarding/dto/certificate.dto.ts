import { IsString, IsOptional, IsDateString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadTestCertificateDto {
  @ApiProperty({ description: 'Certificado de pruebas en base64' })
  @IsString()
  certificate: string;

  @ApiProperty({ description: 'Contraseña del certificado' })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración del certificado' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class UploadProdCertificateDto {
  @ApiProperty({ description: 'Certificado productivo en base64' })
  @IsString()
  certificate: string;

  @ApiProperty({ description: 'Contraseña del certificado' })
  @IsString()
  @MinLength(4)
  password: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración del certificado' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
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
