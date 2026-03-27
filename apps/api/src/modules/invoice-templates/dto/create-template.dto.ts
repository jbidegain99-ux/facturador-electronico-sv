import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ description: 'ID de la plantilla del sistema a clonar' })
  @IsString()
  sourceTemplateId: string;

  @ApiPropertyOptional({ description: 'Nombre personalizado', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Tipo de DTE específico (ej: "01", "03")',
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  dteType?: string;
}
