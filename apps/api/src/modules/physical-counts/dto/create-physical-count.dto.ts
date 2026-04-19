import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePhysicalCountDto {
  @IsDateString()
  countDate!: string;

  @Type(() => Number) @IsInt() @Min(2000) @Max(2100)
  fiscalYear!: number;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}
