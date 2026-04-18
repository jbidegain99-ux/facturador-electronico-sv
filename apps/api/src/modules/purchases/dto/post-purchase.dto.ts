import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { FormaPago } from './create-purchase.dto';

export class PostPurchaseDto {
  @ApiProperty({ enum: FormaPago })
  @IsEnum(FormaPago)
  formaPago!: FormaPago;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cuentaPagoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaPago?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}
