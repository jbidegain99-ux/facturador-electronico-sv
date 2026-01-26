import { IsString, IsOptional, IsInt, IsBoolean, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ description: 'Codigo unico del plan (ej: BASIC, PRO)' })
  @IsString()
  @MaxLength(50)
  codigo: string;

  @ApiProperty({ description: 'Nombre del plan' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripcion del plan' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiProperty({ description: 'DTEs por mes (-1 para ilimitado)', default: 100 })
  @IsInt()
  @Min(-1)
  maxDtesPerMonth: number;

  @ApiProperty({ description: 'Usuarios maximos (-1 para ilimitado)', default: 1 })
  @IsInt()
  @Min(-1)
  maxUsers: number;

  @ApiProperty({ description: 'Clientes maximos (-1 para ilimitado)', default: 100 })
  @IsInt()
  @Min(-1)
  maxClientes: number;

  @ApiProperty({ description: 'Almacenamiento en MB (-1 para ilimitado)', default: 500 })
  @IsInt()
  @Min(-1)
  maxStorageMb: number;

  @ApiPropertyOptional({ description: 'Features habilitados (JSON array)' })
  @IsOptional()
  @IsString()
  features?: string;

  @ApiPropertyOptional({ description: 'Precio mensual' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioMensual?: number;

  @ApiPropertyOptional({ description: 'Precio anual' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioAnual?: number;

  @ApiPropertyOptional({ description: 'Orden de visualizacion' })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @ApiPropertyOptional({ description: 'Es el plan por defecto', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Nombre del plan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripcion del plan' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ description: 'DTEs por mes (-1 para ilimitado)' })
  @IsOptional()
  @IsInt()
  @Min(-1)
  maxDtesPerMonth?: number;

  @ApiPropertyOptional({ description: 'Usuarios maximos (-1 para ilimitado)' })
  @IsOptional()
  @IsInt()
  @Min(-1)
  maxUsers?: number;

  @ApiPropertyOptional({ description: 'Clientes maximos (-1 para ilimitado)' })
  @IsOptional()
  @IsInt()
  @Min(-1)
  maxClientes?: number;

  @ApiPropertyOptional({ description: 'Almacenamiento en MB (-1 para ilimitado)' })
  @IsOptional()
  @IsInt()
  @Min(-1)
  maxStorageMb?: number;

  @ApiPropertyOptional({ description: 'Features habilitados (JSON array)' })
  @IsOptional()
  @IsString()
  features?: string;

  @ApiPropertyOptional({ description: 'Precio mensual' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioMensual?: number;

  @ApiPropertyOptional({ description: 'Precio anual' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  precioAnual?: number;

  @ApiPropertyOptional({ description: 'Orden de visualizacion' })
  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;

  @ApiPropertyOptional({ description: 'Plan activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Es el plan por defecto' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class AssignPlanDto {
  @ApiProperty({ description: 'ID del plan a asignar' })
  @IsString()
  planId: string;
}
