import {
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OnboardingStep, StepStatus, PerformedBy } from '../types/onboarding.types';

export class UpdateStepDto {
  @ApiProperty({
    enum: OnboardingStep,
    description: 'Paso del proceso',
  })
  @IsEnum(OnboardingStep)
  step: OnboardingStep;

  @ApiPropertyOptional({
    enum: StepStatus,
    description: 'Estado del paso',
  })
  @IsOptional()
  @IsEnum(StepStatus)
  status?: StepStatus;

  @ApiPropertyOptional({ description: 'Datos específicos del paso (JSON)' })
  @IsOptional()
  @IsObject()
  stepData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Notas u observaciones' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Razón del bloqueo (si aplica)' })
  @IsOptional()
  @IsString()
  blockerReason?: string;
}

export class CompleteStepDto {
  @ApiProperty({
    enum: OnboardingStep,
    description: 'Paso a completar',
  })
  @IsEnum(OnboardingStep)
  step: OnboardingStep;

  @ApiPropertyOptional({ description: 'Datos del paso completado' })
  @IsOptional()
  @IsObject()
  stepData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GoToStepDto {
  @ApiProperty({
    enum: OnboardingStep,
    description: 'Paso al que navegar',
  })
  @IsEnum(OnboardingStep)
  step: OnboardingStep;
}

// Response DTO
export class StepDetailDto {
  step: OnboardingStep;
  name: string;
  description: string;
  status: StepStatus;
  order: number;
  isCurrentStep: boolean;
  canNavigateTo: boolean;
  stepData?: Record<string, unknown>;
  notes?: string;
  blockerReason?: string;
  performedBy?: PerformedBy;
  startedAt?: Date;
  completedAt?: Date;
}

export class OnboardingProgressDto {
  currentStep: OnboardingStep;
  overallStatus: string;
  completedSteps: number;
  totalSteps: number;
  percentComplete: number;
  steps: StepDetailDto[];
  canProceed: boolean;
  nextAction?: string;
}
