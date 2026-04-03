'use client';

import * as React from 'react';
import { API_URL } from '@/lib/api';
import type {
  CatalogItem,
  CatalogCategory,
  CatalogResponse,
  PlanLimitInfo,
  UnidadMedida,
  ImportResult,
} from './catalog-types';
import { parseCSV } from './catalog-types';

interface UseCatalogDataReturn {
  items: CatalogItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  fetchError: string | null;
  categories: CatalogCategory[];
  planLimit: PlanLimitInfo | null;
  units: UnidadMedida[];
  fetchItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchPlanLimit: () => Promise<void>;
  handleToggleFavorite: (item: CatalogItem) => Promise<void>;
  handleCreateCategory: (name: string, color: string) => Promise<void>;
  handleUpdateCategory: (cat: CatalogCategory, name: string, color: string) => Promise<void>;
  handleDeleteCategory: (cat: CatalogCategory) => Promise<void>;
  handleDeleteItem: (item: CatalogItem) => Promise<void>;
  handleExport: () => Promise<void>;
  handleImport: (file: File, separator: string) => Promise<ImportResult | null>;
  savingCat: boolean;
  deleting: boolean;
}

interface UseCatalogDataOptions {
  page: number;
  limit: number;
  search: string;
  tab: string;
  categoryFilter: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  toast: { success: (msg: string) => void; error: (msg: string) => void };
  tc: (key: string, values?: Record<string, string | number>) => string;
}

const getAuthHeaders = (): Record<string, string> => ({});

