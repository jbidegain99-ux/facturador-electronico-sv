import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RecurringInvoicesService } from '../recurring-invoices.service';

@Injectable()
export class RecurringInvoiceScheduler {
  private readonly logger = new Logger(RecurringInvoiceScheduler.name);

  constructor(
    private recurringService: RecurringInvoicesService,
    @InjectQueue('recurring-invoices') private recurringQueue: Queue,
  ) {}

  /**
   * Runs daily at 01:00 AM UTC.
   * Finds all ACTIVE templates with nextRunDate <= now and enqueues them.
   */
  @Cron('0 1 * * *')
  async handleDueTemplates(): Promise<void> {
    // Only run if Redis is configured
    if (!process.env.REDIS_URL) {
      this.logger.debug('Redis not configured, skipping recurring invoice scheduler');
      return;
    }

    this.logger.log('Checking for due recurring invoice templates...');

    try {
      const dueTemplates = await this.recurringService.getDueTemplates();
      this.logger.log(`Found ${dueTemplates.length} due templates`);

      for (const template of dueTemplates) {
        await this.recurringQueue.add(
          'process-recurring',
          { templateId: template.id },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 60000, // 60s base delay
            },
            removeOnComplete: 100, // Keep last 100 completed jobs
            removeOnFail: 200, // Keep last 200 failed jobs
          },
        );
        this.logger.log(`Enqueued template ${template.id} (${template.nombre})`);
      }
    } catch (error) {
      this.logger.error('Error in recurring invoice scheduler', error);
    }
  }
}
