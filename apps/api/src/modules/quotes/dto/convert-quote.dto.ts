import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertQuoteDto {
  @ApiPropertyOptional({
    description: 'MH DTE type code (01, 03, 11, 14, etc.). Defaults to 01 if not provided.',
    example: '01',
  })
  @IsString()
  @IsOptional()
  dteType?: string;
}
