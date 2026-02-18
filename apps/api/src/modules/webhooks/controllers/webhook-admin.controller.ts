import {
  Controller,
  Get,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../super-admin/guards/super-admin.guard';
import { PrismaService } from '../../../prisma/prisma.service';

interface TenantWebhookSummary {
  tenantId: string;
  tenantName: string;
  endpointCount: number;
  activeEndpoints: number;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
}

@ApiTags('Admin Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/webhooks')
export class WebhookAdminController {
  constructor(private prisma: PrismaService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get webhook summary for all tenants (super admin)' })
  async getSummary() {
    // Get all tenants that have webhook endpoints
    const tenants = await this.prisma.tenant.findMany({
      where: {
        webhookEndpoints: { some: {} },
      },
      select: {
        id: true,
        nombre: true,
        webhookEndpoints: {
          select: {
            id: true,
            isActive: true,
            _count: { select: { deliveries: true } },
          },
        },
      },
    });

    const summaries: TenantWebhookSummary[] = [];

    for (const tenant of tenants) {
      const endpointIds = tenant.webhookEndpoints.map((e) => e.id);

      const [delivered, failed] = endpointIds.length > 0
        ? await Promise.all([
            this.prisma.webhookDelivery.count({
              where: { endpointId: { in: endpointIds }, status: 'DELIVERED' },
            }),
            this.prisma.webhookDelivery.count({
              where: { endpointId: { in: endpointIds }, status: { in: ['FAILED', 'DEAD_LETTER'] } },
            }),
          ])
        : [0, 0];

      const totalDeliveries = tenant.webhookEndpoints.reduce(
        (sum, ep) => sum + ep._count.deliveries,
        0,
      );

      summaries.push({
        tenantId: tenant.id,
        tenantName: tenant.nombre,
        endpointCount: tenant.webhookEndpoints.length,
        activeEndpoints: tenant.webhookEndpoints.filter((e) => e.isActive).length,
        totalDeliveries,
        successfulDeliveries: delivered,
        failedDeliveries: failed,
      });
    }

    return { status: HttpStatus.OK, data: summaries };
  }
}
