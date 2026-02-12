'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

// ── Types ────────────────────────────────────────────────────────────

interface QuoteLineItem {
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

interface PublicQuote {
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
  lineItems: QuoteLineItem[];
  version: number;
}

interface LineItemDecision {
  approvalStatus: 'APPROVED' | 'REJECTED';
  approvedQuantity: number | null;
  rejectionReason: string;
}

interface ErrorResponse {
  message?: string;
}

type SubmitResult = 'success' | 'error' | null;

// ── Status config ────────────────────────────────────────────────────

interface StatusDisplay {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const STATUS_DISPLAY: Record<string, StatusDisplay> = {
  DRAFT: {
    label: 'Borrador',
    bgClass: 'bg-gray-500/20',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/30',
  },
  SENT: {
    label: 'Pendiente de Aprobacion',
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/30',
  },
  APPROVED: {
    label: 'Aprobada',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/30',
  },
  PARTIALLY_APPROVED: {
    label: 'Aprobada Parcialmente',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  REJECTED: {
    label: 'Rechazada',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
  },
  EXPIRED: {
    label: 'Expirada',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  CONVERTED: {
    label: 'Convertida a Factura',
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30',
  },
  CANCELLED: {
    label: 'Cancelada',
    bgClass: 'bg-gray-500/20',
    textClass: 'text-gray-500',
    borderClass: 'border-gray-500/30',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-SV', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isExpired(validUntil: string): boolean {
  try {
    return new Date(validUntil) < new Date();
  } catch {
    return false;
  }
}

function isActionable(status: string): boolean {
  return status === 'SENT';
}

// ── Spinner SVG ─────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className || 'h-5 w-5'}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ── Check icon ──────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || 'h-5 w-5'}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── X icon ──────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || 'h-5 w-5'}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export default function QuoteApprovalPage() {
  const params = useParams();
  const token = params.token as string;
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  // State
  const [quote, setQuote] = React.useState<PublicQuote | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitResult, setSubmitResult] = React.useState<SubmitResult>(null);
  const [submitMessage, setSubmitMessage] = React.useState('');

  // Form fields
  const [approverName, setApproverName] = React.useState('');
  const [approverEmail, setApproverEmail] = React.useState('');
  const [comments, setComments] = React.useState('');

  // Line item decisions: map from lineItem.id -> decision
  const [decisions, setDecisions] = React.useState<
    Record<string, LineItemDecision>
  >({});

  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [rejectorName, setRejectorName] = React.useState('');
  const [rejectorEmail, setRejectorEmail] = React.useState('');
  const [rejectComments, setRejectComments] = React.useState('');

  // ── Fetch quote ───────────────────────────────────────────────────

  const fetchQuote = React.useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/public/approve/${token}`);

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as ErrorResponse;
        throw new Error(
          errData.message || `Error al cargar la cotizacion (${res.status})`,
        );
      }

      const data = (await res.json()) as PublicQuote;
      setQuote(data);

      // Initialize decisions: all items approved by default
      const initialDecisions: Record<string, LineItemDecision> = {};
      if (Array.isArray(data.lineItems)) {
        for (const item of data.lineItems) {
          initialDecisions[item.id] = {
            approvalStatus: 'APPROVED',
            approvedQuantity: item.quantity,
            rejectionReason: '',
          };
        }
      }
      setDecisions(initialDecisions);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar la cotizacion';
      setFetchError(message);
      console.error('Error fetching quote for approval:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // ── Decision handlers ─────────────────────────────────────────────

  const toggleItemApproval = (itemId: string) => {
    setDecisions((prev) => {
      const current = prev[itemId];
      if (!current) return prev;

      const item = quote?.lineItems.find((li) => li.id === itemId);
      const newStatus: 'APPROVED' | 'REJECTED' =
        current.approvalStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED';

      return {
        ...prev,
        [itemId]: {
          ...current,
          approvalStatus: newStatus,
          approvedQuantity:
            newStatus === 'APPROVED' ? (item?.quantity ?? null) : null,
          rejectionReason: newStatus === 'APPROVED' ? '' : current.rejectionReason,
        },
      };
    });
  };

  const updateRejectionReason = (itemId: string, reason: string) => {
    setDecisions((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: {
          ...current,
          rejectionReason: reason,
        },
      };
    });
  };

  const updateApprovedQuantity = (itemId: string, qty: number) => {
    setDecisions((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: {
          ...current,
          approvedQuantity: qty,
        },
      };
    });
  };

  // ── Calculated totals ─────────────────────────────────────────────

  const approvedTotal = React.useMemo(() => {
    if (!quote) return 0;
    let total = 0;
    for (const item of quote.lineItems) {
      const decision = decisions[item.id];
      if (decision?.approvalStatus === 'APPROVED') {
        const qty = decision.approvedQuantity ?? item.quantity;
        const ratio = qty / item.quantity;
        total += item.lineTotal * ratio;
      }
    }
    return total;
  }, [quote, decisions]);

  const approvedSubtotal = React.useMemo(() => {
    if (!quote) return 0;
    let subtotal = 0;
    for (const item of quote.lineItems) {
      const decision = decisions[item.id];
      if (decision?.approvalStatus === 'APPROVED') {
        const qty = decision.approvedQuantity ?? item.quantity;
        const ratio = qty / item.quantity;
        subtotal += item.lineSubtotal * ratio;
      }
    }
    return subtotal;
  }, [quote, decisions]);

  const approvedTax = React.useMemo(() => {
    if (!quote) return 0;
    let tax = 0;
    for (const item of quote.lineItems) {
      const decision = decisions[item.id];
      if (decision?.approvalStatus === 'APPROVED') {
        const qty = decision.approvedQuantity ?? item.quantity;
        const ratio = qty / item.quantity;
        tax += item.lineTax * ratio;
      }
    }
    return tax;
  }, [quote, decisions]);

  const approvedCount = React.useMemo(() => {
    return Object.values(decisions).filter(
      (d) => d.approvalStatus === 'APPROVED',
    ).length;
  }, [decisions]);

  const totalItems = quote?.lineItems.length ?? 0;

  // ── Submit approval ───────────────────────────────────────────────

  const handleApprove = async () => {
    if (!approverName.trim() || !approverEmail.trim()) {
      toastRef.current.error('Nombre y correo son obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const lineItems = Object.entries(decisions).map(([id, decision]) => ({
        id,
        approvalStatus: decision.approvalStatus,
        approvedQuantity:
          decision.approvalStatus === 'APPROVED'
            ? decision.approvedQuantity
            : undefined,
        rejectionReason:
          decision.approvalStatus === 'REJECTED' && decision.rejectionReason.trim()
            ? decision.rejectionReason.trim()
            : undefined,
      }));

      const res = await fetch(`${apiUrl}/quotes/public/approve/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverName: approverName.trim(),
          approverEmail: approverEmail.trim(),
          comments: comments.trim() || undefined,
          lineItems,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as ErrorResponse;
        throw new Error(errData.message || 'Error al enviar la aprobacion');
      }

