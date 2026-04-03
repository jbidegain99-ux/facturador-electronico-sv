# PROMPT: Sistema Completo de Webhooks para Facturador Electrónico SV

## 🎯 OBJETIVO

Implementar un sistema robusto de webhooks outbound/inbound en el Facturador Electrónico SV que permita:

1. **Notificaciones automáticas** cuando ocurran eventos importantes en el sistema
2. **Integración específica con Wellnest Studio** para facturación automática de compras de paquetes
3. **Dashboard de monitoreo** para gestión y troubleshooting de webhooks
4. **Sistema de reintentos** con backoff exponencial y dead letter queue
5. **Seguridad robusta** con HMAC signatures y rate limiting

## 📋 CONTEXTO TÉCNICO

**Arquitectura Actual:**
- Backend: NestJS + Prisma ORM + Azure SQL Database
- Sistema multi-tenant por `tenantId`
- Eventos DTE: creación, firma, transmisión, aprobación/rechazo MH
- BullMQ para jobs asíncronos (facturas recurrentes)

**Integración Target - Wellnest Studio:**
- Plataforma: Next.js 14 + PostgreSQL + Stripe
- Sistema de paquetes de clases (Yoga, Pilates, Pole Sport, etc.)
- Compra → Stripe → Webhook a Facturador → Crear DTE automático
- URL: wellneststudio.net / contact@wellneststudio.net

## 🏗️ DISEÑO ARQUITECTÓNICO

### Schema Prisma (Añadir a schema.prisma)

```prisma
// Configuración de webhooks por tenant
model WebhookEndpoint {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Configuración básica
  name        String   // "Wellnest Integration"
  url         String   // "https://wellneststudio.net/api/webhooks/facturador"
  isActive    Boolean  @default(true)
  secretKey   String   // Para HMAC signature
  
  // Eventos suscritos
  events      WebhookEvent[] // Relación con eventos habilitados
  
  // Configuración avanzada
  timeoutMs   Int      @default(30000) // 30s timeout
  maxRetries  Int      @default(5)
  retryDelayMs Int     @default(1000)  // Base delay, exponential backoff
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lastUsed    DateTime?
  
  // Índices
  @@unique([tenantId, name])
  @@map("webhook_endpoints")
}

// Eventos disponibles para webhooks
model WebhookEvent {
  id          String   @id @default(uuid())
  
  // Evento específico
  eventType   String   // "dte.created", "dte.approved", "invoice.paid"
  description String   // "DTE ha sido aprobado por el Ministerio de Hacienda"
  
  // Relaciones
  endpoints   WebhookEndpoint[]
  deliveries  WebhookDelivery[]
  
  @@unique([eventType])
  @@map("webhook_events")
}

// Log inmutable de todas las entregas de webhook
model WebhookDelivery {
  id              String   @id @default(uuid())
  
  // Referencias
  tenantId        String
  endpointId      String
  eventId         String
  endpoint        WebhookEndpoint @relation(fields: [endpointId], references: [id])
  event           WebhookEvent    @relation(fields: [eventId], references: [id])
  
  // Identificación única para idempotencia
  idempotencyKey  String   @unique // evento + timestamp + tenant
  
  // Payload enviado
  payload         Json     // Datos del evento serializado
  headers         Json     // Headers HTTP enviados
  
  // Estado de entrega
  status          WebhookDeliveryStatus @default(PENDING)
  attemptCount    Int      @default(0)
  maxAttempts     Int      @default(5)
  
  // Respuesta recibida
  responseStatus  Int?     // HTTP status code
  responseHeaders Json?    // Headers de respuesta
  responseBody    String?  // Body de respuesta (limitado)
  
  // Timing
  sentAt          DateTime?
  completedAt     DateTime?
  nextRetryAt     DateTime?
  
  // Error tracking
  errorMessage    String?
  errorTrace      String?
  
  // Metadata
  createdAt       DateTime @default(now())
  
  @@index([tenantId, status])
  @@index([endpointId, createdAt])
  @@index([nextRetryAt]) // Para retry jobs
  @@map("webhook_deliveries")
}

enum WebhookDeliveryStatus {
  PENDING      // Esperando ser enviado
  SENDING      // En proceso de envío
  DELIVERED    // Enviado exitosamente (2xx response)
  FAILED       // Falló temporalmente, se reintentará
  DEAD_LETTER  // Agotó todos los intentos
  CANCELLED    // Cancelado manualmente
}

// Tabla puente para eventos habilitados por endpoint
model WebhookEndpointEvent {
  endpointId String
  eventId    String
  
  endpoint   WebhookEndpoint @relation(fields: [endpointId], references: [id], onDelete: Cascade)
  event      WebhookEvent    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@id([endpointId, eventId])
  @@map("webhook_endpoint_events")
}
```

