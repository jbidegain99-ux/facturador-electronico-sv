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

// Auth templates
export { passwordResetTemplate } from './password-reset';
export type { PasswordResetData } from './password-reset';

export { emailVerificationTemplate } from './email-verification';
export type { EmailVerificationData } from './email-verification';

// Welcome template
export { welcomeTemplate } from './welcome';
export type { WelcomeData } from './welcome';

// Payment template
export { paymentReceiptTemplate } from './payment-receipt';
export type { PaymentReceiptData } from './payment-receipt';

// Support ticket templates
export { ticketCreatedTemplate } from './ticket-created';
export type { TicketCreatedData } from './ticket-created';

export { ticketReplyTemplate } from './ticket-reply';
export type { TicketReplyData } from './ticket-reply';

export { ticketStatusChangedTemplate } from './ticket-status-changed';
export type { TicketStatusChangedData } from './ticket-status-changed';

export { ticketNewAdminTemplate } from './ticket-new-admin';
export type { TicketNewAdminData } from './ticket-new-admin';
