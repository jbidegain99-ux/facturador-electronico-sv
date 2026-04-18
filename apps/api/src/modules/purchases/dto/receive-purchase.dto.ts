import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class RecibirLineaDto {
  @ApiProperty()
  @IsString()
  lineaId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  cantidadRecibida!: number;

  @ApiProperty()
  @IsString()
  sucursalId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ReceivePurchaseDto {
  @ApiProperty()
  @IsDateString()
  fechaRecepcion!: string;

  @ApiProperty({ type: [RecibirLineaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecibirLineaDto)
  lineas!: RecibirLineaDto[];
}
