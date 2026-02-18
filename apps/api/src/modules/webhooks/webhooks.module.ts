import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DteModule } from '../dte/dte.module';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookEndpointsController } from './controllers/webhook-endpoints.controller';
import { WebhookDeliveriesController } from './controllers/webhook-deliveries.controller';
import { InboundWebhooksController } from './controllers/inbound.controller';
import { WebhookAdminController } from './controllers/webhook-admin.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => DteModule)],
  providers: [WebhooksService, WebhookDeliveryService],
  controllers: [
    WebhookEndpointsController,
    WebhookDeliveriesController,
    InboundWebhooksController,
    WebhookAdminController,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
