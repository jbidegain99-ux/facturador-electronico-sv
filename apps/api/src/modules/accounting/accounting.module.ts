import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { AccountingAutomationService } from './accounting-automation.service';

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [AccountingController],
  providers: [AccountingService, AccountingAutomationService],
  exports: [AccountingService, AccountingAutomationService],
})
export class AccountingModule {}
