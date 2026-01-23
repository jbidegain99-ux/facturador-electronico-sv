import { PartialType } from '@nestjs/swagger';
import { CreateEmailConfigDto } from './create-email-config.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmailConfigDto extends PartialType(CreateEmailConfigDto) {
  @ApiPropertyOptional({ description: 'Activate or deactivate email sending' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
