import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SimulateInvoiceDto {
  @IsNumber()
  @Min(0)
  totalGravada: number;

  @IsNumber()
  @Min(0)
  totalIva: number;

  @IsNumber()
  @Min(0)
  totalPagar: number;

  @IsOptional()
  @IsString()
  tipoDte?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
