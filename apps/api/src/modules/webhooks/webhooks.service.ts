import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

export interface WebhookEventData {
  tenantId: string;
  eventType: string;
  data: Record<string, unknown>;
  correlationId?: string;
}

export interface WebhookStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deadLetterDeliveries: number;
  successRate: number;
  period: string;
}

const DELIVERY_STATUS = {
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  DEAD_LETTER: 'DEAD_LETTER',
  CANCELLED: 'CANCELLED',
} as const;

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Trigger a webhook event for a specific tenant.
   * Creates delivery records for all active endpoints subscribed to this event.
   */
  async triggerEvent(eventData: WebhookEventData): Promise<void> {
    const { tenantId, eventType, data, correlationId } = eventData;

    this.logger.log(`Triggering webhook event: ${eventType} for tenant ${tenantId}`);

    try {
      // Find the event definition
      const event = await this.prisma.webhookEvent.findUnique({
        where: { eventType },
      });

      if (!event) {
        this.logger.debug(`No webhook event definition for ${eventType}, skipping`);
        return;
      }

      // Find active endpoints subscribed to this event for this tenant
      const subscriptions = await this.prisma.webhookEndpointEvent.findMany({
        where: {
          eventId: event.id,
          endpoint: {
            tenantId,
            isActive: true,
          },
        },
        include: {
          endpoint: true,
        },
      });

      if (subscriptions.length === 0) {
        this.logger.debug(`No active endpoints for event ${eventType} in tenant ${tenantId}`);
        return;
      }

      // Create a delivery for each subscribed endpoint
      for (const sub of subscriptions) {
        const idempotencyKey = this.generateIdempotencyKey(
          tenantId,
          eventType,
          correlationId || crypto.randomUUID(),
        );

        // Check for duplicate
        const existing = await this.prisma.webhookDelivery.findUnique({
          where: { idempotencyKey },
        });

        if (existing) {
          this.logger.warn(`Duplicate webhook delivery skipped: ${idempotencyKey}`);
          continue;
        }

        const payload = {
          event: eventType,
          timestamp: new Date().toISOString(),
          tenant_id: tenantId,
          data,
          correlation_id: correlationId || null,
        };

        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'Facturador-SV-Webhooks/1.0',
          'X-Webhook-Event': eventType,
          'X-Webhook-Delivery': idempotencyKey,
        };

        await this.prisma.webhookDelivery.create({
          data: {
            tenantId,
            endpointId: sub.endpoint.id,
            eventId: event.id,
            idempotencyKey,
            payload: JSON.stringify(payload),
            headers: JSON.stringify(headers),
            maxAttempts: sub.endpoint.maxRetries,
            status: DELIVERY_STATUS.PENDING,
          },
        });

        this.logger.log(`Created webhook delivery for endpoint ${sub.endpoint.name} (${sub.endpoint.id})`);
      }
    } catch (error) {
      // Webhook failures should never break the main business flow
      this.logger.error(
        `Failed to trigger webhook event ${eventType}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Get webhook stats for a tenant
   */
  async getStats(tenantId: string, days = 7): Promise<WebhookStats> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, delivered, failed, deadLetter] = await Promise.all([
      this.prisma.webhookDelivery.count({
        where: { tenantId, createdAt: { gte: since } },
      }),
      this.prisma.webhookDelivery.count({
        where: { tenantId, status: DELIVERY_STATUS.DELIVERED, createdAt: { gte: since } },
      }),
      this.prisma.webhookDelivery.count({
        where: { tenantId, status: DELIVERY_STATUS.FAILED, createdAt: { gte: since } },
      }),
      this.prisma.webhookDelivery.count({
        where: { tenantId, status: DELIVERY_STATUS.DEAD_LETTER, createdAt: { gte: since } },
      }),
    ]);

    const successRate = total > 0 ? parseFloat(((delivered / total) * 100).toFixed(2)) : 0;

    return {
      totalDeliveries: total,
      successfulDeliveries: delivered,
      failedDeliveries: failed,
      deadLetterDeliveries: deadLetter,
      successRate,
      period: `${days} days`,
    };
  }

  /**
   * Seed default webhook events if they don't exist
   */
  async seedEvents(): Promise<void> {
    const events = [
      { eventType: 'dte.created', description: 'DTE ha sido creado y está listo para firma' },
      { eventType: 'dte.signed', description: 'DTE ha sido firmado digitalmente' },
      { eventType: 'dte.transmitted', description: 'DTE ha sido enviado al Ministerio de Hacienda' },
      { eventType: 'dte.approved', description: 'DTE ha sido aprobado por el Ministerio de Hacienda' },
      { eventType: 'dte.rejected', description: 'DTE ha sido rechazado por el Ministerio de Hacienda' },
      { eventType: 'invoice.paid', description: 'Factura ha sido marcada como pagada' },
      { eventType: 'client.created', description: 'Nuevo cliente ha sido registrado' },
      { eventType: 'quote.approved', description: 'Cotización ha sido aprobada' },
    ];

    for (const evt of events) {
      await this.prisma.webhookEvent.upsert({
        where: { eventType: evt.eventType },
        update: { description: evt.description },
        create: evt,
      });
    }

    this.logger.log(`Seeded ${events.length} webhook events`);
  }

  private generateIdempotencyKey(
    tenantId: string,
    eventType: string,
    correlationId: string,
  ): string {
    const timestamp = Date.now();
    const data = `${tenantId}:${eventType}:${correlationId}:${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }
}
