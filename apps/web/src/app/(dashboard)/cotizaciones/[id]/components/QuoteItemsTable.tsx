'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ClipboardList } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { QuoteDetail, QuoteLineItem } from './quote-types';
import { APPROVAL_STYLE_MAP } from './quote-types';

interface QuoteItemsTableProps {
  quote: QuoteDetail;
  lineItems: QuoteLineItem[];
  showApprovalBadges: boolean;
  hasApprovedTotals: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
  tInvoices: (key: string) => string;
}

export function QuoteItemsTable({
  quote,
  lineItems,
  showApprovalBadges,
  hasApprovedTotals,
  t,
  tCommon,
  tInvoices,
}: QuoteItemsTableProps) {
  return (
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
            <TableHead className="text-right">IVA (13%)</TableHead>
            <TableHead className="text-right">{tCommon('total')}</TableHead>
            {showApprovalBadges && (
              <TableHead className="text-center">{tCommon('status')}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => {
            const approvalBadge = APPROVAL_STYLE_MAP[item.approvalStatus] || APPROVAL_STYLE_MAP.PENDING;
            const quantityDiffers = item.approvedQuantity != null && item.approvedQuantity !== item.quantity;

            return (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">{item.lineNumber}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{item.description}</p>
                    {item.itemCode && <p className="text-xs text-muted-foreground">{item.itemCode}</p>}
                    {item.approvalStatus === 'REJECTED' && item.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">{t('rejectionReason')} {item.rejectionReason}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span>{item.quantity}</span>
                  {quantityDiffers && (
                    <span className="block text-xs text-green-400">{t('statusApproved')}: {item.approvedQuantity}</span>
                  )}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell className="text-right">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.lineTax)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.lineTotal)}</TableCell>
                {showApprovalBadges && (
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs ${approvalBadge.className}`}>
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
            <span className="font-medium">{formatCurrency(Number(quote.subtotal))}</span>
          </div>
          <div className="flex justify-between w-60">
            <span className="text-muted-foreground">{tInvoices('ivaLabel')}</span>
            <span className="font-medium">{formatCurrency(Number(quote.taxAmount))}</span>
          </div>
          <div className="h-px bg-primary/30 w-60" />
          <div className="flex justify-between w-60">
            <span className="text-lg font-semibold">{tInvoices('totalLabel')}</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(Number(quote.total))}</span>
          </div>
        </div>
      </div>

      {/* Approved totals */}
      {hasApprovedTotals && (
        <div className="border-t border-green-600/30 p-5 bg-green-600/5">
          <h3 className="text-sm font-medium text-green-400 uppercase tracking-wider mb-3">{t('approvedTotals')}</h3>
          <div className="flex flex-col items-end space-y-2">
            {quote.approvedSubtotal != null && (
              <div className="flex justify-between w-60">
                <span className="text-muted-foreground">{tInvoices('subtotalLabel')}</span>
                <span className="font-medium text-green-400">{formatCurrency(Number(quote.approvedSubtotal))}</span>
              </div>
            )}
            {quote.approvedTaxAmount != null && (
              <div className="flex justify-between w-60">
                <span className="text-muted-foreground">{tInvoices('ivaLabel')}</span>
                <span className="font-medium text-green-400">{formatCurrency(Number(quote.approvedTaxAmount))}</span>
              </div>
            )}
            <div className="h-px bg-green-600/30 w-60" />
            <div className="flex justify-between w-60">
              <span className="text-lg font-semibold text-green-400">{t('approvedTotal')}</span>
              <span className="text-2xl font-bold text-green-400">{formatCurrency(Number(quote.approvedTotal))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
