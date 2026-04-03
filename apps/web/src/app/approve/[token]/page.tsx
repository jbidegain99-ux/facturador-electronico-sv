'use client';

import { API_URL } from '@/lib/api';
import * as React from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import type { PublicQuote, ErrorResponse, SubmitResult } from './components/approval-types';
import { STATUS_DISPLAY, formatDate, isExpired } from './components/approval-types';
import { Spinner, CheckIcon, XIcon, ApprovalHeader as Header } from './components/ApprovalIcons';
import { ApprovalLineItems } from './components/ApprovalLineItems';

const ApprovalForm = dynamic(() => import('./components/ApprovalForm').then(m => ({ default: m.ApprovalForm })), { ssr: false });
const RejectDialog = dynamic(() => import('./components/RejectDialog').then(m => ({ default: m.RejectDialog })), { ssr: false });

// ── Main Component ──────────────────────────────────────────────────

export default function QuoteApprovalPage() {
  const params = useParams();
  const token = params.token as string;
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  const [quote, setQuote] = React.useState<PublicQuote | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitResult, setSubmitResult] = React.useState<SubmitResult>(null);
  const [submitMessage, setSubmitMessage] = React.useState('');

  const [approverName, setApproverName] = React.useState('');
  const [approverEmail, setApproverEmail] = React.useState('');
  const [comments, setComments] = React.useState('');
  const [removedItems, setRemovedItems] = React.useState<Set<string>>(new Set());

  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [rejectorName, setRejectorName] = React.useState('');
  const [rejectorEmail, setRejectorEmail] = React.useState('');
  const [rejectComments, setRejectComments] = React.useState('');

  // ── Fetch quote ───────────────────────────────────────────────────

  const fetchQuote = React.useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const apiUrl = API_URL || '';
      const res = await fetch(`${apiUrl}/quotes/public/approve/${token}`);
      if (!res.ok) { const errData = (await res.json().catch(() => ({}))) as ErrorResponse; throw new Error(errData.message || `Error al cargar la cotizacion (${res.status})`); }
      setQuote((await res.json()) as PublicQuote);
    } catch (err) { setFetchError(err instanceof Error ? err.message : 'Error al cargar la cotizacion'); }
    finally { setLoading(false); }
  }, [token]);

  React.useEffect(() => { fetchQuote(); }, [fetchQuote]);

  const toggleItemRemoval = (itemId: string) => {
    setRemovedItems((prev) => { const next = new Set(prev); if (next.has(itemId)) next.delete(itemId); else next.add(itemId); return next; });
  };

  // ── Submit handlers ──────────────────────────────────────────────

  const handleApprove = async () => {
    if (!approverName.trim() || !approverEmail.trim()) { toastRef.current.error('Nombre y correo son obligatorios'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/quotes/public/approve/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approverName: approverName.trim(), approverEmail: approverEmail.trim(), comments: comments.trim() || undefined }) });
      if (!res.ok) { const errData = (await res.json().catch(() => ({}))) as ErrorResponse; throw new Error(errData.message || 'Error al enviar la aprobacion'); }
      setSubmitResult('success'); setSubmitMessage('La cotizacion ha sido aprobada exitosamente.');
    } catch (err) { const msg = err instanceof Error ? err.message : 'Error al enviar la aprobacion'; setSubmitResult('error'); setSubmitMessage(msg); }
    finally { setSubmitting(false); }
  };

  const handleRequestChanges = async () => {
    if (!comments.trim()) { toastRef.current.error('Por favor explica los cambios que necesitas'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/quotes/public/request-changes/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ removedItems: Array.from(removedItems), comments: comments.trim(), clientName: approverName.trim() || undefined, clientEmail: approverEmail.trim() || undefined }) });
      if (!res.ok) { const errData = (await res.json().catch(() => ({}))) as ErrorResponse; throw new Error(errData.message || 'Error al solicitar cambios'); }
      setSubmitResult('success'); setSubmitMessage('Sus cambios han sido enviados al proveedor. Recibira una cotizacion actualizada pronto.');
    } catch (err) { const msg = err instanceof Error ? err.message : 'Error al solicitar cambios'; setSubmitResult('error'); setSubmitMessage(msg); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toastRef.current.error('El motivo de rechazo es obligatorio'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/quotes/public/reject/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: rejectReason.trim(), rejectorName: rejectorName.trim() || undefined, rejectorEmail: rejectorEmail.trim() || undefined, comments: rejectComments.trim() || undefined }) });
      if (!res.ok) { const errData = (await res.json().catch(() => ({}))) as ErrorResponse; throw new Error(errData.message || 'Error al rechazar la cotizacion'); }
      setShowRejectDialog(false); setSubmitResult('success'); setSubmitMessage('La cotizacion ha sido rechazada.');
    } catch (err) { const msg = err instanceof Error ? err.message : 'Error al rechazar la cotizacion'; setSubmitResult('error'); setSubmitMessage(msg); }
    finally { setSubmitting(false); }
  };

  // ── Loading / Error states ──────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="text-center"><Spinner className="h-10 w-10 text-blue-500 mx-auto" /><p className="mt-4 text-gray-400 text-sm">Cargando cotizacion...</p></div>
      </div>
    );
  }

  if (fetchError || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="max-w-md w-full mx-4 p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"><XIcon className="h-8 w-8 text-red-400" /></div>
          <h2 className="text-xl font-semibold text-white mb-2">No se pudo cargar la cotizacion</h2>
          <p className="text-gray-400 text-sm">{fetchError || 'El enlace puede ser invalido o haber expirado.'}</p>
        </div>
      </div>
    );
  }

  if (submitResult === 'success') {
    return (
      <div className="min-h-screen" style={{ background: '#0F172A' }}>
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 72px)' }}>
          <div className="max-w-md w-full mx-4 p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"><CheckIcon className="h-8 w-8 text-green-400" /></div>
            <h2 className="text-xl font-semibold text-white mb-2">Respuesta Enviada</h2>
            <p className="text-gray-400 text-sm">{submitMessage}</p>
            <p className="text-gray-500 text-xs mt-4">Puedes cerrar esta pagina.</p>
          </div>
        </div>
      </div>
    );
  }

  const expired = isExpired(quote.validUntil);
  const actionable = quote.status === 'SENT' && !expired;
  const isChangesRequested = quote.status === 'CHANGES_REQUESTED';
  const statusInfo = STATUS_DISPLAY[quote.status] || STATUS_DISPLAY.SENT;
  const hasRemovedItems = removedItems.size > 0;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Banners */}
        {isChangesRequested && (
          <div className="mb-6 p-5 rounded-xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0"><span className="text-orange-400 text-lg">!</span></div>
              <div>
                <p className="font-semibold text-orange-400">Cambios enviados</p>
                <p className="text-gray-400 text-sm mt-1">Sus cambios han sido enviados al proveedor. Recibira una cotizacion actualizada pronto.</p>
                <p className="text-gray-500 text-xs mt-2">No es posible realizar mas cambios hasta que reciba la version actualizada.</p>
              </div>
            </div>
          </div>
        )}

        {!actionable && !isChangesRequested && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: expired ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)', border: expired ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${expired ? 'bg-amber-500/20' : statusInfo.bgClass}`}>
                {expired ? <span className="text-amber-400 text-sm font-bold">!</span> : quote.status === 'APPROVED' || quote.status === 'PARTIALLY_APPROVED' ? <CheckIcon className={`h-4 w-4 ${statusInfo.textClass}`} /> : <XIcon className={`h-4 w-4 ${statusInfo.textClass}`} />}
              </div>
              <div>
                <p className={`font-medium ${expired ? 'text-amber-400' : statusInfo.textClass}`}>
                  {expired ? 'Esta cotizacion ha expirado' : `Esta cotizacion ya fue ${statusInfo.label.toLowerCase()}`}
                </p>
                <p className="text-gray-500 text-sm mt-1">{expired ? 'La fecha de validez ha pasado. Contacta al emisor si necesitas una nueva cotizacion.' : 'No es posible realizar cambios en esta cotizacion.'}</p>
              </div>
            </div>
          </div>
        )}

        {submitResult === 'error' && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm font-medium">{submitMessage}</p>
          </div>
        )}

        {/* Quote header */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">Cotizacion {quote.quoteNumber}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass} border ${statusInfo.borderClass}`}>{statusInfo.label}</span>
              </div>
              {quote.clienteNombre && (
                <p className="text-gray-400 text-sm">
                  Para: <span className="text-gray-300">{quote.clienteNombre}</span>
                  {quote.clienteEmail && <span className="text-gray-500"> ({quote.clienteEmail})</span>}
                </p>
              )}
            </div>
            <div className="text-sm text-gray-400 sm:text-right space-y-1 flex-shrink-0">
              <p>Emision: <span className="text-gray-300">{formatDate(quote.issueDate)}</span></p>
              <p>Valida hasta: <span className={expired ? 'text-amber-400 font-medium' : 'text-gray-300'}>{formatDate(quote.validUntil)}{expired && ' (expirada)'}</span></p>
              {quote.version > 1 && <p>Version: <span className="text-gray-300">v{quote.version}</span></p>}
            </div>
          </div>
        </div>

        {/* Line items */}
        <ApprovalLineItems
          lineItems={quote.lineItems} actionable={actionable}
          removedItems={removedItems} onToggleRemoval={toggleItemRemoval}
          subtotal={Number(quote.subtotal)} taxAmount={Number(quote.taxAmount)} total={Number(quote.total)}
        />

        {/* Terms & Notes */}
        {(quote.terms || quote.notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {quote.terms && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Terminos y Condiciones</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{quote.terms}</p>
              </div>
            )}
            {quote.notes && (
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notas</h3>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Approval form */}
        {actionable && (
          <ApprovalForm
            hasRemovedItems={hasRemovedItems} removedItemsCount={removedItems.size}
            submitting={submitting}
            approverName={approverName} setApproverName={setApproverName}
            approverEmail={approverEmail} setApproverEmail={setApproverEmail}
            comments={comments} setComments={setComments}
            onApprove={handleApprove} onRequestChanges={handleRequestChanges}
            onOpenReject={() => { setRejectorName(approverName); setRejectorEmail(approverEmail); setRejectComments(comments); setShowRejectDialog(true); }}
          />
        )}
      </main>

      <footer className="py-6 text-center">
        <p className="text-gray-600 text-xs">Generado por <span className="text-gray-500 font-medium">Facturo by Republicode</span></p>
      </footer>

      <RejectDialog
        quoteNumber={quote.quoteNumber} show={showRejectDialog} onClose={() => setShowRejectDialog(false)} onReject={handleReject}
        submitting={submitting} rejectReason={rejectReason} setRejectReason={setRejectReason}
        rejectorName={rejectorName} setRejectorName={setRejectorName}
        rejectorEmail={rejectorEmail} setRejectorEmail={setRejectorEmail}
        rejectComments={rejectComments} setRejectComments={setRejectComments}
      />
    </div>
  );
}
