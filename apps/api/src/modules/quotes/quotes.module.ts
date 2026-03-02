import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { DteModule } from '../dte/dte.module';
import { EmailConfigModule } from '../email-config/email-config.module';
import { PlansModule } from '../plans/plans.module';
import { QuotesController, QuotesPublicController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { QuoteEmailService } from './quote-email.service';
import { QuotesCronService } from './quotes-cron.service';

@Module({
  imports: [PrismaModule, DteModule, ConfigModule, EmailConfigModule, PlansModule],
  controllers: [QuotesPublicController, QuotesController],
  providers: [QuotesService, QuoteEmailService, QuotesCronService],
  exports: [QuotesService],
})
export class QuotesModule {}
