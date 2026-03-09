import { IsOptional, IsBoolean, IsIn, IsString } from 'class-validator';

export class UpdateAccountingConfigDto {
  @IsOptional()
  @IsBoolean()
  autoJournalEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['ON_APPROVED', 'ON_CREATED'])
  autoJournalTrigger?: 'ON_APPROVED' | 'ON_CREATED';
}
