/**
 * Shared email template styles and utilities.
 * All colors, helpers, and inline-style generators for HTML email templates.
 */

export const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryLighter: '#A78BFA',
  primaryDark: '#6D28D9',
  bgDark: '#1a1a2e',
  bgCard: '#16213e',
  bgCardAlt: '#1e2a4a',
  textPrimary: '#f0f0f0',
  textSecondary: '#a0a0b0',
  textMuted: '#6b7280',
  border: '#2d2d44',
  borderLight: '#3d3d54',
  success: '#10B981',
  successBg: '#064e3b',
  warning: '#F59E0B',
  warningBg: '#78350f',
  danger: '#EF4444',
  dangerBg: '#7f1d1d',
  white: '#ffffff',
  black: '#000000',
} as const;

/** Escape HTML special characters to prevent XSS in email templates. */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a number as currency string $X.XX */
export function formatMoney(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}

/** Format a date for display in emails (dd/mm/yyyy) */
export function formatEmailDate(
  date: Date | string | null | undefined,
): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

/** Generate a CTA button as an HTML string */
export function emailButton(
  text: string,
  href: string,
  bgColor: string = COLORS.primary,
): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px auto;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: ${bgColor};">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
            href="${href}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="17%" fillcolor="${bgColor}" stroke="f">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">
              ${escapeHtml(text)}
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${href}" target="_blank"
            style="display: inline-block; padding: 14px 32px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: ${COLORS.white}; text-decoration: none; border-radius: 8px; background-color: ${bgColor};">
            ${escapeHtml(text)}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>`;
}

/** Generate a key-value info row for summary tables */
export function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 10px 16px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textSecondary}; font-size: 14px; font-family: Arial, sans-serif;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 10px 16px; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textPrimary}; font-size: 14px; font-family: Arial, sans-serif; font-weight: 600; text-align: right;">
        ${value}
      </td>
    </tr>`;
}

/** Generate a callout/alert box */
export function calloutBox(
  content: string,
  borderColor: string = COLORS.primaryLight,
  bgColor: string = COLORS.bgCardAlt,
): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0;">
      <tr>
        <td style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; border-radius: 4px; padding: 16px; font-family: Arial, sans-serif; font-size: 14px; color: ${COLORS.textPrimary};">
          ${content}
        </td>
      </tr>
    </table>`;
}
