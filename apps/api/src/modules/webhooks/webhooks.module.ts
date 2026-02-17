import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookEndpointsController } from './controllers/webhook-endpoints.controller';
import { WebhookDeliveriesController } from './controllers/webhook-deliveries.controller';
import { InboundWebhooksController } from './controllers/inbound.controller';

@Module({
  imports: [PrismaModule],
  providers: [WebhooksService, WebhookDeliveryService],
  controllers: [
    WebhookEndpointsController,
    WebhookDeliveriesController,
    InboundWebhooksController,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
