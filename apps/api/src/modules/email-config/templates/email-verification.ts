/**
 * Email template for email verification.
 * Sent to new users when they register to verify their email address.
 */

import { COLORS, escapeHtml, emailButton, calloutBox } from './email-styles';
import { emailLayout } from './email-layout';

export interface EmailVerificationData {
  nombreUsuario: string;
  nombreEmpresa: string;
  verificationLink: string;
}

export function emailVerificationTemplate(data: EmailVerificationData): {
  html: string;
  text: string;
} {
  const { nombreUsuario, nombreEmpresa, verificationLink } = data;

  const safeNombre = escapeHtml(nombreUsuario);
  const safeEmpresa = escapeHtml(nombreEmpresa);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          &iexcl;Hola <strong>${safeNombre}</strong>!
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          Gracias por registrar <strong>${safeEmpresa}</strong> en Facturo. Para completar tu registro y activar tu cuenta, por favor confirma tu correo electr&oacute;nico haciendo clic en el bot&oacute;n a continuaci&oacute;n.
        </td>
      </tr>
    </table>

    ${emailButton('Confirmar mi correo', verificationLink, COLORS.primary)}

    ${calloutBox(
      `<strong>Este enlace expira en 24 horas.</strong> Despu&eacute;s de ese tiempo, deber&aacute;s solicitar un nuevo enlace de verificaci&oacute;n.`,
      COLORS.warning,
      COLORS.warningBg,
    )}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          Si no creaste esta cuenta, puedes ignorar este correo.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: 'Confirma tu correo',
    subtitle: safeEmpresa,
    preheader: `Confirma tu correo para activar tu cuenta en Facturo`,
    body: bodyHtml,
  });

  let text = `CONFIRMA TU CORREO\n\n`;
  text += `Hola ${nombreUsuario}!\n\n`;
  text += `Gracias por registrar ${nombreEmpresa} en Facturo.\n`;
  text += `Para completar tu registro y activar tu cuenta, confirma tu correo electronico:\n\n`;
  text += `Confirmar mi correo: ${verificationLink}\n\n`;
  text += `Este enlace expira en 24 horas.\n\n`;
  text += `Si no creaste esta cuenta, puedes ignorar este correo.\n`;

  return { html, text };
}
