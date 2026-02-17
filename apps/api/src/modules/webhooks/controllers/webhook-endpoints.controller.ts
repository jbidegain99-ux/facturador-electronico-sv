import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
import * as crypto from 'crypto';

interface CreateEndpointBody {
  name: string;
  url: string;
  events: string[];
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

interface UpdateEndpointBody {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('api/v1/webhooks/endpoints')
export class WebhookEndpointsController {
  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List webhook endpoints for current tenant' })
  async getEndpoints(@CurrentUser('tenantId') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { tenantId },
      include: {
        subscribedEvents: {
          include: {
            event: {
              select: { eventType: true, description: true },
            },
          },
        },
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to flatten events
    const data = endpoints.map((ep) => ({
      id: ep.id,
      name: ep.name,
      url: ep.url,
      isActive: ep.isActive,
      timeoutMs: ep.timeoutMs,
      maxRetries: ep.maxRetries,
      retryDelayMs: ep.retryDelayMs,
      lastUsedAt: ep.lastUsedAt,
      createdAt: ep.createdAt,
      updatedAt: ep.updatedAt,
      events: ep.subscribedEvents.map((se) => ({
        eventType: se.event.eventType,
        description: se.event.description,
      })),
      deliveryCount: ep._count.deliveries,
    }));

    return { status: HttpStatus.OK, data };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook endpoint' })
  async createEndpoint(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateEndpointBody,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');
    if (!dto.name || !dto.url || !dto.events?.length) {
      throw new BadRequestException('name, url, y events son requeridos');
    }

    // Validate events exist
    const validEvents = await this.prisma.webhookEvent.findMany({
      where: { eventType: { in: dto.events } },
    });

    if (validEvents.length !== dto.events.length) {
      const found = validEvents.map((e) => e.eventType);
      const missing = dto.events.filter((e) => !found.includes(e));
      throw new BadRequestException(`Eventos no válidos: ${missing.join(', ')}`);
    }

    const secretKey = crypto.randomBytes(32).toString('hex');

    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        tenantId,
        name: dto.name,
        url: dto.url,
        secretKey,
        timeoutMs: dto.timeoutMs ?? 30000,
        maxRetries: dto.maxRetries ?? 5,
        retryDelayMs: dto.retryDelayMs ?? 1000,
        subscribedEvents: {
          create: validEvents.map((evt) => ({
            eventId: evt.id,
          })),
        },
      },
      include: {
        subscribedEvents: {
          include: { event: { select: { eventType: true, description: true } } },
        },
      },
    });

    return {
      status: HttpStatus.CREATED,
      data: {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        isActive: endpoint.isActive,
        secretKey, // Only returned on creation
        events: endpoint.subscribedEvents.map((se) => ({
          eventType: se.event.eventType,
          description: se.event.description,
        })),
        createdAt: endpoint.createdAt,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get endpoint details' })
  async getEndpoint(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') endpointId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, tenantId },
      include: {
        subscribedEvents: {
          include: { event: { select: { eventType: true, description: true } } },
        },
      },
    });

    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    return {
      status: HttpStatus.OK,
      data: {
        id: endpoint.id,
        name: endpoint.name,
        url: endpoint.url,
        isActive: endpoint.isActive,
        timeoutMs: endpoint.timeoutMs,
        maxRetries: endpoint.maxRetries,
        retryDelayMs: endpoint.retryDelayMs,
        lastUsedAt: endpoint.lastUsedAt,
        createdAt: endpoint.createdAt,
        updatedAt: endpoint.updatedAt,
        hasSecretKey: true,
        events: endpoint.subscribedEvents.map((se) => ({
          eventType: se.event.eventType,
          description: se.event.description,
        })),
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook endpoint' })
  async updateEndpoint(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') endpointId: string,
    @Body() dto: UpdateEndpointBody,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });

    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    // Build update data without using `any`
    interface EndpointUpdateData {
      name?: string;
      url?: string;
      isActive?: boolean;
      timeoutMs?: number;
      maxRetries?: number;
      retryDelayMs?: number;
    }
    const updateData: EndpointUpdateData = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.url !== undefined) updateData.url = dto.url;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.timeoutMs !== undefined) updateData.timeoutMs = dto.timeoutMs;
    if (dto.maxRetries !== undefined) updateData.maxRetries = dto.maxRetries;
    if (dto.retryDelayMs !== undefined) updateData.retryDelayMs = dto.retryDelayMs;

    // Update events if provided
    if (dto.events) {
      const validEvents = await this.prisma.webhookEvent.findMany({
        where: { eventType: { in: dto.events } },
      });

      if (validEvents.length !== dto.events.length) {
        throw new BadRequestException('Algunos eventos no son válidos');
      }

      // Delete existing subscriptions and create new ones
      await this.prisma.webhookEndpointEvent.deleteMany({
        where: { endpointId },
      });

      await this.prisma.webhookEndpointEvent.createMany({
        data: validEvents.map((evt) => ({
          endpointId,
          eventId: evt.id,
        })),
      });
    }

    const updated = await this.prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: updateData,
      include: {
        subscribedEvents: {
          include: { event: { select: { eventType: true, description: true } } },
        },
      },
    });

    return {
      status: HttpStatus.OK,
      data: {
        id: updated.id,
        name: updated.name,
        url: updated.url,
        isActive: updated.isActive,
        timeoutMs: updated.timeoutMs,
        maxRetries: updated.maxRetries,
        retryDelayMs: updated.retryDelayMs,
        lastUsedAt: updated.lastUsedAt,
        events: updated.subscribedEvents.map((se) => ({
          eventType: se.event.eventType,
          description: se.event.description,
        })),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook endpoint' })
  async deleteEndpoint(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') endpointId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });

    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    await this.prisma.webhookEndpoint.delete({
      where: { id: endpointId },
    });

    return {
      status: HttpStatus.OK,
      message: 'Endpoint eliminado exitosamente',
    };
  }

  @Post(':id/regenerate-secret')
  @ApiOperation({ summary: 'Regenerate endpoint secret key' })
  async regenerateSecret(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') endpointId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });

    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    const newSecretKey = crypto.randomBytes(32).toString('hex');

    await this.prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { secretKey: newSecretKey },
    });

    return {
      status: HttpStatus.OK,
      data: { secretKey: newSecretKey },
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get endpoint delivery stats' })
  async getEndpointStats(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') endpointId: string,
    @Query('days') days = '7',
  ) {
    if (!tenantId) throw new BadRequestException('Tenant no asignado');

    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: { id: endpointId, tenantId },
    });

    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');

    const daysNum = parseInt(days, 10) || 7;
    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    const [total, delivered, failed, deadLetter] = await Promise.all([
      this.prisma.webhookDelivery.count({
        where: { endpointId, createdAt: { gte: since } },
      }),
      this.prisma.webhookDelivery.count({
        where: { endpointId, status: 'DELIVERED', createdAt: { gte: since } },
      }),
      this.prisma.webhookDelivery.count({
        where: { endpointId, status: 'FAILED', createdAt: { gte: since } },
      }),
      this.prisma.webhookDelivery.count({
        where: { endpointId, status: 'DEAD_LETTER', createdAt: { gte: since } },
      }),
    ]);

    const successRate = total > 0 ? parseFloat(((delivered / total) * 100).toFixed(2)) : 0;

    return {
      status: HttpStatus.OK,
      data: {
        totalDeliveries: total,
        successfulDeliveries: delivered,
        failedDeliveries: failed,
        deadLetterDeliveries: deadLetter,
        successRate,
        period: `${daysNum} days`,
      },
    };
  }
}
