import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailConfigModule } from '../email-config/email-config.module';
import {
  OnboardingService,
  TestExecutionService,
  OnboardingCommunicationService,
} from './services';
import {
  OnboardingController,
  OnboardingAdminController,
} from './onboarding.controller';

@Module({
  imports: [
    PrismaModule,
    EmailConfigModule, // For EncryptionService
  ],
  controllers: [OnboardingController, OnboardingAdminController],
  providers: [
    OnboardingService,
    TestExecutionService,
    OnboardingCommunicationService,
  ],
  exports: [OnboardingService, TestExecutionService],
})
export class OnboardingModule {}
