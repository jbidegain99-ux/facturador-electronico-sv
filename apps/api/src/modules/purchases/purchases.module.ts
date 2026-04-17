import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';
import { PurchasesService } from './services/purchases.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AccountingModule)],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
