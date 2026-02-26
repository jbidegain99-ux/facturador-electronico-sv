/**
 * Email template for support ticket reply notification.
 * Sent to the user when an admin adds a public comment to their ticket.
 */

import { COLORS, escapeHtml, emailButton, calloutBox } from './email-styles';
import { emailLayout } from './email-layout';

export interface TicketReplyData {
  ticketNumber: string;
  subject: string;
  commentContent: string;
  authorName: string;
  ticketLink: string;
}

export function ticketReplyTemplate(data: TicketReplyData): {
  html: string;
  text: string;
} {
  const { ticketNumber, subject, commentContent, authorName, ticketLink } = data;

  const safeTicketNumber = escapeHtml(ticketNumber);
  const safeSubject = escapeHtml(subject);
  const safeComment = escapeHtml(commentContent);
  const safeAuthor = escapeHtml(authorName);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          Hay una nueva respuesta en tu ticket <strong>#${safeTicketNumber}</strong>:
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.4; padding-bottom: 20px;">
          <strong style="color: ${COLORS.textPrimary};">Asunto:</strong> ${safeSubject}
        </td>
      </tr>
    </table>

    ${calloutBox(
      `<strong style="color: ${COLORS.primaryLighter};">${safeAuthor}</strong> escribi&oacute;:<br><br>` +
      `<span style="color: ${COLORS.textPrimary};">${safeComment}</span>`,
      COLORS.primaryLight,
      COLORS.bgCardAlt,
    )}

    ${emailButton('Ver Ticket', ticketLink)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          Puedes responder directamente desde tu panel de soporte.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: 'Nueva Respuesta en tu Ticket',
    subtitle: `#${safeTicketNumber} - ${safeSubject}`,
    preheader: `Respuesta en ticket #${ticketNumber} de ${authorName}`,
    body: bodyHtml,
  });

  let text = `NUEVA RESPUESTA EN TU TICKET\n`;
  text += `#${ticketNumber} - ${subject}\n\n`;
  text += `${authorName} escribio:\n\n`;
  text += `${commentContent}\n\n`;
  text += `Ver Ticket: ${ticketLink}\n\n`;
  text += `Puedes responder directamente desde tu panel de soporte.\n`;

  return { html, text };
}
