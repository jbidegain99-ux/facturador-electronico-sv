import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { InventoryAdjustmentsModule } from '../inventory-adjustments/inventory-adjustments.module';
import { PhysicalCountsController } from './physical-counts.controller';
import { PhysicalCountService } from './services/physical-count.service';
import { PhysicalCountCsvService } from './services/physical-count-csv.service';

@Module({
  imports: [PrismaModule, PlansModule, InventoryAdjustmentsModule],
  controllers: [PhysicalCountsController],
  providers: [PhysicalCountService, PhysicalCountCsvService],
  exports: [PhysicalCountService],
})
export class PhysicalCountsModule {}
