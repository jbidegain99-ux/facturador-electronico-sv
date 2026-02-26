import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupportController, AdminSupportController } from './support.controller';
import { SupportService } from './support.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailConfigModule } from '../email-config/email-config.module';

@Module({
  imports: [PrismaModule, EmailConfigModule, ConfigModule],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