      setSubmitResult('success');
      setSubmitMessage(
        approvedCount === totalItems
          ? 'La cotizacion ha sido aprobada exitosamente.'
          : `La cotizacion ha sido aprobada parcialmente (${approvedCount} de ${totalItems} items).`,
      );
      toastRef.current.success('Cotizacion aprobada');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al enviar la aprobacion';
      setSubmitResult('error');
      setSubmitMessage(message);
      toastRef.current.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Submit rejection ──────────────────────────────────────────────

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toastRef.current.error('El motivo de rechazo es obligatorio');
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/public/reject/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason.trim(),
          rejectorName: rejectorName.trim() || undefined,
          rejectorEmail: rejectorEmail.trim() || undefined,
          comments: rejectComments.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as ErrorResponse;
        throw new Error(errData.message || 'Error al rechazar la cotizacion');
      }

      setShowRejectDialog(false);
      setSubmitResult('success');
      setSubmitMessage('La cotizacion ha sido rechazada.');
      toastRef.current.success('Cotizacion rechazada');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al rechazar la cotizacion';
      setSubmitResult('error');
      setSubmitMessage(message);
      toastRef.current.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="text-center">
          <Spinner className="h-10 w-10 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400 text-sm">Cargando cotizacion...</p>
        </div>
      </div>
    );
  }

  // ── Fetch error state ─────────────────────────────────────────────

  if (fetchError || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div
          className="max-w-md w-full mx-4 p-8 rounded-2xl text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XIcon className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No se pudo cargar la cotizacion
          </h2>
          <p className="text-gray-400 text-sm">
            {fetchError ||
              'El enlace puede ser invalido o haber expirado. Contacta al emisor para obtener un nuevo enlace.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Post-submit result ────────────────────────────────────────────

  if (submitResult === 'success') {
    return (
      <div className="min-h-screen" style={{ background: '#0F172A' }}>
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
          <div
            className="max-w-md w-full mx-4 p-8 rounded-2xl text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Respuesta Enviada
            </h2>
            <p className="text-gray-400 text-sm">{submitMessage}</p>
            <p className="text-gray-500 text-xs mt-4">
              Puedes cerrar esta pagina.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Determine page state ──────────────────────────────────────────

  const expired = isExpired(quote.validUntil);
  const actionable = isActionable(quote.status) && !expired;
  const statusInfo = STATUS_DISPLAY[quote.status] || STATUS_DISPLAY.SENT;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Non-actionable banner */}
        {!actionable && (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{
              background: expired
                ? 'rgba(245,158,11,0.1)'
                : 'rgba(255,255,255,0.03)',
              border: expired
                ? '1px solid rgba(245,158,11,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  expired ? 'bg-amber-500/20' : statusInfo.bgClass
                }`}
              >
                {expired ? (
                  <span className="text-amber-400 text-sm font-bold">!</span>
                ) : quote.status === 'APPROVED' || quote.status === 'PARTIALLY_APPROVED' ? (
                  <CheckIcon className={`h-4 w-4 ${statusInfo.textClass}`} />
                ) : (
                  <XIcon className={`h-4 w-4 ${statusInfo.textClass}`} />
                )}
              </div>
              <div>
                <p
                  className={`font-medium ${
                    expired ? 'text-amber-400' : statusInfo.textClass
                  }`}
                >
                  {expired
                    ? 'Esta cotizacion ha expirado'
                    : `Esta cotizacion ya fue ${statusInfo.label.toLowerCase()}`}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {expired
                    ? 'La fecha de validez ha pasado. Contacta al emisor si necesitas una nueva cotizacion.'
                    : 'No es posible realizar cambios en esta cotizacion.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit error banner */}
        {submitResult === 'error' && (
          <div
            className="mb-6 p-4 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <p className="text-red-400 text-sm font-medium">{submitMessage}</p>
          </div>
        )}

        {/* Quote header card */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  Cotizacion {quote.quoteNumber}
                </h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass} border ${statusInfo.borderClass}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              {quote.clienteNombre && (
                <p className="text-gray-400 text-sm">
                  Para: <span className="text-gray-300">{quote.clienteNombre}</span>
                  {quote.clienteEmail && (
                    <span className="text-gray-500"> ({quote.clienteEmail})</span>
                  )}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-400 sm:text-right space-y-1 flex-shrink-0">
              <p>
                Emision:{' '}
                <span className="text-gray-300">
                  {formatDate(quote.issueDate)}
                </span>
              </p>
              <p>
                Valida hasta:{' '}
                <span
                  className={expired ? 'text-amber-400 font-medium' : 'text-gray-300'}
                >
                  {formatDate(quote.validUntil)}
                  {expired && ' (expirada)'}
                </span>
              </p>
              {quote.version > 1 && (
                <p>
                  Version:{' '}
                  <span className="text-gray-300">v{quote.version}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-lg font-semibold text-white">
              Items de la Cotizacion
            </h2>
            {actionable && (
              <p className="text-gray-500 text-xs mt-1">
                Marca los items que deseas aprobar o rechazar individualmente.
              </p>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {actionable && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Estado
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripcion
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cant.
                  </th>
                  {actionable && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cant. Aprobada
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio Unit.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desc.
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((item) => {
                  const decision = decisions[item.id];
                  const isApproved = decision?.approvalStatus === 'APPROVED';
                  const isRejected = decision?.approvalStatus === 'REJECTED';

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className="transition-colors"
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          background: isRejected && actionable
                            ? 'rgba(239,68,68,0.05)'
                            : 'transparent',
                        }}
                      >
                        {actionable && (
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleItemApproval(item.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                isApproved
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              }`}
                              title={isApproved ? 'Click para rechazar' : 'Click para aprobar'}
                            >
                              {isApproved ? (
                                <CheckIcon className="h-4 w-4" />
                              ) : (
                                <XIcon className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        )}
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          {item.lineNumber}
                        </td>
                        <td className="px-4 py-3">
                          <p
                            className={`text-sm font-medium ${
                              isRejected && actionable ? 'text-gray-500 line-through' : 'text-white'
                            }`}
                          >
                            {item.description}
                          </p>
                          {item.itemCode && (
                            <p className="text-xs text-gray-500">{item.itemCode}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">
                          {item.quantity}
                        </td>
                        {actionable && (
                          <td className="px-4 py-3 text-right">
                            {isApproved ? (
                              <input
                                type="number"
                                min={1}
                                max={item.quantity}
                                value={decision?.approvedQuantity ?? item.quantity}
                                onChange={(e) =>
                                  updateApprovedQuantity(
                                    item.id,
                                    Math.min(
                                      Math.max(1, parseInt(e.target.value) || 1),
                                      item.quantity,
                                    ),
                                  )
                                }
                                className="w-20 px-2 py-1 text-right text-sm rounded-lg text-white"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }}
                              />
                            ) : (
                              <span className="text-gray-500 text-sm">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right text-sm text-gray-300">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-300">
                          {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-white">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                      {/* Rejection reason input */}
                      {actionable && isRejected && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 pb-3 pt-0"
                            style={{ borderTop: 'none' }}
                          >
                            <div className="ml-12 flex items-center gap-2">
                              <span className="text-xs text-red-400 flex-shrink-0">
                                Motivo:
                              </span>
                              <input
                                type="text"
                                value={decision?.rejectionReason || ''}
                                onChange={(e) =>
                                  updateRejectionReason(item.id, e.target.value)
                                }
                                placeholder="Razon del rechazo (opcional)"
                                className="flex-1 px-3 py-1.5 text-sm rounded-lg text-white placeholder-gray-600"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {quote.lineItems.map((item) => {
              const decision = decisions[item.id];
              const isApproved = decision?.approvalStatus === 'APPROVED';
              const isRejected = decision?.approvalStatus === 'REJECTED';

              return (
                <div
                  key={item.id}
                  className="p-4"
                  style={{
                    background: isRejected && actionable
                      ? 'rgba(239,68,68,0.05)'
                      : 'transparent',
                    borderColor: 'rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    {actionable && (
                      <button
                        type="button"
                        onClick={() => toggleItemApproval(item.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                          isApproved
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {isApproved ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <XIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isRejected && actionable ? 'text-gray-500 line-through' : 'text-white'
                        }`}
                      >
                        {item.description}
                      </p>
                      {item.itemCode && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.itemCode}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                        <span>Cant: {item.quantity}</span>
                        <span>Precio: {formatCurrency(item.unitPrice)}</span>
                        {item.discount > 0 && (
                          <span>Desc: {formatCurrency(item.discount)}</span>
                        )}
                      </div>
                      {actionable && isApproved && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Cant. aprobada:</span>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={decision?.approvedQuantity ?? item.quantity}
                            onChange={(e) =>
                              updateApprovedQuantity(
                                item.id,
                                Math.min(
                                  Math.max(1, parseInt(e.target.value) || 1),
                                  item.quantity,
                                ),
                              )
                            }
                            className="w-16 px-2 py-1 text-right text-xs rounded-lg text-white"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          />
                        </div>
                      )}
                      {actionable && isRejected && (
                        <input
                          type="text"
                          value={decision?.rejectionReason || ''}
                          onChange={(e) =>
                            updateRejectionReason(item.id, e.target.value)
                          }
                          placeholder="Motivo del rechazo (opcional)"
                          className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg text-white placeholder-gray-600"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(239,68,68,0.2)',
                          }}
                        />
                      )}
                    </div>
                    <p className="text-sm font-medium text-white flex-shrink-0">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div
            className="px-6 py-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex flex-col items-end space-y-2">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal original:</span>
                  <span className="text-gray-300">
                    {formatCurrency(Number(quote.subtotal))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">IVA:</span>
                  <span className="text-gray-300">
                    {formatCurrency(Number(quote.taxAmount))}
                  </span>
                </div>
                <div
                  className="h-px"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                />
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">
                    Total original:
                  </span>
                  <span className="text-white font-semibold text-lg">
                    {formatCurrency(Number(quote.total))}
                  </span>
                </div>

                {actionable && approvedTotal !== Number(quote.total) && (
                  <>
                    <div
                      className="h-px my-1"
                      style={{ background: 'rgba(34,197,94,0.2)' }}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400/70">Subtotal aprobado:</span>
                      <span className="text-green-400/70">
                        {formatCurrency(approvedSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400/70">IVA aprobado:</span>
                      <span className="text-green-400/70">
                        {formatCurrency(approvedTax)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400 font-medium">
                        Total aprobado:
                      </span>
                      <span className="text-green-400 font-semibold text-lg">
                        {formatCurrency(approvedTotal)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                      {approvedCount} de {totalItems} items aprobados
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        {(quote.terms || quote.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {quote.terms && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Terminos y Condiciones
                </h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                  {quote.terms}
                </p>
              </div>
            )}
            {quote.notes && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Notas
                </h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">
                  {quote.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Approval form (only when actionable) */}
        {actionable && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2 className="text-lg font-semibold text-white mb-1">
              Tu Respuesta
            </h2>
            <p className="text-gray-500 text-xs mb-5">
              Completa tus datos para aprobar o rechazar esta cotizacion.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Correo electronico <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={approverEmail}
                  onChange={(e) => setApproverEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Comentarios (opcional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Agrega notas o comentarios adicionales..."
                rows={3}
                className="w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting || !approverName.trim() || !approverEmail.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                style={{
                  background: submitting
                    ? '#166534'
                    : 'linear-gradient(135deg, #22C55E, #16A34A)',
                }}
              >
                {submitting ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                {approvedCount === totalItems
                  ? 'Aprobar Cotizacion'
                  : `Aprobar ${approvedCount} de ${totalItems} Items`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectorName(approverName);
                  setRejectorEmail(approverEmail);
                  setRejectComments(comments);
                  setShowRejectDialog(true);
                }}
                disabled={submitting}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
              >
                <XIcon className="h-4 w-4 text-red-400" />
                <span className="text-red-400">Rechazar Todo</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-gray-600 text-xs">
          Generado por{' '}
          <span className="text-gray-500 font-medium">Facturo by Republicode</span>
        </p>
      </footer>

      {/* Reject whole quote dialog (overlay) */}
      {showRejectDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: '#1E293B',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Rechazar Cotizacion
              </h3>
              <button
                type="button"
                onClick={() => setShowRejectDialog(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Rechazaras completamente la cotizacion{' '}
              <span className="text-white font-medium">{quote.quoteNumber}</span>.
              Por favor indica el motivo.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Motivo del rechazo <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Describe por que rechazas esta cotizacion..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Tu nombre
                  </label>
                  <input
                    type="text"
                    value={rejectorName}
                    onChange={(e) => setRejectorName(e.target.value)}
                    placeholder="Nombre"
                    className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Tu correo
                  </label>
                  <input
                    type="email"
                    value={rejectorEmail}
                    onChange={(e) => setRejectorEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Comentarios adicionales
                </label>
                <input
                  type="text"
                  value={rejectComments}
                  onChange={(e) => setRejectComments(e.target.value)}
                  placeholder="Comentarios opcionales..."
                  className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowRejectDialog(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 transition-colors hover:text-white"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!rejectReason.trim() || submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: submitting
                    ? '#991B1B'
                    : 'linear-gradient(135deg, #EF4444, #DC2626)',
                }}
              >
                {submitting ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <XIcon className="h-4 w-4" />
                )}
                Rechazar Cotizacion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Header Component ────────────────────────────────────────────────

function Header() {
  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'rgba(15,23,42,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
            }}
          >
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">
            Facturo <span className="text-gray-500 font-normal">by Republicode</span>
          </span>
        </div>
        <span className="text-xs text-gray-500">Portal de Aprobacion</span>
      </div>
    </header>
  );
}
