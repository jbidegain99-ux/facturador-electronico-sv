import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AnularPurchaseDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  motivo!: string;
}
