import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryAdjustmentsController } from './inventory-adjustments.controller';
import { InventoryAdjustmentService } from './services/inventory-adjustment.service';

@Module({
  imports: [PrismaModule, PlansModule, AccountingModule],
  controllers: [InventoryAdjustmentsController],
  providers: [InventoryAdjustmentService],
  exports: [InventoryAdjustmentService],
})
export class InventoryAdjustmentsModule {}
