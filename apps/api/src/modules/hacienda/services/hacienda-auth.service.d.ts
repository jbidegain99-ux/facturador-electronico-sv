import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../email-config/services/encryption.service';
import { HaciendaEnvironment } from '../interfaces';
export interface TokenInfo {
    token: string;
    roles: string[];
    obtainedAt: Date;
    expiresAt: Date;
}
/**
 * Service for authenticating with Ministerio de Hacienda API
 */
export declare class HaciendaAuthService {
    private prisma;
    private encryptionService;
    private readonly logger;
    private tokenCache;
    constructor(prisma: PrismaService, encryptionService: EncryptionService);
    /**
     * Authenticate with Hacienda API and get a token
     * @param nit - The NIT for authentication
     * @param password - The API password
     * @param environment - TEST or PRODUCTION
     * @returns Token information
     */
    authenticate(nit: string, password: string, environment?: HaciendaEnvironment): Promise<TokenInfo>;
    /**
     * Get or refresh token for a specific tenant and environment
     */
    getTokenForTenant(tenantId: string, environment?: HaciendaEnvironment): Promise<TokenInfo>;
    /**
     * Validate API credentials by attempting authentication
     */
    validateCredentials(nit: string, password: string, environment?: HaciendaEnvironment): Promise<{
        valid: boolean;
        message: string;
        expiresAt?: Date;
    }>;
    /**
     * Clear cached token for a tenant/environment
     */
    clearCache(nit?: string, environment?: HaciendaEnvironment): void;
    /**
     * Refresh token for a tenant - forces new authentication
     */
    refreshToken(tenantId: string, environment?: HaciendaEnvironment): Promise<TokenInfo>;
    /**
     * Check if a token is still valid
     */
    private isTokenValid;
    /**
     * Get token validity hours based on environment
     */
    getTokenValidityHours(environment: HaciendaEnvironment): number;
}
//# sourceMappingURL=hacienda-auth.service.d.ts.map