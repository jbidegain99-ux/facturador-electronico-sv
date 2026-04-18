import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { KardexReportService } from './services/kardex-report.service';
import { IvaDeclaracionReportService } from './services/iva-declaracion-report.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, KardexReportService, IvaDeclaracionReportService],
  exports: [ReportsService, KardexReportService, IvaDeclaracionReportService],
})
export class ReportsModule {}
