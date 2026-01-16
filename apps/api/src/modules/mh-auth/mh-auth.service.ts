import { Injectable, Logger } from '@nestjs/common';
import { authenticate, MHAuthError, MHEnvironment } from '@facturador/mh-client';

export interface TokenInfo {
  token: string;
  roles: string[];
  obtainedAt: Date;
}

@Injectable()
export class MhAuthService {
  private readonly logger = new Logger(MhAuthService.name);
  private tokenCache: Map<string, TokenInfo> = new Map();

  async getToken(
    nit: string,
    password: string,
    env: MHEnvironment = 'test'
  ): Promise<TokenInfo> {
    const cacheKey = `${nit}:${env}`;
    const cached = this.tokenCache.get(cacheKey);

    if (cached && this.isTokenValid(cached)) {
      this.logger.debug(`Using cached token for NIT: ${nit}`);
      return cached;
    }

    this.logger.log(`Authenticating with MH for NIT: ${nit}`);

    try {
      const response = await authenticate(nit, password, { env });

      if (response.status === 'OK') {
        const body = response.body as { token: string; roles: string[] };
        const tokenInfo: TokenInfo = {
          token: body.token,
          roles: body.roles,
          obtainedAt: new Date(),
        };

        this.tokenCache.set(cacheKey, tokenInfo);
        this.logger.log(`Successfully authenticated with MH for NIT: ${nit}`);

        return tokenInfo;
      }

      throw new MHAuthError('Authentication failed with status ERROR');
    } catch (error) {
      this.logger.error(
        `Failed to authenticate with MH: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  async saveTokenToTenant(tenantId: string, tokenInfo: TokenInfo): Promise<void> {
    // TODO: Implement database persistence
    this.logger.log(`Saving token for tenant: ${tenantId}`);
  }

  clearCache(nit?: string, env?: MHEnvironment): void {
    if (nit && env) {
      const cacheKey = `${nit}:${env}`;
      this.tokenCache.delete(cacheKey);
    } else {
      this.tokenCache.clear();
    }
  }

  private isTokenValid(tokenInfo: TokenInfo): boolean {
    const TOKEN_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours
    const elapsed = Date.now() - tokenInfo.obtainedAt.getTime();
    return elapsed < TOKEN_TTL_MS;
  }
}
