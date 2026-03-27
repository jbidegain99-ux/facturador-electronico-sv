import { Module } from '@nestjs/common';
import { InvoiceTemplatesController } from './invoice-templates.controller';
import { InvoiceTemplatesService } from './invoice-templates.service';
import { TemplateRenderService } from './template-render.service';

@Module({
  controllers: [InvoiceTemplatesController],
  providers: [InvoiceTemplatesService, TemplateRenderService],
  exports: [InvoiceTemplatesService, TemplateRenderService],
})
export class InvoiceTemplatesModule {}
