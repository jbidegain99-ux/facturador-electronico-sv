import { IsEnum, IsArray, ArrayNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DteType } from '../types/onboarding.types';

export class DteTypeSelectionItemDto {
  @ApiProperty({
    enum: DteType,
    description: 'Tipo de DTE',
  })
  @IsEnum(DteType)
  dteType: DteType;

  @ApiPropertyOptional({ description: 'Si es requerido por el negocio' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class SetDteTypesDto {
  @ApiProperty({
    type: [DteTypeSelectionItemDto],
    description: 'Lista de tipos de DTE seleccionados',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos un tipo de DTE' })
  dteTypes: DteTypeSelectionItemDto[];
}

// Response DTO for DTE types with their status
export class DteTypeStatusDto {
  dteType: DteType;
  name: string;
  description: string;
  isRequired: boolean;
  isSelected: boolean;
  testCompleted: boolean;
  testCompletedAt?: Date;
  testsRequired: number;
  testsCompleted: number;
}
