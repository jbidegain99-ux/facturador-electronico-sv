'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Loader2 } from 'lucide-react';
import type { StatusHistoryEntry } from './quote-types';
import { STATUS_STYLE_MAP, formatDateTime } from './quote-types';

interface QuoteStatusHistoryProps {
  statusHistory: StatusHistoryEntry[];
  historyLoading: boolean;
  t: (key: string) => string;
  tCommon: (key: string) => string;
}

export function QuoteStatusHistory({
  statusHistory,
  historyLoading,
  t,
  tCommon,
}: QuoteStatusHistoryProps) {
  return (
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
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-4">
            {statusHistory.map((entry) => {
              const toConfig = STATUS_STYLE_MAP[entry.toStatus];
              return (
                <div key={entry.id} className="relative flex items-start gap-4 pl-8">
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
                      <p className="text-xs text-muted-foreground mt-1 italic">{entry.reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