### Enum de Estado de Entrega

```typescript
export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING', 
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER',
  CANCELLED = 'CANCELLED'
}
```

## 🔧 IMPLEMENTACIÓN BACKEND

### 1. Módulo Webhooks Core (`src/modules/webhooks/`)

**webhooks.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhooksService } from './webhooks.service';
import { WebhookProcessor } from './webhook.processor';
import { WebhookEndpointsController } from './controllers/webhook-endpoints.controller';
import { WebhookDeliveriesController } from './controllers/webhook-deliveries.controller';
import { WebhookEventsService } from './webhook-events.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhooks',
      defaultJobOptions: {
        attempts: 1, // Controlamos reintentos manualmente
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    }),
  ],
  providers: [
    WebhooksService,
    WebhookEventsService,
    WebhookProcessor,
  ],
  controllers: [
    WebhookEndpointsController,
    WebhookDeliveriesController,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
```

**webhooks.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus } from '@prisma/client';
import * as crypto from 'crypto';

export interface WebhookEventData {
  tenantId: string;
  eventType: string; // 'dte.created', 'dte.approved', etc.
  data: Record<string, any>;
  correlationId?: string;
  timestamp?: Date;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('webhooks') private webhookQueue: Queue,
  ) {}

  /**
   * Disparar evento de webhook para un tenant específico
   */
  async triggerEvent(eventData: WebhookEventData): Promise<void> {
    const { tenantId, eventType, data, correlationId } = eventData;
    
    this.logger.log(`Triggering webhook event: ${eventType} for tenant ${tenantId}`);

    // Buscar endpoints activos que tengan este evento habilitado
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        isActive: true,
        events: {
          some: {
            eventType,
          },
        },
      },
      include: {
        events: {
          where: { eventType },
        },
      },
    });

    if (endpoints.length === 0) {
      this.logger.debug(`No active endpoints found for event ${eventType} in tenant ${tenantId}`);
      return;
    }

    // Crear deliveries para cada endpoint
    for (const endpoint of endpoints) {
      const event = endpoint.events[0]; // Solo debería haber uno por eventType
      
      const idempotencyKey = this.generateIdempotencyKey(
        tenantId,
        eventType,
        correlationId || crypto.randomUUID(),
        new Date()
      );

      // Verificar si ya existe este delivery (idempotencia)
      const existingDelivery = await this.prisma.webhookDelivery.findUnique({
        where: { idempotencyKey },
      });

      if (existingDelivery) {
        this.logger.warn(`Duplicate webhook delivery skipped: ${idempotencyKey}`);
        continue;
      }

      // Crear el delivery record
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          tenantId,
          endpointId: endpoint.id,
          eventId: event.id,
          idempotencyKey,
          payload: {
            event: eventType,
            timestamp: new Date().toISOString(),
            tenant_id: tenantId,
            data,
            correlation_id: correlationId,
          },
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Facturador-SV-Webhooks/1.0',
            'X-Webhook-Event': eventType,
            'X-Webhook-Delivery': idempotencyKey,
          },
          maxAttempts: endpoint.maxRetries,
        },
      });

      // Agregar job a la cola
      await this.webhookQueue.add(
        'send-webhook',
        {
          deliveryId: delivery.id,
        },
        {
          delay: 0, // Envío inmediato
          jobId: delivery.id, // Prevenir duplicados
        }
      );
    }
  }

  /**
   * Generar clave de idempotencia única
   */
  private generateIdempotencyKey(
    tenantId: string,
    eventType: string,
    correlationId: string,
    timestamp: Date
  ): string {
    const data = `${tenantId}:${eventType}:${correlationId}:${timestamp.getTime()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Crear signature HMAC para seguridad
   */
  generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Obtener estadísticas de webhooks para un tenant
   */
  async getWebhookStats(tenantId: string, days = 7): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalDeliveries, successfulDeliveries, failedDeliveries] = await Promise.all([
      this.prisma.webhookDelivery.count({
        where: {
          tenantId,
          createdAt: { gte: since },
        },
      }),
      this.prisma.webhookDelivery.count({
        where: {
          tenantId,
          status: WebhookDeliveryStatus.DELIVERED,
          createdAt: { gte: since },
        },
      }),
      this.prisma.webhookDelivery.count({
        where: {
          tenantId,
          status: {
            in: [WebhookDeliveryStatus.FAILED, WebhookDeliveryStatus.DEAD_LETTER],
          },
          createdAt: { gte: since },
        },
      }),
    ]);

    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate: parseFloat(successRate.toFixed(2)),
      period: `${days} days`,
    };
  }
}
```

### 2. Processor de Webhooks (`webhook.processor.ts`)

```typescript
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookDeliveryStatus } from '@prisma/client';
import { WebhooksService } from './webhooks.service';
import axios, { AxiosResponse } from 'axios';

