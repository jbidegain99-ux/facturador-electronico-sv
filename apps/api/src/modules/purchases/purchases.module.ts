import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';
import { PurchasesService } from './services/purchases.service';
import { PurchaseReceptionService } from './services/purchase-reception.service';
import { PurchasesController } from './purchases.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => AccountingModule)],
  controllers: [PurchasesController],
  providers: [PurchasesService, PurchaseReceptionService],
  exports: [PurchasesService, PurchaseReceptionService],
})
export class PurchasesModule {}
