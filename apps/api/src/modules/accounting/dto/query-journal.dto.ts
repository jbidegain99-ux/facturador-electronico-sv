import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto';

export class QueryJournalDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'POSTED', 'VOIDED'])
  status?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MANUAL', 'AUTOMATIC', 'ADJUSTMENT', 'CLOSING'])
  entryType?: string;
}