interface WebhookJobData {
  deliveryId: string;
}

@Processor('webhooks')
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  @Process('send-webhook')
  async handleWebhookDelivery(job: Job<WebhookJobData>): Promise<void> {
    const { deliveryId } = job.data;
    
    this.logger.log(`Processing webhook delivery: ${deliveryId}`);

    // Obtener delivery con endpoint info
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        endpoint: true,
        event: true,
      },
    });

    if (!delivery) {
      throw new Error(`Webhook delivery not found: ${deliveryId}`);
    }

    if (delivery.status !== WebhookDeliveryStatus.PENDING) {
      this.logger.warn(`Delivery ${deliveryId} is not pending, skipping`);
      return;
    }

    // Marcar como enviando
    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: WebhookDeliveryStatus.SENDING,
        attemptCount: { increment: 1 },
        sentAt: new Date(),
      },
    });

    try {
      // Preparar payload y signature
      const payloadString = JSON.stringify(delivery.payload);
      const signature = this.webhooksService.generateSignature(
        payloadString,
        delivery.endpoint.secretKey
      );

      const headers = {
        ...delivery.headers,
        'X-Webhook-Signature-256': `sha256=${signature}`,
        'X-Webhook-Timestamp': Math.floor(Date.now() / 1000).toString(),
      };

      // Enviar webhook
      const response: AxiosResponse = await axios.post(
        delivery.endpoint.url,
        delivery.payload,
        {
          headers: headers as any,
          timeout: delivery.endpoint.timeoutMs,
          validateStatus: (status) => status >= 200 && status < 300,
        }
      );

      // Marcar como entregado exitosamente
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: WebhookDeliveryStatus.DELIVERED,
          responseStatus: response.status,
          responseHeaders: this.sanitizeHeaders(response.headers),
          responseBody: this.truncateResponse(response.data),
          completedAt: new Date(),
          errorMessage: null,
          errorTrace: null,
        },
      });

      // Actualizar lastUsed del endpoint
      await this.prisma.webhookEndpoint.update({
        where: { id: delivery.endpoint.id },
        data: { lastUsed: new Date() },
      });

      this.logger.log(`Webhook delivered successfully: ${deliveryId} to ${delivery.endpoint.url}`);

    } catch (error) {
      await this.handleWebhookError(delivery, error);
    }
  }

  private async handleWebhookError(delivery: any, error: any): Promise<void> {
    const canRetry = delivery.attemptCount < delivery.maxAttempts;
    const isTemporaryError = this.isRetriableError(error);

    if (canRetry && isTemporaryError) {
      // Calcular delay con backoff exponencial
      const baseDelay = delivery.endpoint.retryDelayMs;
      const exponentialDelay = baseDelay * Math.pow(2, delivery.attemptCount - 1);
      const jitterDelay = exponentialDelay + Math.random() * 1000; // Jitter
      const nextRetryAt = new Date(Date.now() + jitterDelay);

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: WebhookDeliveryStatus.FAILED,
          responseStatus: error.response?.status || null,
          responseHeaders: error.response?.headers ? this.sanitizeHeaders(error.response.headers) : null,
          responseBody: error.response?.data ? this.truncateResponse(error.response.data) : null,
          errorMessage: error.message,
          errorTrace: error.stack,
          nextRetryAt,
        },
      });

      // Programar reintento
      await job.getQueue().add(
        'send-webhook',
        { deliveryId: delivery.id },
        {
          delay: jitterDelay,
          jobId: `${delivery.id}-retry-${delivery.attemptCount}`,
        }
      );

      this.logger.warn(`Webhook delivery failed, will retry: ${delivery.id} in ${Math.round(jitterDelay / 1000)}s`);
    } else {
      // Marcar como dead letter
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: WebhookDeliveryStatus.DEAD_LETTER,
          responseStatus: error.response?.status || null,
          responseHeaders: error.response?.headers ? this.sanitizeHeaders(error.response.headers) : null,
          responseBody: error.response?.data ? this.truncateResponse(error.response.data) : null,
          errorMessage: error.message,
          errorTrace: error.stack,
          completedAt: new Date(),
        },
      });

      this.logger.error(`Webhook delivery failed permanently: ${delivery.id} - ${error.message}`);
    }
  }

  private isRetriableError(error: any): boolean {
    // Errores 5xx son retriables, 4xx generalmente no
    if (error.response?.status) {
      return error.response.status >= 500;
    }
    
    // Errores de red/timeout son retriables
    return error.code === 'ECONNREFUSED' || 
           error.code === 'ETIMEDOUT' || 
           error.code === 'ENOTFOUND' ||
           error.message.includes('timeout');
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    // Remover headers sensibles
    delete sanitized['set-cookie'];
    delete sanitized['authorization'];
    return sanitized;
  }

  private truncateResponse(data: any): string {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return stringData.length > 1000 ? stringData.substring(0, 1000) + '...' : stringData;
  }
}
```

### 3. Controladores REST API

**webhook-endpoints.controller.ts:**
```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService } from '../webhooks.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import * as crypto from 'crypto';

