import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { DefaultEmailService } from '../modules/email-config/services/default-email.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@SkipThrottle()
@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private defaultEmailService: DefaultEmailService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const [dbHealthy, emailHealthy, pendingNotifications] = await Promise.all([
      this.checkDatabase(),
      this.checkEmailService(),
      this.countPendingNotifications(),
    ]);

    const allHealthy = dbHealthy && emailHealthy;
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: dbHealthy ? 'healthy' : 'unhealthy',
        email: emailHealthy ? 'healthy' : 'unhealthy',
      },
      queues: {
        pendingNotifications,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  root() {
    return {
      message: 'Facturador Electronico SV API',
      version: '1.0',
      docs: '/docs',
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkEmailService(): Promise<boolean> {
    try {
      await this.defaultEmailService.getClientCredentialsToken();
      return true;
    } catch {
      return false;
    }
  }

  private async countPendingNotifications(): Promise<number> {
    try {
      return await this.prisma.pendingNotification.count({
        where: { status: { in: ['PENDING', 'FAILED'] } },
      });
    } catch {
      return -1;
    }
  }
}
