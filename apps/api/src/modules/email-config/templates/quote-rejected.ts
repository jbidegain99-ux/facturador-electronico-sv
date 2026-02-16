/**
 * Email template for rejected quotes.
 * Notifies the emisor that a client has rejected their quote.
 */

import { COLORS, escapeHtml, calloutBox, emailButton } from './email-styles';
import { emailLayout } from './email-layout';

export interface QuoteRejectedData {
  quoteNumber: string;
  clienteNombre: string;
  rejectionReason?: string | null;
  quoteLink?: string;
}

export function quoteRejectedTemplate(data: QuoteRejectedData): {
  html: string;
  text: string;
} {
  const { quoteNumber, clienteNombre, rejectionReason, quoteLink } = data;

  const safeQuoteNumber = escapeHtml(quoteNumber);
  const safeClienteNombre = escapeHtml(clienteNombre);

  let bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          La cotizaci&oacute;n <strong>${safeQuoteNumber}</strong> ha sido rechazada por <strong>${safeClienteNombre}</strong>.
        </td>
      </tr>
    </table>`;

  if (rejectionReason) {
    bodyHtml += `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; padding-bottom: 4px; font-weight: 600;">
          Motivo del rechazo:
        </td>
      </tr>
      <tr>
        <td>
          ${calloutBox(escapeHtml(rejectionReason), COLORS.danger, COLORS.dangerBg)}
        </td>
      </tr>
    </table>`;
  }

  bodyHtml += `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 16px;">
          Puedes revisar los detalles y tomar las acciones necesarias desde el sistema.
        </td>
      </tr>
    </table>`;

  if (quoteLink) {
    bodyHtml += emailButton('Ver Detalles', quoteLink, COLORS.danger);
  }

  const html = emailLayout({
    title: 'Cotizacion Rechazada',
    subtitle: safeQuoteNumber,
    preheader: `La cotizacion ${quoteNumber} ha sido rechazada por ${clienteNombre}`,
    body: bodyHtml,
  });

  let text = `COTIZACION RECHAZADA\n\n`;
  text += `La cotizacion ${quoteNumber} ha sido rechazada por ${clienteNombre}.\n\n`;
  if (rejectionReason) {
    text += `Motivo del rechazo:\n${rejectionReason}\n\n`;
  }
  text += `Puedes revisar los detalles y tomar las acciones necesarias desde el sistema.\n`;
  if (quoteLink) {
    text += `\nVer Detalles: ${quoteLink}\n`;
  }

  return { html, text };
}
