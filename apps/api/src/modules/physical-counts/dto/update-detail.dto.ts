import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDetailDto {
  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Type(() => Number)
  countedQty?: number | null;

  @IsOptional() @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) @Type(() => Number)
  unitCost?: number;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}
