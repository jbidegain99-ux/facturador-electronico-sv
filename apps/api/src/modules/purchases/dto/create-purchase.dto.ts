import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { PurchaseLineDto } from './purchase-line.dto';

export enum TipoDocProveedor { FC = 'FC', CCF = 'CCF', NCF = 'NCF', NDF = 'NDF', OTRO = 'OTRO' }
export enum FormaPago { CONTADO = 'contado', CREDITO = 'credito' }
export enum EstadoInicialCreacion { DRAFT = 'DRAFT', POSTED = 'POSTED' }

export class CreatePurchaseDto {
  @ApiProperty()
  @IsString()
  proveedorId!: string;

  @ApiProperty({ enum: TipoDocProveedor })
  @IsEnum(TipoDocProveedor)
  tipoDoc!: TipoDocProveedor;

  @ApiProperty()
  @IsString()
  numDocumentoProveedor!: string;

  @ApiProperty()
  @IsDateString()
  fechaDoc!: string;

  @ApiProperty()
  @IsDateString()
  fechaContable!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiProperty({ type: [PurchaseLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  lineas!: PurchaseLineDto[];

  @ApiProperty({ enum: EstadoInicialCreacion, default: EstadoInicialCreacion.DRAFT })
  @IsEnum(EstadoInicialCreacion)
  estadoInicial!: EstadoInicialCreacion;

  @ApiPropertyOptional({ description: 'Override auto-detección de IVA retenido' })
  @IsOptional()
  @IsBoolean()
  ivaRetenidoOverride?: boolean;

  @ApiPropertyOptional({ description: 'Override ISR retenido %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  isrRetenidoPct?: number;

  @ApiPropertyOptional({ enum: FormaPago })
  @IsOptional()
  @IsEnum(FormaPago)
  formaPago?: FormaPago;

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

  @ApiPropertyOptional({ description: 'Si true, recepción se hará después' })
  @IsOptional()
  @IsBoolean()
  recibirDespues?: boolean;
}
