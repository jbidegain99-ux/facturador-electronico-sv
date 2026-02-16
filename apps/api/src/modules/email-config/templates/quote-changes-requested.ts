/**
 * Email template: Client requested changes to a quote.
 * Sent to the tenant/business when a client requests modifications.
 */

import {
  COLORS,
  escapeHtml,
  emailButton,
  calloutBox,
} from './email-styles';
import { emailLayout } from './email-layout';

export interface QuoteChangesRequestedData {
  quoteNumber: string;
  clienteNombre: string;
  comments: string;
  removedItems: string[];
  quoteLink: string;
}

export function quoteChangesRequestedTemplate(
  data: QuoteChangesRequestedData,
): { html: string; text: string } {
  const removedItemsHtml =
    data.removedItems.length > 0
      ? `
    <p style="margin: 16px 0 8px 0; font-size: 13px; color: ${COLORS.textSecondary}; font-family: Arial, sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
      Items Removidos
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 16px 0;">
      ${data.removedItems
        .map(
          (item) => `
        <tr>
          <td style="padding: 6px 12px; font-family: Arial, sans-serif; font-size: 14px; color: ${COLORS.danger}; line-height: 1.6;">
            &bull; ${escapeHtml(item)}
          </td>
        </tr>`,
        )
        .join('')}
    </table>`
      : '';

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; color: ${COLORS.textPrimary}; font-family: Arial, sans-serif; line-height: 1.6;">
      El cliente <strong>${escapeHtml(data.clienteNombre)}</strong> ha solicitado cambios en la cotizaci&oacute;n
      <strong style="color: ${COLORS.warning};">${escapeHtml(data.quoteNumber)}</strong>.
    </p>

    <p style="margin: 16px 0 8px 0; font-size: 13px; color: ${COLORS.textSecondary}; font-family: Arial, sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
      Comentarios del Cliente
    </p>
    ${calloutBox(escapeHtml(data.comments), COLORS.warning, COLORS.warningBg)}

    ${removedItemsHtml}

    ${emailButton('Revisar y Actualizar Cotizacion', data.quoteLink, COLORS.warning)}
  `;

  const html = emailLayout({
    title: 'Cambios Solicitados',
    subtitle: escapeHtml(data.quoteNumber),
    preheader: `${escapeHtml(data.clienteNombre)} solicita cambios en ${escapeHtml(data.quoteNumber)}`,
    body,
  });

  const removedItemsText =
    data.removedItems.length > 0
      ? `\nItems removidos:\n${data.removedItems.map((item) => `  - ${item}`).join('\n')}`
      : '';

  const text = [
    `Cambios Solicitados - ${data.quoteNumber}`,
    '',
    `El cliente ${data.clienteNombre} ha solicitado cambios en la cotizacion ${data.quoteNumber}.`,
    '',
    `Comentarios del cliente:`,
    data.comments,
    removedItemsText,
    '',
    `Revisar y actualizar: ${data.quoteLink}`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  return { html, text };
}
