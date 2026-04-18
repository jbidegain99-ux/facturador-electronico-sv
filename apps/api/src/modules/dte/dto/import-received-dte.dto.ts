import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { DteFormat } from './preview-dte.dto';

export class ImportReceivedDteDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  content!: string;

  @ApiProperty({ enum: DteFormat })
  @IsEnum(DteFormat)
  format!: DteFormat;
}
