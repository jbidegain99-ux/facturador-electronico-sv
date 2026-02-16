import { IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryQuoteDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn([
    'DRAFT',
    'SENT',
    'PENDING_APPROVAL',
    'APPROVED',
    'PARTIALLY_APPROVED',
    'REJECTED',
    'EXPIRED',
    'CONVERTED',
    'CANCELLED',
    'CHANGES_REQUESTED',
    'REVISED',
  ])
  status?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
