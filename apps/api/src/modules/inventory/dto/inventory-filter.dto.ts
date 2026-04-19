import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class InventoryFilterDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsIn(['OK', 'BELOW_REORDER', 'OUT_OF_STOCK'])
  status?: 'OK' | 'BELOW_REORDER' | 'OUT_OF_STOCK';

  @IsOptional() @IsIn(['code', 'description', 'currentQty', 'totalValue', 'lastMovementAt'])
  sortBy?: string;

  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
