/**
 * Email template for password reset requests.
 * Security-focused messaging with a time-limited reset link.
 */

import { COLORS, escapeHtml, emailButton, calloutBox } from './email-styles';
import { emailLayout } from './email-layout';

export interface PasswordResetData {
  nombre: string;
  resetLink: string;
}

export function passwordResetTemplate(data: PasswordResetData): {
  html: string;
  text: string;
} {
  const { nombre, resetLink } = data;

  const safeNombre = escapeHtml(nombre);

  const bodyHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 16px;">
          Hola <strong>${safeNombre}</strong>,
        </td>
      </tr>
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; padding-bottom: 20px;">
          Recibimos una solicitud para restablecer la contrase&ntilde;a de tu cuenta.
          Si t&uacute; realizaste esta solicitud, haz clic en el bot&oacute;n a continuaci&oacute;n
          para crear una nueva contrase&ntilde;a.
        </td>
      </tr>
    </table>

    ${emailButton('Restablecer Contrasena', resetLink, COLORS.primary)}

    ${calloutBox(
      `<strong>Este enlace expira en 1 hora.</strong> Despu&eacute;s de ese tiempo, deber&aacute;s solicitar un nuevo restablecimiento.`,
      COLORS.warning,
      COLORS.warningBg,
    )}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; padding-top: 8px;">
          Si no solicitaste este cambio, puedes ignorar este correo.
          Tu contrase&ntilde;a actual seguir&aacute; siendo la misma.
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px;">
      <tr>
        <td style="font-family: Arial, sans-serif; font-size: 12px; color: ${COLORS.textMuted}; line-height: 1.6; border-top: 1px solid ${COLORS.border}; padding-top: 16px;">
          Por seguridad, nunca compartimos tu contrase&ntilde;a por correo electr&oacute;nico.
          Si no reconoces esta actividad, te recomendamos cambiar tu contrase&ntilde;a de inmediato.
        </td>
      </tr>
    </table>`;

  const html = emailLayout({
    title: 'Restablecer Contrasena',
    preheader: 'Solicitud para restablecer tu contrasena',
    body: bodyHtml,
  });

  let text = `RESTABLECER CONTRASENA\n\n`;
  text += `Hola ${nombre},\n\n`;
  text += `Recibimos una solicitud para restablecer la contrasena de tu cuenta.\n`;
  text += `Si tu realizaste esta solicitud, utiliza el siguiente enlace para crear una nueva contrasena:\n\n`;
  text += `Restablecer Contrasena: ${resetLink}\n\n`;
  text += `Este enlace expira en 1 hora.\n\n`;
  text += `Si no solicitaste este cambio, puedes ignorar este correo. Tu contrasena actual seguira siendo la misma.\n`;

  return { html, text };
}
