import { Module, Logger } from '@nestjs/common';
import type { DynamicModule, Provider, Type, ForwardReference } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DteModule } from '../dte/dte.module';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesService } from './recurring-invoices.service';

type NestImport =
  | Type<unknown>
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference;

const logger = new Logger('RecurringInvoicesModule');
const dynamicImports: NestImport[] = [PrismaModule, DteModule];
const dynamicProviders: Provider[] = [RecurringInvoicesService];

if (process.env.REDIS_URL) {
  try {
    // Dynamic require so the processor/scheduler decorators (@Processor, @InjectQueue)
    // are never evaluated when Redis is not configured
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bull = require('@nestjs/bullmq') as { BullModule: { registerQueue: (opts: { name: string }) => DynamicModule } };
    dynamicImports.push(
      bull.BullModule.registerQueue({ name: 'recurring-invoices' }),
    );

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const processorMod = require('./processors/recurring-invoice.processor') as { RecurringInvoiceProcessor: Type<unknown> };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const schedulerMod = require('./schedulers/recurring-invoice.scheduler') as { RecurringInvoiceScheduler: Type<unknown> };

    dynamicProviders.push(processorMod.RecurringInvoiceProcessor);
    dynamicProviders.push(schedulerMod.RecurringInvoiceScheduler);

    logger.log('Redis available - recurring invoice auto-generation ENABLED');
  } catch (e) {
    logger.warn(
      'Failed to load BullMQ modules - recurring invoice auto-generation DISABLED',
    );
  }
} else {
  logger.warn(
    'REDIS_URL not set - recurring invoice auto-generation DISABLED',
  );
}

@Module({
  imports: dynamicImports,
  controllers: [RecurringInvoicesController],
  providers: dynamicProviders,
  exports: [RecurringInvoicesService],
})
export class RecurringInvoicesModule {}
