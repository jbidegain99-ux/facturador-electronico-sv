import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogoItemDto {
  @ApiProperty({ description: 'Codigo del item' })
  @IsString()
  codigo: string;

  @ApiProperty({ description: 'Valor/nombre del item' })
  @IsString()
  valor: string;

  @ApiPropertyOptional({ description: 'Descripcion del item' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Codigo del padre (para municipios)' })
  @IsOptional()
  @IsString()
  parentCodigo?: string;

  @ApiPropertyOptional({ description: 'Orden de visualizacion' })
  @IsOptional()
  @IsInt()
  orden?: number;

  @ApiPropertyOptional({ description: 'Metadatos adicionales en JSON' })
  @IsOptional()
  @IsString()
  metadata?: string;
}

export class SyncCatalogoDto {
  @ApiProperty({ type: [CatalogoItemDto], description: 'Lista de items a sincronizar' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogoItemDto)
  items: CatalogoItemDto[];

  @ApiPropertyOptional({ description: 'Version del catalogo' })
  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateCatalogoDto {
  @ApiProperty({ description: 'Codigo del catalogo (ej: CAT-002)' })
  @IsString()
  codigo: string;

  @ApiProperty({ description: 'Nombre del catalogo' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripcion del catalogo' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateCatalogoDto {
  @ApiPropertyOptional({ description: 'Nombre del catalogo' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripcion del catalogo' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Version del catalogo' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Estado activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
