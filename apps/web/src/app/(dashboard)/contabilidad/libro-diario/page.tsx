'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Check,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface JournalEntryLine {
  id: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
  lineNumber: number;
  account: { id: string; code: string; name: string };
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  status: string;
  entryType: string;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
}

interface PaginatedEntries {
  data: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PostableAccount {
  id: string;
  code: string;
  name: string;
  accountType: string;
}

interface LineForm {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
}

interface EntryForm {
  entryDate: string;
  description: string;
  entryType: string;
  lines: LineForm[];
}

const EMPTY_LINE: LineForm = { accountId: '', description: '', debit: '', credit: '' };

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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    POSTED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    VOIDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  const labels: Record<string, string> = {
    DRAFT: 'Borrador',
    POSTED: 'Contabilizada',
    VOIDED: 'Anulada',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function LibroDiarioPage() {
  const { features, loading: planLoading } = usePlanFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!planLoading && !features.accounting) {
      router.replace('/contabilidad');
    }
  }, [planLoading, features.accounting, router]);

  const [entries, setEntries] = useState<PaginatedEntries | null>(null);
  const [accounts, setAccounts] = useState<PostableAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>({
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    entryType: 'MANUAL',
    lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }],
  });
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchEntries = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/accounting/journal-entries?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json) setEntries(json);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateFrom, dateTo]);

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
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleAddLine = () => {
    setForm(prev => ({
      ...prev,
      lines: [...prev.lines, { ...EMPTY_LINE }],
    }));
  };

  const handleRemoveLine = (index: number) => {
    if (form.lines.length <= 2) return;
    setForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleLineChange = (index: number, field: keyof LineForm, value: string) => {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => i === index ? { ...line, [field]: value } : line),
    }));
  };

  const totalDebit = form.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = form.lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSave = async () => {
    if (!form.description) {
      toastRef.current.error('Error', 'La descripcion es requerida');
      return;
    }
    if (!isBalanced) {
      toastRef.current.error('Error', 'La partida no cuadra');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body = {
        entryDate: form.entryDate,
        description: form.description,
        entryType: form.entryType,
        lines: form.lines
          .filter(l => l.accountId && (parseFloat(l.debit) || parseFloat(l.credit)))
          .map(l => ({
            accountId: l.accountId,
            description: l.description,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
          })),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/journal-entries`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toastRef.current.success('Partida creada', `${(json as { entryNumber?: string }).entryNumber || ''}`);
        setShowForm(false);
        setForm({
          entryDate: new Date().toISOString().split('T')[0],
          description: '',
          entryType: 'MANUAL',
          lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }],
        });
        fetchEntries();
      } else {
        toastRef.current.error('Error', (json as { message?: string }).message || 'Error al crear partida');
      }
    } catch {
      toastRef.current.error('Error', 'Error de conexion');
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async (id: string) => {
    setPosting(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/journal-entries/${id}/post`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toastRef.current.success('Partida contabilizada');
        fetchEntries();
        setShowDetail(null);
      } else {
        const json = await res.json().catch(() => ({}));
        toastRef.current.error('Error', (json as { message?: string }).message || 'Error al contabilizar');
      }
    } catch {
      toastRef.current.error('Error', 'Error de conexion');
    } finally {
      setPosting(null);
    }
  };

  const handleVoid = async (id: string) => {
    const reason = prompt('Motivo de la anulacion:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/journal-entries/${id}/void`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        toastRef.current.success('Partida anulada');
        fetchEntries();
        setShowDetail(null);
      } else {
        const json = await res.json().catch(() => ({}));
        toastRef.current.error('Error', (json as { message?: string }).message || 'Error al anular');
      }
    } catch {
      toastRef.current.error('Error', 'Error de conexion');
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
            <h1 className="text-2xl font-bold">Libro Diario</h1>
            <p className="text-muted-foreground">Partidas contables</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nueva Partida
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="POSTED">Contabilizada</option>
          <option value="VOIDED">Anulada</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Desde:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Hasta:</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Entries Table */}
      <div className="rounded-lg border bg-card overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !entries || entries.data.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-lg font-medium">No hay partidas contables</p>
            <p className="text-sm mt-1">Crea tu primera partida con el boton de arriba</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">No. Partida</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Descripcion</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Debe</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Haber</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground w-32">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {entries.data.map(entry => (
                  <tr
                    key={entry.id}
                    className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    onClick={() => setShowDetail(entry)}
                  >
                    <td className="px-4 py-2 font-mono text-sm">{entry.entryNumber}</td>
                    <td className="px-4 py-2 text-sm">{formatDate(entry.entryDate)}</td>
                    <td className="px-4 py-2 text-sm max-w-xs truncate">{entry.description}</td>
                    <td className="px-4 py-2 text-center"><StatusBadge status={entry.status} /></td>
                    <td className="px-4 py-2 text-sm text-right font-mono">{formatCurrency(Number(entry.totalDebit))}</td>
                    <td className="px-4 py-2 text-sm text-right font-mono">{formatCurrency(Number(entry.totalCredit))}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {entry.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePost(entry.id)}
                            disabled={posting === entry.id}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 disabled:opacity-50"
                          >
                            {posting === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Contabilizar
                          </button>
                        )}
                        {entry.status === 'POSTED' && (
                          <button
                            onClick={() => handleVoid(entry.id)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                          >
                            <X className="h-3 w-3" />
                            Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {entries.totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  Mostrando {entries.data.length} de {entries.total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm">
                    Pagina {entries.page} de {entries.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(entries.totalPages, p + 1))}
                    disabled={page === entries.totalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-lg shadow-lg w-full max-w-2xl p-6 space-y-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Partida {showDetail.entryNumber}</h2>
                <p className="text-sm text-muted-foreground">{formatDate(showDetail.entryDate)} - {showDetail.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={showDetail.status} />
                <button onClick={() => setShowDetail(null)} className="p-1 rounded hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">Cuenta</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-muted-foreground">Concepto</th>
                  <th className="px-3 py-2 text-right text-sm font-medium text-muted-foreground">Debe</th>
                  <th className="px-3 py-2 text-right text-sm font-medium text-muted-foreground">Haber</th>
                </tr>
              </thead>
              <tbody>
                {showDetail.lines.map(line => (
                  <tr key={line.id} className="border-b">
                    <td className="px-3 py-2 text-sm">
                      <span className="font-mono">{line.account.code}</span> - {line.account.name}
                    </td>
                    <td className="px-3 py-2 text-sm">{line.description}</td>
                    <td className="px-3 py-2 text-sm text-right font-mono">
                      {Number(line.debit) > 0 ? formatCurrency(Number(line.debit)) : ''}
                    </td>
                    <td className="px-3 py-2 text-sm text-right font-mono">
                      {Number(line.credit) > 0 ? formatCurrency(Number(line.credit)) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td colSpan={2} className="px-3 py-2 text-sm text-right">Totales:</td>
                  <td className="px-3 py-2 text-sm text-right font-mono">{formatCurrency(Number(showDetail.totalDebit))}</td>
                  <td className="px-3 py-2 text-sm text-right font-mono">{formatCurrency(Number(showDetail.totalCredit))}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex justify-end gap-2 pt-2">
              {showDetail.status === 'DRAFT' && (
                <button
                  onClick={() => handlePost(showDetail.id)}
                  disabled={posting === showDetail.id}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {posting === showDetail.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Contabilizar
                </button>
              )}
              {showDetail.status === 'POSTED' && (
                <button
                  onClick={() => handleVoid(showDetail.id)}
                  className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <X className="h-4 w-4" />
                  Anular
                </button>
              )}
              <button
                onClick={() => setShowDetail(null)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-lg shadow-lg w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold">Nueva Partida Contable</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha *</label>
                <input
                  type="date"
                  value={form.entryDate}
                  onChange={e => setForm({ ...form, entryDate: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  value={form.entryType}
                  onChange={e => setForm({ ...form, entryType: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                  <option value="CLOSING">Cierre</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Descripcion *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                  placeholder="Concepto de la partida"
                />
              </div>
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Lineas de la partida</h3>
                <button
                  onClick={handleAddLine}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" /> Agregar linea
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Cuenta</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Concepto</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground w-28">Debe</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground w-28">Haber</th>
                    <th className="px-2 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-2 py-1">
                        <select
                          value={line.accountId}
                          onChange={e => handleLineChange(idx, 'accountId', e.target.value)}
                          className="w-full rounded border bg-background px-2 py-1 text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={line.description}
                          onChange={e => handleLineChange(idx, 'description', e.target.value)}
                          className="w-full rounded border bg-background px-2 py-1 text-sm"
                          placeholder="Descripcion"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.debit}
                          onChange={e => handleLineChange(idx, 'debit', e.target.value)}
                          className="w-full rounded border bg-background px-2 py-1 text-sm text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.credit}
                          onChange={e => handleLineChange(idx, 'credit', e.target.value)}
                          className="w-full rounded border bg-background px-2 py-1 text-sm text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        {form.lines.length > 2 && (
                          <button
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan={2} className="px-2 py-2 text-sm text-right">Totales:</td>
                    <td className="px-2 py-2 text-sm text-right font-mono">{formatCurrency(totalDebit)}</td>
                    <td className="px-2 py-2 text-sm text-right font-mono">{formatCurrency(totalCredit)}</td>
                    <td />
                  </tr>
                  <tr>
                    <td colSpan={2} className="px-2 py-1 text-sm text-right">Diferencia:</td>
                    <td colSpan={2} className={`px-2 py-1 text-sm text-right font-mono ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalDebit - totalCredit)}
                      {isBalanced ? ' (Cuadra)' : ' (No cuadra)'}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isBalanced}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear Partida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
