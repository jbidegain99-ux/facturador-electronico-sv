import { IsEnum, IsString, MinLength } from 'class-validator';

export enum DteFormat {
  JSON = 'json',
  XML = 'xml',
}

export class PreviewDteDto {
  @IsString()
  @MinLength(1, { message: 'content must not be empty' })
  content: string;

  @IsEnum(DteFormat)
  format: DteFormat;
}
