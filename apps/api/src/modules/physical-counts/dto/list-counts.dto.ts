import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const PHYSICAL_COUNT_STATUSES = ['DRAFT', 'FINALIZED', 'CANCELLED'] as const;
export type PhysicalCountStatus = (typeof PHYSICAL_COUNT_STATUSES)[number];

export class ListCountsDto {
  @IsOptional() @IsIn(PHYSICAL_COUNT_STATUSES)
  status?: PhysicalCountStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2100)
  fiscalYear?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
