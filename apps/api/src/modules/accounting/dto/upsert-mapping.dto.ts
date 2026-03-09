import { IsString, IsOptional, IsArray, ValidateNested, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class MappingLineDto {
  @IsString()
  @MinLength(1)
  cuenta: string;

  @IsString()
  @MinLength(1)
  monto: string; // 'total' | 'subtotal' | 'iva'

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class MappingConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MappingLineDto)
  debe: MappingLineDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MappingLineDto)
  haber: MappingLineDto[];
}

export class UpsertMappingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  operation: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsString()
  debitAccountId: string;

  @IsString()
  creditAccountId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MappingConfigDto)
  mappingConfig?: MappingConfigDto;
}
