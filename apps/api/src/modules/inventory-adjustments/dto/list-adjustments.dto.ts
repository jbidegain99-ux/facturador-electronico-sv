import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ADJUSTMENT_SUBTYPES, AdjustmentSubtype } from './create-adjustment.dto';

export class ListAdjustmentsDto {
  @IsOptional() @IsString()
  catalogItemId?: string;

  @IsOptional() @IsIn(ADJUSTMENT_SUBTYPES)
  subtype?: AdjustmentSubtype;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
