import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface MhAuthResponse {
  status: string;
  body: {
    token: string;
    roles: string[];
  };
}

@Injectable()
export class MhAuthService {
  private readonly logger = new Logger(MhAuthService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getToken(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }

    // Check if we have a valid token
    if (tenant.mhToken && tenant.mhTokenExpiry && tenant.mhTokenExpiry > new Date()) {
      return tenant.mhToken;
    }

    // Get a new token
    const newToken = await this.authenticateWithMh(tenant.nit, tenant.nrc);

    // Save token with 23 hour expiry (MH tokens last 24h)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 23);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        mhToken: newToken,
        mhTokenExpiry: expiry,
      },
    });

    return newToken;
  }

  private async authenticateWithMh(nit: string, _nrc: string): Promise<string> {
    const baseUrl = this.configService.get<string>('MH_API_BASE_URL');
    const passwordPrivado = this.configService.get<string>('MH_PASSWORD_PRIVADO');

    const url = `${baseUrl}/seguridad/auth`;

    this.logger.log(`Autenticando con MH para NIT: ${nit}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        user: nit,
        pwd: passwordPrivado || '',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Error autenticando con MH: ${error}`);
      throw new Error(`Error de autenticacion con MH: ${response.status}`);
    }

    const data: MhAuthResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error('Autenticacion con MH fallida');
    }

    this.logger.log('Autenticacion con MH exitosa');
    return data.body.token;
  }
}