export function useCatalogData({
  page, limit, search, tab, categoryFilter, sortBy, sortOrder, toast, tc,
}: UseCatalogDataOptions): UseCatalogDataReturn {
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<CatalogCategory[]>([]);
  const [planLimit, setPlanLimit] = React.useState<PlanLimitInfo | null>(null);
  const [units, setUnits] = React.useState<UnidadMedida[]>([]);
  const [savingCat, setSavingCat] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  // Load units
  React.useEffect(() => {
    fetch(`${API_URL}/catalogs/unidades-medida`, { credentials: 'include', headers: getAuthHeaders() })
      .then(res => res.ok ? res.json().catch(() => []) : [])
      .then(data => { if (Array.isArray(data)) setUnits(data); })
      .catch(() => {});
  }, []);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/catalog-items/categories`, { credentials: 'include', headers: getAuthHeaders() });
      if (res.ok) { const data = await res.json().catch(() => []); if (Array.isArray(data)) setCategories(data); }
    } catch {}
  }, []);

  React.useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const fetchPlanLimit = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/catalog-items/plan-limit`, { credentials: 'include', headers: getAuthHeaders() });
      if (res.ok) { const data = await res.json().catch(() => null); if (data && typeof data.current === 'number') setPlanLimit(data); }
    } catch {}
  }, []);

  React.useEffect(() => { fetchPlanLimit(); }, [fetchPlanLimit]);

  const fetchItems = React.useCallback(async () => {
    setLoading(true); setFetchError(null);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), sortBy, sortOrder });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (tab === 'FAVORITES') params.set('isFavorite', 'true');
      else if (tab) params.set('type', tab);

      const res = await fetch(`${API_URL}/catalog-items?${params}`, { credentials: 'include', headers: getAuthHeaders() });
      if (!res.ok) { if (res.status === 404) { setFetchError(tc('importError')); return; } throw new Error(tc('importError')); }

      const data: CatalogResponse = await res.json().catch(() => ({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }));
      const list = Array.isArray(data?.data) ? data.data : [];
      setItems(list);
      setTotal(!isNaN(Number(data?.total)) ? Number(data.total) : list.length);
      setTotalPages(!isNaN(Number(data?.totalPages)) && Number(data.totalPages) >= 1 ? Number(data.totalPages) : 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : tc('importError');
      setFetchError(message); toastRef.current.error(message);
    } finally { setLoading(false); }
  }, [page, limit, search, tab, categoryFilter, sortBy, sortOrder, tc]);

  React.useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleToggleFavorite = async (item: CatalogItem) => {
    try {
      const res = await fetch(`${API_URL}/catalog-items/${item.id}/favorite`, { credentials: 'include', method: 'POST', headers: getAuthHeaders() });
      if (!res.ok) throw new Error(tc('favoriteError'));
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch { toastRef.current.error(tc('favoriteError')); }
  };

  const handleCreateCategory = async (name: string, color: string) => {
    setSavingCat(true);
    try {
      const res = await fetch(`${API_URL}/catalog-items/categories`, { credentials: 'include', method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('categoryCreateError')); }
      toastRef.current.success(tc('categoryCreated')); fetchCategories();
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tc('categoryCreateError')); }
    finally { setSavingCat(false); }
  };

  const handleUpdateCategory = async (cat: CatalogCategory, name: string, color: string) => {
    setSavingCat(true);
    try {
      const res = await fetch(`${API_URL}/catalog-items/categories/${cat.id}`, { credentials: 'include', method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('categoryUpdateError')); }
      toastRef.current.success(tc('categoryUpdated')); fetchCategories(); fetchItems();
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tc('categoryUpdateError')); }
    finally { setSavingCat(false); }
  };

  const handleDeleteCategory = async (cat: CatalogCategory) => {
    if (!confirm(tc('deleteCategoryConfirm', { name: cat.name }))) return;
    try {
      const res = await fetch(`${API_URL}/catalog-items/categories/${cat.id}`, { credentials: 'include', method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error(tc('categoryDeleteError'));
      toastRef.current.success(tc('categoryDeleted')); fetchCategories(); fetchItems();
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tc('categoryDeleteError')); }
  };

  const handleDeleteItem = async (item: CatalogItem) => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/catalog-items/${item.id}`, { credentials: 'include', method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('itemDeleteError')); }
      toastRef.current.success(tc('itemDeleted')); fetchItems(); fetchPlanLimit();
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tc('itemDeleteError')); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/catalog-items/export`, { credentials: 'include', headers: getAuthHeaders() });
      if (!res.ok) throw new Error(tc('exportError'));
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) { toastRef.current.error(tc('noItemsExport')); return; }
      const csvHeaders = ['code', 'name', 'description', 'type', 'category', 'basePrice', 'costPrice', 'taxRate', 'tipoItem', 'uniMedida', 'tributo'];
      const csvRows = data.map((item: CatalogItem) => csvHeaders.map(h => { if (h === 'category') return item.category?.name || ''; const val = item[h as keyof CatalogItem]; if (val === null || val === undefined) return ''; const str = String(val); return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str; }).join(','));
      const csv = [csvHeaders.join(','), ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `catalogo_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url); toastRef.current.success(tc('exportSuccess'));
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tc('exportError')); }
  };

  const handleImport = async (file: File, separator: string): Promise<ImportResult | null> => {
    try {
      const text = await file.text();
      const rows = parseCSV(text, separator);
      if (rows.length < 2) { toastRef.current.error(tc('csvMinRows')); return null; }
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const dataRows = rows.slice(1);
      const fieldMap: Record<string, number> = {};
      for (const fn of ['code', 'name', 'description', 'type', 'baseprice', 'costprice', 'taxrate', 'tipoitem', 'unimedida', 'tributo']) {
        const idx = headers.findIndex(h => h.replace(/[_\s-]/g, '').toLowerCase() === fn);
        if (idx !== -1) fieldMap[fn] = idx;
      }
      if (fieldMap['code'] === undefined || fieldMap['name'] === undefined) { toastRef.current.error(tc('csvRequiredCols')); return null; }
      const importRows = dataRows.map(row => ({ code: row[fieldMap['code']] || '', name: row[fieldMap['name']] || '', description: fieldMap['description'] !== undefined ? row[fieldMap['description']] : undefined, type: fieldMap['type'] !== undefined ? row[fieldMap['type']] : 'PRODUCT', basePrice: Number(row[fieldMap['baseprice'] ?? -1] || '0'), costPrice: fieldMap['costprice'] !== undefined && row[fieldMap['costprice']] ? Number(row[fieldMap['costprice']]) : undefined, taxRate: fieldMap['taxrate'] !== undefined && row[fieldMap['taxrate']] ? Number(row[fieldMap['taxrate']]) : 13.0, tipoItem: fieldMap['tipoitem'] !== undefined && row[fieldMap['tipoitem']] ? Number(row[fieldMap['tipoitem']]) : 1, uniMedida: fieldMap['unimedida'] !== undefined && row[fieldMap['unimedida']] ? Number(row[fieldMap['unimedida']]) : 99, tributo: fieldMap['tributo'] !== undefined ? row[fieldMap['tributo']] : '20' }));

      const res = await fetch(`${API_URL}/catalog-items/import`, { credentials: 'include', method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: importRows }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('importError')); }
      const result: ImportResult = await res.json();
      toastRef.current.success(tc('importSuccess', { created: result.created, updated: result.updated }));
      fetchItems(); fetchPlanLimit();
      return result;
    } catch (err) { toastRef.current.error(err instanceof Error ? err.message : tc('importError')); return null; }
  };

  return {
    items, total, totalPages, loading, fetchError,
    categories, planLimit, units, savingCat, deleting,
    fetchItems, fetchCategories, fetchPlanLimit,
    handleToggleFavorite, handleCreateCategory, handleUpdateCategory,
    handleDeleteCategory, handleDeleteItem, handleExport, handleImport,
  };
}
