import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  code: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsInt()
  @Min(1)
  @Max(4)
  level: number;

  @IsIn(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'])
  accountType: string;

  @IsIn(['DEBIT', 'CREDIT'])
  normalBalance: string;

  @IsOptional()
  @IsBoolean()
  allowsPosting?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
