import { PartialType } from '@nestjs/swagger';
import { CreateTemplateDto } from './create-template.dto';
import { IsOptional, IsIn } from 'class-validator';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
  @IsOptional()
  @IsIn(['ACTIVE', 'PAUSED', 'CANCELLED'])
  status?: string;
}
