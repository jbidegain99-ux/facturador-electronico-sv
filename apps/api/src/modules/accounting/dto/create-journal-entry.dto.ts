import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  IsIn,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalEntryLineDto {
  @IsString()
  accountId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debit: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  credit: number;
}

export class CreateJournalEntryDto {
  @IsDateString()
  entryDate: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsIn(['MANUAL', 'ADJUSTMENT', 'CLOSING'])
  entryType?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  sourceDocumentId?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
