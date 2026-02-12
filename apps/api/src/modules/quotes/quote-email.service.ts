import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Quote, QuoteLineItem } from '@prisma/client';

type QuoteWithLineItems = Quote & { lineItems?: QuoteLineItem[] };

@Injectable()
export class QuoteEmailService {
  private readonly logger = new Logger(QuoteEmailService.name);

  constructor(private configService: ConfigService) {}

  async sendQuoteToClient(quote: QuoteWithLineItems): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');

    this.logger.log(
      `[EMAIL STUB] Would send quote ${quote.quoteNumber} to ${quote.clienteEmail || 'unknown'}`,
    );
    this.logger.log(
      `[EMAIL STUB] Approval link: ${frontendUrl}/approve/${quote.approvalToken}`,
    );
    this.logger.log(
      `[EMAIL STUB] Total: $${quote.total} | Valid until: ${quote.validUntil}`,
    );

    // TODO: integrate with tenant email config (TenantEmailConfig)
    // For now, log the intent and return success
    return true;
  }

  async notifyQuoteApproval(quote: Quote): Promise<boolean> {
    this.logger.log(
      `[EMAIL STUB] Would notify admin: quote ${quote.quoteNumber} approved by ${quote.approvedBy}`,
    );
    return true;
  }

  async notifyQuoteRejection(quote: Quote): Promise<boolean> {
    this.logger.log(
      `[EMAIL STUB] Would notify admin: quote ${quote.quoteNumber} rejected. Reason: ${quote.rejectionReason}`,
    );
    return true;
  }

  async sendReminder(quote: Quote): Promise<boolean> {
    this.logger.log(
      `[EMAIL STUB] Would send reminder for quote ${quote.quoteNumber} to ${quote.clienteEmail}`,
    );
    return true;
  }
}
