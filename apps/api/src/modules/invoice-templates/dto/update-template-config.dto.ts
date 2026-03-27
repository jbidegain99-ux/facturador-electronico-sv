import { IsObject, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type {
  TemplateColors,
  TemplateFonts,
  LogoSettings,
  SectionConfig,
  PageSettings,
} from '../interfaces/template-config.interface';

export class UpdateTemplateConfigDto {
  @ApiPropertyOptional({ description: 'Colores del tema' })
  @IsOptional()
  @IsObject()
  colors?: Partial<TemplateColors>;

  @ApiPropertyOptional({ description: 'Fuentes tipográficas' })
  @IsOptional()
  @IsObject()
  fonts?: Partial<TemplateFonts>;

  @ApiPropertyOptional({ description: 'Configuración del logo' })
  @IsOptional()
  @IsObject()
  logo?: Partial<LogoSettings>;

  @ApiPropertyOptional({ description: 'Visibilidad y orden de secciones' })
  @IsOptional()
  @IsObject()
  sections?: Record<string, Partial<SectionConfig>>;

  @ApiPropertyOptional({ description: 'Configuración de página' })
  @IsOptional()
  @IsObject()
  pageSettings?: Partial<PageSettings>;
}
