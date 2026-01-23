import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CommunicationType,
  CommunicationDirection,
  OnboardingStep,
} from '@prisma/client';

export class AddCommunicationDto {
  @ApiProperty({
    enum: CommunicationType,
    description: 'Tipo de comunicación',
  })
  @IsEnum(CommunicationType)
  type: CommunicationType;

  @ApiPropertyOptional({ description: 'Asunto del mensaje' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ description: 'Contenido del mensaje' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'URLs de archivos adjuntos' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    enum: OnboardingStep,
    description: 'Paso relacionado',
  })
  @IsOptional()
  @IsEnum(OnboardingStep)
  relatedStep?: OnboardingStep;
}

// Response DTOs
export class CommunicationDto {
  id: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string;
  content: string;
  attachments?: string[];
  relatedStep?: OnboardingStep;
  sentBy?: string;
  sentAt: Date;
  readAt?: Date;
}

export class CommunicationListDto {
  communications: CommunicationDto[];
  total: number;
  unreadCount: number;
}
