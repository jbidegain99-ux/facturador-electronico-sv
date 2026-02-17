import { Module, forwardRef } from '@nestjs/common';
import { DteController } from './dte.controller';
import { DteBuilderService } from './services/dte-builder.service';
import { DteValidatorService } from './services/dte-validator.service';
import { DteService } from './dte.service';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SignerModule } from '../signer/signer.module';
import { MhAuthModule } from '../mh-auth/mh-auth.module';
import { EmailConfigModule } from '../email-config/email-config.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [PrismaModule, SignerModule, MhAuthModule, EmailConfigModule, forwardRef(() => WebhooksModule)],
  controllers: [DteController],
  providers: [DteBuilderService, DteValidatorService, DteService, PdfService],
  exports: [DteBuilderService, DteValidatorService, DteService, PdfService],
})
export class DteModule {}
