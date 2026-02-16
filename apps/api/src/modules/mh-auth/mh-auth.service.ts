import { Injectable, Logger } from '@nestjs/common';
import { authenticate, MHAuthError, MHEnvironment } from '@facturador/mh-client';
import { PrismaService } from '../../prisma/prisma.service';

export interface TokenInfo {
  token: string;
  roles: string[];
  obtainedAt: Date;
}

@Injectable()
export class MhAuthService {
  private readonly logger = new Logger(MhAuthService.name);
  private tokenCache: Map<string, TokenInfo> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async getToken(
    nit: string,
    password: string,
    env: MHEnvironment = 'test'
  ): Promise<TokenInfo> {
    const cacheKey = `${nit}:${env}`;

    // 1. Check in-memory cache
    const cached = this.tokenCache.get(cacheKey);
    if (cached && this.isTokenValid(cached)) {
      this.logger.debug(`Using cached token for NIT: ${nit}`);
      return cached;
    }

    // 2. Check database for persisted token
    const dbToken = await this.loadTokenFromDb(nit, env);
    if (dbToken && this.isTokenValid(dbToken)) {
      this.logger.debug(`Using DB-persisted token for NIT: ${nit}`);
      this.tokenCache.set(cacheKey, dbToken);
      return dbToken;
    }

    // 3. Authenticate with MH
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

        // Save to memory cache
        this.tokenCache.set(cacheKey, tokenInfo);

        // Save to database (fire-and-forget, don't block)
        this.saveTokenToDb(nit, env, tokenInfo).catch((err) => {
          this.logger.warn(
            `Failed to persist MH token to DB: ${err instanceof Error ? err.message : 'Unknown error'}`,
          );
        });

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

  /**
   * Load a persisted token from the database via Tenant NIT → HaciendaConfig → EnvironmentConfig
   */
  private async loadTokenFromDb(
    nit: string,
    env: MHEnvironment,
  ): Promise<TokenInfo | null> {
    try {
      const cleanNit = nit.replace(/-/g, '');
      const environment = env === 'test' ? 'TEST' : 'PRODUCTION';

      const tenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [
            { nit },
            { nit: cleanNit },
          ],
        },
        select: {
          haciendaConfig: {
            select: {
              environmentConfigs: {
                where: { environment },
                select: {
                  currentTokenEncrypted: true,
                  tokenExpiresAt: true,
                  tokenRefreshedAt: true,
                },
              },
            },
          },
        },
      });

      const envConfig = tenant?.haciendaConfig?.environmentConfigs?.[0];
      if (!envConfig?.currentTokenEncrypted || !envConfig.tokenExpiresAt) {
        return null;
      }

      // Check if DB token is still valid
      if (new Date(envConfig.tokenExpiresAt) <= new Date()) {
        return null;
      }

      return {
        token: envConfig.currentTokenEncrypted,
        roles: [],
        obtainedAt: envConfig.tokenRefreshedAt ?? new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `Error loading MH token from DB: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Save token to the database for persistence across restarts.
   */
  private async saveTokenToDb(
    nit: string,
    env: MHEnvironment,
    tokenInfo: TokenInfo,
  ): Promise<void> {
    const cleanNit = nit.replace(/-/g, '');
    const environment = env === 'test' ? 'TEST' : 'PRODUCTION';

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { nit },
          { nit: cleanNit },
        ],
      },
      select: { id: true },
    });

    if (!tenant) {
      this.logger.warn(`Cannot persist MH token: tenant not found for NIT ${nit}`);
      return;
    }

    // Upsert HaciendaConfig
    const haciendaConfig = await this.prisma.haciendaConfig.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        activeEnvironment: environment,
      },
      update: {},
      select: { id: true },
    });

    // Token expires in 23 hours from now
    const tokenExpiresAt = new Date(tokenInfo.obtainedAt.getTime() + 23 * 60 * 60 * 1000);

    // Upsert EnvironmentConfig with token
    await this.prisma.haciendaEnvironmentConfig.upsert({
      where: {
        haciendaConfigId_environment: {
          haciendaConfigId: haciendaConfig.id,
          environment,
        },
      },
      create: {
        haciendaConfigId: haciendaConfig.id,
        environment,
        currentTokenEncrypted: tokenInfo.token,
        tokenExpiresAt,
        tokenRefreshedAt: tokenInfo.obtainedAt,
      },
      update: {
        currentTokenEncrypted: tokenInfo.token,
        tokenExpiresAt,
        tokenRefreshedAt: tokenInfo.obtainedAt,
      },
    });

    this.logger.debug(`MH token persisted to DB for NIT: ${nit} (env: ${environment})`);
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
