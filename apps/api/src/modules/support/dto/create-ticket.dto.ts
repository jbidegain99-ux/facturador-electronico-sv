import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TicketType {
  EMAIL_CONFIG = 'EMAIL_CONFIG',
  TECHNICAL = 'TECHNICAL',
  BILLING = 'BILLING',
  GENERAL = 'GENERAL',
  ONBOARDING = 'ONBOARDING',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateTicketDto {
  @ApiProperty({ enum: TicketType, description: 'Tipo de ticket' })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiProperty({ description: 'Asunto del ticket', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  subject: string;

  @ApiPropertyOptional({ description: 'Descripcion detallada del problema' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Metadatos adicionales en formato JSON' })
  @IsOptional()
  @IsString()
  metadata?: string;

  @ApiPropertyOptional({ enum: TicketPriority, description: 'Prioridad del ticket' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
