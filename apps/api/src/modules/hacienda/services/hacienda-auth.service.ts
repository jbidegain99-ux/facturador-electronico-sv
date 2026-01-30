import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EncryptionService } from '../../email-config/services/encryption.service';
import {
  HaciendaEnvironment,
  HaciendaAuthResponse,
  HACIENDA_URLS,
  HACIENDA_ENDPOINTS,
  TOKEN_VALIDITY,
} from '../interfaces';

export interface TokenInfo {
  token: string;
  roles: string[];
  obtainedAt: Date;
  expiresAt: Date;
}

/**
 * Service for authenticating with Ministerio de Hacienda API
 */
@Injectable()
export class HaciendaAuthService {
  private readonly logger = new Logger(HaciendaAuthService.name);
  private tokenCache: Map<string, TokenInfo> = new Map();

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Authenticate with Hacienda API and get a token
   * @param nit - The NIT for authentication
   * @param password - The API password
   * @param environment - TEST or PRODUCTION
   * @returns Token information
   */
  async authenticate(
    nit: string,
    password: string,
    environment: HaciendaEnvironment = 'TEST',
  ): Promise<TokenInfo> {
    // Check cache first
    const cacheKey = `${nit}:${environment}`;
    const cached = this.tokenCache.get(cacheKey);

    if (cached && this.isTokenValid(cached)) {
      this.logger.debug(`Using cached token for NIT: ${nit}`);
      return cached;
    }

    this.logger.log(`Authenticating with MH for NIT: ${nit}, Env: ${environment}`);

    const baseUrl = HACIENDA_URLS[environment];
    const url = `${baseUrl}${HACIENDA_ENDPOINTS.AUTH}`;

    try {
      // Hacienda expects application/x-www-form-urlencoded with 'user' and 'pwd'
      const formData = new URLSearchParams();
      formData.append('user', nit.replace(/-/g, '')); // Remove dashes from NIT
      formData.append('pwd', password);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data: HaciendaAuthResponse = await response.json();

      if (data.status === 'OK' && data.body) {
        const now = new Date();
        const validity = TOKEN_VALIDITY[environment];
        const expiresAt = new Date(now.getTime() + validity);

        const tokenInfo: TokenInfo = {
          token: data.body.token,
          roles: data.body.roles,
          obtainedAt: now,
          expiresAt,
        };

        // Cache the token
        this.tokenCache.set(cacheKey, tokenInfo);

        this.logger.log(`Successfully authenticated with MH for NIT: ${nit}`);
        return tokenInfo;
      }

      const errorMessage = data.message || 'Error de autenticación con Hacienda';
      this.logger.error(`MH Auth failed: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Failed to authenticate with MH: ${message}`);
      throw new BadRequestException(`Error de conexión con Hacienda: ${message}`);
    }
  }

  /**
   * Get or refresh token for a specific tenant and environment
   */
  async getTokenForTenant(
    tenantId: string,
    environment: HaciendaEnvironment = 'TEST',
  ): Promise<TokenInfo> {
    // Get environment config
    const envConfig = await this.prisma.haciendaEnvironmentConfig.findFirst({
      where: {
        haciendaConfig: {
          tenantId,
        },
        environment,
      },
      include: {
        haciendaConfig: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!envConfig) {
      throw new BadRequestException(
        `No se encontró configuración de Hacienda para el ambiente ${environment}`,
      );
    }

    if (!envConfig.apiUser || !envConfig.apiPasswordEncrypted) {
      throw new BadRequestException(
        'Faltan credenciales de API. Configure el usuario y contraseña de Hacienda.',
      );
    }

    // Check if we have a valid cached token in DB
    if (
      envConfig.currentTokenEncrypted &&
      envConfig.tokenExpiresAt &&
      new Date() < envConfig.tokenExpiresAt
    ) {
      this.logger.debug(`Using stored token for tenant: ${tenantId}`);
      return {
        token: this.encryptionService.decrypt(envConfig.currentTokenEncrypted),
        roles: [],
        obtainedAt: envConfig.tokenRefreshedAt || new Date(),
        expiresAt: envConfig.tokenExpiresAt,
      };
    }

    // Get fresh token
    const nit = envConfig.haciendaConfig.tenant.nit;
    const password = this.encryptionService.decrypt(envConfig.apiPasswordEncrypted);

    const tokenInfo = await this.authenticate(nit, password, environment);

    // Store token in database
    await this.prisma.haciendaEnvironmentConfig.update({
      where: { id: envConfig.id },
      data: {
        currentTokenEncrypted: this.encryptionService.encrypt(tokenInfo.token),
        tokenExpiresAt: tokenInfo.expiresAt,
        tokenRefreshedAt: tokenInfo.obtainedAt,
      },
    });

    return tokenInfo;
  }

  /**
   * Validate API credentials by attempting authentication
   */
  async validateCredentials(
    nit: string,
    password: string,
    environment: HaciendaEnvironment = 'TEST',
  ): Promise<{ valid: boolean; message: string; expiresAt?: Date }> {
    try {
      const tokenInfo = await this.authenticate(nit, password, environment);
      return {
        valid: true,
        message: 'Credenciales válidas',
        expiresAt: tokenInfo.expiresAt,
      };
    } catch (error) {
      const message = error instanceof BadRequestException
        ? error.message
        : 'Error al validar credenciales';
      return {
        valid: false,
        message,
      };
    }
  }

  /**
   * Clear cached token for a tenant/environment
   */
  clearCache(nit?: string, environment?: HaciendaEnvironment): void {
    if (nit && environment) {
      const cacheKey = `${nit}:${environment}`;
      this.tokenCache.delete(cacheKey);
    } else {
      this.tokenCache.clear();
    }
  }

  /**
   * Refresh token for a tenant
   */
  async refreshToken(
    tenantId: string,
    environment: HaciendaEnvironment = 'TEST',
  ): Promise<TokenInfo> {
    // Get environment config
    const envConfig = await this.prisma.haciendaEnvironmentConfig.findFirst({
      where: {
        haciendaConfig: {
          tenantId,
        },
        environment,
      },
      include: {
        haciendaConfig: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!envConfig) {
      throw new BadRequestException(
        `No se encontró configuración de Hacienda para el ambiente ${environment}`,
      );
    }

    // Clear cache to force fresh auth
    const nit = envConfig.haciendaConfig.tenant.nit;
    this.clearCache(nit, environment);

    // Get fresh token
    return this.getTokenForTenant(tenantId, environment);
  }

  /**
   * Check if a token is still valid
   */
  private isTokenValid(tokenInfo: TokenInfo): boolean {
    // Give 5 minute buffer before expiry
    const bufferMs = 5 * 60 * 1000;
    const now = Date.now();
    return tokenInfo.expiresAt.getTime() - bufferMs > now;
  }

  /**
   * Get token validity hours based on environment
   */
  getTokenValidityHours(environment: HaciendaEnvironment): number {
    return environment === 'TEST' ? 48 : 24;
  }
}
