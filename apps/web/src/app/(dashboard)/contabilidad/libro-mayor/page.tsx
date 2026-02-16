'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { ArrowLeft, Loader2, BookOpen, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PostableAccount {
  id: string;
  code: string;
  name: string;
  accountType: string;
  normalBalance: string;
}

interface LedgerEntry {
  date: string;
  entryNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

interface LedgerData {
  account: { id: string; code: string; name: string; normalBalance: string };
  entries: LedgerEntry[];
  openingBalance: number;
  closingBalance: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function LibroMayorPage() {
  const t = useTranslations('accounting');
  const tCommon = useTranslations('common');
  const { features, loading: planLoading } = usePlanFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!planLoading && !features.accounting) {
      router.replace('/contabilidad');
    }
  }, [planLoading, features.accounting, router]);

  const [accounts, setAccounts] = useState<PostableAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/accounts/postable`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json().catch(() => []);
        if (Array.isArray(json)) setAccounts(json);
      }
    } catch {
      // Non-critical
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const fetchLedger = async () => {
    if (!selectedAccountId) {
      toastRef.current.error(tCommon('error'), t('selectAccountError'));
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ accountId: selectedAccountId });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/accounting/reports/general-ledger?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json) setLedger(json);
      } else {
        const json = await res.json().catch(() => ({}));
        toastRef.current.error(tCommon('error'), (json as { message?: string }).message || t('ledgerError'));
      }
    } catch {
      toastRef.current.error(tCommon('error'), t('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(a =>
    searchTerm
      ? a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/contabilidad" className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('ledger')}</h1>
          <p className="text-muted-foreground">{t('ledgerSubtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1 block">{t('accountRequired')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('searchAccount')}
                className="w-full rounded-md border bg-background pl-10 pr-4 py-2 text-sm mb-1"
              />
            </div>
            {loadingAccounts ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('loadingAccounts')}
              </div>
            ) : (
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                size={Math.min(filteredAccounts.length + 1, 8)}
              >
                <option value="">{t('selectAccountOption')}</option>
                {filteredAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('fromDate').replace(':', '')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('toDate').replace(':', '')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={fetchLedger}
            disabled={loading || !selectedAccountId}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            {t('query')}
          </button>
        </div>
      </div>

      {/* Ledger Results */}
      {ledger && (
        <div className="rounded-lg border bg-card overflow-auto">
          <div className="px-4 py-3 border-b bg-muted/50">
            <h3 className="font-semibold">
              {ledger.account.code} - {ledger.account.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('normalBalanceLabel')}: {ledger.account.normalBalance === 'DEBIT' ? t('debitNature') : t('creditNature')}
              {dateFrom && ` | Desde: ${dateFrom}`}
              {dateTo && ` | Hasta: ${dateTo}`}
            </p>
          </div>

          {ledger.entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('noMovements')}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">{tCommon('date')}</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">{t('entryNumber')}</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">{tCommon('description')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">{t('debitCol')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">{t('creditColJournal')}</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">{t('balance')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-muted/10">
                  <td colSpan={5} className="px-4 py-2 text-sm font-medium">{t('openingBalance')}</td>
                  <td className="px-4 py-2 text-sm text-right font-mono font-medium">
                    {formatCurrency(ledger.openingBalance)}
                  </td>
                </tr>
                {ledger.entries.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-2 text-sm">{formatDate(entry.date)}</td>
                    <td className="px-4 py-2 text-sm font-mono">{entry.entryNumber}</td>
                    <td className="px-4 py-2 text-sm">{entry.description}</td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : ''}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-mono">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : ''}
                    </td>
                    <td className="px-4 py-2 text-sm text-right font-mono font-medium">
                      {formatCurrency(entry.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold bg-muted/30">
                  <td colSpan={3} className="px-4 py-2 text-sm text-right">{t('closingBalance')}</td>
                  <td className="px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(ledger.entries.reduce((s, e) => s + e.debit, 0))}
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(ledger.entries.reduce((s, e) => s + e.credit, 0))}
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(ledger.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
