import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export enum PurchaseLineTipo {
  BIEN = 'bien',
  SERVICIO = 'servicio',
}

export class PurchaseLineDto {
  @ApiProperty({ enum: PurchaseLineTipo })
  @IsEnum(PurchaseLineTipo)
  tipo!: PurchaseLineTipo;

  @ApiProperty()
  @IsString()
  descripcion!: string;

  @ApiPropertyOptional({ description: 'Required si tipo=bien' })
  @ValidateIf((o: PurchaseLineDto) => o.tipo === PurchaseLineTipo.BIEN)
  @IsString()
  itemId?: string;

  @ApiPropertyOptional({ description: 'Required si tipo=servicio' })
  @ValidateIf((o: PurchaseLineDto) => o.tipo === PurchaseLineTipo.SERVICIO)
  @IsString()
  cuentaContableId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: PurchaseLineDto) => o.tipo === PurchaseLineTipo.BIEN)
  @IsNumber()
  @Min(0)
  cantidad?: number;

  @ApiPropertyOptional()
  @ValidateIf((o: PurchaseLineDto) => o.tipo === PurchaseLineTipo.BIEN)
  @IsNumber()
  @Min(0)
  precioUnit?: number;

  @ApiPropertyOptional({ description: 'Para tipo=servicio es el monto total' })
  @ValidateIf((o: PurchaseLineDto) => o.tipo === PurchaseLineTipo.SERVICIO)
  @IsNumber()
  @Min(0)
  monto?: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  descuentoPct!: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  ivaAplica!: boolean;
}
