'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, XCircle, Trash2, Ban, Loader2, FileText } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface DteTypeOption {
  code: string;
  name: string;
}

interface QuoteDialogsProps {
  quoteId: string;
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
  onConvert: (dteType: string) => void;
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
  quoteId,
  quoteNumber,
  actionLoading,
  showRejectDialog, setShowRejectDialog, rejectReason, setRejectReason, onReject,
  showConvertDialog, setShowConvertDialog, onConvert,
  showDeleteDialog, setShowDeleteDialog, onDelete,
  showCancelDialog, setShowCancelDialog, onCancel,
  t, tCommon,
}: QuoteDialogsProps) {
  const [dteTypes, setDteTypes] = React.useState<DteTypeOption[]>([]);
  const [dteTypesLoading, setDteTypesLoading] = React.useState(false);
  const [selectedDteType, setSelectedDteType] = React.useState<string>('');

  // Fetch available DTE types when convert dialog opens
  React.useEffect(() => {
    if (!showConvertDialog) {
      setSelectedDteType('');
      return;
    }
    setDteTypesLoading(true);
    fetch(`${API_URL}/quotes/${quoteId}/available-dte-types`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { availableDteTypes: DteTypeOption[] }) => {
        setDteTypes(data.availableDteTypes || []);
        if (data.availableDteTypes?.length === 1) {
          setSelectedDteType(data.availableDteTypes[0].code);
        }
      })
      .catch(() => setDteTypes([]))
      .finally(() => setDteTypesLoading(false));
  }, [showConvertDialog, quoteId]);

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

      {/* Convert dialog — DTE type selector */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('convertQuote')}</DialogTitle>
            <DialogDescription>{t('convertConfirm', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>

          {dteTypesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">{t('loadingDteTypes')}</span>
            </div>
          ) : dteTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t('noDteTypesAvailable')}</p>
          ) : (
            <div className="space-y-2 py-2">
              <label className="text-sm font-medium text-foreground">{t('selectDteType')}</label>
              {dteTypes.map((dte) => (
                <label
                  key={dte.code}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDteType === dte.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="dteType"
                    value={dte.code}
                    checked={selectedDteType === dte.code}
                    onChange={() => setSelectedDteType(dte.code)}
                    className="accent-primary"
                  />
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">{dte.code} — {dte.name}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConvertDialog(false)}>{tCommon('cancel')}</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => onConvert(selectedDteType)}
              disabled={!selectedDteType || actionLoading || dteTypesLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              {t('convertToDte')}
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
