import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Contenido del comentario' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Es un comentario interno (solo visible para admins)', default: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
