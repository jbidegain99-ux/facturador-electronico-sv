/**
 * Email template for new support ticket notification to admins.
 * Sent to super admins when a new support ticket is created.
 */

import { COLORS, escapeHtml, infoRow, emailButton } from './email-styles';
import { emailLayout } from './email-layout';

export interface TicketNewAdminData {
  ticketNumber: string;
  subject: string;
  type: string;
  priority: string;
  tenantName: string;
  requesterName: string;
  adminLink: string;
}

export function ticketNewAdminTemplate(data: TicketNewAdminData): {
  html: string;
  text: string;
} {
  const { ticketNumber, subject, type, priority, tenantName, requesterName, adminLink } = data;

  const safeTicketNumber = escapeHtml(ticketNumber);
  const safeSubject = escapeHtml(subject);
  const safeType = escapeHtml(type);
  const safePriority = escapeHtml(priority);
  const safeTenant = escapeHtml(tenantName);
  const safeRequester = escapeHtml(requesterName);

  let infoRows = '';
  infoRows += infoRow('Ticket', `#${safeTicketNumber}`);
  infoRows += infoRow('Asunto', safeSubject);
  infoRows += infoRow('Tipo', safeType);
  infoRows += infoRow('Prioridad', safePriority);
  infoRows += infoRow('Empresa', safeTenant);
  infoRows += infoRow('Solicitante', safeRequester);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          Se ha creado un nuevo ticket de soporte que requiere atenci&oacute;n:
        </td>
      </tr>
    </table>

    <!-- Ticket details table -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${COLORS.bgCardAlt}; border-radius: 8px; margin-bottom: 20px;">
      ${infoRows}
    </table>

    ${emailButton('Ver en Admin', adminLink)}`;

  const html = emailLayout({
    title: 'Nuevo Ticket de Soporte',
    subtitle: `#${safeTicketNumber} - ${safePriority}`,
    preheader: `Nuevo ticket #${ticketNumber} de ${requesterName} (${tenantName})`,
    body: bodyHtml,
  });

  let text = `NUEVO TICKET DE SOPORTE\n`;
  text += `#${ticketNumber}\n\n`;
  text += `Se ha creado un nuevo ticket de soporte:\n\n`;
  text += `- Ticket: #${ticketNumber}\n`;
  text += `- Asunto: ${subject}\n`;
  text += `- Tipo: ${type}\n`;
  text += `- Prioridad: ${priority}\n`;
  text += `- Empresa: ${tenantName}\n`;
  text += `- Solicitante: ${requesterName}\n\n`;
  text += `Ver en Admin: ${adminLink}\n`;

  return { html, text };
}
