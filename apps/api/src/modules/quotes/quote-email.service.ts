import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Quote, QuoteLineItem } from '@prisma/client';
import { DefaultEmailService } from '../email-config/services/default-email.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  quoteSentTemplate,
  quoteUpdatedTemplate,
  quoteChangesRequestedTemplate,
  quoteApprovedTenantTemplate,
  quoteApprovedClientTemplate,
  quoteRejectedTemplate,
  quoteReminderTemplate,
} from '../email-config/templates';

type QuoteWithLineItems = Quote & { lineItems?: QuoteLineItem[] };

@Injectable()
export class QuoteEmailService {
  private readonly logger = new Logger(QuoteEmailService.name);

  constructor(
    private configService: ConfigService,
    private defaultEmailService: DefaultEmailService,
    private prisma: PrismaService,
  ) {}

  async sendQuoteToClient(quote: QuoteWithLineItems): Promise<boolean> {
    if (!quote.clienteEmail) {
      this.logger.warn(
        `Cannot send quote ${quote.quoteNumber}: no client email`,
      );
      return false;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const approvalLink = `${frontendUrl}/approve/${quote.approvalToken}`;

    const lineItems = (quote.lineItems || []).map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      lineTotal: Number(li.lineTotal),
    }));

    // Use updated template if version > 1 (quote was revised)
    const isRevised = quote.version > 1;
    const { html, text } = isRevised
      ? quoteUpdatedTemplate({
          quoteNumber: quote.quoteNumber,
          clienteNombre: quote.clienteNombre || 'Cliente',
          version: quote.version,
          total: Number(quote.total),
          subtotal: Number(quote.subtotal),
          taxAmount: Number(quote.taxAmount),
          validUntil: quote.validUntil,
          approvalLink,
          lineItems,
        })
      : quoteSentTemplate({
          quoteNumber: quote.quoteNumber,
          clienteNombre: quote.clienteNombre || 'Cliente',
          total: Number(quote.total),
          subtotal: Number(quote.subtotal),
          taxAmount: Number(quote.taxAmount),
          validUntil: quote.validUntil,
          approvalLink,
          lineItems,
          terms: quote.terms,
        });

    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: quote.clienteEmail,
      subject: isRevised
        ? `Cotización Actualizada ${quote.quoteNumber}`
        : `Cotización ${quote.quoteNumber}`,
      html,
      text,
    });

    if (!result.success) {
      this.logger.error(
        `Failed to send quote ${quote.quoteNumber}: ${result.errorMessage}`,
      );
    }

    return result.success;
  }

  async notifyQuoteApproval(quote: Quote): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');

    // Send confirmation to client
    if (quote.clienteEmail) {
      const { html: clientHtml, text: clientText } =
        quoteApprovedClientTemplate({
          quoteNumber: quote.quoteNumber,
          clienteNombre: quote.clienteNombre || 'Cliente',
          total: Number(quote.total),
        });

      await this.defaultEmailService.sendEmail(quote.tenantId, {
        to: quote.clienteEmail,
        subject: `Cotización ${quote.quoteNumber} - Aprobación Confirmada`,
        html: clientHtml,
        text: clientText,
      });
    }

    // Notify tenant users
    const tenantUsers = await this.prisma.user.findMany({
      where: { tenantId: quote.tenantId },
      select: { email: true },
      take: 5,
    });

    const recipientEmail =
      tenantUsers[0]?.email || quote.clienteEmail || '';

    const { html, text } = quoteApprovedTenantTemplate({
      quoteNumber: quote.quoteNumber,
      clienteNombre: quote.clienteNombre || 'Cliente',
      approvedBy: quote.approvedBy,
      total: Number(quote.total),
      approvedAt: quote.approvedAt,
      quoteLink: `${frontendUrl}/cotizaciones/${quote.id}`,
    });

    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: recipientEmail,
      subject: `Cotización ${quote.quoteNumber} - Aprobada`,
      html,
      text,
    });

    return result.success;
  }

  async notifyQuoteRejection(quote: Quote): Promise<boolean> {
    // Get tenant users to notify
    const tenantUsers = await this.prisma.user.findMany({
      where: { tenantId: quote.tenantId },
      select: { email: true },
      take: 5,
    });

    const recipientEmail =
      tenantUsers[0]?.email || quote.clienteEmail || '';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');

    const { html, text } = quoteRejectedTemplate({
      quoteNumber: quote.quoteNumber,
      clienteNombre: quote.clienteNombre || 'Cliente',
      rejectionReason: quote.rejectionReason,
      quoteLink: `${frontendUrl}/cotizaciones/${quote.id}`,
    });

    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: recipientEmail,
      subject: `Cotización ${quote.quoteNumber} - Rechazada`,
      html,
      text,
    });

    return result.success;
  }

  async notifyChangesRequested(
    quote: QuoteWithLineItems,
    removedItemIds: string[],
    comments: string,
  ): Promise<boolean> {
    const removedDescriptions = (quote.lineItems || [])
      .filter((li) => removedItemIds.includes(li.id))
      .map((li) => li.description);

    // Get tenant users to notify
    const tenantUsers = await this.prisma.user.findMany({
      where: { tenantId: quote.tenantId },
      select: { email: true },
      take: 5,
    });

    const recipientEmail =
      tenantUsers[0]?.email || quote.clienteEmail || '';

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const quoteLink = `${frontendUrl}/cotizaciones/${quote.id}`;

    const { html, text } = quoteChangesRequestedTemplate({
      quoteNumber: quote.quoteNumber,
      clienteNombre: quote.clienteNombre || 'Cliente',
      comments,
      removedItems: removedDescriptions,
      quoteLink,
    });

    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: recipientEmail,
      subject: `Cotización ${quote.quoteNumber} - Cambios Solicitados`,
      html,
      text,
    });

    return result.success;
  }

  async sendReminder(quote: Quote): Promise<boolean> {
    if (!quote.clienteEmail) {
      this.logger.warn(
        `Cannot send reminder for quote ${quote.quoteNumber}: no client email`,
      );
      return false;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const approvalLink = `${frontendUrl}/approve/${quote.approvalToken}`;

    const { html, text } = quoteReminderTemplate({
      quoteNumber: quote.quoteNumber,
      clienteNombre: quote.clienteNombre || 'Cliente',
      total: Number(quote.total),
      validUntil: quote.validUntil,
      approvalLink,
    });

    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: quote.clienteEmail,
      subject: `Recordatorio: Cotización ${quote.quoteNumber} pendiente`,
      html,
      text,
    });

    return result.success;
  }
}
