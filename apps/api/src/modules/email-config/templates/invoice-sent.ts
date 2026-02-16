/**
 * Email template for sent invoices (DTE).
 * Sent to the receptor along with the PDF attachment.
 */

import { COLORS, escapeHtml, infoRow, calloutBox } from './email-styles';
import { emailLayout } from './email-layout';

export interface InvoiceSentData {
  tipoLabel: string;
  numeroControl: string;
  codigoGeneracion: string;
  totalPagar: string;
  selloRecepcion?: string | null;
  nombreReceptor: string;
  nombreEmisor: string;
}

export function invoiceSentTemplate(data: InvoiceSentData): {
  html: string;
  text: string;
} {
  const {
    tipoLabel,
    numeroControl,
    codigoGeneracion,
    totalPagar,
    selloRecepcion,
    nombreReceptor,
    nombreEmisor,
  } = data;

  const safeTipoLabel = escapeHtml(tipoLabel);
  const safeNumeroControl = escapeHtml(numeroControl);
  const safeCodigoGeneracion = escapeHtml(codigoGeneracion);
  const safeTotalPagar = escapeHtml(totalPagar);
  const safeNombreReceptor = escapeHtml(nombreReceptor);
  const safeNombreEmisor = escapeHtml(nombreEmisor);

  let infoRows = '';
  infoRows += infoRow('Numero de Control', safeNumeroControl);
  infoRows += infoRow('Codigo de Generacion', safeCodigoGeneracion);
  infoRows += infoRow('Total', safeTotalPagar);
  if (selloRecepcion) {
    infoRows += infoRow('Sello de Recepcion', escapeHtml(selloRecepcion));
  }

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          Estimado/a <strong>${safeNombreReceptor}</strong>,
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          Se adjunta su ${safeTipoLabel} Electr&oacute;nica en formato PDF. A continuaci&oacute;n, los datos fiscales del documento:
        </td>
      </tr>
    </table>

    <!-- Fiscal data table -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${COLORS.bgCardAlt}; border-radius: 8px; margin-bottom: 20px;">
      ${infoRows}
    </table>

    ${calloutBox(
      'Este documento ha sido procesado por el Ministerio de Hacienda de El Salvador.',
      COLORS.success,
      COLORS.successBg,
    )}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          El documento PDF se encuentra adjunto a este correo.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: `${safeTipoLabel} Electronica`,
    subtitle: safeNumeroControl,
    preheader: `${tipoLabel} ${numeroControl} - ${totalPagar}`,
    body: bodyHtml,
    footerExtra: `Enviado por ${safeNombreEmisor}`,
  });

  let text = `${tipoLabel.toUpperCase()} ELECTRONICA\n`;
  text += `${numeroControl}\n\n`;
  text += `Estimado/a ${nombreReceptor},\n\n`;
  text += `Se adjunta su ${tipoLabel} Electronica en formato PDF.\n\n`;
  text += `Datos fiscales:\n`;
  text += `- Numero de Control: ${numeroControl}\n`;
  text += `- Codigo de Generacion: ${codigoGeneracion}\n`;
  text += `- Total: ${totalPagar}\n`;
  if (selloRecepcion) {
    text += `- Sello de Recepcion: ${selloRecepcion}\n`;
  }
  text += `\nEste documento ha sido procesado por el Ministerio de Hacienda de El Salvador.\n`;
  text += `\nEl documento PDF se encuentra adjunto a este correo.\n`;
  text += `\nEnviado por ${nombreEmisor}\n`;

  return { html, text };
}
