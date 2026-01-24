import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssistanceLevel } from '../types/onboarding.types';

export class StartOnboardingDto {
  @ApiProperty({
    enum: ['SELF_SERVICE', 'GUIDED', 'FULL_SERVICE'],
    description: 'Nivel de asistencia deseado',
  })
  @IsEnum(AssistanceLevel)
  assistanceLevel: AssistanceLevel;

  @ApiPropertyOptional({ description: 'Notas o comentarios iniciales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
