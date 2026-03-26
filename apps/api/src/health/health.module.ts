import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailConfigModule } from '../modules/email-config/email-config.module';

@Module({
  imports: [PrismaModule, EmailConfigModule],
  controllers: [HealthController],
})
export class HealthModule {}
