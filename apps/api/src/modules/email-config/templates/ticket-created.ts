/**
 * Email template for support ticket created confirmation.
 * Sent to the user when they create a support ticket.
 */

import { COLORS, escapeHtml, infoRow, calloutBox } from './email-styles';
import { emailLayout } from './email-layout';

export interface TicketCreatedData {
  ticketNumber: string;
  subject: string;
  type: string;
  priority: string;
  nombreUsuario: string;
}

export function ticketCreatedTemplate(data: TicketCreatedData): {
  html: string;
  text: string;
} {
  const { ticketNumber, subject, type, priority, nombreUsuario } = data;

  const safeTicketNumber = escapeHtml(ticketNumber);
  const safeSubject = escapeHtml(subject);
  const safeType = escapeHtml(type);
  const safePriority = escapeHtml(priority);
  const safeNombre = escapeHtml(nombreUsuario);

  let infoRows = '';
  infoRows += infoRow('N&uacute;mero de Ticket', safeTicketNumber);
  infoRows += infoRow('Asunto', safeSubject);
  infoRows += infoRow('Tipo', safeType);
  infoRows += infoRow('Prioridad', safePriority);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          Hola <strong>${safeNombre}</strong>,
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          Hemos recibido tu solicitud de soporte. Nuestro equipo la revisar&aacute; y te responder&aacute; a la brevedad.
        </td>
      </tr>
    </table>

    <!-- Ticket details table -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${COLORS.bgCardAlt}; border-radius: 8px; margin-bottom: 20px;">
      ${infoRows}
    </table>

    ${calloutBox(
      '<strong>Pr&oacute;ximos pasos:</strong><br><br>' +
      '&bull; Revisaremos tu solicitud en las pr&oacute;ximas horas<br>' +
      '&bull; Recibir&aacute;s una notificaci&oacute;n cuando respondamos<br>' +
      '&bull; Puedes agregar m&aacute;s informaci&oacute;n desde tu panel de soporte',
      COLORS.primaryLight,
      COLORS.bgCardAlt,
    )}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          Guarda el n&uacute;mero de ticket <strong style="color: ${COLORS.textPrimary};">${safeTicketNumber}</strong> como referencia.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: 'Ticket de Soporte Creado',
    subtitle: `#${safeTicketNumber}`,
    preheader: `Ticket #${ticketNumber} creado - ${subject}`,
    body: bodyHtml,
  });

  let text = `TICKET DE SOPORTE CREADO\n`;
  text += `#${ticketNumber}\n\n`;
  text += `Hola ${nombreUsuario},\n\n`;
  text += `Hemos recibido tu solicitud de soporte.\n\n`;
  text += `Detalles del ticket:\n`;
  text += `- Numero de Ticket: ${ticketNumber}\n`;
  text += `- Asunto: ${subject}\n`;
  text += `- Tipo: ${type}\n`;
  text += `- Prioridad: ${priority}\n\n`;
  text += `Proximos pasos:\n`;
  text += `- Revisaremos tu solicitud en las proximas horas\n`;
  text += `- Recibiras una notificacion cuando respondamos\n`;
  text += `- Puedes agregar mas informacion desde tu panel de soporte\n\n`;
  text += `Guarda el numero de ticket ${ticketNumber} como referencia.\n`;

  return { html, text };
}
