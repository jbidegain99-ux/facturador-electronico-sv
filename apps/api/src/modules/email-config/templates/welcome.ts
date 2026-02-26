/**
 * Email template for welcome / account created.
 * Sent to new users when a tenant registers.
 */

import { COLORS, escapeHtml, emailButton, calloutBox } from './email-styles';
import { emailLayout } from './email-layout';

export interface WelcomeData {
  nombreUsuario: string;
  nombreEmpresa: string;
  email: string;
  dashboardLink: string;
}

export function welcomeTemplate(data: WelcomeData): {
  html: string;
  text: string;
} {
  const { nombreUsuario, nombreEmpresa, email, dashboardLink } = data;

  const safeNombre = escapeHtml(nombreUsuario);
  const safeEmpresa = escapeHtml(nombreEmpresa);
  const safeEmail = escapeHtml(email);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          &iexcl;Hola <strong>${safeNombre}</strong>!
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          Tu cuenta para <strong>${safeEmpresa}</strong> ha sido creada exitosamente. Ya puedes comenzar a utilizar Facturo para gestionar tu facturaci&oacute;n electr&oacute;nica.
        </td>
      </tr>
    </table>

    ${calloutBox(
      `<strong>Con Facturo puedes:</strong><br><br>
      &bull; Emitir Facturas, Cr&eacute;ditos Fiscales y m&aacute;s DTEs<br>
      &bull; Gestionar tu cat&aacute;logo de clientes<br>
      &bull; Enviar cotizaciones profesionales<br>
      &bull; Consultar reportes y estad&iacute;sticas`,
      COLORS.primaryLight,
      COLORS.bgCardAlt,
    )}

    ${emailButton('Ir al Dashboard', dashboardLink)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          Tu correo de acceso es: <strong style="color: ${COLORS.textPrimary};">${safeEmail}</strong>
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          Si tienes alguna pregunta, no dudes en contactarnos a trav&eacute;s de nuestro sistema de soporte.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: 'Bienvenido a Facturo',
    subtitle: safeEmpresa,
    preheader: `Bienvenido a Facturo - Tu cuenta para ${nombreEmpresa} esta lista`,
    body: bodyHtml,
  });

  let text = `BIENVENIDO A FACTURO\n\n`;
  text += `Hola ${nombreUsuario}!\n\n`;
  text += `Tu cuenta para ${nombreEmpresa} ha sido creada exitosamente.\n`;
  text += `Ya puedes comenzar a utilizar Facturo para gestionar tu facturacion electronica.\n\n`;
  text += `Con Facturo puedes:\n`;
  text += `- Emitir Facturas, Creditos Fiscales y mas DTEs\n`;
  text += `- Gestionar tu catalogo de clientes\n`;
  text += `- Enviar cotizaciones profesionales\n`;
  text += `- Consultar reportes y estadisticas\n\n`;
  text += `Ir al Dashboard: ${dashboardLink}\n\n`;
  text += `Tu correo de acceso es: ${email}\n`;
  text += `Si tienes alguna pregunta, no dudes en contactarnos.\n`;

  return { html, text };
}
