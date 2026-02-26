/**
 * Email template for payment receipt confirmation.
 * Sent to the client when a payment is received.
 */

import { COLORS, escapeHtml, infoRow, emailButton, calloutBox } from './email-styles';
import { emailLayout } from './email-layout';

export interface PaymentReceiptData {
  nombreReceptor: string;
  numeroFactura: string;
  montoPagado: string;
  fechaPago: string;
  metodoPago: string;
  nombreEmisor: string;
  detailsLink?: string;
}

export function paymentReceiptTemplate(data: PaymentReceiptData): {
  html: string;
  text: string;
} {
  const {
    nombreReceptor,
    numeroFactura,
    montoPagado,
    fechaPago,
    metodoPago,
    nombreEmisor,
    detailsLink,
  } = data;

  const safeNombreReceptor = escapeHtml(nombreReceptor);
  const safeNumeroFactura = escapeHtml(numeroFactura);
  const safeMontoPagado = escapeHtml(montoPagado);
  const safeFechaPago = escapeHtml(fechaPago);
  const safeMetodoPago = escapeHtml(metodoPago);
  const safeNombreEmisor = escapeHtml(nombreEmisor);

  let infoRows = '';
  infoRows += infoRow('Factura', safeNumeroFactura);
  infoRows += infoRow('Monto Pagado', safeMontoPagado);
  infoRows += infoRow('Fecha de Pago', safeFechaPago);
  infoRows += infoRow('M&eacute;todo de Pago', safeMetodoPago);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          Estimado/a <strong>${safeNombreReceptor}</strong>,
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          Hemos recibido su pago exitosamente. A continuaci&oacute;n, el detalle de la transacci&oacute;n:
        </td>
      </tr>
    </table>

    <!-- Payment details table -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${COLORS.bgCardAlt}; border-radius: 8px; margin-bottom: 20px;">
      ${infoRows}
    </table>

    ${calloutBox(
      'Pago recibido correctamente. Gracias por su pago.',
      COLORS.success,
      COLORS.successBg,
    )}

    ${detailsLink ? emailButton('Ver Detalles', detailsLink) : ''}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          Si tiene alguna consulta sobre este pago, contacte a ${safeNombreEmisor}.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: 'Confirmaci\u00f3n de Pago',
    subtitle: safeNumeroFactura,
    preheader: `Pago recibido - Factura ${numeroFactura} - ${montoPagado}`,
    body: bodyHtml,
    footerExtra: `Enviado por ${safeNombreEmisor}`,
  });

  let text = `CONFIRMACION DE PAGO\n`;
  text += `${numeroFactura}\n\n`;
  text += `Estimado/a ${nombreReceptor},\n\n`;
  text += `Hemos recibido su pago exitosamente.\n\n`;
  text += `Detalle de la transaccion:\n`;
  text += `- Factura: ${numeroFactura}\n`;
  text += `- Monto Pagado: ${montoPagado}\n`;
  text += `- Fecha de Pago: ${fechaPago}\n`;
  text += `- Metodo de Pago: ${metodoPago}\n\n`;
  text += `Pago recibido correctamente. Gracias por su pago.\n`;
  if (detailsLink) {
    text += `\nVer Detalles: ${detailsLink}\n`;
  }
  text += `\nEnviado por ${nombreEmisor}\n`;

  return { html, text };
}