class CreateWebhookEndpointDto {
  name: string;
  url: string;
  events: string[]; // Array of event types
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

class UpdateWebhookEndpointDto {
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
@Controller('api/webhooks/endpoints')
@UseGuards(JwtAuthGuard, TenantGuard)
export class WebhookEndpointsController {
  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista endpoints de webhooks del tenant' })
  async getEndpoints(@CurrentTenant() tenantId: string) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { tenantId },
      include: {
        events: {
          select: {
            eventType: true,
            description: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: HttpStatus.OK,
      data: endpoints,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Crear nuevo endpoint de webhook' })
  async createEndpoint(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateWebhookEndpointDto,
  ) {
    // Validar que los eventos existen
    const validEvents = await this.prisma.webhookEvent.findMany({
      where: {
        eventType: { in: dto.events },
      },
    });

    if (validEvents.length !== dto.events.length) {
      throw new Error('Algunos eventos especificados no existen');
    }

    // Generar secret key
    const secretKey = crypto.randomBytes(32).toString('hex');

    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        tenantId,
        name: dto.name,
        url: dto.url,
        secretKey,
        timeoutMs: dto.timeoutMs || 30000,
        maxRetries: dto.maxRetries || 5,
        retryDelayMs: dto.retryDelayMs || 1000,
        events: {
          connect: validEvents.map(event => ({ id: event.id })),
        },
      },
      include: {
        events: {
          select: {
            eventType: true,
            description: true,
          },
        },
      },
    });

    return {
      status: HttpStatus.CREATED,
      data: {
        ...endpoint,
        secretKey: secretKey, // Solo se devuelve en creación
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de endpoint específico' })
  async getEndpoint(
    @CurrentTenant() tenantId: string,
    @Param('id') endpointId: string,
  ) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        tenantId,
      },
      include: {
        events: {
          select: {
            eventType: true,
            description: true,
          },
        },
      },
    });

    if (!endpoint) {
      throw new Error('Endpoint no encontrado');
    }

    // No devolver el secretKey en consultas GET
    const { secretKey, ...endpointWithoutSecret } = endpoint;

    return {
      status: HttpStatus.OK,
      data: {
        ...endpointWithoutSecret,
        hasSecretKey: !!secretKey,
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar endpoint de webhook' })
  async updateEndpoint(
    @CurrentTenant() tenantId: string,
    @Param('id') endpointId: string,
    @Body() dto: UpdateWebhookEndpointDto,
  ) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        tenantId,
      },
    });

    if (!endpoint) {
      throw new Error('Endpoint no encontrado');
    }

