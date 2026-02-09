import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../email-config/services';
import { ExecuteTestDto, ExecuteEventTestDto } from '../dto';
export declare class TestExecutionService {
    private readonly prisma;
    private readonly encryptionService;
    constructor(prisma: PrismaService, encryptionService: EncryptionService);
    getTestProgress(tenantId: string): Promise<{
        initialized: boolean;
        message: string;
        totalTestsRequired?: undefined;
        totalTestsCompleted?: undefined;
        percentComplete?: undefined;
        dteProgress?: undefined;
        eventProgress?: undefined;
        canRequestAuthorization?: undefined;
        lastTestAt?: undefined;
        lastTestResult?: undefined;
        lastTestError?: undefined;
    } | {
        initialized: boolean;
        totalTestsRequired: number;
        totalTestsCompleted: number;
        percentComplete: number;
        dteProgress: {
            dteType: string;
            name: string;
            required: any;
            completed: any;
            isComplete: boolean;
        }[];
        eventProgress: {
            eventType: string;
            name: string;
            required: number;
            completed: any;
            isComplete: boolean;
        }[];
        canRequestAuthorization: boolean;
        lastTestAt: Date | null;
        lastTestResult: string | null;
        lastTestError: string | null;
        message?: undefined;
    }>;
    executeDteTest(tenantId: string, dto: ExecuteTestDto): Promise<{
        success: boolean;
        message: string;
        responseCode?: string;
        selloRecibido?: string;
        codigoGeneracion?: string;
        errors?: string[];
        timestamp: Date;
    }>;
    executeEventTest(tenantId: string, dto: ExecuteEventTestDto): Promise<{
        success: boolean;
        message: string;
        responseCode?: string;
        errors?: string[];
        timestamp: Date;
    }>;
    getTestHistory(tenantId: string, limit?: number): Promise<{
        tests: never[];
        total: number;
        message: string;
    }>;
    private getOnboardingWithCredentials;
    private callHaciendaTestApi;
    private callHaciendaEventApi;
    private getDteTypeName;
    private getEventTypeName;
}
//# sourceMappingURL=test-execution.service.d.ts.map