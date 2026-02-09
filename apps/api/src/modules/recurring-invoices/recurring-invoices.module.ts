import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { DteModule } from '../dte/dte.module';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoiceProcessor } from './processors/recurring-invoice.processor';
import { RecurringInvoiceScheduler } from './schedulers/recurring-invoice.scheduler';

// Only register queue-dependent providers when Redis is available
const queueProviders = process.env.REDIS_URL
  ? [RecurringInvoiceProcessor, RecurringInvoiceScheduler]
  : [];

const queueImports = process.env.REDIS_URL
  ? [BullModule.registerQueue({ name: 'recurring-invoices' })]
  : [];

@Module({
  imports: [PrismaModule, DteModule, ...queueImports],
  controllers: [RecurringInvoicesController],
  providers: [RecurringInvoicesService, ...queueProviders],
  exports: [RecurringInvoicesService],
})
export class RecurringInvoicesModule {}
