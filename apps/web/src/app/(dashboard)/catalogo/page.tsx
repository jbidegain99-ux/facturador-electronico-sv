'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Package,
  Upload,
  Download,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageSizeSelector } from '@/components/ui/page-size-selector';
import { useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';
import type {
  CatalogItem,
  CatalogCategory,
  CatalogResponse,
  PlanLimitInfo,
  UnidadMedida,
  ItemForm,
  ImportResult,
} from './components/catalog-types';
import {
  EMPTY_FORM,
  TABS,
  TRIBUTO_OPTIONS,
  CSV_TEMPLATE,
  validateField,
  parseCSV,
} from './components/catalog-types';
import { CatalogTable } from './components/CatalogTable';

const CatalogItemFormModal = dynamic(() => import('./components/CatalogItemFormModal').then(m => ({ default: m.CatalogItemFormModal })), { ssr: false });
const DeleteConfirmDialog = dynamic(() => import('./components/DeleteConfirmDialog').then(m => ({ default: m.DeleteConfirmDialog })), { ssr: false });
const CategoriesModal = dynamic(() => import('./components/CategoriesModal').then(m => ({ default: m.CategoriesModal })), { ssr: false });
const ImportModal = dynamic(() => import('./components/ImportModal').then(m => ({ default: m.ImportModal })), { ssr: false });

// ─── Component ─────────────────────────────────────────────

export default function CatalogoPage() {
  const tc = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  // Data state
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<CatalogCategory[]>([]);
  const [planLimit, setPlanLimit] = React.useState<PlanLimitInfo | null>(null);

  // Filter state
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null);
  const [formData, setFormData] = React.useState<ItemForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = React.useState(false);
  const [savingCat, setSavingCat] = React.useState(false);

  // Import state
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importSeparator, setImportSeparator] = React.useState(',');
  const [importPreview, setImportPreview] = React.useState<string[][] | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [units, setUnits] = React.useState<UnidadMedida[]>([]);

  const getAuthHeaders = (): Record<string, string> => ({ });

  // ─── Data fetchers ──────────────────────────────────────

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
      const parsedTotal = Number(data?.total);
      const parsedPages = Number(data?.totalPages);
      setTotal(!isNaN(parsedTotal) ? parsedTotal : list.length);
      setTotalPages(!isNaN(parsedPages) && parsedPages >= 1 ? parsedPages : 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : tc('importError');
      setFetchError(message); toastRef.current.error(message);
    } finally { setLoading(false); }
  }, [page, limit, search, tab, categoryFilter, sortBy, sortOrder]);

  React.useEffect(() => { fetchItems(); }, [fetchItems]);

  // ─── Sort / limit helpers ──────────────────────────────

  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
    setPage(1);
  };

  const isAtLimit = planLimit && planLimit.max !== -1 && planLimit.current >= planLimit.max;
  const isNearLimit = planLimit && planLimit.max !== -1 && planLimit.current >= planLimit.max * 0.8 && !isAtLimit;

  // ─── Modal helpers ──────────────────────────────────────

  const openCreateModal = () => { setEditingItem(null); setFormData(EMPTY_FORM); setFieldErrors({}); setIsModalOpen(true); };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({ type: item.type, code: item.code, name: item.name, description: item.description || '', tipoItem: String(item.tipoItem), basePrice: String(item.basePrice), costPrice: item.costPrice != null ? String(item.costPrice) : '', uniMedida: String(item.uniMedida), tributo: item.tributo || '20', taxRate: String(item.taxRate), categoryId: item.categoryId || '' });
    setFieldErrors({}); setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); setFormData(EMPTY_FORM); setFieldErrors({}); };

  const handleFormChange = (field: keyof ItemForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleTributoChange = (value: string) => {
    const option = TRIBUTO_OPTIONS.find((o) => o.value === value);
    setFormData((prev) => ({ ...prev, tributo: value, taxRate: option?.rate || '0.00' }));
  };

  // ─── CRUD handlers ─────────────────────────────────────

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    errors.code = validateField('code', formData.code);
    errors.name = validateField('name', formData.name);
    errors.basePrice = validateField('basePrice', formData.basePrice);
    errors.costPrice = validateField('costPrice', formData.costPrice);
    errors.description = validateField('description', formData.description);
    if (Object.values(errors).some((e) => e !== '')) { setFieldErrors(errors); return; }

    setSaving(true);
    try {
      const body: Record<string, unknown> = { type: formData.type, code: formData.code.trim(), name: formData.name.trim(), description: formData.description.trim() || undefined, tipoItem: Number(formData.tipoItem), basePrice: Number(formData.basePrice), uniMedida: Number(formData.uniMedida), tributo: formData.tributo, taxRate: Number(formData.taxRate), categoryId: formData.categoryId || null };
      if (formData.costPrice.trim()) body.costPrice = Number(formData.costPrice);

      const isEdit = !!editingItem;
      const url = isEdit ? `${API_URL}/catalog-items/${editingItem.id}` : `${API_URL}/catalog-items`;
      const res = await fetch(url, { credentials: 'include', method: isEdit ? 'PATCH' : 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('itemSaveError')); }
      toast.success(isEdit ? tc('itemUpdated') : tc('itemCreated'));
      closeModal(); fetchItems(); fetchPlanLimit();
    } catch (err) { toast.error(err instanceof Error ? err.message : tc('itemSaveError')); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/catalog-items/${deleteConfirm.id}`, { credentials: 'include', method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('itemDeleteError')); }
      toast.success(tc('itemDeleted')); setDeleteConfirm(null); fetchItems(); fetchPlanLimit();
    } catch (err) { toast.error(err instanceof Error ? err.message : tc('itemDeleteError')); }
    finally { setDeleting(false); }
  };

  const handleToggleFavorite = async (item: CatalogItem) => {
    try {
      const res = await fetch(`${API_URL}/catalog-items/${item.id}/favorite`, { credentials: 'include', method: 'POST', headers: getAuthHeaders() });
      if (!res.ok) throw new Error(tc('favoriteError'));
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i));
    } catch { toastRef.current.error(tc('favoriteError')); }
  };

  // ─── Category handlers ─────────────────────────────────

  const handleCreateCategory = async (name: string, color: string) => {
    setSavingCat(true);
    try {
      const res = await fetch(`${API_URL}/catalog-items/categories`, { credentials: 'include', method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('categoryCreateError')); }
      toast.success(tc('categoryCreated')); fetchCategories();
    } catch (err) { toast.error(err instanceof Error ? err.message : tc('categoryCreateError')); }
    finally { setSavingCat(false); }
  };

  const handleUpdateCategory = async (cat: CatalogCategory, name: string, color: string) => {
    setSavingCat(true);
    try {
      const res = await fetch(`${API_URL}/catalog-items/categories/${cat.id}`, { credentials: 'include', method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('categoryUpdateError')); }
      toast.success(tc('categoryUpdated')); fetchCategories(); fetchItems();
    } catch (err) { toast.error(err instanceof Error ? err.message : tc('categoryUpdateError')); }
    finally { setSavingCat(false); }
  };

  const handleDeleteCategory = async (cat: CatalogCategory) => {
    if (!confirm(tc('deleteCategoryConfirm', { name: cat.name }))) return;
    try {
      const res = await fetch(`${API_URL}/catalog-items/categories/${cat.id}`, { credentials: 'include', method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error(tc('categoryDeleteError'));
      toast.success(tc('categoryDeleted')); fetchCategories(); fetchItems();
    } catch (err) { toast.error(err instanceof Error ? err.message : tc('categoryDeleteError')); }
  };

  // ─── Import / Export handlers ──────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportFile(file); setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => { const text = ev.target?.result as string; setImportPreview(parseCSV(text, importSeparator).slice(0, 6)); };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true); setImportResult(null);
    try {
      const text = await importFile.text();
      const rows = parseCSV(text, importSeparator);
      if (rows.length < 2) { toast.error(tc('csvMinRows')); return; }
      const headers = rows[0].map((h) => h.toLowerCase().trim());
      const dataRows = rows.slice(1);
      const fieldMap: Record<string, number> = {};
      const fieldNames = ['code', 'name', 'description', 'type', 'baseprice', 'costprice', 'taxrate', 'tipoitem', 'unimedida', 'tributo'];
      for (const fn of fieldNames) { const idx = headers.findIndex((h) => h.replace(/[_\s-]/g, '').toLowerCase() === fn); if (idx !== -1) fieldMap[fn] = idx; }
      if (fieldMap['code'] === undefined || fieldMap['name'] === undefined) { toast.error(tc('csvRequiredCols')); return; }
      const importRows = dataRows.map((row) => ({ code: row[fieldMap['code']] || '', name: row[fieldMap['name']] || '', description: fieldMap['description'] !== undefined ? row[fieldMap['description']] : undefined, type: fieldMap['type'] !== undefined ? row[fieldMap['type']] : 'PRODUCT', basePrice: Number(row[fieldMap['baseprice'] ?? -1] || '0'), costPrice: fieldMap['costprice'] !== undefined && row[fieldMap['costprice']] ? Number(row[fieldMap['costprice']]) : undefined, taxRate: fieldMap['taxrate'] !== undefined && row[fieldMap['taxrate']] ? Number(row[fieldMap['taxrate']]) : 13.0, tipoItem: fieldMap['tipoitem'] !== undefined && row[fieldMap['tipoitem']] ? Number(row[fieldMap['tipoitem']]) : 1, uniMedida: fieldMap['unimedida'] !== undefined && row[fieldMap['unimedida']] ? Number(row[fieldMap['unimedida']]) : 99, tributo: fieldMap['tributo'] !== undefined ? row[fieldMap['tributo']] : '20' }));

      const res = await fetch(`${API_URL}/catalog-items/import`, { credentials: 'include', method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: importRows }) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('importError')); }
      const result: ImportResult = await res.json();
      setImportResult(result); toast.success(tc('importSuccess', { created: result.created, updated: result.updated }));
      fetchItems(); fetchPlanLimit();
    } catch (err) { toast.error(err instanceof Error ? err.message : tc('importError')); }
    finally { setImporting(false); }
  };

  const closeImportModal = () => { setImportModalOpen(false); setImportFile(null); setImportPreview(null); setImportResult(null); };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/catalog-items/export`, { credentials: 'include', headers: getAuthHeaders() });
      if (!res.ok) throw new Error(tc('exportError'));
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) { toast.error(tc('noItemsExport')); return; }
      const csvHeaders = ['code', 'name', 'description', 'type', 'category', 'basePrice', 'costPrice', 'taxRate', 'tipoItem', 'uniMedida', 'tributo'];
      const csvRows = data.map((item: CatalogItem) => csvHeaders.map((h) => { if (h === 'category') return item.category?.name || ''; const val = item[h as keyof CatalogItem]; if (val === null || val === undefined) return ''; const str = String(val); return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str; }).join(','));
      const csv = [csvHeaders.join(','), ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `catalogo_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url); toast.success(tc('exportSuccess'));
    } catch (err) { toast.error(err instanceof Error ? err.message : tc('exportError')); }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla_catalogo.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Package className="h-6 w-6" />
            {tc('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {tc('subtitle')}
            {planLimit && planLimit.max !== -1 && (
              <span className="ml-2 text-sm">({planLimit.current}/{planLimit.max} items)</span>
            )}
          </p>
        </div>
        {!fetchError && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCategoriesModalOpen(true)}>
              <Tag className="mr-2 h-4 w-4" />{tc('categories')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />{tCommon('import')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />{tCommon('export')}
            </Button>
            <Button onClick={openCreateModal} disabled={!!isAtLimit}>
              <Plus className="mr-2 h-4 w-4" />{tc('newItem')}
            </Button>
          </div>
        )}
      </div>

      {/* Plan limit warnings */}
      {isAtLimit && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {tc('planLimitReached', { max: planLimit?.max ?? 0, plan: planLimit?.planCode ?? '' })}
        </div>
      )}
      {isNearLimit && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {tc('planLimitNear', { current: planLimit?.current ?? 0, max: planLimit?.max ?? 0, plan: planLimit?.planCode ?? '' })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {TABS.map((tabItem) => {
          const tabLabels: Record<string, string> = { '': tc('allTab'), 'PRODUCT': tc('productsTab'), 'SERVICE': tc('servicesTab'), 'FAVORITES': tc('favoritesTab') };
          return (
            <button
              key={tabItem.key}
              onClick={() => { setTab(tabItem.key); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                tab === tabItem.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tabLabels[tabItem.key] || tabItem.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Search + Category Filter + PageSize */}
          <div className="flex items-center justify-between px-4 py-3 border-b gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={tc('searchPlaceholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9 w-64" />
              </div>
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === '_all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="w-48"><SelectValue placeholder={tc('allCategories')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">{tc('allCategories')}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          {cat.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <PageSizeSelector value={limit} onChange={(v) => { setLimit(v); setPage(1); }} />
          </div>

          <CatalogTable
            items={items} loading={loading} fetchError={fetchError}
            total={total} totalPages={totalPages} page={page}
            sortBy={sortBy} sortOrder={sortOrder} isAtLimit={isAtLimit}
            onSort={handleSort} onPageChange={setPage}
            onToggleFavorite={handleToggleFavorite}
            onEdit={openEditModal} onDelete={setDeleteConfirm}
            onCreateFirst={openCreateModal} onRetry={fetchItems}
            tc={tc} tCommon={tCommon}
          />
        </CardContent>
      </Card>

      {/* Modals (code-split) */}
      <CatalogItemFormModal
        isOpen={isModalOpen} onClose={closeModal}
        editingItem={editingItem} formData={formData} fieldErrors={fieldErrors}
        saving={saving} categories={categories} units={units}
        onFormChange={handleFormChange} onTributoChange={handleTributoChange}
        onSave={handleSave} tc={tc} tCommon={tCommon}
      />

      <DeleteConfirmDialog
        item={deleteConfirm} deleting={deleting}
        onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)}
        tc={tc} tCommon={tCommon}
      />

      <CategoriesModal
        isOpen={categoriesModalOpen} onClose={() => setCategoriesModalOpen(false)}
        categories={categories} onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory}
        saving={savingCat} tc={tc} tCommon={tCommon}
      />

      <ImportModal
        isOpen={importModalOpen} onClose={closeImportModal}
        importFile={importFile} importPreview={importPreview}
        importResult={importResult} importing={importing}
        importSeparator={importSeparator} onSeparatorChange={setImportSeparator}
        onFileChange={handleFileChange} onImport={handleImport}
        onDownloadTemplate={downloadTemplate} tc={tc} tCommon={tCommon}
      />
    </div>
  );
}
