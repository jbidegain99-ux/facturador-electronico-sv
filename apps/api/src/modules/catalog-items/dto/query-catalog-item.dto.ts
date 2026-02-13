import { IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto';

export class QueryCatalogItemDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['PRODUCT', 'SERVICE'])
  type?: string;

  @IsOptional()
  @Type(() => String)
  isActive?: string; // "true" or "false" from query string

  @IsOptional()
  @Type(() => String)
  isFavorite?: string; // "true" or "false" from query string

  @IsOptional()
  @IsString()
  categoryId?: string;
}
