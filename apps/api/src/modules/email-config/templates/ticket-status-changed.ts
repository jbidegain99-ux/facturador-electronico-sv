/**
 * Email template for support ticket status change notification.
 * Sent to the user when their ticket status is updated.
 */

import { COLORS, escapeHtml, infoRow, emailButton, calloutBox } from './email-styles';
import { emailLayout } from './email-layout';

export interface TicketStatusChangedData {
  ticketNumber: string;
  subject: string;
  oldStatus: string;
  newStatus: string;
  resolution?: string | null;
  ticketLink: string;
}

export function ticketStatusChangedTemplate(data: TicketStatusChangedData): {
  html: string;
  text: string;
} {
  const { ticketNumber, subject, oldStatus, newStatus, resolution, ticketLink } = data;

  const safeTicketNumber = escapeHtml(ticketNumber);
  const safeSubject = escapeHtml(subject);
  const safeOldStatus = escapeHtml(oldStatus);
  const safeNewStatus = escapeHtml(newStatus);

  let infoRows = '';
  infoRows += infoRow('Ticket', `#${safeTicketNumber}`);
  infoRows += infoRow('Asunto', safeSubject);
  infoRows += infoRow('Estado Anterior', safeOldStatus);
  infoRows += infoRow('Nuevo Estado', `<strong style="color: ${COLORS.success};">${safeNewStatus}</strong>`);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          El estado de tu ticket ha sido actualizado:
        </td>
      </tr>
    </table>

    <!-- Status details table -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${COLORS.bgCardAlt}; border-radius: 8px; margin-bottom: 20px;">
      ${infoRows}
    </table>

    ${resolution ? calloutBox(
      `<strong>Resoluci&oacute;n:</strong><br><br>${escapeHtml(resolution)}`,
      COLORS.success,
      COLORS.successBg,
    ) : ''}

    ${emailButton('Ver Ticket', ticketLink)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          Si necesitas m&aacute;s ayuda, puedes reabrir el ticket desde tu panel de soporte.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: 'Estado de Ticket Actualizado',
    subtitle: `#${safeTicketNumber} - ${safeSubject}`,
    preheader: `Ticket #${ticketNumber} actualizado a ${newStatus}`,
    body: bodyHtml,
  });

  let text = `ESTADO DE TICKET ACTUALIZADO\n`;
  text += `#${ticketNumber} - ${subject}\n\n`;
  text += `El estado de tu ticket ha sido actualizado:\n\n`;
  text += `- Ticket: #${ticketNumber}\n`;
  text += `- Asunto: ${subject}\n`;
  text += `- Estado Anterior: ${oldStatus}\n`;
  text += `- Nuevo Estado: ${newStatus}\n`;
  if (resolution) {
    text += `\nResolucion:\n${resolution}\n`;
  }
  text += `\nVer Ticket: ${ticketLink}\n\n`;
  text += `Si necesitas mas ayuda, puedes reabrir el ticket desde tu panel de soporte.\n`;

  return { html, text };
}
