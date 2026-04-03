'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  User, Calendar, Shield, RefreshCw, XCircle, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { QuoteDetail, QuoteLineItem } from './quote-types';
import { formatDate, formatDateTime } from './quote-types';

// ── Changes Requested Section ──────────────────────────────

interface ChangesRequestedSectionProps {
  quote: QuoteDetail;
  lineItems: QuoteLineItem[];
  t: (key: string) => string;
}

export function ChangesRequestedSection({ quote, lineItems, t }: ChangesRequestedSectionProps) {
  if (quote.status !== 'CHANGES_REQUESTED') return null;

  return (
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
            {lineItems.filter((li) => li.approvalStatus === 'REJECTED').map((li) => (
              <li key={li.id} className="text-sm text-red-400 flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="line-through">{li.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Approval Info Section ──────────────────────────────────

interface ApprovalInfoSectionProps {
  quote: QuoteDetail;
  onCopyUrl: () => void;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function ApprovalInfoSection({ quote, onCopyUrl, t, tCommon }: ApprovalInfoSectionProps) {
  if (!quote.approvedBy) return null;

  return (
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
            <Button variant="ghost" size="sm" onClick={onCopyUrl} className="shrink-0">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Version Info Section ───────────────────────────────────

interface VersionInfoSectionProps {
  quote: QuoteDetail;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function VersionInfoSection({ quote, t }: VersionInfoSectionProps) {
  const [showVersions, setShowVersions] = React.useState(false);

  if (quote.version <= 1) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('versionLabel', { version: quote.version })}</h3>
        </div>
        {quote.quoteGroupId && (
          <Button variant="ghost" size="sm" onClick={() => setShowVersions(!showVersions)} className="text-muted-foreground hover:text-foreground">
            {showVersions ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
            {t('viewVersions')}
          </Button>
        )}
      </div>
      {showVersions && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('versionDesc', { version: quote.version })}
            {quote.quoteGroupId && (
              <span className="ml-1">{t('group')} <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded">{quote.quoteGroupId}</code></span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Client Info Section ────────────────────────────────────

interface ClientInfoSectionProps {
  quote: QuoteDetail;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function ClientInfoSection({ quote, t, tCommon }: ClientInfoSectionProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-foreground">{t('client')}</h2>
      </div>
      {quote.client ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{tCommon('name')}</p>
            <p className="text-foreground font-medium">{quote.client.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{tCommon('type')}</p>
            <p className="text-foreground">{quote.client.numDocumento}</p>
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
            <p className="text-muted-foreground text-sm">{t('clientNotFound')}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dates Section ──────────────────────────────────────────

interface DatesSectionProps {
  quote: QuoteDetail;
  t: (key: string) => string;
}

export function DatesSection({ quote, t }: DatesSectionProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('dates')}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">{t('created')}</p>
          <p className="text-foreground">{formatDate(quote.createdAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('emission')}</p>
          <p className="text-foreground">{formatDate(quote.issueDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('validUntil')}</p>
          <p className="text-foreground">{formatDate(quote.validUntil)}</p>
        </div>
        {quote.sentAt && (
          <div>
            <p className="text-muted-foreground">{t('sent')}</p>
            <p className="text-foreground">{formatDate(quote.sentAt)}</p>
          </div>
        )}
        {quote.convertedAt && (
          <div>
            <p className="text-muted-foreground">{t('converted')}</p>
            <p className="text-foreground">{formatDate(quote.convertedAt)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
