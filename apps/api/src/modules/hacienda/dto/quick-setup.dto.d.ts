/**
 * DTO for quick setup of Hacienda credentials
 * Used by companies that already have their certificates and API credentials
 */
export declare class QuickSetupDto {
    environment: 'TEST' | 'PRODUCTION';
    apiUser: string;
    apiPassword: string;
    certificatePassword: string;
}
/**
 * DTO for validating Hacienda API connection without saving
 */
export declare class ValidateConnectionDto {
    environment: 'TEST' | 'PRODUCTION';
    apiUser: string;
    apiPassword: string;
}
/**
 * Response for quick setup endpoint
 */
export declare class QuickSetupResponseDto {
    success: boolean;
    message: string;
    data?: {
        environment: 'TEST' | 'PRODUCTION';
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
}
/**
 * Response for validate connection endpoint
 */
export declare class ValidateConnectionResponseDto {
    success: boolean;
    tokenExpiry?: Date;
    error?: string;
}
//# sourceMappingURL=quick-setup.dto.d.ts.map