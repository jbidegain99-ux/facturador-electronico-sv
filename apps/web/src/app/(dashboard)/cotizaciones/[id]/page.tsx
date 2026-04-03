'use client';

import { API_URL } from '@/lib/api';
import * as React from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, ArrowRight, Send, CheckCircle, XCircle, Ban, Pencil, Trash2,
  Loader2, ClipboardList, FileText, Link as LinkIcon, RefreshCw, WifiOff,
} from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncQueueStore } from '@/store/sync-queue';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/lib/utils';
import type { QuoteDetail, StatusHistoryEntry } from './components/quote-types';
import { STATUS_STYLE_MAP, formatDate } from './components/quote-types';
import {
  ChangesRequestedSection,
  ApprovalInfoSection,
  VersionInfoSection,
  ClientInfoSection,
  DatesSection,
} from './components/QuoteInfoSections';
import { QuoteItemsTable } from './components/QuoteItemsTable';

const QuoteDialogs = dynamic(() => import('./components/QuoteDialogs').then(m => ({ default: m.QuoteDialogs })), { ssr: false });
const QuoteStatusHistory = dynamic(() => import('./components/QuoteStatusHistory').then(m => ({ default: m.QuoteStatusHistory })));
const SignaturePad = dynamic(() => import('@/components/facturas/signature-pad').then(m => ({ default: m.SignaturePad })), { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-muted" /> });

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

  // Dialogs
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [showConvertDialog, setShowConvertDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  // Mobile approve/reject
  const { isOnline } = useOnlineStatus();
  const addOp = useSyncQueueStore((s) => s.addOp);
  const [mobileShowSignature, setMobileShowSignature] = React.useState(false);
  const [mobileSignatureData, setMobileSignatureData] = React.useState<string | null>(null);
  const [mobileRejectReason, setMobileRejectReason] = React.useState('');
  const [showMobileReject, setShowMobileReject] = React.useState(false);

  // -- Fetch ----------------------------------------------------------------

  const fetchQuote = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotes/${id}`, { credentials: 'include', headers: {} });
      if (!res.ok) { toastRef.current.error(t('cantLoadQuote')); router.push('/cotizaciones'); return; }
      setQuote(await res.json() as QuoteDetail);
    } catch (err) { console.error('Error fetching quote:', err); toastRef.current.error(t('cantLoadQuote')); }
    finally { setLoading(false); }
  }, [id, router]);

  const fetchStatusHistory = React.useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotes/${id}/status-history`, { credentials: 'include', headers: {} });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setStatusHistory(data as StatusHistoryEntry[]);
    } catch (err) { console.error('Error fetching status history:', err); }
    finally { setHistoryLoading(false); }
  }, [id]);

  React.useEffect(() => { fetchQuote(); fetchStatusHistory(); }, [fetchQuote, fetchStatusHistory]);

  // -- Actions --------------------------------------------------------------

  const handleAction = async (action: string, body?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotes/${id}/${action}`, { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error((errData as { message?: string }).message || `Error al ${action}`); }
      toastRef.current.success(t('actionSuccess'));
      fetchQuote(); fetchStatusHistory();
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tCommon('error')); }
    finally { setActionLoading(false); setShowRejectDialog(false); setShowCancelDialog(false); }
  };

  const handleConvert = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotes/${id}/convert`, { credentials: 'include', method: 'POST', headers: {} });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error((errData as { message?: string }).message || 'Error al convertir'); }
      const result = await res.json();
      toastRef.current.success(t('convertSuccess'));
      if ((result as { invoice?: { id?: string } }).invoice?.id) router.push(`/facturas/${(result as { invoice: { id: string } }).invoice.id}`);
      else fetchQuote();
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tCommon('error')); }
    finally { setActionLoading(false); setShowConvertDialog(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotes/${id}`, { credentials: 'include', method: 'DELETE', headers: {} });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error((errData as { message?: string }).message || 'Error al eliminar'); }
      toastRef.current.success(t('deleteSuccess')); router.push('/cotizaciones');
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tCommon('error')); }
    finally { setActionLoading(false); setShowDeleteDialog(false); }
  };

  const handleCreateNewVersion = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotes/${id}/create-version`, { credentials: 'include', method: 'POST', headers: {} });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error((errData as { message?: string }).message || 'Error al crear nueva version'); }
      const result = await res.json();
      toastRef.current.success(t('createNewVersion'));
      const newQuote = result as { id?: string };
      router.push(newQuote.id ? `/cotizaciones/${newQuote.id}` : '/cotizaciones');
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tCommon('error')); }
    finally { setActionLoading(false); }
  };

  const handleCopyApprovalUrl = () => {
    if (!quote?.approvalUrl) return;
    navigator.clipboard.writeText(quote.approvalUrl).then(
      () => toastRef.current.success(t('copyApprovalLink')),
      () => toastRef.current.error(tCommon('error')),
    );
  };

  // -- Mobile approve/reject handlers ---------------------------------------

  const handleMobileApprove = async () => {
    if (!quote) return;
    if (!isOnline) {
      await addOp('APPROVE_QUOTE', { quoteId: id, signature: mobileSignatureData });
      toastRef.current.success(t('approveQueued') ?? 'Aprobacion guardada. Se enviara cuando vuelvas a estar en linea.');
      setMobileShowSignature(false);
      setMobileSignatureData(null);
      return;
    }
    await handleAction('approve', mobileSignatureData ? { signature: mobileSignatureData } : undefined);
    setMobileShowSignature(false);
    setMobileSignatureData(null);
  };

  const handleMobileReject = async () => {
    if (!quote) return;
    if (!isOnline) {
      await addOp('REJECT_QUOTE', { quoteId: id, reason: mobileRejectReason });
      toastRef.current.success(t('rejectQueued') ?? 'Rechazo guardado. Se enviara cuando vuelvas a estar en linea.');
      setShowMobileReject(false);
      setMobileRejectReason('');
      return;
    }
    await handleAction('reject', { reason: mobileRejectReason });
    setShowMobileReject(false);
    setMobileRejectReason('');
  };

  // -- Helpers --------------------------------------------------------------

  const showApprovalBadges = quote?.status === 'PARTIALLY_APPROVED' || quote?.status === 'APPROVED' || quote?.status === 'PENDING_APPROVAL' || quote?.status === 'CHANGES_REQUESTED';
  const hasApprovedTotals = quote?.approvedTotal != null && quote.approvedTotal !== quote.total;

  // -- Loading / Not found --------------------------------------------------
  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!quote) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t('quoteNotFound')}</p>
        <Button className="mt-4" onClick={() => router.push('/cotizaciones')}>{t('backToQuotes')}</Button>
      </div>
    );
  }

  const statusConfig = STATUS_STYLE_MAP[quote.status] || STATUS_STYLE_MAP.DRAFT;
  const lineItems = Array.isArray(quote.lineItems) ? quote.lineItems : [];

  // -- Render ---------------------------------------------------------------

  const canApproveReject = quote.status === 'SENT' || quote.status === 'PENDING_APPROVAL';

  return (
    <>
    {/* ── Mobile view ── */}
    <div className="md:hidden space-y-4 pb-28">
      {/* Mobile header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/cotizaciones')} className="text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary shrink-0" />
            {quote.quoteNumber}
            {quote.version > 1 && <span className="text-xs font-normal text-muted-foreground">v{quote.version}</span>}
          </h1>
          <Badge variant={statusConfig.variant} className={`${statusConfig.className} mt-1`}>{t(statusConfig.labelKey)}</Badge>
        </div>
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400">
          <WifiOff className="h-3.5 w-3.5" />
          Sin conexion - las acciones se enviaran al reconectar
        </div>
      )}

      {/* Mobile summary card */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('client')}</span>
          <span className="text-sm font-medium truncate ml-2">{quote.client?.nombre || quote.clienteNombre || '-'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{tCommon('total')}</span>
          <span className="text-lg font-bold">{formatCurrency(Number(quote.total))}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('items') ?? 'Items'}</span>
          <span className="text-sm">{lineItems.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{tCommon('date')}</span>
          <span className="text-sm">{formatDate(quote.issueDate)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('validUntilLabel')}</span>
          <span className="text-sm">{formatDate(quote.validUntil)}</span>
        </div>
      </div>

      {/* Rejection reason on mobile */}
      {quote.status === 'REJECTED' && quote.rejectionReason && (
        <div className="rounded-lg border border-red-600/30 bg-red-500/5 p-3">
          <p className="text-xs text-red-400"><strong>{t('rejectionReason')}</strong> {quote.rejectionReason}</p>
        </div>
      )}

      {/* Mobile signature pad for approve */}
      {mobileShowSignature && (
        <div className="rounded-lg border border-green-600/30 bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium">{t('signToApprove') ?? 'Firme para aprobar'}</h3>
          <SignaturePad onSignatureChange={setMobileSignatureData} />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => { setMobileShowSignature(false); setMobileSignatureData(null); }}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleMobileApprove}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              {t('confirmApprove') ?? 'Confirmar'}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile reject reason input */}
      {showMobileReject && (
        <div className="rounded-lg border border-red-600/30 bg-card p-4 space-y-3">
          <h3 className="text-sm font-medium">{t('rejectReasonLabel') ?? 'Motivo del rechazo'}</h3>
          <textarea
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
            rows={3}
            placeholder={t('rejectReasonPlaceholder') ?? 'Explique el motivo...'}
            value={mobileRejectReason}
            onChange={(e) => setMobileRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => { setShowMobileReject(false); setMobileRejectReason(''); }}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={handleMobileReject}
              disabled={actionLoading || !mobileRejectReason.trim()}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
              {t('confirmReject') ?? 'Rechazar'}
            </Button>
          </div>
        </div>
      )}

      {/* Fixed bottom action bar for approve/reject */}
      {canApproveReject && !mobileShowSignature && !showMobileReject && (
        <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm p-3 flex gap-3 safe-bottom">
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowMobileReject(true)}
            disabled={actionLoading}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {t('reject')}
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setMobileShowSignature(true)}
            disabled={actionLoading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {t('markApproved')}
          </Button>
        </div>
      )}
    </div>

    {/* ── Desktop view ── */}
    <div className="hidden md:block space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/cotizaciones')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />{tCommon('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              {quote.quoteNumber}
              {quote.version > 1 && <span className="text-sm font-normal text-muted-foreground ml-2">v{quote.version}</span>}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={statusConfig.variant} className={statusConfig.className}>{t(statusConfig.labelKey)}</Badge>
              <span className="text-sm text-muted-foreground">{t('validUntilLabel')} {formatDate(quote.validUntil)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons based on status */}
        <div className="flex items-center gap-2">
          {quote.status === 'DRAFT' && (
            <>
              <Button variant="ghost" onClick={() => router.push(`/cotizaciones/nueva?edit=${quote.id}`)}><Pencil className="w-4 h-4 mr-2" />{tCommon('edit')}</Button>
              <Button className="btn-primary" onClick={() => handleAction('send')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}{t('sendToClient')}
              </Button>
              <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setShowDeleteDialog(true)}><Trash2 className="w-4 h-4 mr-2" />{tCommon('delete')}</Button>
            </>
          )}
          {quote.status === 'SENT' && (
            <>
              {quote.approvalUrl && <Button variant="ghost" className="text-teal-400 hover:text-teal-300" onClick={handleCopyApprovalUrl}><LinkIcon className="w-4 h-4 mr-2" />{t('copyApprovalLink')}</Button>}
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction('approve')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}{t('markApproved')}
              </Button>
              <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setShowRejectDialog(true)}><XCircle className="w-4 h-4 mr-2" />{t('reject')}</Button>
              <Button variant="ghost" className="text-muted-foreground" onClick={() => setShowCancelDialog(true)}><Ban className="w-4 h-4 mr-2" />{tCommon('cancel')}</Button>
            </>
          )}
          {quote.status === 'CHANGES_REQUESTED' && (
            <>
              <Button variant="ghost" onClick={() => router.push(`/cotizaciones/nueva?edit=${quote.id}`)}><Pencil className="w-4 h-4 mr-2" />{t('editAndResend')}</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleAction('resend')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}{t('resendNoChanges')}
              </Button>
            </>
          )}
          {(quote.status === 'APPROVED' || quote.status === 'PARTIALLY_APPROVED') && (
            <>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowConvertDialog(true)} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}{t('convertToInvoice')}
              </Button>
              <Button variant="ghost" className="text-muted-foreground" onClick={() => setShowCancelDialog(true)}><Ban className="w-4 h-4 mr-2" />{tCommon('cancel')}</Button>
            </>
          )}
          {(quote.status === 'REJECTED' || quote.status === 'EXPIRED' || quote.status === 'CANCELLED') && (
            <Button className="btn-primary" onClick={handleCreateNewVersion} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}{t('createNewVersion')}
            </Button>
          )}
          {quote.status === 'CONVERTED' && quote.convertedToInvoiceId && (
            <Button className="btn-primary" onClick={() => router.push(`/facturas/${quote.convertedToInvoiceId}`)}>
              <FileText className="w-4 h-4 mr-2" />{t('viewInvoice')}<ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {quote.status === 'REJECTED' && quote.rejectionReason && (
        <div className="glass-card p-4 border-red-600/30">
          <p className="text-sm text-red-400"><strong>{t('rejectionReason')}</strong> {quote.rejectionReason}</p>
        </div>
      )}

      <ChangesRequestedSection quote={quote} lineItems={lineItems} t={t} />

      {/* Conversion info */}
      {quote.status === 'CONVERTED' && quote.convertedAt && (
        <div className="glass-card p-4 border-purple-600/30">
          <p className="text-sm text-purple-400">{t('convertedAt', { date: formatDate(quote.convertedAt) })}</p>
        </div>
      )}

      <ApprovalInfoSection quote={quote} onCopyUrl={handleCopyApprovalUrl} t={t} tCommon={tCommon} />
      <VersionInfoSection quote={quote} t={t} />
      <ClientInfoSection quote={quote} t={t} tCommon={tCommon} />

      <QuoteItemsTable
        quote={quote} lineItems={lineItems}
        showApprovalBadges={!!showApprovalBadges} hasApprovedTotals={!!hasApprovedTotals}
        t={t} tCommon={tCommon} tInvoices={tInvoices}
      />

      {/* Terms & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quote.terms && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('terms')}</h3>
            <p className="text-foreground text-sm whitespace-pre-wrap">{quote.terms}</p>
          </div>
        )}
        {quote.notes && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('internalNotesSection')}</h3>
            <p className="text-foreground text-sm whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
      </div>

      <DatesSection quote={quote} t={t} />
      <QuoteStatusHistory statusHistory={statusHistory} historyLoading={historyLoading} t={t} tCommon={tCommon} />

      {/* Dialogs (code-split) */}
      <QuoteDialogs
        quoteNumber={quote.quoteNumber} actionLoading={actionLoading}
        showRejectDialog={showRejectDialog} setShowRejectDialog={setShowRejectDialog}
        rejectReason={rejectReason} setRejectReason={setRejectReason}
        onReject={(reason) => handleAction('reject', { reason })}
        showConvertDialog={showConvertDialog} setShowConvertDialog={setShowConvertDialog} onConvert={handleConvert}
        showDeleteDialog={showDeleteDialog} setShowDeleteDialog={setShowDeleteDialog} onDelete={handleDelete}
        showCancelDialog={showCancelDialog} setShowCancelDialog={setShowCancelDialog} onCancel={() => handleAction('cancel')}
        t={t} tCommon={tCommon}
      />
    </div>
    </>
  );
}
