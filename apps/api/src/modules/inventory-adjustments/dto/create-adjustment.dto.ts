import { IsDateString, IsIn, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export const ADJUSTMENT_SUBTYPES = [
  'ROBO',
  'MERMA',
  'DONACION',
  'AUTOCONSUMO',
  'AJUSTE_FALTANTE',
  'AJUSTE_SOBRANTE',
] as const;

export type AdjustmentSubtype = (typeof ADJUSTMENT_SUBTYPES)[number];

export class CreateAdjustmentDto {
  @IsString()
  catalogItemId!: string;

  @IsIn(ADJUSTMENT_SUBTYPES)
  subtype!: AdjustmentSubtype;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  quantity!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Type(() => Number)
  unitCost?: number;

  @IsDateString()
  movementDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
