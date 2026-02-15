import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Quote, QuoteLineItem } from '@prisma/client';
import { DefaultEmailService } from '../email-config/services/default-email.service';

type QuoteWithLineItems = Quote & { lineItems?: QuoteLineItem[] };

@Injectable()
export class QuoteEmailService {
  private readonly logger = new Logger(QuoteEmailService.name);

  constructor(
    private configService: ConfigService,
    private defaultEmailService: DefaultEmailService,
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

    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: quote.clienteEmail,
      subject: `Cotización ${quote.quoteNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Cotización ${quote.quoteNumber}</h2>
          <p>Estimado/a ${quote.clienteNombre},</p>
          <p>Le enviamos la cotización solicitada por un total de <strong>$${quote.total}</strong>.</p>
          <p>Esta cotización es válida hasta el <strong>${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-SV') : 'N/A'}</strong>.</p>
          ${approvalLink ? `<p><a href="${approvalLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Aprobar Cotización</a></p>` : ''}
          <p style="color: #666; font-size: 12px;">Este correo fue enviado automáticamente por Facturador Electrónico SV.</p>
        </div>
      `,
    });

    if (!result.success) {
      this.logger.error(
        `Failed to send quote ${quote.quoteNumber}: ${result.errorMessage}`,
      );
    }

    return result.success;
  }

  async notifyQuoteApproval(quote: Quote): Promise<boolean> {
    // Notify the tenant that the quote was approved
    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: quote.clienteEmail || '',
      subject: `Cotización ${quote.quoteNumber} - Aprobada`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Cotización Aprobada</h2>
          <p>La cotización <strong>${quote.quoteNumber}</strong> ha sido aprobada${quote.approvedBy ? ` por ${quote.approvedBy}` : ''}.</p>
        </div>
      `,
    });

    return result.success;
  }

  async notifyQuoteRejection(quote: Quote): Promise<boolean> {
    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: quote.clienteEmail || '',
      subject: `Cotización ${quote.quoteNumber} - Rechazada`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Cotización Rechazada</h2>
          <p>La cotización <strong>${quote.quoteNumber}</strong> ha sido rechazada.</p>
          ${quote.rejectionReason ? `<p><strong>Razón:</strong> ${quote.rejectionReason}</p>` : ''}
        </div>
      `,
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

    const result = await this.defaultEmailService.sendEmail(quote.tenantId, {
      to: quote.clienteEmail,
      subject: `Recordatorio: Cotización ${quote.quoteNumber} pendiente`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recordatorio de Cotización</h2>
          <p>Estimado/a ${quote.clienteNombre},</p>
          <p>Le recordamos que tiene pendiente la cotización <strong>${quote.quoteNumber}</strong> por un total de <strong>$${quote.total}</strong>.</p>
          <p>Esta cotización es válida hasta el <strong>${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-SV') : 'N/A'}</strong>.</p>
          ${approvalLink ? `<p><a href="${approvalLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Cotización</a></p>` : ''}
        </div>
      `,
    });

    return result.success;
  }
}
