import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { EmailConfigModule } from '../email-config/email-config.module';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { WebhookEndpointsController } from './controllers/webhook-endpoints.controller';
import { WebhookDeliveriesController } from './controllers/webhook-deliveries.controller';
import { WebhookAdminController } from './controllers/webhook-admin.controller';

@Module({
  imports: [PrismaModule, PlansModule, EmailConfigModule],
  providers: [WebhooksService, WebhookDeliveryService],
  controllers: [
    WebhookEndpointsController,
    WebhookDeliveriesController,
    WebhookAdminController,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
