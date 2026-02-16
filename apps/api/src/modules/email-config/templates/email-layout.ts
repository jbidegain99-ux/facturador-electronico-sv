/**
 * Base email layout wrapper.
 * Provides branded header (purple gradient) and footer for all email templates.
 * Table-based for maximum email client compatibility.
 */

import { COLORS, escapeHtml } from './email-styles';

export interface EmailLayoutOptions {
  /** Title shown in the header area */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Hidden preheader text for inbox preview */
  preheader?: string;
  /** Main HTML body content */
  body: string;
  /** Extra footer content (optional) */
  footerExtra?: string;
}

export function emailLayout(options: EmailLayoutOptions): string {
  const { title, subtitle, preheader, body, footerExtra } = options;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif; }
    body { margin: 0; padding: 0; background-color: ${COLORS.bgDark}; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse; }
    a { color: ${COLORS.primaryLighter}; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-content { padding: 16px !important; }
      .mobile-full { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bgDark}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: ${COLORS.bgDark};">${escapeHtml(preheader)}</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${COLORS.bgDark};">
    <tr>
      <td align="center" style="padding: 24px 16px;">

        <!-- Email container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%;">

          <!-- Header with gradient -->
          <tr>
            <td align="center" style="border-radius: 12px 12px 0 0; padding: 32px 24px; background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight});">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:120px;">
                <v:fill type="gradient" color="${COLORS.primary}" color2="${COLORS.primaryLight}" angle="135" />
                <v:textbox inset="0,0,0,0" style="mso-fit-shape-to-text:true">
              <![endif]-->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif;">
                    <h1 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 2px;">
                      Facturo
                    </h1>
                    <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: ${COLORS.white}; line-height: 1.3;">
                      ${escapeHtml(title)}
                    </h2>
                    ${subtitle ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">${escapeHtml(subtitle)}</p>` : ''}
                  </td>
                </tr>
              </table>
              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-content" style="background-color: ${COLORS.bgCard}; padding: 32px 28px; border-left: 1px solid ${COLORS.border}; border-right: 1px solid ${COLORS.border};">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLORS.bgDark}; border-top: 1px solid ${COLORS.border}; border-radius: 0 0 12px 12px; padding: 24px 28px; border-left: 1px solid ${COLORS.border}; border-right: 1px solid ${COLORS.border}; border-bottom: 1px solid ${COLORS.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${footerExtra ? `<tr><td style="padding-bottom: 16px; font-family: Arial, sans-serif; font-size: 13px; color: ${COLORS.textSecondary};">${footerExtra}</td></tr>` : ''}
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: ${COLORS.textMuted}; line-height: 1.6;">
                    Republicode S.A. de C.V. &bull; El Salvador<br>
                    Facturaci&oacute;n Electr&oacute;nica &bull; &copy; ${year}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>
  <!-- /Outer wrapper -->
</body>
</html>`;
}
