import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { KardexReportService } from './services/kardex-report.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, KardexReportService],
  exports: [ReportsService, KardexReportService],
})
export class ReportsModule {}
