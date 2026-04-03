'use client';

import { API_URL } from '@/lib/api';
import * as React from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, ArrowRight, Send, CheckCircle, XCircle, Ban, Pencil, Trash2,
  Loader2, ClipboardList, FileText, Link as LinkIcon, RefreshCw,
} from 'lucide-react';
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
  return (
    <div className="space-y-6">
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
  );
}
