export interface QuoteLineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  tipoItem: number;
  itemCode: string | null;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
  approvalStatus: string;
  approvedQuantity: number | null;
  rejectionReason: string | null;
}

export interface QuoteClient {
  id: string;
  nombre: string;
  numDocumento: string;
  nrc?: string | null;
  correo?: string | null;
  telefono?: string | null;
}

export interface QuoteDetail {
  id: string;
  quoteNumber: string;
  clienteId: string;
  client?: QuoteClient | null;
  issueDate: string;
  validUntil: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  items: string | null;
  lineItems: QuoteLineItem[];
  terms?: string | null;
  notes?: string | null;
  convertedToInvoiceId?: string | null;
  convertedAt?: string | null;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvedSubtotal?: number | null;
  approvedTaxAmount?: number | null;
  approvedTotal?: number | null;
  approvalUrl?: string | null;
  version: number;
  quoteGroupId?: string | null;
  clienteNombre?: string | null;
  clienteEmail?: string | null;
  sentAt?: string | null;
  clientNotes?: string | null;
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  actorId: string | null;
  reason: string | null;
  createdAt: string;
}

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

export const STATUS_STYLE_MAP: Record<string, { labelKey: string; variant: StatusConfig['variant']; className: string }> = {
  DRAFT: { labelKey: 'statusDraft', variant: 'secondary', className: 'bg-muted text-muted-foreground border-border' },
  SENT: { labelKey: 'statusSent', variant: 'default', className: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
  PENDING_APPROVAL: { labelKey: 'statusPending', variant: 'default', className: 'bg-teal-600/20 text-teal-400 border-teal-600/30' },
  APPROVED: { labelKey: 'statusApproved', variant: 'default', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
  PARTIALLY_APPROVED: { labelKey: 'statusPartial', variant: 'default', className: 'bg-orange-600/20 text-orange-400 border-orange-600/30' },
  REJECTED: { labelKey: 'statusRejected', variant: 'destructive', className: 'bg-red-600/20 text-red-400 border-red-600/30' },
  EXPIRED: { labelKey: 'statusExpired', variant: 'outline', className: 'bg-amber-600/20 text-amber-400 border-amber-600/30' },
  CONVERTED: { labelKey: 'statusConverted', variant: 'default', className: 'bg-purple-600/20 text-purple-400 border-purple-600/30' },
  CANCELLED: { labelKey: 'statusCancelled', variant: 'secondary', className: 'bg-muted text-muted-foreground border-border' },
  CHANGES_REQUESTED: { labelKey: 'statusChangesRequested', variant: 'default', className: 'bg-orange-600/20 text-orange-400 border-orange-600/30' },
  REVISED: { labelKey: 'statusRevised', variant: 'default', className: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30' },
};

export const APPROVAL_STYLE_MAP: Record<string, { labelKey: string; className: string }> = {
  APPROVED: { labelKey: 'approvalApproved', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
  REJECTED: { labelKey: 'approvalRejected', className: 'bg-red-600/20 text-red-400 border-red-600/30' },
  PENDING: { labelKey: 'approvalPending', className: 'bg-muted text-muted-foreground border-border' },
};

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-SV', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