    const updateData: any = {};
    
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.url !== undefined) updateData.url = dto.url;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.timeoutMs !== undefined) updateData.timeoutMs = dto.timeoutMs;
    if (dto.maxRetries !== undefined) updateData.maxRetries = dto.maxRetries;
    if (dto.retryDelayMs !== undefined) updateData.retryDelayMs = dto.retryDelayMs;

    // Actualizar eventos si se proporcionan
    if (dto.events) {
      const validEvents = await this.prisma.webhookEvent.findMany({
        where: {
          eventType: { in: dto.events },
        },
      });

      if (validEvents.length !== dto.events.length) {
        throw new Error('Algunos eventos especificados no existen');
      }

      updateData.events = {
        set: validEvents.map(event => ({ id: event.id })),
      };
    }

    const updatedEndpoint = await this.prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: updateData,
      include: {
        events: {
          select: {
            eventType: true,
            description: true,
          },
        },
      },
    });

    const { secretKey, ...endpointWithoutSecret } = updatedEndpoint;

    return {
      status: HttpStatus.OK,
      data: endpointWithoutSecret,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar endpoint de webhook' })
  async deleteEndpoint(
    @CurrentTenant() tenantId: string,
    @Param('id') endpointId: string,
  ) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        tenantId,
      },
    });

    if (!endpoint) {
      throw new Error('Endpoint no encontrado');
    }

    await this.prisma.webhookEndpoint.delete({
      where: { id: endpointId },
    });

    return {
      status: HttpStatus.OK,
      message: 'Endpoint eliminado exitosamente',
    };
  }

  @Post(':id/regenerate-secret')
  @ApiOperation({ summary: 'Regenerar secret key del endpoint' })
  async regenerateSecret(
    @CurrentTenant() tenantId: string,
    @Param('id') endpointId: string,
  ) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        tenantId,
      },
    });

    if (!endpoint) {
      throw new Error('Endpoint no encontrado');
    }

    const newSecretKey = crypto.randomBytes(32).toString('hex');

    await this.prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: { secretKey: newSecretKey },
    });

    return {
      status: HttpStatus.OK,
      data: {
        secretKey: newSecretKey,
      },
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Estadísticas del endpoint' })
  async getEndpointStats(
    @CurrentTenant() tenantId: string,
    @Param('id') endpointId: string,
    @Query('days') days = '7',
  ) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        tenantId,
      },
    });

    if (!endpoint) {
      throw new Error('Endpoint no encontrado');
    }

    const daysNum = parseInt(days, 10);
    const since = new Date();
    since.setDate(since.getDate() - daysNum);

    const [totalDeliveries, successfulDeliveries, failedDeliveries, deadLetterDeliveries] = await Promise.all([
      this.prisma.webhookDelivery.count({
        where: {
          endpointId,
          createdAt: { gte: since },
        },
      }),
      this.prisma.webhookDelivery.count({
        where: {
          endpointId,
          status: 'DELIVERED',
          createdAt: { gte: since },
        },
      }),
      this.prisma.webhookDelivery.count({
        where: {
          endpointId,
          status: 'FAILED',
          createdAt: { gte: since },
        },
      }),
      this.prisma.webhookDelivery.count({
        where: {
          endpointId,
          status: 'DEAD_LETTER',
          createdAt: { gte: since },
        },
      }),
    ]);

    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    return {
      status: HttpStatus.OK,
      data: {
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        deadLetterDeliveries,
        successRate: parseFloat(successRate.toFixed(2)),
        period: `${daysNum} days`,
      },
    };
  }
}
```

## 🔄 INTEGRACIÓN CON EVENTOS EXISTENTES

### Modificar el servicio DTE para disparar webhooks

**En `src/modules/dte/dte.service.ts`:**

```typescript
// Importar el servicio de webhooks
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class DteService {
  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService, // Inyectar servicio
    // ... otros servicios
  ) {}

  async createDTE(tenantId: string, dteData: CreateDTEDto): Promise<DTE> {
    // Lógica existente de creación...
    const dte = await this.prisma.dTE.create({
      data: {
        // ... datos del DTE
      }
    });

    // Disparar webhook
    await this.webhooksService.triggerEvent({
      tenantId,
      eventType: 'dte.created',
      data: {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        tipoDocumento: dte.tipoDocumento,
        numeroControl: dte.numeroControl,
        fechaEmision: dte.fechaEmision,
        montoTotal: dte.montoTotal,
        cliente: {
          nombre: dte.nombreReceptor,
          documento: dte.numDocumentoReceptor,
        },
        // Datos específicos para Wellnest
        external_reference: dteData.externalReference, // ID de compra de Wellnest
        pdf_url: null, // Se generará después
      },
      correlationId: dte.id,
    });

    return dte;
  }

  async approveDTE(dteId: string): Promise<void> {
    // Lógica de aprobación por MH...
    const dte = await this.prisma.dTE.update({
      where: { id: dteId },
      data: {
        estado: 'APROBADO',
        selloRecibido: 'SELLO_MH_123',
        // ... otros campos
      }
    });

    // Generar PDF si no existe
    const pdfUrl = await this.generateDTEPdf(dte.id);

    // Disparar webhook de aprobación
    await this.webhooksService.triggerEvent({
      tenantId: dte.tenantId,
      eventType: 'dte.approved',
      data: {
        dteId: dte.id,
        codigoGeneracion: dte.codigoGeneracion,
        selloRecibido: dte.selloRecibido,
        pdf_url: pdfUrl,
        estado: 'APROBADO',
        fechaAprobacion: new Date().toISOString(),
        external_reference: dte.externalReference,
      },
      correlationId: dte.id,
    });
  }
}
```

## 🎯 CONFIGURACIÓN ESPECÍFICA PARA WELLNEST

### Eventos Iniciales a Crear

```sql
-- Insertar eventos disponibles
INSERT INTO webhook_events (id, event_type, description) VALUES
(gen_random_uuid(), 'dte.created', 'DTE ha sido creado y está listo para firma'),
(gen_random_uuid(), 'dte.signed', 'DTE ha sido firmado digitalmente'),
(gen_random_uuid(), 'dte.transmitted', 'DTE ha sido enviado al Ministerio de Hacienda'),
(gen_random_uuid(), 'dte.approved', 'DTE ha sido aprobado por el Ministerio de Hacienda'),
(gen_random_uuid(), 'dte.rejected', 'DTE ha sido rechazado por el Ministerio de Hacienda'),
(gen_random_uuid(), 'invoice.paid', 'Factura ha sido marcada como pagada'),
(gen_random_uuid(), 'client.created', 'Nuevo cliente ha sido registrado'),
(gen_random_uuid(), 'quote.approved', 'Cotización ha sido aprobada');
```

### Endpoint para Webhook Inbound de Wellnest

**Crear `src/modules/webhooks/controllers/inbound.controller.ts`:**

```typescript
import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DteService } from '../../dte/dte.service';
import { WebhooksService } from '../webhooks.service';
import * as crypto from 'crypto';

