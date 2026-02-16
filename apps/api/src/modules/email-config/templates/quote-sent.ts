/**
 * Email template: Quote sent to client.
 * Displays line items, totals, validity, and approval CTA.
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

export interface QuoteSentData {
  quoteNumber: string;
  clienteNombre: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  validUntil: Date | string | null;
  approvalLink: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  terms?: string | null;
}

function buildLineItemsTable(
  lineItems: QuoteSentData['lineItems'],
): string {
  if (!lineItems || lineItems.length === 0) return '';

  const rows = lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textPrimary}; font-size: 14px; font-family: Arial, sans-serif;">
          ${escapeHtml(item.description)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textSecondary}; font-size: 14px; font-family: Arial, sans-serif; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textSecondary}; font-size: 14px; font-family: Arial, sans-serif; text-align: right;">
          ${formatMoney(item.unitPrice)}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textPrimary}; font-size: 14px; font-family: Arial, sans-serif; text-align: right; font-weight: 600;">
          ${formatMoney(item.lineTotal)}
        </td>
      </tr>`,
    )
    .join('');

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="padding: 10px 12px; background-color: ${COLORS.bgDark}; color: ${COLORS.textSecondary}; font-size: 12px; font-family: Arial, sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid ${COLORS.border};">
          Descripci&oacute;n
        </td>
        <td style="padding: 10px 12px; background-color: ${COLORS.bgDark}; color: ${COLORS.textSecondary}; font-size: 12px; font-family: Arial, sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; text-align: center; border-bottom: 2px solid ${COLORS.border};">
          Cant.
        </td>
        <td style="padding: 10px 12px; background-color: ${COLORS.bgDark}; color: ${COLORS.textSecondary}; font-size: 12px; font-family: Arial, sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; text-align: right; border-bottom: 2px solid ${COLORS.border};">
          P. Unit.
        </td>
        <td style="padding: 10px 12px; background-color: ${COLORS.bgDark}; color: ${COLORS.textSecondary}; font-size: 12px; font-family: Arial, sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; text-align: right; border-bottom: 2px solid ${COLORS.border};">
          Total
        </td>
      </tr>
      ${rows}
    </table>`;
}

function buildTotalsTable(
  subtotal: number,
  taxAmount: number,
  total: number,
): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 8px 0 16px 0;">
      ${infoRow('Subtotal', formatMoney(subtotal))}
      ${infoRow('IVA 13%', formatMoney(taxAmount))}
      <tr>
        <td style="padding: 12px 16px; color: ${COLORS.textPrimary}; font-size: 16px; font-family: Arial, sans-serif; font-weight: bold;">
          Total
        </td>
        <td style="padding: 12px 16px; color: ${COLORS.primary}; font-size: 18px; font-family: Arial, sans-serif; font-weight: bold; text-align: right;">
          ${formatMoney(total)}
        </td>
      </tr>
    </table>`;
}

export function quoteSentTemplate(
  data: QuoteSentData,
): { html: string; text: string } {
  const validUntilStr = formatEmailDate(data.validUntil);

  const body = `
    <p style="margin: 0 0 16px 0; font-size: 16px; color: ${COLORS.textPrimary}; font-family: Arial, sans-serif; line-height: 1.6;">
      Estimado/a <strong>${escapeHtml(data.clienteNombre)}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: ${COLORS.textSecondary}; font-family: Arial, sans-serif; line-height: 1.6;">
      Le enviamos la siguiente cotizaci&oacute;n para su revisi&oacute;n y aprobaci&oacute;n.
    </p>

    ${buildLineItemsTable(data.lineItems)}
    ${buildTotalsTable(data.subtotal, data.taxAmount, data.total)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0;">
      ${infoRow('V\u00e1lida hasta', validUntilStr)}
    </table>

    ${
      data.terms
        ? `
    <p style="margin: 16px 0 8px 0; font-size: 13px; color: ${COLORS.textSecondary}; font-family: Arial, sans-serif; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
      T&eacute;rminos y Condiciones
    </p>
    <p style="margin: 0 0 16px 0; font-size: 14px; color: ${COLORS.textSecondary}; font-family: Arial, sans-serif; line-height: 1.6; white-space: pre-wrap;">
      ${escapeHtml(data.terms)}
    </p>`
        : ''
    }

    ${emailButton('Ver y Aprobar Cotizacion', data.approvalLink, COLORS.primary)}
  `;

  const html = emailLayout({
    title: `Cotizacion ${escapeHtml(data.quoteNumber)}`,
    preheader: `Cotizacion ${escapeHtml(data.quoteNumber)} por ${formatMoney(data.total)}`,
    body,
  });

  const lineItemsText = (data.lineItems ?? [])
    .map(
      (item) =>
        `  - ${item.description}: ${item.quantity} x ${formatMoney(item.unitPrice)} = ${formatMoney(item.lineTotal)}`,
    )
    .join('\n');

  const text = [
    `Cotizacion ${data.quoteNumber}`,
    '',
    `Estimado/a ${data.clienteNombre},`,
    '',
    'Le enviamos la siguiente cotizacion para su revision y aprobacion.',
    '',
    lineItemsText ? `Detalle:\n${lineItemsText}` : '',
    '',
    `Subtotal: ${formatMoney(data.subtotal)}`,
    `IVA 13%: ${formatMoney(data.taxAmount)}`,
    `Total: ${formatMoney(data.total)}`,
    '',
    `Valida hasta: ${validUntilStr}`,
    data.terms ? `\nTerminos y Condiciones:\n${data.terms}` : '',
    '',
    `Ver y aprobar: ${data.approvalLink}`,
  ]
    .filter(Boolean)
    .join('\n');

  return { html, text };
}
