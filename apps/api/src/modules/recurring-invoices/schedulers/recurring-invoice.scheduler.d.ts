import { Queue } from 'bullmq';
import { RecurringInvoicesService } from '../recurring-invoices.service';
export declare class RecurringInvoiceScheduler {
    private recurringService;
    private recurringQueue;
    private readonly logger;
    constructor(recurringService: RecurringInvoicesService, recurringQueue: Queue);
    /**
     * Runs daily at 01:00 AM UTC.
     * Finds all ACTIVE templates with nextRunDate <= now and enqueues them.
     */
    handleDueTemplates(): Promise<void>;
}
//# sourceMappingURL=recurring-invoice.scheduler.d.ts.map