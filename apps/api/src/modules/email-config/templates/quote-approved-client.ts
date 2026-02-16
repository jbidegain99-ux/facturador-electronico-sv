/**
 * Email template: Quote approval confirmed - sent to client.
 * Confirms to the client that their approval was received.
 */

import {
  COLORS,
  escapeHtml,
  formatMoney,
  infoRow,
} from './email-styles';
import { emailLayout } from './email-layout';

export interface QuoteApprovedClientData {
  quoteNumber: string;
  clienteNombre: string;
  total: number;
  tenantNombre?: string;
}

export function quoteApprovedClientTemplate(
  data: QuoteApprovedClientData,
): { html: string; text: string } {
  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; color: ${COLORS.textPrimary}; font-family: Arial, sans-serif; line-height: 1.6;">
      Estimado/a <strong>${escapeHtml(data.clienteNombre)}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: ${COLORS.textSecondary}; font-family: Arial, sans-serif; line-height: 1.6;">
      Su aprobaci&oacute;n de la cotizaci&oacute;n ha sido registrada exitosamente.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 24px 0; background-color: ${COLORS.bgCardAlt}; border-radius: 8px;">
      ${infoRow('Cotizaci\u00f3n', escapeHtml(data.quoteNumber))}
      ${infoRow('Total Aprobado', formatMoney(data.total))}
      ${data.tenantNombre ? infoRow('Proveedor', escapeHtml(data.tenantNombre)) : ''}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 16px 0;">
      <tr>
        <td style="background-color: ${COLORS.bgCardAlt}; border-left: 4px solid ${COLORS.primaryLight}; border-radius: 4px; padding: 16px; font-family: Arial, sans-serif; font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6;">
          El proveedor proceder&aacute; con la facturaci&oacute;n. Recibir&aacute; su factura electr&oacute;nica en un correo separado.
        </td>
      </tr>
    </table>
  `;

  const html = emailLayout({
    title: 'Aprobacion Confirmada',
    subtitle: escapeHtml(data.quoteNumber),
    preheader: `Aprobacion confirmada para cotizacion ${escapeHtml(data.quoteNumber)}`,
    body,
  });

  const text = [
    `Aprobacion Confirmada - ${data.quoteNumber}`,
    '',
    `Estimado/a ${data.clienteNombre},`,
    '',
    'Su aprobacion de la cotizacion ha sido registrada exitosamente.',
    '',
    `Cotizacion: ${data.quoteNumber}`,
    `Total Aprobado: ${formatMoney(data.total)}`,
    data.tenantNombre ? `Proveedor: ${data.tenantNombre}` : '',
    '',
    'El proveedor procedera con la facturacion. Recibira su factura electronica en un correo separado.',
  ]
    .filter(Boolean)
    .join('\n');

  return { html, text };
}
