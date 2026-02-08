import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportClienteItem {
  @ApiProperty({ description: 'Tipo de documento (36=NIT, 13=DUI, etc.)' })
  @IsString()
  @IsNotEmpty()
  tipoDocumento: string;

  @ApiProperty({ description: 'Numero de documento' })
  @IsString()
  @IsNotEmpty()
  numDocumento: string;

  @ApiProperty({ description: 'Nombre o razon social' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'NRC del cliente' })
  @IsString()
  @IsOptional()
  nrc?: string;

  @ApiPropertyOptional({ description: 'Correo electronico' })
  @IsString()
  @IsOptional()
  correo?: string;

  @ApiPropertyOptional({ description: 'Telefono' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({ description: 'Direccion' })
  @IsString()
  @IsNotEmpty()
  direccion: string;
}

export class ImportClientesDto {
  @ApiProperty({ type: [ImportClienteItem], description: 'Lista de clientes a importar' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportClienteItem)
  clientes: ImportClienteItem[];

  @ApiPropertyOptional({ description: 'Nombre del archivo de origen' })
  @IsString()
  @IsOptional()
  fileName?: string;
}
