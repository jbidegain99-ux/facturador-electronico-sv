import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

/**
 * DTO for quick setup of Hacienda credentials
 * Used by companies that already have their certificates and API credentials
 */
export class QuickSetupDto {
  @ApiProperty({
    enum: ['TEST', 'PRODUCTION'],
    description: 'Environment to configure',
    example: 'TEST',
  })
  @IsEnum(['TEST', 'PRODUCTION'], {
    message: 'El ambiente debe ser TEST o PRODUCTION',
  })
  environment: 'TEST' | 'PRODUCTION';

  @ApiProperty({
    description: 'API user for Hacienda authentication (usually NIT without dashes)',
    example: '06140101001000',
  })
  @IsString()
  @IsNotEmpty({ message: 'El usuario de API es requerido' })
  apiUser: string;

  @ApiProperty({
    description: 'API password for Hacienda authentication',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña de API es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, { message: 'La contraseña no puede exceder 50 caracteres' })
  apiPassword: string;

  @ApiProperty({
    description: 'Certificate password for the .p12/.pfx file',
    example: 'CertPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña del certificado es requerida' })
  certificatePassword: string;
}

/**
 * DTO for validating Hacienda API connection without saving
 */
export class ValidateConnectionDto {
  @ApiProperty({
    enum: ['TEST', 'PRODUCTION'],
    description: 'Environment to validate against',
    example: 'TEST',
  })
  @IsEnum(['TEST', 'PRODUCTION'], {
    message: 'El ambiente debe ser TEST o PRODUCTION',
  })
  environment: 'TEST' | 'PRODUCTION';

  @ApiProperty({
    description: 'API user for Hacienda authentication (usually NIT without dashes)',
    example: '06140101001000',
  })
  @IsString()
  @IsNotEmpty({ message: 'El usuario de API es requerido' })
  apiUser: string;

  @ApiProperty({
    description: 'API password for Hacienda authentication',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña de API es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, { message: 'La contraseña no puede exceder 50 caracteres' })
  apiPassword: string;
}

/**
 * Response for quick setup endpoint
 */
export class QuickSetupResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  data?: {
    environment: 'TEST' | 'PRODUCTION';
    certificate: {
      valid: boolean;
      nit: string | null;
      expiresAt: Date;
      subject: string;
      daysUntilExpiry: number;
    };
    authentication: {
      valid: boolean;
      tokenExpiresAt: Date;
    };
  };

  @ApiPropertyOptional()
  errors?: {
    field: string;
    message: string;
  }[];
}

/**
 * Response for validate connection endpoint
 */
export class ValidateConnectionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  tokenExpiry?: Date;

  @ApiPropertyOptional()
  error?: string;
}
