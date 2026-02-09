import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../email-config/services';
import { OnboardingStep, OnboardingStatus, StepStatus, DteType } from '../types/onboarding.types';
import { StartOnboardingDto, UpdateCompanyInfoDto, SetHaciendaCredentialsDto, SetDteTypesDto, UploadTestCertificateDto, UploadProdCertificateDto, SetApiCredentialsDto, CompleteStepDto, GoToStepDto } from '../dto';
export declare class OnboardingService {
    private readonly prisma;
    private readonly encryptionService;
    constructor(prisma: PrismaService, encryptionService: EncryptionService);
    getOnboarding(tenantId: string): Promise<any>;
    getProgress(tenantId: string): Promise<{
        hasStarted: boolean;
        currentStep: string;
        overallStatus: string;
        completedSteps: number;
        totalSteps: number;
        percentComplete: number;
        steps: {
            order: number;
            status: string;
            isCurrentStep: boolean;
            canNavigateTo: boolean;
            name: string;
            description: string;
            step: OnboardingStep;
        }[];
        canProceed?: undefined;
        nextAction?: undefined;
    } | {
        hasStarted: boolean;
        currentStep: string;
        overallStatus: string;
        completedSteps: number;
        totalSteps: number;
        percentComplete: number;
        steps: {
            order: number;
            status: any;
            isCurrentStep: boolean;
            canNavigateTo: boolean;
            stepData: any;
            notes: any;
            blockerReason: any;
            performedBy: any;
            startedAt: any;
            completedAt: any;
            name: string;
            description: string;
            step: OnboardingStep;
        }[];
        canProceed: boolean;
        nextAction: string | undefined;
    }>;
    startOnboarding(tenantId: string, dto: StartOnboardingDto, userId: string): Promise<any>;
    updateCompanyInfo(tenantId: string, dto: UpdateCompanyInfoDto, userId: string): Promise<any>;
    setHaciendaCredentials(tenantId: string, dto: SetHaciendaCredentialsDto, userId: string): Promise<any>;
    setDteTypes(tenantId: string, dto: SetDteTypesDto, userId: string): Promise<any>;
    getDteTypes(tenantId: string): Promise<{
        selected: {
            dteType: string;
            isRequired: boolean;
            testCompleted: boolean;
            testCompletedAt: Date | null;
            testsRequired: number;
            testsCompleted: any;
        }[];
        available: {
            dteType: DteType;
            name: string;
            testsRequired: number;
        }[];
    }>;
    uploadTestCertificate(tenantId: string, dto: UploadTestCertificateDto, userId: string): Promise<any>;
    uploadProdCertificate(tenantId: string, dto: UploadProdCertificateDto, userId: string): Promise<any>;
    setTestApiCredentials(tenantId: string, dto: SetApiCredentialsDto, userId: string): Promise<any>;
    setProdApiCredentials(tenantId: string, dto: SetApiCredentialsDto, userId: string): Promise<any>;
    completeStep(tenantId: string, dto: CompleteStepDto, userId: string): Promise<any>;
    goToStep(tenantId: string, dto: GoToStepDto): Promise<any>;
    getAll(status?: OnboardingStatus): Promise<{
        id: string;
        tenantId: string;
        tenantName: string;
        tenantNit: string;
        currentStep: string;
        overallStatus: string;
        assistanceLevel: string;
        completedSteps: number;
        totalSteps: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    adminUpdateStep(tenantId: string, step: OnboardingStep, status: StepStatus, userId: string, notes?: string, blockerReason?: string): Promise<any>;
    private getOnboardingOrThrow;
    private upsertStepRecord;
    private initializeTestProgress;
    private getAvailableDteTypes;
    private getDteTypeName;
    private formatOnboardingResponse;
    private buildStepsList;
    private getDefaultStepsList;
    private canProceedToNextStep;
    private areAllTestsComplete;
    private getNextAction;
}
//# sourceMappingURL=onboarding.service.d.ts.map