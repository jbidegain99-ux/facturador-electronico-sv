/**
 * Email template for quote reminders.
 * Sends a friendly reminder to a client about a pending quote.
 */

import {
  COLORS,
  escapeHtml,
  formatMoney,
  formatEmailDate,
  emailButton,
  infoRow,
} from './email-styles';
import { emailLayout } from './email-layout';

export interface QuoteReminderData {
  quoteNumber: string;
  clienteNombre: string;
  total: number;
  validUntil: Date | string | null;
  approvalLink: string;
}

export function quoteReminderTemplate(data: QuoteReminderData): {
  html: string;
  text: string;
} {
  const { quoteNumber, clienteNombre, total, validUntil, approvalLink } = data;

  const safeQuoteNumber = escapeHtml(quoteNumber);
  const safeClienteNombre = escapeHtml(clienteNombre);
  const formattedTotal = formatMoney(total);
  const formattedDate = formatEmailDate(validUntil);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          Hola <strong>${safeClienteNombre}</strong>,
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          Te escribimos para recordarte que tienes una cotizaci&oacute;n pendiente de revisi&oacute;n.
          Nos encantar&iacute;a que puedas revisarla cuando tengas un momento.
        </td>
      </tr>
    </table>

    <!-- Quote summary table -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${COLORS.bgCardAlt}; border-radius: 8px; margin-bottom: 20px;">
      ${infoRow('Cotizacion', safeQuoteNumber)}
      ${infoRow('Total', escapeHtml(formattedTotal))}
      ${infoRow('Valida hasta', escapeHtml(formattedDate))}
    </table>

    ${emailButton('Ver Cotizacion', approvalLink, COLORS.primary)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.textMuted}; line-height: 1.6; padding-top: 8px;">
          ${validUntil ? `Este enlace es v&aacute;lido hasta ${escapeHtml(formattedDate)}.` : ''}
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: 'Recordatorio de Cotizacion',
    subtitle: safeQuoteNumber,
    preheader: `Tienes una cotizacion pendiente por ${formattedTotal}`,
    body: bodyHtml,
  });

  let text = `RECORDATORIO DE COTIZACION\n`;
  text += `${quoteNumber}\n\n`;
  text += `Hola ${clienteNombre},\n\n`;
  text += `Te escribimos para recordarte que tienes una cotizacion pendiente de revision.\n\n`;
  text += `- Cotizacion: ${quoteNumber}\n`;
  text += `- Total: ${formattedTotal}\n`;
  text += `- Valida hasta: ${formattedDate}\n\n`;
  text += `Ver Cotizacion: ${approvalLink}\n`;
  if (validUntil) {
    text += `\nEste enlace es valido hasta ${formattedDate}.\n`;
  }

  return { html, text };
}
