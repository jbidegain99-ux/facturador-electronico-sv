import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { WebhooksService } from '../webhooks.service';
import { WebhookDeliveryService } from '../webhook-delivery.service';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhookDeliveriesController {
  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
    private deliveryService: WebhookDeliveryService,
  ) {}

  @Get('events')
  @ApiOperation({ summary: 'List all available webhook events' })
  async getAvailableEvents() {
    const events = await this.prisma.webhookEvent.findMany({
      orderBy: { eventType: 'asc' },
    });

    return {
      status: HttpStatus.OK,
      data: events.map((e) => ({
        eventType: e.eventType,
        description: e.description,
      })),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get global webhook stats for tenant' })
  async getStats(
    @CurrentUser('tenantId') tenantId: string,
    @Query('days') days = '7',
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const daysNum = parseInt(days, 10) || 7;
    const stats = await this.webhooksService.getStats(tenantId, daysNum);

    return { status: HttpStatus.OK, data: stats };
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'List webhook deliveries for tenant' })
  async getDeliveries(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('endpointId') endpointId?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    interface DeliveryWhereFilter {
      tenantId: string;
      status?: string;
      endpointId?: string;
    }

    const where: DeliveryWhereFilter = { tenantId };
    if (status) where.status = status;
    if (endpointId) where.endpointId = endpointId;

    const [data, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          endpoint: { select: { name: true, url: true } },
          event: { select: { eventType: true, description: true } },
        },
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);

    return {
      status: HttpStatus.OK,
      data: data.map((d) => ({
        id: d.id,
        endpointName: d.endpoint.name,
        endpointUrl: d.endpoint.url,
        eventType: d.event.eventType,
        eventDescription: d.event.description,
        status: d.status,
        attemptCount: d.attemptCount,
        maxAttempts: d.maxAttempts,
        responseStatus: d.responseStatus,
        errorMessage: d.errorMessage,
        sentAt: d.sentAt,
        completedAt: d.completedAt,
        nextRetryAt: d.nextRetryAt,
        createdAt: d.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  @Get('deliveries/:id')
  @ApiOperation({ summary: 'Get delivery details' })
  async getDeliveryDetail(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') deliveryId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: { id: deliveryId, tenantId },
      include: {
        endpoint: { select: { name: true, url: true } },
        event: { select: { eventType: true, description: true } },
      },
    });

    if (!delivery) throw new NotFoundException('Delivery no encontrado');

    return {
      status: HttpStatus.OK,
      data: {
        id: delivery.id,
        endpointName: delivery.endpoint.name,
        endpointUrl: delivery.endpoint.url,
        eventType: delivery.event.eventType,
        eventDescription: delivery.event.description,
        idempotencyKey: delivery.idempotencyKey,
        payload: delivery.payload,
        headers: delivery.headers,
        status: delivery.status,
        attemptCount: delivery.attemptCount,
        maxAttempts: delivery.maxAttempts,
        responseStatus: delivery.responseStatus,
        responseHeaders: delivery.responseHeaders,
        responseBody: delivery.responseBody,
        errorMessage: delivery.errorMessage,
        sentAt: delivery.sentAt,
        completedAt: delivery.completedAt,
        nextRetryAt: delivery.nextRetryAt,
        createdAt: delivery.createdAt,
      },
    };
  }

  @Post('deliveries/:id/retry')
  @ApiOperation({ summary: 'Retry a failed delivery' })
  async retryDelivery(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') deliveryId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    await this.deliveryService.retryDelivery(deliveryId, tenantId);

    return {
      status: HttpStatus.OK,
      message: 'Delivery encolado para reintento',
    };
  }

  @Post('test/:endpointId')
  @ApiOperation({ summary: 'Send a test webhook to an endpoint' })
  async testEndpoint(
    @CurrentUser('tenantId') tenantId: string,
    @Param('endpointId') endpointId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });

    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    // Find or create a test event
    let testEvent = await this.prisma.webhookEvent.findUnique({
      where: { eventType: 'test.ping' },
    });

    if (!testEvent) {
      testEvent = await this.prisma.webhookEvent.create({
        data: {
          eventType: 'test.ping',
          description: 'Test ping event for verifying webhook endpoints',
        },
      });
    }

    // Trigger event directly for this endpoint
    await this.webhooksService.triggerEvent({
      tenantId,
      eventType: 'test.ping',
      data: {
        message: 'This is a test webhook from Facturador Electrónico SV',
        timestamp: new Date().toISOString(),
      },
      correlationId: `test-${Date.now()}`,
    });

    return {
      status: HttpStatus.OK,
      message: 'Test webhook enviado',
    };
  }
}
