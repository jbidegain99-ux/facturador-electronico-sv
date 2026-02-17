import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

interface DeliveryWithEndpoint {
  id: string;
  tenantId: string;
  endpointId: string;
  eventId: string;
  idempotencyKey: string;
  payload: string;
  headers: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  endpoint: {
    id: string;
    url: string;
    secretKey: string;
    timeoutMs: number;
    retryDelayMs: number;
  };
}

interface ParsedHeaders {
  [key: string]: string;
}

const DELIVERY_STATUS = {
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  DEAD_LETTER: 'DEAD_LETTER',
} as const;

/**
 * Processes pending webhook deliveries using cron (no BullMQ/Redis dependency).
 * Runs every 30 seconds to pick up pending/failed deliveries and send them.
 */
@Injectable()
export class WebhookDeliveryService implements OnModuleInit {
  private readonly logger = new Logger(WebhookDeliveryService.name);
  private processing = false;

  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Seed webhook events on startup
    await this.webhooksService.seedEvents();
  }

  /**
   * Process pending webhook deliveries every 30 seconds
   */
  @Cron('*/30 * * * * *', {
    name: 'processWebhookDeliveries',
  })
  async processPendingDeliveries(): Promise<void> {
    // Prevent concurrent processing
    if (this.processing) return;
    this.processing = true;

    try {
      // Find PENDING deliveries or FAILED deliveries whose nextRetryAt has passed
      const deliveries = await this.prisma.webhookDelivery.findMany({
        where: {
          OR: [
            { status: DELIVERY_STATUS.PENDING },
            {
              status: DELIVERY_STATUS.FAILED,
              nextRetryAt: { lte: new Date() },
            },
          ],
        },
        include: {
          endpoint: {
            select: {
              id: true,
              url: true,
              secretKey: true,
              timeoutMs: true,
              retryDelayMs: true,
            },
          },
        },
        take: 50, // Process in batches
        orderBy: { createdAt: 'asc' },
      }) as DeliveryWithEndpoint[];

      if (deliveries.length === 0) return;

      this.logger.log(`Processing ${deliveries.length} webhook deliveries`);

      for (const delivery of deliveries) {
        await this.sendDelivery(delivery);
      }
    } catch (error) {
      this.logger.error(
        `Error in webhook delivery cron: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.processing = false;
    }
  }

  /**
   * Send a single webhook delivery
   */
  async sendDelivery(delivery: DeliveryWithEndpoint): Promise<void> {
    this.logger.log(`Sending webhook delivery ${delivery.id} to ${delivery.endpoint.url}`);

    // Mark as SENDING
    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: DELIVERY_STATUS.SENDING,
        attemptCount: { increment: 1 },
        sentAt: new Date(),
      },
    });

    try {
      const payloadString = delivery.payload;
      const signature = this.webhooksService.generateSignature(
        payloadString,
        delivery.endpoint.secretKey,
      );

      const storedHeaders: ParsedHeaders = JSON.parse(delivery.headers);
      const requestHeaders: Record<string, string> = {
        ...storedHeaders,
        'X-Webhook-Signature-256': `sha256=${signature}`,
        'X-Webhook-Timestamp': Math.floor(Date.now() / 1000).toString(),
      };

      // Use native fetch with AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), delivery.endpoint.timeoutMs);

      const response = await fetch(delivery.endpoint.url, {
        method: 'POST',
        headers: requestHeaders,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text().catch(() => '');
      const responseHeaders = this.sanitizeHeaders(
        Object.fromEntries(response.headers.entries()),
      );

      if (response.ok) {
        // Success
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DELIVERY_STATUS.DELIVERED,
            responseStatus: response.status,
            responseHeaders: JSON.stringify(responseHeaders),
            responseBody: this.truncate(responseBody, 2000),
            completedAt: new Date(),
            errorMessage: null,
          },
        });

        // Update endpoint lastUsedAt
        await this.prisma.webhookEndpoint.update({
          where: { id: delivery.endpoint.id },
          data: { lastUsedAt: new Date() },
        });

        this.logger.log(`Webhook delivered: ${delivery.id} → ${response.status}`);
      } else {
        // HTTP error
        await this.handleFailure(delivery, response.status, responseBody, responseHeaders);
      }
    } catch (error) {
      // Network/timeout error
      const message = error instanceof Error ? error.message : String(error);
      await this.handleFailure(delivery, null, null, null, message);
    }
  }

  /**
   * Retry a specific delivery (for manual retry from UI)
   */
  async retryDelivery(deliveryId: string, tenantId: string): Promise<void> {
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: {
        id: deliveryId,
        tenantId,
        status: { in: [DELIVERY_STATUS.FAILED, DELIVERY_STATUS.DEAD_LETTER] },
      },
    });

    if (!delivery) {
      throw new Error('Delivery not found or not in retryable state');
    }

    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: DELIVERY_STATUS.PENDING,
        nextRetryAt: null,
        errorMessage: null,
      },
    });

    this.logger.log(`Delivery ${deliveryId} queued for retry`);
  }

  private async handleFailure(
    delivery: DeliveryWithEndpoint,
    responseStatus: number | null,
    responseBody: string | null,
    responseHeaders: Record<string, string> | null,
    errorMessage?: string,
  ): Promise<void> {
    const currentAttempt = delivery.attemptCount + 1; // Already incremented
    const canRetry = currentAttempt < delivery.maxAttempts;
    const isRetriable = responseStatus === null || responseStatus >= 500;

    if (canRetry && isRetriable) {
      // Schedule retry with exponential backoff + jitter
      const baseDelay = delivery.endpoint.retryDelayMs;
      const exponentialDelay = baseDelay * Math.pow(2, currentAttempt - 1);
      const jitter = Math.random() * 1000;
      const nextRetryAt = new Date(Date.now() + exponentialDelay + jitter);

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: DELIVERY_STATUS.FAILED,
          responseStatus,
          responseHeaders: responseHeaders ? JSON.stringify(responseHeaders) : null,
          responseBody: responseBody ? this.truncate(responseBody, 2000) : null,
          errorMessage: errorMessage || `HTTP ${responseStatus}`,
          nextRetryAt,
        },
      });

      this.logger.warn(
        `Webhook delivery failed, retry ${currentAttempt}/${delivery.maxAttempts}: ${delivery.id} in ${Math.round(exponentialDelay / 1000)}s`,
      );
    } else {
      // Dead letter
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: DELIVERY_STATUS.DEAD_LETTER,
          responseStatus,
          responseHeaders: responseHeaders ? JSON.stringify(responseHeaders) : null,
          responseBody: responseBody ? this.truncate(responseBody, 2000) : null,
          errorMessage: errorMessage || `HTTP ${responseStatus}`,
          completedAt: new Date(),
        },
      });

      this.logger.error(`Webhook delivery dead-lettered: ${delivery.id}`);
    }
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    delete sanitized['set-cookie'];
    delete sanitized['authorization'];
    return sanitized;
  }

  private truncate(str: string, maxLen: number): string {
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  }
}
