import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestEmailConfigDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'Email address to send test email to',
  })
  @IsEmail()
  recipientEmail: string;

  @ApiPropertyOptional({
    example: 'Prueba de configuración de email',
    description: 'Custom subject for test email',
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    example: 'Este es un correo de prueba para verificar la configuración.',
    description: 'Custom message for test email',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class TestConnectionResultDto {
  success: boolean;
  responseTimeMs: number;
  errorMessage?: string;
  errorCode?: string;
}

export class SendTestEmailResultDto {
  success: boolean;
  messageId?: string;
  errorMessage?: string;
}
