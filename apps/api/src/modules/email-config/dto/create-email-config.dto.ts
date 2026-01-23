import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailProvider, EmailAuthMethod } from '@prisma/client';

export class CreateEmailConfigDto {
  @ApiProperty({
    enum: EmailProvider,
    example: 'SENDGRID',
    description: 'Email provider to use',
  })
  @IsEnum(EmailProvider)
  provider: EmailProvider;

  @ApiProperty({
    enum: EmailAuthMethod,
    example: 'API_KEY',
    description: 'Authentication method',
  })
  @IsEnum(EmailAuthMethod)
  authMethod: EmailAuthMethod;

  // SMTP Configuration
  @ApiPropertyOptional({ example: 'smtp.sendgrid.net' })
  @ValidateIf((o) => o.authMethod === 'SMTP_BASIC')
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @ValidateIf((o) => o.authMethod === 'SMTP_BASIC')
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiPropertyOptional({ example: 'apikey' })
  @ValidateIf((o) => o.authMethod === 'SMTP_BASIC')
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional({ example: 'SG.xxxxx' })
  @ValidateIf((o) => o.authMethod === 'SMTP_BASIC')
  @IsString()
  smtpPassword?: string;

  // API Configuration
  @ApiPropertyOptional({ example: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' })
  @ValidateIf((o) => o.authMethod === 'API_KEY')
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ example: 'https://api.sendgrid.com/v3' })
  @IsOptional()
  @IsString()
  apiEndpoint?: string;

  // OAuth2 Configuration (for M365 and Google)
  @ApiPropertyOptional({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  @ValidateIf((o) => o.authMethod === 'OAUTH2')
  @IsString()
  oauth2ClientId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.authMethod === 'OAUTH2')
  @IsString()
  oauth2ClientSecret?: string;

  @ApiPropertyOptional({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  oauth2TenantId?: string; // For Azure AD

  // Sender Configuration
  @ApiProperty({ example: 'facturas@miempresa.com' })
  @IsEmail()
  fromEmail: string;

  @ApiProperty({ example: 'Mi Empresa S.A. de C.V.' })
  @IsString()
  fromName: string;

  @ApiPropertyOptional({ example: 'soporte@miempresa.com' })
  @IsOptional()
  @IsEmail()
  replyToEmail?: string;

  // Advanced Configuration
  @ApiPropertyOptional({ example: 100, description: 'Max emails per hour' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  rateLimitPerHour?: number;

  @ApiPropertyOptional({ example: 3, description: 'Number of retry attempts' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  retryAttempts?: number;

  @ApiPropertyOptional({ example: 30, description: 'Timeout in seconds' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  timeoutSeconds?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