interface WellnestPurchaseWebhook {
  userId: string;
  packageId: string;
  purchaseId: string;
  amount: number;
  currency: string;
  purchaseDate: string;
  expirationDate: string;
  creditsTotal: number;
  paymentMethod: string;
  discountApplied?: number;
  customerData: {
    name: string;
    email: string;
    phone?: string;
  };
}

@Controller('api/webhooks/inbound')
export class InboundWebhooksController {
  private readonly logger = new Logger(InboundWebhooksController.name);

  constructor(
    private prisma: PrismaService,
    private dteService: DteService,
    private webhooksService: WebhooksService,
  ) {}

  @Post('wellnest/:tenantId')
  async handleWellnestPurchase(
    @Param('tenantId') tenantId: string,
    @Body() payload: WellnestPurchaseWebhook,
    @Headers('x-webhook-signature-256') signature?: string,
    @Headers('x-webhook-timestamp') timestamp?: string,
  ) {
    this.logger.log(`Received Wellnest webhook for tenant ${tenantId}`);

    // Verificar que el tenant existe y tiene configuración Wellnest
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant no encontrado');
    }

    // Verificar signature si está configurada
    if (signature) {
      const isValid = this.verifyWebhookSignature(
        JSON.stringify(payload),
        signature,
        'WELLNEST_SECRET_KEY' // Esto debería venir de config del tenant
      );

      if (!isValid) {
        throw new UnauthorizedException('Signature inválida');
      }
    }

