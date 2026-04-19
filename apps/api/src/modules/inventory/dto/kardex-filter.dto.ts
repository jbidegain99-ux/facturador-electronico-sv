import { IsDateString, IsOptional, IsString } from 'class-validator';

export class KardexFilterDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional() @IsString()
  movementType?: string;
}
