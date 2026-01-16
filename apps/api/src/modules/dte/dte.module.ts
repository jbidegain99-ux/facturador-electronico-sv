import { Module } from '@nestjs/common';
import { DteBuilderService } from './services/dte-builder.service';
import { DteValidatorService } from './services/dte-validator.service';

@Module({
  providers: [DteBuilderService, DteValidatorService],
  exports: [DteBuilderService, DteValidatorService],
})
export class DteModule {}
