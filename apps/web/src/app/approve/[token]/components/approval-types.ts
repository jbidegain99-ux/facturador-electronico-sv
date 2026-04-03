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

export interface PublicQuote {
  id: string;
  quoteNumber: string;
  clienteNombre: string | null;
  clienteEmail: string | null;
  issueDate: string;
  validUntil: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  terms: string | null;
  notes: string | null;
  clientNotes: string | null;
  lineItems: QuoteLineItem[];
  version: number;
}

export interface ErrorResponse {
  message?: string;
}

export type SubmitResult = 'success' | 'error' | null;

export interface StatusDisplay {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const STATUS_DISPLAY: Record<string, StatusDisplay> = {
  DRAFT: { label: 'Borrador', bgClass: 'bg-gray-500/20', textClass: 'text-gray-400', borderClass: 'border-border' },
  SENT: { label: 'Pendiente de Aprobacion', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400', borderClass: 'border-blue-500/30' },
  APPROVED: { label: 'Aprobada', bgClass: 'bg-green-500/20', textClass: 'text-green-400', borderClass: 'border-green-500/30' },
  PARTIALLY_APPROVED: { label: 'Aprobada Parcialmente', bgClass: 'bg-amber-500/20', textClass: 'text-amber-400', borderClass: 'border-amber-500/30' },
  REJECTED: { label: 'Rechazada', bgClass: 'bg-red-500/20', textClass: 'text-red-400', borderClass: 'border-red-500/30' },
  EXPIRED: { label: 'Expirada', bgClass: 'bg-amber-500/20', textClass: 'text-amber-400', borderClass: 'border-amber-500/30' },
  CONVERTED: { label: 'Convertida a Factura', bgClass: 'bg-purple-500/20', textClass: 'text-purple-400', borderClass: 'border-purple-500/30' },
  CANCELLED: { label: 'Cancelada', bgClass: 'bg-gray-500/20', textClass: 'text-gray-500', borderClass: 'border-border' },
  CHANGES_REQUESTED: { label: 'Cambios Solicitados', bgClass: 'bg-orange-500/20', textClass: 'text-orange-400', borderClass: 'border-orange-500/30' },
  REVISED: { label: 'Revisada', bgClass: 'bg-indigo-500/20', textClass: 'text-indigo-400', borderClass: 'border-indigo-500/30' },
};

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day} de ${month} de ${year}`;
  } catch { return dateStr; }
}

export function isExpired(validUntil: string): boolean {
  try { return new Date(validUntil) < new Date(); } catch { return false; }
}
