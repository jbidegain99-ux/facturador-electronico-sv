import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './services/inventory.service';
import { InventoryExportService } from './services/inventory-export.service';

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryExportService],
  exports: [InventoryService],
})
export class InventoryModule {}
