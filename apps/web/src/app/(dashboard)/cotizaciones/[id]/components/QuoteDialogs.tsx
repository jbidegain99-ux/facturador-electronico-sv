'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, XCircle, Trash2, Ban, Loader2 } from 'lucide-react';

interface QuoteDialogsProps {
  quoteNumber: string;
  actionLoading: boolean;
  // Reject
  showRejectDialog: boolean;
  setShowRejectDialog: (v: boolean) => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  onReject: (reason: string) => void;
  // Convert
  showConvertDialog: boolean;
  setShowConvertDialog: (v: boolean) => void;
  onConvert: () => void;
  // Delete
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  onDelete: () => void;
  // Cancel
  showCancelDialog: boolean;
  setShowCancelDialog: (v: boolean) => void;
  onCancel: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
}

export function QuoteDialogs({
  quoteNumber,
  actionLoading,
  showRejectDialog, setShowRejectDialog, rejectReason, setRejectReason, onReject,
  showConvertDialog, setShowConvertDialog, onConvert,
  showDeleteDialog, setShowDeleteDialog, onDelete,
  showCancelDialog, setShowCancelDialog, onCancel,
  t, tCommon,
}: QuoteDialogsProps) {
  return (
    <>
      {/* Reject dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectQuote')}</DialogTitle>
            <DialogDescription>{t('rejectPrompt', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('rejectPlaceholder')}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>{tCommon('cancel')}</Button>
            <Button variant="destructive" onClick={() => onReject(rejectReason)} disabled={!rejectReason.trim() || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              {t('reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('convertQuote')}</DialogTitle>
            <DialogDescription>{t('convertConfirm', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConvertDialog(false)}>{tCommon('cancel')}</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={onConvert} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              {t('convertToInvoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteQuote')}</DialogTitle>
            <DialogDescription>{t('deleteConfirm', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>{tCommon('cancel')}</Button>
            <Button variant="destructive" onClick={onDelete} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cancelQuote')}</DialogTitle>
            <DialogDescription>{t('cancelConfirm', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCancelDialog(false)}>{tCommon('back')}</Button>
            <Button variant="destructive" onClick={onCancel} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              {t('cancelQuote')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