    try {
      // Crear DTE automático para la compra
      const dte = await this.dteService.createDTE(tenantId, {
        tipoDocumento: '01', // Factura
        externalReference: payload.purchaseId,
        
        // Datos del cliente
        nombreReceptor: payload.customerData.name,
        emailReceptor: payload.customerData.email,
        telefonoReceptor: payload.customerData.phone || '',
        
        // Datos del documento
        fechaEmision: new Date(payload.purchaseDate),
        condicionOperacion: '1', // Contado
        
        // Items de la factura
        items: [{
          numeroItem: 1,
          tipoItem: '2', // Servicio
          descripcion: `Paquete de ${payload.creditsTotal} clases - Wellnest Studio`,
          cantidad: 1,
          unidadMedida: '59', // Unidad
          precioUni: payload.amount,
          montoDescu: payload.discountApplied || 0,
          ventaNoSuj: 0,
          ventaExenta: 0,
          ventaGravada: payload.amount - (payload.discountApplied || 0),
          tributos: null,
        }],
        
        // Resumen
        totalNoSuj: 0,
        totalExenta: 0,
        totalGravada: payload.amount - (payload.discountApplied || 0),
        subTotal: payload.amount - (payload.discountApplied || 0),
        ivaRete1: 0,
        reteRenta: 0,
        montoTotalOperacion: payload.amount - (payload.discountApplied || 0),
        totalIva: (payload.amount - (payload.discountApplied || 0)) * 0.13, // IVA 13%
        montoTotal: payload.amount,
      });

      // Responder a Wellnest con el ID del DTE creado
      return {
        status: HttpStatus.OK,
        data: {
          dteId: dte.id,
          codigoGeneracion: dte.codigoGeneracion,
          message: 'DTE creado exitosamente',
        },
      };

    } catch (error) {
      this.logger.error(`Error processing Wellnest webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  private verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );
  }
}
```

## 📊 FRONTEND - Dashboard de Webhooks

### Página de Gestión de Webhooks (`apps/web/src/app/(authenticated)/webhooks/page.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Plus, Settings, BarChart } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  events: Array<{
    eventType: string;
    description: string;
  }>;
  lastUsed: string | null;
  createdAt: string;
}

interface WebhookStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deadLetterDeliveries: number;
  successRate: number;
  period: string;
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);

  useEffect(() => {
    loadEndpoints();
    loadGlobalStats();
  }, []);

  const loadEndpoints = async () => {
    try {
      const response = await fetch('/api/webhooks/endpoints', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEndpoints(data.data);
      }
    } catch (error) {
      toast.error('Error cargando endpoints');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStats = async () => {
    try {
      const response = await fetch('/api/webhooks/stats?days=7', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const toggleEndpoint = async (endpointId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/endpoints/${endpointId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await loadEndpoints();
        toast.success(`Endpoint ${!isActive ? 'activado' : 'desactivado'} exitosamente`);
      }
    } catch (error) {
      toast.error('Error actualizando endpoint');
    }
  };

  const getStatusBadge = (isActive: boolean, lastUsed: string | null) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    
    if (!lastUsed) {
      return <Badge variant="outline">Sin usar</Badge>;
    }

    const daysSinceUsed = Math.floor((Date.now() - new Date(lastUsed).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceUsed <= 1) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>;
    } else if (daysSinceUsed <= 7) {
      return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Poco uso</Badge>;
    } else {
      return <Badge variant="outline" className="border-red-300 text-red-700">Sin actividad</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-gray-600">Integraciones y notificaciones en tiempo real</p>
        </div>
        
        <CreateWebhookDialog onSuccess={loadEndpoints} />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entregas</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">Últimos {stats.period}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exitosas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.successfulDeliveries}</div>
              <p className="text-xs text-muted-foreground">{stats.successRate}% tasa de éxito</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedDeliveries}</div>
              <p className="text-xs text-muted-foreground">Reintentos pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dead Letter</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.deadLetterDeliveries}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Endpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoints Configurados</CardTitle>
          <CardDescription>
            Gestiona las URLs que reciben notificaciones de eventos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Último Uso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.map((endpoint) => (
                <TableRow key={endpoint.id}>
                  <TableCell className="font-medium">{endpoint.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{endpoint.url}</TableCell>
                  <TableCell>{getStatusBadge(endpoint.isActive, endpoint.lastUsed)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.events.slice(0, 2).map((event) => (
                        <Badge key={event.eventType} variant="outline" className="text-xs">
                          {event.eventType}
                        </Badge>
                      ))}
                      {endpoint.events.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{endpoint.events.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {endpoint.lastUsed ? (
                      <span className="text-sm">
                        {new Date(endpoint.lastUsed).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={endpoint.isActive ? "destructive" : "default"}
                        onClick={() => toggleEndpoint(endpoint.id, endpoint.isActive)}
                      >
                        {endpoint.isActive ? "Desactivar" : "Activar"}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedEndpoint(endpoint)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {endpoints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-gray-500">No tienes endpoints configurados</p>
                      <CreateWebhookDialog onSuccess={loadEndpoints} />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Endpoint Details Modal */}
      {selectedEndpoint && (
        <EndpointDetailsDialog 
          endpoint={selectedEndpoint}
          onClose={() => setSelectedEndpoint(null)}
          onUpdate={loadEndpoints}
        />
      )}
    </div>
  );
}

// Subcomponentes CreateWebhookDialog y EndpointDetailsDialog...
// [Código de los subcomponentes aquí]
```

## 📝 DOCUMENTACIÓN PARA WELLNEST

### Guía de Integración

```markdown
# Integración Wellnest → Facturador Electrónico SV

## 🔗 URL del Webhook

**Endpoint:** `https://facturador-api-sv.../api/webhooks/inbound/wellnest/{TENANT_ID}`
**Método:** `POST`
**Content-Type:** `application/json`

## 🔐 Autenticación

Incluir header HMAC para validación:
```
X-Webhook-Signature-256: sha256={HMAC_SHA256}
X-Webhook-Timestamp: {UNIX_TIMESTAMP}
```

## 📋 Payload Esperado

```json
{
  "userId": "user_123",
  "packageId": "pack_yoga_10", 
  "purchaseId": "purchase_789",
  "amount": 75.00,
  "currency": "USD",
  "purchaseDate": "2025-02-17T10:30:00Z",
  "expirationDate": "2025-05-17T10:30:00Z",
  "creditsTotal": 10,
  "paymentMethod": "stripe",
  "discountApplied": 15.00,
  "customerData": {
    "name": "María García",
    "email": "maria@email.com",  
    "phone": "+503 7123-4567"
  }
}
```

## 📤 Respuesta Esperada

```json
{
  "status": 200,
  "data": {
    "dteId": "dte_456",
    "codigoGeneracion": "DTE-01-CMPV0000-000000000000001",
    "message": "DTE creado exitosamente"
  }
}
```

## 🔄 Notificaciones de Vuelta

Una vez procesado el DTE, recibirás webhooks de confirmación:

```json
{
  "event": "dte.approved",
  "timestamp": "2025-02-17T10:35:00Z",
  "tenant_id": "{TENANT_ID}",
  "data": {
    "dteId": "dte_456",
    "codigoGeneracion": "DTE-01-CMPV0000-000000000000001",
    "selloRecibido": "SELLO_MH_ABC123",
    "pdf_url": "https://facturador.../pdf/dte_456.pdf",
    "estado": "APROBADO",
    "fechaAprobacion": "2025-02-17T10:34:00Z",
    "external_reference": "purchase_789"
  }
}
```
```

## ⚡ COMANDOS DE DESPLIEGUE

### 1. Migrations

```bash
# Generar migration
npx prisma migrate dev --name "add_webhooks_system"

# Aplicar en producción
npx prisma migrate deploy
```

### 2. Seeds para Eventos

```sql
-- Ejecutar en Azure SQL Database
INSERT INTO webhook_events (id, event_type, description) VALUES
(NEWID(), 'dte.created', 'DTE ha sido creado y está listo para firma'),
(NEWID(), 'dte.signed', 'DTE ha sido firmado digitalmente'),
(NEWID(), 'dte.transmitted', 'DTE ha sido enviado al Ministerio de Hacienda'),
(NEWID(), 'dte.approved', 'DTE ha sido aprobado por el Ministerio de Hacienda'),
(NEWID(), 'dte.rejected', 'DTE ha sido rechazado por el Ministerio de Hacienda'),
(NEWID(), 'invoice.paid', 'Factura ha sido marcada como pagada'),
(NEWID(), 'client.created', 'Nuevo cliente ha sido registrado'),
(NEWID(), 'quote.approved', 'Cotización ha sido aprobada');
```

### 3. Build y Deploy

```bash
# En WSL - Build containers
cd ~/facturador-electronico-sv
docker build -f apps/api/Dockerfile -t facturaapi:v26 .
docker build -f apps/web/Dockerfile -t facturaweb:v38 .

# Tag y push
docker tag facturaapi:v26 facturadorregistrysg.azurecr.io/facturaapi:v26
docker tag facturaweb:v38 facturadorregistrysg.azurecr.io/facturaweb:v38

az acr login --name facturadorregistrysg
docker push facturadorregistrysg.azurecr.io/facturaapi:v26
docker push facturadorregistrysg.azurecr.io/facturaweb:v38

# Actualizar App Services
az webapp config container set \
  --name facturador-api-sv \
  --resource-group facturador-rg \
  --docker-custom-image-name facturadorregistrysg.azurecr.io/facturaapi:v26

az webapp config container set \
  --name facturador-web-sv \
  --resource-group facturador-rg \
  --docker-custom-image-name facturadorregistrysg.azurecr.io/facturaweb:v38

# Restart
az webapp restart --name facturador-api-sv --resource-group facturador-rg
az webapp restart --name facturador-web-sv --resource-group facturador-rg
```

## ✅ CRITERIOS DE ÉXITO

1. **Funcionalidad Core:**
   - ✅ CRUD completo de webhook endpoints
   - ✅ Sistema de eventos configurable
   - ✅ Queue processor con reintentos exponenciales
   - ✅ Dashboard de monitoreo con estadísticas
   - ✅ Seguridad HMAC implementada

2. **Integración Wellnest:**
   - ✅ Endpoint inbound que reciba compras
   - ✅ Creación automática de DTEs
   - ✅ Webhooks outbound de confirmación
   - ✅ Manejo de errores y logging

3. **Producción Ready:**
   - ✅ Multi-tenant isolation por tenantId
   - ✅ Rate limiting y validaciones
   - ✅ Monitoring y alertas
   - ✅ Dead letter queue handling
   - ✅ Retention policies y cleanup

## 🎯 TESTING

### Casos de Prueba Prioritarios

1. **Crear webhook endpoint de Wellnest**
2. **Simular compra desde Wellnest → Verificar DTE creado**
3. **Verificar notificación de aprobación → Wellnest**
4. **Probar reintentos con endpoint offline**
5. **Dashboard muestra estadísticas correctas**

---

**¿LISTO PARA IMPLEMENTAR?** 

Copia este prompt a Claude Code y ejecuta paso a paso. El sistema de webhooks te permitirá conectar automáticamente las compras de Wellnest con la generación de facturas oficiales en El Salvador. 🚀
