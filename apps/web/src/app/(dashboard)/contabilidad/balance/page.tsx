'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { ArrowLeft, Loader2, Landmark, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface BalanceSheetAccount {
  code: string;
  name: string;
  balance: number;
}

interface BalanceSheetSection {
  title: string;
  accounts: BalanceSheetAccount[];
  total: number;
}

interface BalanceSheetData {
  assets: BalanceSheetSection[];
  liabilities: BalanceSheetSection[];
  equity: BalanceSheetSection[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function ReportSection({ section, colorClass }: { section: BalanceSheetSection; colorClass: string }) {
  return (
    <div className="space-y-1">
      <h3 className={`text-sm font-bold ${colorClass} border-b pb-1`}>{section.title}</h3>
      {section.accounts.map(account => (
        <div key={account.code} className="flex justify-between text-sm py-0.5 pl-4">
          <span>
            <span className="font-mono text-muted-foreground mr-2">{account.code}</span>
            {account.name}
          </span>
          <span className="font-mono">{formatCurrency(account.balance)}</span>
        </div>
      ))}
      <div className={`flex justify-between text-sm font-semibold border-t pt-1 ${colorClass}`}>
        <span>Total {section.title}</span>
        <span className="font-mono">{formatCurrency(section.total)}</span>
      </div>
    </div>
  );
}

export default function BalancePage() {
  const t = useTranslations('accounting');
  const tCommon = useTranslations('common');
  const { features, loading: planLoading } = usePlanFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!planLoading && !features.accounting) {
      router.replace('/contabilidad');
    }
  }, [planLoading, features.accounting, router]);

  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/reports/balance-sheet`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json) setData(json);
      } else {
        const json = await res.json().catch(() => ({}));
        toastRef.current.error(tCommon('error'), (json as { message?: string }).message || t('balanceError'));
      }
    } catch {
      toastRef.current.error(tCommon('error'), t('connectionError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = new Date().toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contabilidad" className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t('balanceSheet')}</h1>
            <p className="text-muted-foreground">{t('balanceSheetSubtitle')}</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {tCommon('refresh')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-muted-foreground">
          <Landmark className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p className="text-lg font-medium">{t('noDataAvailable')}</p>
          <p className="text-sm mt-1">{t('postEntriesToSee')}</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 space-y-6 max-w-3xl">
          {/* Report Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-lg font-bold">{t('balanceSheetTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('asOf', { date: today })}</p>
            <p className="text-xs text-muted-foreground">{t('currencyNote')}</p>
          </div>

          {/* Assets */}
          <div className="space-y-4">
            {data.assets.length > 0 ? (
              data.assets.map((section, idx) => (
                <ReportSection key={idx} section={section} colorClass="text-green-700 dark:text-green-400" />
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                <span className="font-bold text-green-700 dark:text-green-400">{t('assetType')}</span>
                <p className="pl-4">{t('noAssetBalances')}</p>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t-2 border-green-600 pt-2 text-green-700 dark:text-green-400">
              <span>{t('totalAssetsLabel')}</span>
              <span className="font-mono">{formatCurrency(data.totalAssets)}</span>
            </div>
          </div>

          <hr className="border-t-2" />

          {/* Liabilities */}
          <div className="space-y-4">
            {data.liabilities.length > 0 ? (
              data.liabilities.map((section, idx) => (
                <ReportSection key={idx} section={section} colorClass="text-red-700 dark:text-red-400" />
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                <span className="font-bold text-red-700 dark:text-red-400">{t('liabilityType')}</span>
                <p className="pl-4">{t('noLiabilityBalances')}</p>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t-2 border-red-600 pt-2 text-red-700 dark:text-red-400">
              <span>{t('totalLiabilitiesLabel')}</span>
              <span className="font-mono">{formatCurrency(data.totalLiabilities)}</span>
            </div>
          </div>

          {/* Equity */}
          <div className="space-y-4">
            {data.equity.length > 0 ? (
              data.equity.map((section, idx) => (
                <ReportSection key={idx} section={section} colorClass="text-blue-700 dark:text-blue-400" />
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                <span className="font-bold text-blue-700 dark:text-blue-400">{t('equityType')}</span>
                <p className="pl-4">{t('noEquityBalances')}</p>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t-2 border-blue-600 pt-2 text-blue-700 dark:text-blue-400">
              <span>{t('totalEquityLabel')}</span>
              <span className="font-mono">{formatCurrency(data.totalEquity)}</span>
            </div>
          </div>

          <hr className="border-t-2" />

          {/* Equation Check */}
          <div className="bg-muted/50 rounded-md p-4">
            <div className="flex justify-between font-bold text-base">
              <span>{t('liabilityPlusEquity')}</span>
              <span className="font-mono">{formatCurrency(data.totalLiabilities + data.totalEquity)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>{t('differenceLabel')}</span>
              <span className={`font-mono ${Math.abs(data.totalAssets - data.totalLiabilities - data.totalEquity) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.totalAssets - data.totalLiabilities - data.totalEquity)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
