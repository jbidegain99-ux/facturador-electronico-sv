import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { HaciendaService } from './hacienda.service';
import { ConfigureEnvironmentDto, SwitchEnvironmentDto, TestConnectionDto, RenewTokenDto, ExecuteTestDto, GetTestHistoryQueryDto, GenerateTestDataDto, QuickSetupDto, ValidateConnectionDto } from './dto';
import { HaciendaEnvironment } from './interfaces';
export declare class HaciendaController {
    private readonly haciendaService;
    constructor(haciendaService: HaciendaService);
    getConfig(user: CurrentUserData): Promise<import("./interfaces").HaciendaConfigResponse>;
    quickSetup(user: CurrentUserData, certificate: Express.Multer.File, dto: QuickSetupDto): Promise<{
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
    validateConnection(user: CurrentUserData, dto: ValidateConnectionDto): Promise<{
        success: boolean;
        tokenExpiry?: Date;
        error?: string;
    }>;
    testConnection(user: CurrentUserData, dto: TestConnectionDto): Promise<{
        success: boolean;
        message: string;
        tokenExpiry?: Date;
    }>;
    renewToken(user: CurrentUserData, dto: RenewTokenDto): Promise<{
        success: boolean;
        expiresAt: Date;
    }>;
    switchEnvironment(user: CurrentUserData, dto: SwitchEnvironmentDto): Promise<{
        success: boolean;
    }>;
    configureEnvironment(user: CurrentUserData, environment: string, certificate: Express.Multer.File, dto: ConfigureEnvironmentDto): Promise<{
        success: boolean;
        message: string;
        certificateInfo?: any;
    }>;
    getTestProgress(user: CurrentUserData): Promise<import("./interfaces").TestProgressResponse>;
    executeTest(user: CurrentUserData, dto: ExecuteTestDto): Promise<import("./interfaces").ExecuteTestResult>;
    getTestHistory(user: CurrentUserData, query: GetTestHistoryQueryDto): Promise<import("./interfaces").TestRecordResponse[]>;
    generateTestData(user: CurrentUserData, dto: GenerateTestDataDto): Promise<import("./services/test-data-generator.service").GeneratedTestData>;
    getSuccessfulEmissions(user: CurrentUserData, dteType?: string): Promise<import("./interfaces").TestRecordResponse[]>;
}
//# sourceMappingURL=hacienda.controller.d.ts.map