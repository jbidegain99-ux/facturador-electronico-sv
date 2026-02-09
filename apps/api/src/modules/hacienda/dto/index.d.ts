export * from './quick-setup.dto';
export declare class ConfigureEnvironmentDto {
    apiUser: string;
    apiPassword: string;
    certificatePassword: string;
}
export declare class SwitchEnvironmentDto {
    environment: 'TEST' | 'PRODUCTION';
}
export declare class TestConnectionDto {
    environment: 'TEST' | 'PRODUCTION';
}
export declare class RenewTokenDto {
    environment: 'TEST' | 'PRODUCTION';
}
export declare class ExecuteTestDto {
    dteType: '01' | '03' | '04' | '05' | '06' | '11' | '14';
    testType: 'EMISSION' | 'CANCELLATION' | 'CONTINGENCY';
    testData?: Record<string, unknown>;
    codigoGeneracionToCancel?: string;
}
export declare class GetTestHistoryQueryDto {
    dteType?: string;
    status?: string;
    limit?: number;
    offset?: number;
}
export declare class GenerateTestDataDto {
    dteType: '01' | '03' | '04' | '05' | '06' | '11' | '14';
}
export declare class CertificateInfoDto {
    fileName: string;
    validUntil: Date;
    nit: string | null;
    subject: string;
}
export declare class EnvironmentConfigResponseDto {
    environment: 'TEST' | 'PRODUCTION';
    isConfigured: boolean;
    isValidated: boolean;
    tokenExpiry?: Date;
    certificateInfo?: CertificateInfoDto;
    lastValidationAt?: Date;
    lastValidationError?: string;
}
export declare class HaciendaConfigResponseDto {
    activeEnvironment: 'TEST' | 'PRODUCTION';
    testingStatus: string;
    testingStartedAt?: Date;
    testingCompletedAt?: Date;
    productionAuthorizedAt?: Date;
    testConfig?: EnvironmentConfigResponseDto;
    prodConfig?: EnvironmentConfigResponseDto;
}
export declare class TestProgressByDteDto {
    dteType: string;
    dteName: string;
    emissionRequired: number;
    emissionCompleted: number;
    cancellationRequired: number;
    cancellationCompleted: number;
    isComplete: boolean;
}
export declare class TestProgressResponseDto {
    progress: TestProgressByDteDto[];
    totalRequired: number;
    totalCompleted: number;
    percentComplete: number;
    canRequestAuthorization: boolean;
    daysRemaining?: number;
    testingStartedAt?: Date;
}
//# sourceMappingURL=index.d.ts.map