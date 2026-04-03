'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Package, Upload, Download, Tag, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { PageSizeSelector } from '@/components/ui/page-size-selector';
import { useTranslations } from 'next-intl';
import { API_URL } from '@/lib/api';
import type { CatalogItem, ItemForm, ImportResult } from './components/catalog-types';
import { EMPTY_FORM, TABS, TRIBUTO_OPTIONS, CSV_TEMPLATE, validateField } from './components/catalog-types';
import { CatalogTable } from './components/CatalogTable';
import { useCatalogData } from './components/use-catalog-data';

const CatalogItemFormModal = dynamic(() => import('./components/CatalogItemFormModal').then(m => ({ default: m.CatalogItemFormModal })), { ssr: false });
const DeleteConfirmDialog = dynamic(() => import('./components/DeleteConfirmDialog').then(m => ({ default: m.DeleteConfirmDialog })), { ssr: false });
const CategoriesModal = dynamic(() => import('./components/CategoriesModal').then(m => ({ default: m.CategoriesModal })), { ssr: false });
const ImportModal = dynamic(() => import('./components/ImportModal').then(m => ({ default: m.ImportModal })), { ssr: false });

export default function CatalogoPage() {
  const tc = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const toast = useToast();

  // Filter state
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  React.useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Data hook
  const data = useCatalogData({ page, limit, search, tab, categoryFilter, sortBy, sortOrder, toast, tc });

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null);
  const [formData, setFormData] = React.useState<ItemForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<CatalogItem | null>(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = React.useState(false);
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importSeparator, setImportSeparator] = React.useState(',');
  const [importPreview, setImportPreview] = React.useState<string[][] | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);

  // Sort
  const handleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
    setPage(1);
  };

  const isAtLimit = data.planLimit && data.planLimit.max !== -1 && data.planLimit.current >= data.planLimit.max;
  const isNearLimit = data.planLimit && data.planLimit.max !== -1 && data.planLimit.current >= data.planLimit.max * 0.8 && !isAtLimit;

  // Modal helpers
  const openCreateModal = () => { setEditingItem(null); setFormData(EMPTY_FORM); setFieldErrors({}); setIsModalOpen(true); };
  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({ type: item.type, code: item.code, name: item.name, description: item.description || '', tipoItem: String(item.tipoItem), basePrice: String(item.basePrice), costPrice: item.costPrice != null ? String(item.costPrice) : '', uniMedida: String(item.uniMedida), tributo: item.tributo || '20', taxRate: String(item.taxRate), categoryId: item.categoryId || '' });
    setFieldErrors({}); setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditingItem(null); setFormData(EMPTY_FORM); setFieldErrors({}); };

  const handleFormChange = (field: keyof ItemForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleTributoChange = (value: string) => {
    const opt = TRIBUTO_OPTIONS.find(o => o.value === value);
    setFormData(prev => ({ ...prev, tributo: value, taxRate: opt?.rate || '0.00' }));
  };

  // Save item
  const handleSave = async () => {
    const errors: Record<string, string> = {};
    for (const f of ['code', 'name', 'basePrice', 'costPrice', 'description'] as const) errors[f] = validateField(f, formData[f]);
    if (Object.values(errors).some(e => e !== '')) { setFieldErrors(errors); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { type: formData.type, code: formData.code.trim(), name: formData.name.trim(), description: formData.description.trim() || undefined, tipoItem: Number(formData.tipoItem), basePrice: Number(formData.basePrice), uniMedida: Number(formData.uniMedida), tributo: formData.tributo, taxRate: Number(formData.taxRate), categoryId: formData.categoryId || null };
      if (formData.costPrice.trim()) body.costPrice = Number(formData.costPrice);
      const isEdit = !!editingItem;
      const res = await fetch(isEdit ? `${API_URL}/catalog-items/${editingItem.id}` : `${API_URL}/catalog-items`, { credentials: 'include', method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as Record<string, string>).message || tc('itemSaveError')); }
      toast.success(isEdit ? tc('itemUpdated') : tc('itemCreated'));
      closeModal(); data.fetchItems(); data.fetchPlanLimit();
    } catch (err) { toast.error(err instanceof Error ? err.message : tc('itemSaveError')); }
    finally { setSaving(false); }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await data.handleDeleteItem(deleteConfirm);
    setDeleteConfirm(null);
  };

  // Import handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportFile(file); setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { parseCSV: csvParse } = require('./components/catalog-types');
      setImportPreview(csvParse(text, importSeparator).slice(0, 6));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    const result = await data.handleImport(importFile, importSeparator);
    if (result) setImportResult(result);
    setImporting(false);
  };

  const closeImportModal = () => { setImportModalOpen(false); setImportFile(null); setImportPreview(null); setImportResult(null); };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'plantilla_catalogo.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground"><Package className="h-6 w-6" />{tc('title')}</h1>
          <p className="text-muted-foreground mt-1">{tc('subtitle')}{data.planLimit && data.planLimit.max !== -1 && <span className="ml-2 text-sm">({data.planLimit.current}/{data.planLimit.max} items)</span>}</p>
        </div>
        {!data.fetchError && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCategoriesModalOpen(true)}><Tag className="mr-2 h-4 w-4" />{tc('categories')}</Button>
            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}><Upload className="mr-2 h-4 w-4" />{tCommon('import')}</Button>
            <Button variant="outline" size="sm" onClick={data.handleExport}><Download className="mr-2 h-4 w-4" />{tCommon('export')}</Button>
            <Button onClick={openCreateModal} disabled={!!isAtLimit}><Plus className="mr-2 h-4 w-4" />{tc('newItem')}</Button>
          </div>
        )}
      </div>

      {isAtLimit && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400"><AlertTriangle className="h-4 w-4 shrink-0" />{tc('planLimitReached', { max: data.planLimit?.max ?? 0, plan: data.planLimit?.planCode ?? '' })}</div>}
      {isNearLimit && <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400"><AlertTriangle className="h-4 w-4 shrink-0" />{tc('planLimitNear', { current: data.planLimit?.current ?? 0, max: data.planLimit?.max ?? 0, plan: data.planLimit?.planCode ?? '' })}</div>}

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {TABS.map(tabItem => {
          const labels: Record<string, string> = { '': tc('allTab'), PRODUCT: tc('productsTab'), SERVICE: tc('servicesTab'), FAVORITES: tc('favoritesTab') };
          return <button key={tabItem.key} onClick={() => { setTab(tabItem.key); setPage(1); }} className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${tab === tabItem.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{labels[tabItem.key] || tabItem.label}</button>;
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b gap-3">
            <div className="flex items-center gap-3">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={tc('searchPlaceholder')} value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-9 w-64" /></div>
              {data.categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v === '_all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="w-48"><SelectValue placeholder={tc('allCategories')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">{tc('allCategories')}</SelectItem>
                    {data.categories.map(cat => <SelectItem key={cat.id} value={cat.id}><span className="flex items-center gap-2">{cat.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}{cat.name}</span></SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <PageSizeSelector value={limit} onChange={v => { setLimit(v); setPage(1); }} />
          </div>

          <CatalogTable items={data.items} loading={data.loading} fetchError={data.fetchError} total={data.total} totalPages={data.totalPages} page={page} sortBy={sortBy} sortOrder={sortOrder} isAtLimit={isAtLimit} onSort={handleSort} onPageChange={setPage} onToggleFavorite={data.handleToggleFavorite} onEdit={openEditModal} onDelete={setDeleteConfirm} onCreateFirst={openCreateModal} onRetry={data.fetchItems} tc={tc} tCommon={tCommon} />
        </CardContent>
      </Card>

      <CatalogItemFormModal isOpen={isModalOpen} onClose={closeModal} editingItem={editingItem} formData={formData} fieldErrors={fieldErrors} saving={saving} categories={data.categories} units={data.units} onFormChange={handleFormChange} onTributoChange={handleTributoChange} onSave={handleSave} tc={tc} tCommon={tCommon} />
      <DeleteConfirmDialog item={deleteConfirm} deleting={data.deleting} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} tc={tc} tCommon={tCommon} />
      <CategoriesModal isOpen={categoriesModalOpen} onClose={() => setCategoriesModalOpen(false)} categories={data.categories} onCreateCategory={data.handleCreateCategory} onUpdateCategory={data.handleUpdateCategory} onDeleteCategory={data.handleDeleteCategory} saving={data.savingCat} tc={tc} tCommon={tCommon} />
      <ImportModal isOpen={importModalOpen} onClose={closeImportModal} importFile={importFile} importPreview={importPreview} importResult={importResult} importing={importing} importSeparator={importSeparator} onSeparatorChange={setImportSeparator} onFileChange={handleFileChange} onImport={handleImport} onDownloadTemplate={downloadTemplate} tc={tc} tCommon={tCommon} />
    </div>
  );
}
