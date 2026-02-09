import { MHEnvironment } from '@facturador/mh-client';
export interface TokenInfo {
    token: string;
    roles: string[];
    obtainedAt: Date;
}
export declare class MhAuthService {
    private readonly logger;
    private tokenCache;
    getToken(nit: string, password: string, env?: MHEnvironment): Promise<TokenInfo>;
    saveTokenToTenant(tenantId: string, tokenInfo: TokenInfo): Promise<void>;
    clearCache(nit?: string, env?: MHEnvironment): void;
    private isTokenValid;
}
//# sourceMappingURL=mh-auth.service.d.ts.map