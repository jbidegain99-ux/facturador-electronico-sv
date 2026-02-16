/**
 * Barrel export for all email templates.
 */

// Foundation
export { COLORS, escapeHtml, formatMoney, formatEmailDate, emailButton, infoRow, calloutBox } from './email-styles';
export { emailLayout } from './email-layout';
export type { EmailLayoutOptions } from './email-layout';

// Quote templates
export { quoteSentTemplate } from './quote-sent';
export type { QuoteSentData } from './quote-sent';

export { quoteUpdatedTemplate } from './quote-updated';
export type { QuoteUpdatedData } from './quote-updated';

export { quoteChangesRequestedTemplate } from './quote-changes-requested';
export type { QuoteChangesRequestedData } from './quote-changes-requested';

export { quoteApprovedTenantTemplate } from './quote-approved-tenant';
export type { QuoteApprovedTenantData } from './quote-approved-tenant';

export { quoteApprovedClientTemplate } from './quote-approved-client';
export type { QuoteApprovedClientData } from './quote-approved-client';

export { quoteRejectedTemplate } from './quote-rejected';
export type { QuoteRejectedData } from './quote-rejected';

export { quoteReminderTemplate } from './quote-reminder';
export type { QuoteReminderData } from './quote-reminder';

// Invoice template
export { invoiceSentTemplate } from './invoice-sent';
export type { InvoiceSentData } from './invoice-sent';

// Auth template
export { passwordResetTemplate } from './password-reset';
export type { PasswordResetData } from './password-reset';
