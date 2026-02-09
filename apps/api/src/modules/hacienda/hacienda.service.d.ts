import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../email-config/services/encryption.service';
import { CertificateService } from './services/certificate.service';
import { HaciendaAuthService } from './services/hacienda-auth.service';
import { TestDataGeneratorService } from './services/test-data-generator.service';
import { HaciendaEnvironment, HaciendaConfigResponse, TestProgressResponse, TestRecordResponse, ExecuteTestResult, DteTypeCode } from './interfaces';
import { ConfigureEnvironmentDto, ExecuteTestDto, QuickSetupDto, ValidateConnectionDto } from './dto';
import { GeneratedTestData } from './services/test-data-generator.service';
export declare class HaciendaService {
    private prisma;
    private encryptionService;
    private certificateService;
    private haciendaAuthService;
    private testDataGenerator;
    private readonly logger;
    constructor(prisma: PrismaService, encryptionService: EncryptionService, certificateService: CertificateService, haciendaAuthService: HaciendaAuthService, testDataGenerator: TestDataGeneratorService);
    /**
     * Get or create Hacienda configuration for a tenant
     */
    getOrCreateConfig(tenantId: string): Promise<HaciendaConfigResponse>;
    /**
     * Configure an environment with credentials and certificate
     */
    configureEnvironment(tenantId: string, environment: HaciendaEnvironment, dto: ConfigureEnvironmentDto, certificateBuffer: Buffer, certificateFileName: string): Promise<{
        success: boolean;
        message: string;
        certificateInfo?: any;
    }>;
    /**
     * Quick setup for companies that already have credentials
     * Configures environment and validates connection in a single operation
     */
    quickSetup(tenantId: string, dto: QuickSetupDto, certificateBuffer: Buffer, certificateFileName: string): Promise<{
        success: boolean;
        message: string;
        data?: {
            environment: HaciendaEnvironment;
            certificate: {
                valid: boolean;
                nit: string | null;
                expiresAt: Date;
                subject: string;
                daysUntilExpiry: number;
            };
            authentication: {
                valid: boolean;
                tokenExpiresAt: Date;
            };
        };
        errors?: {
            field: string;
            message: string;
        }[];
    }>;
    /**
     * Validate API connection without saving configuration
     * Useful for testing credentials before committing
     */
    validateConnection(dto: ValidateConnectionDto): Promise<{
        success: boolean;
        tokenExpiry?: Date;
        error?: string;
    }>;
    /**
     * Test connection to Hacienda
     */
    testConnection(tenantId: string, environment: HaciendaEnvironment): Promise<{
        success: boolean;
        message: string;
        tokenExpiry?: Date;
    }>;
    /**
     * Renew authentication token
     */
    renewToken(tenantId: string, environment: HaciendaEnvironment): Promise<{
        success: boolean;
        expiresAt: Date;
    }>;
    /**
     * Switch active environment
     */
    switchEnvironment(tenantId: string, environment: HaciendaEnvironment): Promise<{
        success: boolean;
    }>;
    /**
     * Get test progress
     */
    getTestProgress(tenantId: string): Promise<TestProgressResponse>;
    /**
     * Execute a test
     */
    executeTest(tenantId: string, dto: ExecuteTestDto): Promise<ExecuteTestResult>;
    /**
     * Execute emission test
     */
    private executeEmissionTest;
    /**
     * Execute cancellation test
     */
    private executeCancellationTest;
    /**
     * Get test history
     */
    getTestHistory(tenantId: string, filters?: {
        dteType?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<TestRecordResponse[]>;
    /**
     * Generate test data preview
     */
    generateTestDataPreview(tenantId: string, dteType: DteTypeCode): Promise<GeneratedTestData>;
    /**
     * Get environment config helper
     */
    private getEnvironmentConfig;
    /**
     * Format environment config for response
     */
    private formatEnvironmentConfig;
}
//# sourceMappingURL=hacienda.service.d.ts.map