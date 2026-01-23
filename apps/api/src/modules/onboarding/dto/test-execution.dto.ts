import { IsEnum, IsOptional, IsObject, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DteType, TestResult } from '@prisma/client';

export class ExecuteTestDto {
  @ApiProperty({
    enum: DteType,
    description: 'Tipo de DTE a probar',
  })
  @IsEnum(DteType)
  dteType: DteType;

  @ApiPropertyOptional({ description: 'Datos de prueba del DTE' })
  @IsOptional()
  @IsObject()
  testData?: Record<string, unknown>;
}

export class ExecuteEventTestDto {
  @ApiProperty({
    description: 'Tipo de evento a probar',
    enum: ['ANULACION', 'CONTINGENCIA', 'INVALIDACION'],
  })
  @IsString()
  eventType: 'ANULACION' | 'CONTINGENCIA' | 'INVALIDACION';

  @ApiProperty({ description: 'ID del DTE relacionado (si aplica)' })
  @IsOptional()
  @IsString()
  relatedDteId?: string;

  @ApiPropertyOptional({ description: 'Datos adicionales del evento' })
  @IsOptional()
  @IsObject()
  eventData?: Record<string, unknown>;
}

// Response DTOs
export class TestResultDto {
  success: boolean;
  dteType?: DteType;
  eventType?: string;
  message: string;
  responseCode?: string;
  selloRecibido?: string;
  codigoGeneracion?: string;
  errors?: string[];
  timestamp: Date;
}

export class TestProgressSummaryDto {
  totalTestsRequired: number;
  totalTestsCompleted: number;
  percentComplete: number;
  dteProgress: {
    dteType: DteType;
    name: string;
    required: number;
    completed: number;
    isComplete: boolean;
  }[];
  eventProgress: {
    eventType: string;
    name: string;
    required: number;
    completed: number;
    isComplete: boolean;
  }[];
  canRequestAuthorization: boolean;
  lastTestAt?: Date;
  lastTestResult?: TestResult;
}
