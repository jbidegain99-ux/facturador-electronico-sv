import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { DteService } from '../../dte/dte.service';
import { RecurringInvoicesService } from '../recurring-invoices.service';
interface RecurringInvoiceJobData {
    templateId: string;
}
export declare class RecurringInvoiceProcessor extends WorkerHost {
    private prisma;
    private dteService;
    private recurringService;
    private readonly logger;
    constructor(prisma: PrismaService, dteService: DteService, recurringService: RecurringInvoicesService);
    process(job: Job<RecurringInvoiceJobData>): Promise<void>;
    private buildDteData;
}
export {};
//# sourceMappingURL=recurring-invoice.processor.d.ts.map