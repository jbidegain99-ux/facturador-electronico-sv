import { PrismaService } from '../../prisma/prisma.service';
import { CreateTemplateDto } from './dto';
import { UpdateTemplateDto } from './dto';
import { PaginationQueryDto } from '../../common/dto';
import { PaginatedResponse } from '../../common/dto/paginated-response';
import { RecurringInvoiceTemplate, RecurringInvoiceHistory } from '@prisma/client';
export interface TemplateWithRelations extends RecurringInvoiceTemplate {
    cliente: {
        id: string;
        nombre: string;
        numDocumento: string;
    };
    history?: RecurringInvoiceHistory[];
    _count?: {
        history: number;
    };
}
export declare class RecurringInvoicesService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(tenantId: string, dto: CreateTemplateDto): Promise<RecurringInvoiceTemplate>;
    findAll(tenantId: string, query: PaginationQueryDto & {
        status?: string;
    }): Promise<PaginatedResponse<TemplateWithRelations>>;
    findOne(tenantId: string, id: string): Promise<TemplateWithRelations>;
    update(tenantId: string, id: string, dto: UpdateTemplateDto): Promise<RecurringInvoiceTemplate>;
    pause(tenantId: string, id: string): Promise<RecurringInvoiceTemplate>;
    resume(tenantId: string, id: string): Promise<RecurringInvoiceTemplate>;
    cancel(tenantId: string, id: string): Promise<RecurringInvoiceTemplate>;
    getHistory(tenantId: string, templateId: string, query: PaginationQueryDto): Promise<PaginatedResponse<RecurringInvoiceHistory>>;
    /**
     * Get templates that are due to run (used by scheduler)
     */
    getDueTemplates(): Promise<RecurringInvoiceTemplate[]>;
    /**
     * Record a successful execution
     */
    recordSuccess(templateId: string, dteId: string): Promise<void>;
    /**
     * Record a failed execution
     */
    recordFailure(templateId: string, error: string): Promise<void>;
    /**
     * Calculate the next run date based on interval settings.
     * Always returns a future date.
     */
    calculateNextRunDate(config: {
        interval: string;
        anchorDay?: number | null;
        dayOfWeek?: number | null;
        startDate: Date;
    }): Date;
}
//# sourceMappingURL=recurring-invoices.service.d.ts.map