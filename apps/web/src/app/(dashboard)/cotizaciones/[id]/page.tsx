'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle,
  XCircle,
  Ban,
  Pencil,
  Trash2,
  Loader2,
  ClipboardList,
  User,
  Calendar,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';

// -- Types ------------------------------------------------------------------

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
  approvalStatus: string; // PENDING, APPROVED, REJECTED
  approvedQuantity: number | null;
  rejectionReason: string | null;
}

interface QuoteClient {
  id: string;
  nombre: string;
  numDocumento: string;
  nrc?: string | null;
  correo?: string | null;
  telefono?: string | null;
}

interface QuoteDetail {
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

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actorType: string;
  actorId: string | null;
  reason: string | null;
  createdAt: string;
}

// -- Status config ----------------------------------------------------------

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

const STATUS_STYLE_MAP: Record<string, { labelKey: string; variant: StatusConfig['variant']; className: string }> = {
  DRAFT: { labelKey: 'statusDraft', variant: 'secondary', className: 'bg-gray-600/20 text-gray-400 border-gray-600/30' },
  SENT: { labelKey: 'statusSent', variant: 'default', className: 'bg-blue-600/20 text-blue-400 border-blue-600/30' },
  PENDING_APPROVAL: { labelKey: 'statusPending', variant: 'default', className: 'bg-teal-600/20 text-teal-400 border-teal-600/30' },
  APPROVED: { labelKey: 'statusApproved', variant: 'default', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
  PARTIALLY_APPROVED: { labelKey: 'statusPartial', variant: 'default', className: 'bg-orange-600/20 text-orange-400 border-orange-600/30' },
  REJECTED: { labelKey: 'statusRejected', variant: 'destructive', className: 'bg-red-600/20 text-red-400 border-red-600/30' },
  EXPIRED: { labelKey: 'statusExpired', variant: 'outline', className: 'bg-amber-600/20 text-amber-400 border-amber-600/30' },
  CONVERTED: { labelKey: 'statusConverted', variant: 'default', className: 'bg-purple-600/20 text-purple-400 border-purple-600/30' },
  CANCELLED: { labelKey: 'statusCancelled', variant: 'secondary', className: 'bg-gray-700/20 text-gray-500 border-gray-700/30' },
  CHANGES_REQUESTED: { labelKey: 'statusChangesRequested', variant: 'default', className: 'bg-orange-600/20 text-orange-400 border-orange-600/30' },
  REVISED: { labelKey: 'statusRevised', variant: 'default', className: 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30' },
};

const APPROVAL_STYLE_MAP: Record<string, { labelKey: string; className: string }> = {
  APPROVED: { labelKey: 'approvalApproved', className: 'bg-green-600/20 text-green-400 border-green-600/30' },
  REJECTED: { labelKey: 'approvalRejected', className: 'bg-red-600/20 text-red-400 border-red-600/30' },
  PENDING: { labelKey: 'approvalPending', className: 'bg-gray-600/20 text-gray-400 border-gray-600/30' },
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-SV', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// -- Component --------------------------------------------------------------

export default function CotizacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;
  const t = useTranslations('quotes');
  const tCommon = useTranslations('common');
  const tInvoices = useTranslations('invoices');

  const [quote, setQuote] = React.useState<QuoteDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [statusHistory, setStatusHistory] = React.useState<StatusHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [showVersions, setShowVersions] = React.useState(false);

  // Dialogs
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [showConvertDialog, setShowConvertDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  // -- Fetch ----------------------------------------------------------------

  const fetchQuote = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toastRef.current.error(t('cantLoadQuote'));
        router.push('/cotizaciones');
        return;
      }

      const data = await res.json();
      setQuote(data as QuoteDetail);
    } catch (err) {
      console.error('Error fetching quote:', err);
      toastRef.current.error(t('cantLoadQuote'));
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchStatusHistory = React.useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setHistoryLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${id}/status-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      if (Array.isArray(data)) {
        setStatusHistory(data as StatusHistoryEntry[]);
      }
    } catch (err) {
      console.error('Error fetching status history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchQuote();
    fetchStatusHistory();
  }, [fetchQuote, fetchStatusHistory]);

  // -- Actions --------------------------------------------------------------

  const handleAction = async (
    action: string,
    body?: Record<string, unknown>,
  ) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message ||
            `Error al ${action}`,
        );
      }

      toastRef.current.success(t('actionSuccess'));
      fetchQuote();
      fetchStatusHistory();
    } catch (err) {
      toastRef.current.error(
        err instanceof Error ? err.message : tCommon('error'),
      );
    } finally {
      setActionLoading(false);
      setShowRejectDialog(false);
      setShowCancelDialog(false);
    }
  };

  const handleConvert = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${id}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message ||
            'Error al convertir',
        );
      }

      const result = await res.json();
      toastRef.current.success(t('convertSuccess'));

      if ((result as { invoice?: { id?: string } }).invoice?.id) {
        router.push(
          `/facturas/${(result as { invoice: { id: string } }).invoice.id}`,
        );
      } else {
        fetchQuote();
      }
    } catch (err) {
      toastRef.current.error(
        err instanceof Error ? err.message : tCommon('error'),
      );
    } finally {
      setActionLoading(false);
      setShowConvertDialog(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message ||
            'Error al eliminar',
        );
      }

      toastRef.current.success(t('deleteSuccess'));
      router.push('/cotizaciones');
    } catch (err) {
      toastRef.current.error(
        err instanceof Error ? err.message : tCommon('error'),
      );
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCreateNewVersion = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/${id}/create-version`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { message?: string }).message ||
            'Error al crear nueva version',
        );
      }

      const result = await res.json();
      toastRef.current.success(t('createNewVersion'));

      const newQuote = result as { id?: string };
      if (newQuote.id) {
        router.push(`/cotizaciones/${newQuote.id}`);
      } else {
        router.push('/cotizaciones');
      }
    } catch (err) {
      toastRef.current.error(
        err instanceof Error ? err.message : tCommon('error'),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyApprovalUrl = () => {
    if (!quote?.approvalUrl) return;
    navigator.clipboard.writeText(quote.approvalUrl).then(
      () => toastRef.current.success(t('copyApprovalLink')),
      () => toastRef.current.error(tCommon('error')),
    );
  };

  // -- Helpers --------------------------------------------------------------

  const showApprovalBadges =
    quote?.status === 'PARTIALLY_APPROVED' ||
    quote?.status === 'APPROVED' ||
    quote?.status === 'PENDING_APPROVAL' ||
    quote?.status === 'CHANGES_REQUESTED';

  const hasApprovedTotals =
    quote?.approvedTotal != null &&
    quote.approvedTotal !== quote.total;

  // -- Loading --------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">
          {t('quoteNotFound')}
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push('/cotizaciones')}
        >
          {t('backToQuotes')}
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_STYLE_MAP[quote.status] || STATUS_STYLE_MAP.DRAFT;
  const lineItems = Array.isArray(quote.lineItems) ? quote.lineItems : [];

  // -- Render ---------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/cotizaciones')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {tCommon('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              {quote.quoteNumber}
              {quote.version > 1 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  v{quote.version}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge
                variant={statusConfig.variant}
                className={statusConfig.className}
              >
                {t(statusConfig.labelKey)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {t('validUntilLabel')} {formatDate(quote.validUntil)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons based on status */}
        <div className="flex items-center gap-2">
          {quote.status === 'DRAFT' && (
            <>
              <Button
                variant="ghost"
                onClick={() =>
                  router.push(`/cotizaciones/nueva?edit=${quote.id}`)
                }
              >
                <Pencil className="w-4 h-4 mr-2" />
                {tCommon('edit')}
              </Button>
              <Button
                className="btn-primary"
                onClick={() => handleAction('send')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {t('sendToClient')}
              </Button>
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {tCommon('delete')}
              </Button>
            </>
          )}
          {quote.status === 'SENT' && (
            <>
              {quote.approvalUrl && (
                <Button
                  variant="ghost"
                  className="text-teal-400 hover:text-teal-300"
                  onClick={handleCopyApprovalUrl}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  {t('copyApprovalLink')}
                </Button>
              )}
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {t('markApproved')}
              </Button>
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {t('reject')}
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setShowCancelDialog(true)}
              >
                <Ban className="w-4 h-4 mr-2" />
                {tCommon('cancel')}
              </Button>
            </>
          )}
          {quote.status === 'CHANGES_REQUESTED' && (
            <>
              <Button
                variant="ghost"
                onClick={() =>
                  router.push(`/cotizaciones/nueva?edit=${quote.id}`)
                }
              >
                <Pencil className="w-4 h-4 mr-2" />
                {t('editAndResend')}
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => handleAction('resend')}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {t('resendNoChanges')}
              </Button>
            </>
          )}
          {(quote.status === 'APPROVED' || quote.status === 'PARTIALLY_APPROVED') && (
            <>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => setShowConvertDialog(true)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {t('convertToInvoice')}
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setShowCancelDialog(true)}
              >
                <Ban className="w-4 h-4 mr-2" />
                {tCommon('cancel')}
              </Button>
            </>
          )}
          {(quote.status === 'REJECTED' || quote.status === 'EXPIRED' || quote.status === 'CANCELLED') && (
            <Button
              className="btn-primary"
              onClick={handleCreateNewVersion}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {t('createNewVersion')}
            </Button>
          )}
          {quote.status === 'CONVERTED' &&
            quote.convertedToInvoiceId && (
              <Button
                className="btn-primary"
                onClick={() =>
                  router.push(
                    `/facturas/${quote.convertedToInvoiceId}`,
                  )
                }
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('viewInvoice')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
        </div>
      </div>

      {/* Rejection reason */}
      {quote.status === 'REJECTED' && quote.rejectionReason && (
        <div className="glass-card p-4 border-red-600/30">
          <p className="text-sm text-red-400">
            <strong>{t('rejectionReason')}</strong> {quote.rejectionReason}
          </p>
        </div>
      )}

      {/* Changes requested info */}
      {quote.status === 'CHANGES_REQUESTED' && (
        <div className="glass-card p-5 border-orange-600/30">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-5 h-5 text-orange-400" />
            <h2 className="font-semibold text-orange-400">{t('changesRequested')}</h2>
          </div>
          {quote.clientNotes && (
            <div className="bg-orange-600/10 border border-orange-600/20 rounded-lg p-4 mb-3">
              <p className="text-sm text-muted-foreground mb-1 font-medium">{t('clientComment')}</p>
              <p className="text-foreground text-sm whitespace-pre-wrap">{quote.clientNotes}</p>
            </div>
          )}
          {lineItems.some((li) => li.approvalStatus === 'REJECTED') && (
            <div>
              <p className="text-sm text-muted-foreground mb-2 font-medium">{t('itemsToRemove')}</p>
              <ul className="space-y-1">
                {lineItems
                  .filter((li) => li.approvalStatus === 'REJECTED')
                  .map((li) => (
                    <li key={li.id} className="text-sm text-red-400 flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="line-through">{li.description}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Conversion info */}
      {quote.status === 'CONVERTED' && quote.convertedAt && (
        <div className="glass-card p-4 border-purple-600/30">
          <p className="text-sm text-purple-400">
            {t('convertedAt', { date: formatDate(quote.convertedAt) })}
          </p>
        </div>
      )}

      {/* Approval info */}
      {quote.approvedBy && (
        <div className="glass-card p-5 border-green-600/30">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="font-semibold text-foreground">{t('approvalInfo')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('approvedBy')}</p>
              <p className="text-foreground font-medium">{quote.approvedBy}</p>
            </div>
            {quote.approvedAt && (
              <div>
                <p className="text-sm text-muted-foreground">{t('approvalDate')}</p>
                <p className="text-foreground">{formatDateTime(quote.approvedAt)}</p>
              </div>
            )}
            {quote.clientNotes && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">{t('clientNotes')}</p>
                <p className="text-foreground text-sm whitespace-pre-wrap">{quote.clientNotes}</p>
              </div>
            )}
          </div>
          {quote.approvalUrl && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">{t('approvalLink')}</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-foreground bg-background/50 px-3 py-1.5 rounded-md border border-border flex-1 truncate">
                  {quote.approvalUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyApprovalUrl}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Version info */}
      {quote.version > 1 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{t('versionLabel', { version: quote.version })}</h3>
            </div>
            {quote.quoteGroupId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersions(!showVersions)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showVersions ? (
                  <ChevronUp className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-1" />
                )}
                {t('viewVersions')}
              </Button>
            )}
          </div>
          {showVersions && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {t('versionDesc', { version: quote.version })}
                {quote.quoteGroupId && (
                  <span className="ml-1">
                    {t('group')} <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded">{quote.quoteGroupId}</code>
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Client info */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">{t('client')}</h2>
        </div>
        {quote.client ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{tCommon('name')}</p>
              <p className="text-foreground font-medium">
                {quote.client.nombre}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tCommon('type')}</p>
              <p className="text-foreground">
                {quote.client.numDocumento}
              </p>
            </div>
            {quote.client.correo && (
              <div>
                <p className="text-sm text-muted-foreground">{tCommon('email')}</p>
                <p className="text-foreground">{quote.client.correo}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quote.clienteNombre && (
              <div>
                <p className="text-sm text-muted-foreground">{tCommon('name')}</p>
                <p className="text-foreground font-medium">{quote.clienteNombre}</p>
              </div>
            )}
            {quote.clienteEmail && (
              <div>
                <p className="text-sm text-muted-foreground">{tCommon('email')}</p>
                <p className="text-foreground">{quote.clienteEmail}</p>
              </div>
            )}
            {!quote.clienteNombre && !quote.clienteEmail && (
              <p className="text-muted-foreground text-sm">
                {t('clientNotFound')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Items ({lineItems.length})
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{tCommon('description')}</TableHead>
              <TableHead className="text-right">{tInvoices('qty')}</TableHead>
              <TableHead className="text-right">{tCommon('price')}</TableHead>
              <TableHead className="text-right">{tCommon('discount')}</TableHead>
              <TableHead className="text-right">{tCommon('tax')}</TableHead>
              <TableHead className="text-right">{tCommon('total')}</TableHead>
              {showApprovalBadges && (
                <TableHead className="text-center">{tCommon('status')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item) => {
              const approvalBadge = APPROVAL_STYLE_MAP[item.approvalStatus] || APPROVAL_STYLE_MAP.PENDING;
              const quantityDiffers =
                item.approvedQuantity != null &&
                item.approvedQuantity !== item.quantity;

              return (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {item.lineNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {item.description}
                      </p>
                      {item.itemCode && (
                        <p className="text-xs text-muted-foreground">
                          {item.itemCode}
                        </p>
                      )}
                      {item.approvalStatus === 'REJECTED' && item.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1">
                          {t('rejectionReason')} {item.rejectionReason}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span>{item.quantity}</span>
                    {quantityDiffers && (
                      <span className="block text-xs text-green-400">
                        {t('statusApproved')}: {item.approvedQuantity}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.discount > 0
                      ? formatCurrency(item.discount)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.lineTax)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.lineTotal)}
                  </TableCell>
                  {showApprovalBadges && (
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs ${approvalBadge.className}`}
                      >
                        {t(approvalBadge.labelKey)}
                      </Badge>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Totals */}
        <div className="border-t border-border p-5">
          <div className="flex flex-col items-end space-y-2">
            <div className="flex justify-between w-60">
              <span className="text-muted-foreground">{tInvoices('subtotalLabel')}</span>
              <span className="font-medium">
                {formatCurrency(Number(quote.subtotal))}
              </span>
            </div>
            <div className="flex justify-between w-60">
              <span className="text-muted-foreground">{tInvoices('ivaLabel')}</span>
              <span className="font-medium">
                {formatCurrency(Number(quote.taxAmount))}
              </span>
            </div>
            <div className="h-px bg-primary/30 w-60" />
            <div className="flex justify-between w-60">
              <span className="text-lg font-semibold">{tInvoices('totalLabel')}</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(Number(quote.total))}
              </span>
            </div>
          </div>
        </div>

        {/* Approved totals */}
        {hasApprovedTotals && (
          <div className="border-t border-green-600/30 p-5 bg-green-600/5">
            <h3 className="text-sm font-medium text-green-400 uppercase tracking-wider mb-3">
              {t('approvedTotals')}
            </h3>
            <div className="flex flex-col items-end space-y-2">
              {quote.approvedSubtotal != null && (
                <div className="flex justify-between w-60">
                  <span className="text-muted-foreground">{tInvoices('subtotalLabel')}</span>
                  <span className="font-medium text-green-400">
                    {formatCurrency(Number(quote.approvedSubtotal))}
                  </span>
                </div>
              )}
              {quote.approvedTaxAmount != null && (
                <div className="flex justify-between w-60">
                  <span className="text-muted-foreground">{tInvoices('ivaLabel')}</span>
                  <span className="font-medium text-green-400">
                    {formatCurrency(Number(quote.approvedTaxAmount))}
                  </span>
                </div>
              )}
              <div className="h-px bg-green-600/30 w-60" />
              <div className="flex justify-between w-60">
                <span className="text-lg font-semibold text-green-400">{t('approvedTotal')}</span>
                <span className="text-2xl font-bold text-green-400">
                  {formatCurrency(Number(quote.approvedTotal))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terms & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quote.terms && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t('terms')}
            </h3>
            <p className="text-foreground text-sm whitespace-pre-wrap">
              {quote.terms}
            </p>
          </div>
        )}
        {quote.notes && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t('internalNotesSection')}
            </h3>
            <p className="text-foreground text-sm whitespace-pre-wrap">
              {quote.notes}
            </p>
          </div>
        )}
      </div>

      {/* Date info */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('dates')}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t('created')}</p>
            <p className="text-foreground">
              {formatDate(quote.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('emission')}</p>
            <p className="text-foreground">
              {formatDate(quote.issueDate)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('validUntil')}</p>
            <p className="text-foreground">
              {formatDate(quote.validUntil)}
            </p>
          </div>
          {quote.sentAt && (
            <div>
              <p className="text-muted-foreground">{t('sent')}</p>
              <p className="text-foreground">
                {formatDate(quote.sentAt)}
              </p>
            </div>
          )}
          {quote.convertedAt && (
            <div>
              <p className="text-muted-foreground">{t('converted')}</p>
              <p className="text-foreground">
                {formatDate(quote.convertedAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status history timeline */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('statusHistory')}</h3>
        </div>
        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : statusHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noHistory')}</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {statusHistory.map((entry) => {
                const toConfig = STATUS_STYLE_MAP[entry.toStatus];
                return (
                  <div key={entry.id} className="relative flex items-start gap-4 pl-8">
                    {/* Timeline dot */}
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.fromStatus && (
                          <>
                            <Badge
                              variant="outline"
                              className={`text-xs ${(STATUS_STYLE_MAP[entry.fromStatus] || STATUS_STYLE_MAP.DRAFT).className}`}
                            >
                              {t((STATUS_STYLE_MAP[entry.fromStatus] || STATUS_STYLE_MAP.DRAFT).labelKey)}
                            </Badge>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                          </>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${(toConfig || STATUS_STYLE_MAP.DRAFT).className}`}
                        >
                          {t((toConfig || STATUS_STYLE_MAP.DRAFT).labelKey)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatDateTime(entry.createdAt)}</span>
                        {entry.actorType && (
                          <span>
                            {entry.actorType === 'CLIENT' ? t('client') : tCommon('name')}
                            {entry.actorId ? `: ${entry.actorId}` : ''}
                          </span>
                        )}
                      </div>
                      {entry.reason && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {entry.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* -- Dialogs --------------------------------------------------------- */}

      {/* Reject dialog */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectQuote')}</DialogTitle>
            <DialogDescription>
              {t('rejectPrompt', { number: quote.quoteNumber })}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('rejectPlaceholder')}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowRejectDialog(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                handleAction('reject', { reason: rejectReason })
              }
              disabled={!rejectReason.trim() || actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {t('reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert dialog */}
      <Dialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('convertQuote')}</DialogTitle>
            <DialogDescription>
              {t('convertConfirm', { number: quote.quoteNumber })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowConvertDialog(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleConvert}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {t('convertToInvoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteQuote')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirm', { number: quote.quoteNumber })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cancelQuote')}</DialogTitle>
            <DialogDescription>
              {t('cancelConfirm', { number: quote.quoteNumber })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCancelDialog(false)}
            >
              {tCommon('back')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleAction('cancel')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              {t('cancelQuote')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
