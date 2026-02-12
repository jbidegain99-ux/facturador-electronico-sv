import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DteModule } from '../dte/dte.module';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoiceCronService } from './recurring-invoice-cron.service';

@Module({
  imports: [PrismaModule, DteModule],
  controllers: [RecurringInvoicesController],
  providers: [RecurringInvoicesService, RecurringInvoiceCronService],
  exports: [RecurringInvoicesService],
})
export class RecurringInvoicesModule {}
