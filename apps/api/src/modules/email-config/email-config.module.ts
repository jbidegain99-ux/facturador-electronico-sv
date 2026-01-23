import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailConfigController, EmailConfigAdminController } from './email-config.controller';
import {
  EncryptionService,
  EmailConfigService,
  EmailHealthService,
  EmailAssistanceService,
} from './services';
import { EmailAdapterFactory } from './adapters';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [
    EmailConfigController,
    EmailConfigAdminController,
  ],
  providers: [
    EncryptionService,
    EmailAdapterFactory,
    EmailConfigService,
    EmailHealthService,
    EmailAssistanceService,
  ],
  exports: [
    EmailConfigService,
    EmailHealthService,
    EncryptionService,
  ],
})
export class EmailConfigModule {}
