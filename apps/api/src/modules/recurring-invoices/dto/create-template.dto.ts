import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  IsDateString,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateItemDto {
  @IsString()
  descripcion: string;

  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsNumber()
  @Min(0)
  descuento: number = 0;
}

export class CreateTemplateDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  clienteId: string;

  @IsOptional()
  @IsIn(['01', '03'])
  tipoDte?: string = '01';

  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  interval: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  anchorDay?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsIn(['AUTO_DRAFT', 'AUTO_SEND'])
  mode?: string = 'AUTO_DRAFT';

  @IsOptional()
  @IsBoolean()
  autoTransmit?: boolean = false;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items: TemplateItemDto[];

  @IsOptional()
  @IsString()
  notas?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
