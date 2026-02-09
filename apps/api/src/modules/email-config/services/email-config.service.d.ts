import { PrismaService } from '../../../prisma/prisma.service';
import { ConfiguredBy, TenantEmailConfig } from '../types/email.types';
import { EncryptionService } from './encryption.service';
import { EmailAdapterFactory } from '../adapters/adapter.factory';
import { CreateEmailConfigDto, UpdateEmailConfigDto, TestEmailConfigDto } from '../dto';
import { SendEmailParams, SendEmailWithAttachmentParams, SendEmailResult, ConnectionTestResult } from '../adapters/email-adapter.interface';
export declare class EmailConfigService {
    private readonly prisma;
    private readonly encryptionService;
    private readonly adapterFactory;
    private readonly logger;
    constructor(prisma: PrismaService, encryptionService: EncryptionService, adapterFactory: EmailAdapterFactory);
    /**
     * Get email configuration for a tenant
     */
    getConfig(tenantId: string): Promise<TenantEmailConfig | null>;
    /**
     * Create or update email configuration for a tenant
     */
    upsertConfig(tenantId: string, dto: CreateEmailConfigDto, configuredBy?: ConfiguredBy, configuredByUserId?: string): Promise<TenantEmailConfig>;
    /**
     * Update email configuration
     */
    updateConfig(tenantId: string, dto: UpdateEmailConfigDto): Promise<TenantEmailConfig>;
    /**
     * Delete email configuration
     */
    deleteConfig(tenantId: string): Promise<void>;
    /**
     * Test the email configuration connection
     */
    testConnection(tenantId: string): Promise<ConnectionTestResult>;
    /**
     * Send a test email
     */
    sendTestEmail(tenantId: string, dto: TestEmailConfigDto): Promise<SendEmailResult>;
    /**
     * Send an email using the tenant's configuration
     */
    sendEmail(tenantId: string, params: SendEmailParams, dteId?: string): Promise<SendEmailResult>;
    /**
     * Send an email with attachments (typically for DTEs with PDF)
     */
    sendEmailWithAttachment(tenantId: string, params: SendEmailWithAttachmentParams, dteId?: string): Promise<SendEmailResult>;
    /**
     * Activate or deactivate email configuration
     */
    setActive(tenantId: string, isActive: boolean): Promise<TenantEmailConfig>;
    /**
     * Get email send logs for a tenant
     */
    getSendLogs(tenantId: string, page?: number, limit?: number): Promise<{
        logs: {
            id: string;
            errorMessage: string | null;
            dteId: string | null;
            status: string;
            subject: string;
            recipientEmail: string;
            configId: string;
            providerMessageId: string | null;
            attemptNumber: number;
            sentAt: Date;
            deliveredAt: Date | null;
            openedAt: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Encrypt sensitive fields before storing
     */
    private encryptSensitiveFields;
    /**
     * Generate HTML for test email
     */
    private generateTestEmailHtml;
}
//# sourceMappingURL=email-config.service.d.ts.map