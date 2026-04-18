import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PayPurchaseDto {
  @ApiProperty()
  @IsDateString()
  fechaPago!: string;

  @ApiProperty()
  @IsString()
  cuentaSalidaId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  monto!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referencia?: string;
}
