import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupportController, AdminSupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportSlaCronService } from './support-sla-cron.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailConfigModule } from '../email-config/email-config.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PrismaModule, EmailConfigModule, ConfigModule, PlansModule],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, SupportSlaCronService],
  exports: [SupportService],
})
export class SupportModule {}
