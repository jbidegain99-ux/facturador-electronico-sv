import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { OnboardingService, TestExecutionService, OnboardingCommunicationService } from './services';
import { StartOnboardingDto, UpdateCompanyInfoDto, SetHaciendaCredentialsDto, SetDteTypesDto, UploadTestCertificateDto, UploadProdCertificateDto, SetApiCredentialsDto, CompleteStepDto, GoToStepDto, ExecuteTestDto, ExecuteEventTestDto, AddCommunicationDto } from './dto';
import { OnboardingStatus, OnboardingStep, StepStatus } from './types/onboarding.types';
export declare class OnboardingController {
    private readonly onboardingService;
    private readonly testExecutionService;
    private readonly communicationService;
    constructor(onboardingService: OnboardingService, testExecutionService: TestExecutionService, communicationService: OnboardingCommunicationService);
    getOnboarding(user: CurrentUserData): Promise<any>;
    getProgress(user: CurrentUserData): Promise<{
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
    startOnboarding(user: CurrentUserData, dto: StartOnboardingDto): Promise<any>;
    updateCompanyInfo(user: CurrentUserData, dto: UpdateCompanyInfoDto): Promise<any>;
    setHaciendaCredentials(user: CurrentUserData, dto: SetHaciendaCredentialsDto): Promise<any>;
    getDteTypes(user: CurrentUserData): Promise<{
        selected: {
            dteType: string;
            isRequired: boolean;
            testCompleted: boolean;
            testCompletedAt: Date | null;
            testsRequired: number;
            testsCompleted: any;
        }[];
        available: {
            dteType: import("./types/onboarding.types").DteType;
            name: string;
            testsRequired: number;
        }[];
    }>;
    setDteTypes(user: CurrentUserData, dto: SetDteTypesDto): Promise<any>;
    uploadTestCertificate(user: CurrentUserData, dto: UploadTestCertificateDto): Promise<any>;
    uploadProdCertificate(user: CurrentUserData, dto: UploadProdCertificateDto): Promise<any>;
    setTestApiCredentials(user: CurrentUserData, dto: SetApiCredentialsDto): Promise<any>;
    setProdApiCredentials(user: CurrentUserData, dto: SetApiCredentialsDto): Promise<any>;
    completeStep(user: CurrentUserData, dto: CompleteStepDto): Promise<any>;
    goToStep(user: CurrentUserData, dto: GoToStepDto): Promise<any>;
    getTestProgress(user: CurrentUserData): Promise<{
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
    executeTest(user: CurrentUserData, dto: ExecuteTestDto): Promise<{
        success: boolean;
        message: string;
        responseCode?: string;
        selloRecibido?: string;
        codigoGeneracion?: string;
        errors?: string[];
        timestamp: Date;
    }>;
    executeEventTest(user: CurrentUserData, dto: ExecuteEventTestDto): Promise<{
        success: boolean;
        message: string;
        responseCode?: string;
        errors?: string[];
        timestamp: Date;
    }>;
    getTestHistory(user: CurrentUserData, limit?: string): Promise<{
        tests: never[];
        total: number;
        message: string;
    }>;
    getCommunications(user: CurrentUserData, page?: string, limit?: string): Promise<{
        communications: {
            id: string;
            type: string;
            direction: string;
            subject: string | null;
            content: string;
            attachments: any;
            relatedStep: string | null;
            sentBy: string | null;
            sentAt: Date;
            readAt: Date | null;
        }[];
        total: number;
        unreadCount: number;
        page: number;
        totalPages: number;
    }>;
    addCommunication(user: CurrentUserData, dto: AddCommunicationDto): Promise<{
        id: string;
        message: string;
    }>;
    markAsRead(user: CurrentUserData, id: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(user: CurrentUserData): Promise<{
        success: boolean;
    }>;
}
export declare class OnboardingAdminController {
    private readonly onboardingService;
    private readonly testExecutionService;
    private readonly communicationService;
    constructor(onboardingService: OnboardingService, testExecutionService: TestExecutionService, communicationService: OnboardingCommunicationService);
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
    getTenantOnboarding(tenantId: string): Promise<any>;
    getTenantProgress(tenantId: string): Promise<{
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
    updateStep(user: CurrentUserData, tenantId: string, body: {
        step: OnboardingStep;
        status: StepStatus;
        notes?: string;
        blockerReason?: string;
    }): Promise<any>;
    getTenantTestProgress(tenantId: string): Promise<{
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
    getAllCommunications(page?: string, limit?: string): Promise<{
        communications: {
            id: string;
            tenantId: string;
            tenantName: string | null;
            type: string;
            direction: string;
            subject: string | null;
            content: string;
            attachments: any;
            relatedStep: string | null;
            sentBy: string | null;
            sentAt: Date;
            readAt: Date | null;
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getTenantCommunications(tenantId: string, page?: string, limit?: string): Promise<{
        communications: {
            id: string;
            type: string;
            direction: string;
            subject: string | null;
            content: string;
            attachments: any;
            relatedStep: string | null;
            sentBy: string | null;
            sentAt: Date;
            readAt: Date | null;
        }[];
        total: number;
        unreadCount: number;
        page: number;
        totalPages: number;
    }>;
    sendCommunication(user: CurrentUserData, onboardingId: string, dto: AddCommunicationDto): Promise<{
        id: string;
        message: string;
    }>;
}
//# sourceMappingURL=onboarding.controller.d.ts.map