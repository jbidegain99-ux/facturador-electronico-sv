import { Module, forwardRef } from '@nestjs/common';
import { DteController } from './dte.controller';
import { DteBuilderService } from './services/dte-builder.service';
import { DteValidatorService } from './services/dte-validator.service';
import { DteService } from './dte.service';
import { DteNormalizationService } from './services/dte-normalization.service';
import { DteLifecycleService } from './services/dte-lifecycle.service';
import { DteStatsService } from './services/dte-stats.service';
import { PdfService } from './pdf.service';
import { DteErrorMapperService } from './services/error-mapper.service';
import { DteOperationLoggerService } from './services/dte-operation-logger.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SignerModule } from '../signer/signer.module';
import { MhAuthModule } from '../mh-auth/mh-auth.module';
import { EmailConfigModule } from '../email-config/email-config.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { AccountingModule } from '../accounting/accounting.module';
import { SucursalesModule } from '../sucursales/sucursales.module';
import { HaciendaModule } from '../hacienda/hacienda.module';
import { InboundWebhooksController } from '../webhooks/controllers/inbound.controller';

@Module({
  imports: [PrismaModule, SignerModule, MhAuthModule, EmailConfigModule, WebhooksModule, forwardRef(() => AccountingModule), SucursalesModule, HaciendaModule],
  controllers: [DteController, InboundWebhooksController],
  providers: [DteBuilderService, DteValidatorService, DteService, DteNormalizationService, DteLifecycleService, DteStatsService, PdfService, DteErrorMapperService, DteOperationLoggerService],
  exports: [DteBuilderService, DteValidatorService, DteService, DteNormalizationService, DteLifecycleService, DteStatsService, PdfService, DteErrorMapperService, DteOperationLoggerService],
})
export class DteModule {}
