/**
 * Email template: Quote approved - notification to tenant/business.
 * Sent when a client approves a quote, notifying the business owner.
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

export interface QuoteApprovedTenantData {
  quoteNumber: string;
  clienteNombre: string;
  approvedBy?: string | null;
  total: number;
  approvedAt?: Date | string | null;
  quoteLink?: string;
}

export function quoteApprovedTenantTemplate(
  data: QuoteApprovedTenantData,
): { html: string; text: string } {
  const approvedAtStr = formatEmailDate(data.approvedAt);

  const body = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="padding: 16px 0; font-family: Arial, sans-serif;">
          <span style="font-size: 48px; line-height: 1;">&#10004;</span>
        </td>
      </tr>
      <tr>
        <td align="center" style="font-family: Arial, sans-serif; font-size: 16px; color: ${COLORS.success}; font-weight: bold; padding-bottom: 8px;">
          La cotizaci&oacute;n ha sido aprobada
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 24px 0; background-color: ${COLORS.bgCardAlt}; border-radius: 8px;">
      ${infoRow('Cotizaci\u00f3n', escapeHtml(data.quoteNumber))}
      ${infoRow('Cliente', escapeHtml(data.clienteNombre))}
      ${infoRow('Total', formatMoney(data.total))}
      ${data.approvedBy ? infoRow('Aprobado por', escapeHtml(data.approvedBy)) : ''}
      ${infoRow('Fecha', approvedAtStr)}
    </table>

    ${data.quoteLink ? emailButton('Ver Cotizacion', data.quoteLink, COLORS.success) : ''}
  `;

  const html = emailLayout({
    title: 'Cotizacion Aprobada!',
    preheader: `${escapeHtml(data.clienteNombre)} aprobo la cotizacion ${escapeHtml(data.quoteNumber)} por ${formatMoney(data.total)}`,
    body,
  });

  const text = [
    'Cotizacion Aprobada!',
    '',
    'La cotizacion ha sido aprobada.',
    '',
    `Cotizacion: ${data.quoteNumber}`,
    `Cliente: ${data.clienteNombre}`,
    `Total: ${formatMoney(data.total)}`,
    data.approvedBy ? `Aprobado por: ${data.approvedBy}` : '',
    `Fecha: ${approvedAtStr}`,
    '',
    data.quoteLink ? `Ver cotizacion: ${data.quoteLink}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { html, text };
}
