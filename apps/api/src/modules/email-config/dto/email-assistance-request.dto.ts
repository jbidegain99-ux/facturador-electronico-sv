import { IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailProvider, EmailRequestType, RequestStatus } from '../types/email.types';

export class CreateEmailAssistanceRequestDto {
  @ApiProperty({
    enum: EmailRequestType,
    example: 'NEW_SETUP',
    description: 'Type of assistance needed',
  })
  @IsEnum(EmailRequestType)
  requestType: EmailRequestType;

  @ApiPropertyOptional({
    enum: EmailProvider,
    example: 'SENDGRID',
    description: 'Preferred email provider',
  })
  @IsOptional()
  @IsEnum(EmailProvider)
  desiredProvider?: EmailProvider;

  @ApiPropertyOptional({
    example: 'Gmail',
    description: 'Current email provider if any',
  })
  @IsOptional()
  @IsString()
  currentProvider?: string;

  @ApiPropertyOptional({
    example: 'admin@company.com',
    description: 'Account email for current provider',
  })
  @IsOptional()
  @IsEmail()
  accountEmail?: string;

  @ApiPropertyOptional({
    example: 'Necesitamos poder enviar facturas a nuestros clientes por correo.',
    description: 'Additional notes or requirements',
  })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class UpdateEmailAssistanceRequestDto {
  @ApiPropertyOptional({
    enum: RequestStatus,
    example: 'IN_PROGRESS',
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({
    example: 'user-id-123',
    description: 'ID of the assigned agent',
  })
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

export class AddMessageDto {
  @ApiProperty({
    example: 'Hemos recibido su solicitud y la estamos procesando.',
    description: 'Message content',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: ['https://example.com/attachment.pdf'],
    description: 'Array of attachment URLs',
  })
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}
