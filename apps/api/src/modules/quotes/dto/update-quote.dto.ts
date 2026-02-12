import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteLineItemDto } from './create-quote.dto';

export class UpdateQuoteDto {
  @IsOptional()
  @IsString()
  clienteId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemDto)
  items?: QuoteLineItemDto[];

  @IsOptional()
  @IsString()
  terms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEmail()
  clienteEmail?: string;
}
