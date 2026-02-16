'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { useTranslations } from 'next-intl';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Power,
  ArrowLeft,
  Loader2,
  Search,
} from 'lucide-react';

interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  level: number;
  accountType: string;
  normalBalance: string;
  allowsPosting: boolean;
  isActive: boolean;
  isSystem: boolean;
  currentBalance: number;
  description: string | null;
  parentId: string | null;
  children?: AccountingAccount[];
}

interface AccountForm {
  code: string;
  name: string;
  parentId: string;
  level: number;
  accountType: string;
  normalBalance: string;
  allowsPosting: boolean;
  description: string;
}

const EMPTY_FORM: AccountForm = {
  code: '',
  name: '',
  parentId: '',
  level: 4,
  accountType: 'ASSET',
  normalBalance: 'DEBIT',
  allowsPosting: true,
  description: '',
};

// Labels moved inside component to use translations
const ACCOUNT_TYPE_VALUES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
const NORMAL_BALANCE_VALUES = ['DEBIT', 'CREDIT'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function AccountTypeLabel({ type }: { type: string }) {
  const t = useTranslations('accounting');
  const colors: Record<string, string> = {
    ASSET: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    LIABILITY: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    EQUITY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    INCOME: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    EXPENSE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };
  const labels: Record<string, string> = {
    ASSET: t('assetType'),
    LIABILITY: t('liabilityType'),
    EQUITY: t('equityType'),
    INCOME: t('incomeType'),
    EXPENSE: t('expenseType'),
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
      {labels[type] || type}
    </span>
  );
}

function AccountRow({
  account,
  expanded,
  onToggle,
  onEdit,
  onToggleActive,
  searchTerm,
}: {
  account: AccountingAccount;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (account: AccountingAccount) => void;
  onToggleActive: (id: string) => void;
  searchTerm: string;
}) {
  const t = useTranslations('accounting');
  const tCommon = useTranslations('common');
  const hasChildren = account.children && account.children.length > 0;
  const isExpanded = expanded.has(account.id);
  const indent = (account.level - 1) * 24;

  const matchesSearch = searchTerm
    ? account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.name.toLowerCase().includes(searchTerm.toLowerCase())
    : true;

  if (!matchesSearch && !hasChildren) return null;

  return (
    <>
      <tr className={`border-b transition-colors hover:bg-muted/50 ${!account.isActive ? 'opacity-50' : ''}`}>
        <td className="px-4 py-2 whitespace-nowrap" style={{ paddingLeft: `${indent + 16}px` }}>
          <div className="flex items-center gap-1">
            {hasChildren ? (
              <button onClick={() => onToggle(account.id)} className="p-0.5 rounded hover:bg-muted">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span className="font-mono text-sm font-medium">{account.code}</span>
          </div>
        </td>
        <td className="px-4 py-2">
          <span className={`text-sm ${account.level === 1 ? 'font-bold' : account.level === 2 ? 'font-semibold' : ''}`}>
            {account.name}
          </span>
        </td>
        <td className="px-4 py-2">
          <AccountTypeLabel type={account.accountType} />
        </td>
        <td className="px-4 py-2 text-sm text-center">
          {account.normalBalance === 'DEBIT' ? t('debitNature') : t('creditNature')}
        </td>
        <td className="px-4 py-2 text-sm text-center">
          {account.allowsPosting ? (
            <span className="text-green-600">{tCommon('yes')}</span>
          ) : (
            <span className="text-muted-foreground">{tCommon('no')}</span>
          )}
        </td>
        <td className="px-4 py-2 text-sm text-right font-mono">
          {account.allowsPosting ? formatCurrency(Number(account.currentBalance)) : '-'}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1 justify-end">
            {!account.isSystem && (
              <button
                onClick={() => onEdit(account)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title={tCommon('edit')}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onToggleActive(account.id)}
              className={`p-1 rounded hover:bg-muted ${account.isActive ? 'text-green-600' : 'text-red-600'}`}
              title={account.isActive ? t('deactivate') : t('activate')}
            >
              <Power className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {hasChildren && isExpanded && account.children!.map(child => (
        <AccountRow
          key={child.id}
          account={child}
          expanded={expanded}
          onToggle={onToggle}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          searchTerm={searchTerm}
        />
      ))}
    </>
  );
}

export default function CuentasPage() {
  const t = useTranslations('accounting');
  const tCommon = useTranslations('common');
  const { features, loading: planLoading } = usePlanFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!planLoading && !features.accounting) {
      router.replace('/contabilidad');
    }
  }, [planLoading, features.accounting, router]);

  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [flatAccounts, setFlatAccounts] = useState<AccountingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [treeRes, listRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/accounts/list`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (treeRes.ok) {
        const treeData = await treeRes.json().catch(() => []);
        if (Array.isArray(treeData)) setAccounts(treeData);
      }
      if (listRes.ok) {
        const listData = await listRes.json().catch(() => []);
        if (Array.isArray(listData)) setFlatAccounts(listData);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const collect = (accs: AccountingAccount[]) => {
      for (const a of accs) {
        if (a.children && a.children.length > 0) {
          allIds.add(a.id);
          collect(a.children);
        }
      }
    };
    collect(accounts);
    setExpanded(allIds);
  };

  const handleCollapseAll = () => setExpanded(new Set());

  const handleToggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/seed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toastRef.current.success(t('seedSuccess'), `${(json as { created?: number }).created ?? 0}`);
        fetchAccounts();
      } else {
        toastRef.current.error(tCommon('error'), (json as { message?: string }).message || t('saveError'));
      }
    } catch {
      toastRef.current.error(tCommon('error'), t('connectionError'));
    } finally {
      setSeeding(false);
    }
  };

  const handleEdit = (account: AccountingAccount) => {
    setEditingId(account.id);
    setForm({
      code: account.code,
      name: account.name,
      parentId: account.parentId || '',
      level: account.level,
      accountType: account.accountType,
      normalBalance: account.normalBalance,
      allowsPosting: account.allowsPosting,
      description: account.description || '',
    });
    setShowForm(true);
  };

  const handleNewAccount = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/accounts/${id}/toggle-active`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAccounts();
      } else {
        const json = await res.json().catch(() => ({}));
        toastRef.current.error(tCommon('error'), (json as { message?: string }).message || t('stateChangeError'));
      }
    } catch {
      toastRef.current.error(tCommon('error'), t('connectionError'));
    }
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      toastRef.current.error(tCommon('error'), t('codeAndNameRequired'));
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/accounting/accounts/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/accounting/accounts`;

      const body: Record<string, unknown> = {
        code: form.code,
        name: form.name,
        level: form.level,
        accountType: form.accountType,
        normalBalance: form.normalBalance,
        allowsPosting: form.allowsPosting,
        description: form.description || undefined,
      };
      if (form.parentId) body.parentId = form.parentId;

      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toastRef.current.success(editingId ? t('accountUpdated') : t('accountCreated'), `${form.code} - ${form.name}`);
        setShowForm(false);
        fetchAccounts();
      } else {
        toastRef.current.error(tCommon('error'), (json as { message?: string }).message || t('saveError'));
      }
    } catch {
      toastRef.current.error(tCommon('error'), t('connectionError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contabilidad" className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t('chartOfAccounts')}</h1>
            <p className="text-muted-foreground">{t('chartOfAccountsSubtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && !loading && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {seeding ? t('seeding') : t('seedPlan')}
            </button>
          )}
          <button
            onClick={handleNewAccount}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t('newAccount')}
          </button>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchByCodeOrName')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-md border bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={handleExpandAll} className="text-sm text-muted-foreground hover:text-foreground">
            {t('expandAll')}
          </button>
          <span className="text-muted-foreground">|</span>
          <button onClick={handleCollapseAll} className="text-sm text-muted-foreground hover:text-foreground">
            {t('collapseAll')}
          </button>
        </div>
      </div>

      {/* Accounts Tree Table */}
      <div className="rounded-lg border bg-card overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">{t('noAccounts')}</p>
            <p className="text-sm mt-1">{t('noAccountsDesc')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('codeCol')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('nameCol')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('typeCol')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">{t('nature')}</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">{t('movements')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{t('balance')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-20">{tCommon('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <AccountRow
                  key={account.id}
                  account={account}
                  expanded={expanded}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  searchTerm={searchTerm}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {editingId ? t('editAccount') : t('newAccount')}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('codeRequired')}</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                  placeholder="1101.01"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('level')}</label>
                <select
                  value={form.level}
                  onChange={e => setForm({ ...form, level: Number(e.target.value) })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value={1}>{t('levelElement')}</option>
                  <option value={2}>{t('levelCategory')}</option>
                  <option value={3}>{t('levelAccount')}</option>
                  <option value={4}>{t('levelSubaccount')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t('nameRequired')}</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                placeholder="Nombre de la cuenta"
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t('parentAccount')}</label>
              <select
                value={form.parentId}
                onChange={e => setForm({ ...form, parentId: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
              >
                <option value="">{t('noParent')}</option>
                {flatAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('accountType')}</label>
                <select
                  value={form.accountType}
                  onChange={e => setForm({ ...form, accountType: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                >
                  {ACCOUNT_TYPE_VALUES.map(val => {
                    const labelKeys: Record<string, string> = { ASSET: 'assetType', LIABILITY: 'liabilityType', EQUITY: 'equityType', INCOME: 'incomeType', EXPENSE: 'expenseType' };
                    return <option key={val} value={val}>{t(labelKeys[val])}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">{t('normalBalance')}</label>
                <select
                  value={form.normalBalance}
                  onChange={e => setForm({ ...form, normalBalance: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                >
                  {NORMAL_BALANCE_VALUES.map(val => (
                    <option key={val} value={val}>{val === 'DEBIT' ? t('debitNature') : t('creditNature')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowsPosting"
                checked={form.allowsPosting}
                onChange={e => setForm({ ...form, allowsPosting: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="allowsPosting" className="text-sm">
                {t('allowsDirectPostings')}
              </label>
            </div>

            <div>
              <label className="text-sm font-medium">{tCommon('description')}</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? tCommon('save') : tCommon('create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
