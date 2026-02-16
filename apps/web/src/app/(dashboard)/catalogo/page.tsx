'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Pencil,
  Trash2,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Star,
  Upload,
  Download,
  Tag,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { PageSizeSelector } from '@/components/ui/page-size-selector';
import { useTranslations } from 'next-intl';

// ─── Types ─────────────────────────────────────────────────

interface CatalogCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  _count?: { items: number };
}

interface CatalogItem {
  id: string;
  type: string;
  code: string;
  name: string;
  description: string | null;
  tipoItem: number;
  basePrice: string | number;
  costPrice: string | number | null;
  uniMedida: number;
  tributo: string | null;
  taxRate: string | number;
  isActive: boolean;
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  categoryId: string | null;
  category: CatalogCategory | null;
  createdAt: string;
}

interface CatalogResponse {
  data: CatalogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PlanLimitInfo {
  current: number;
  max: number;
  planCode: string;
}

interface UnidadMedida {
  codigo: number;
  descripcion: string;
}

interface ItemForm {
  type: string;
  code: string;
  name: string;
  description: string;
  tipoItem: string;
  basePrice: string;
  costPrice: string;
  uniMedida: string;
  tributo: string;
  taxRate: string;
  categoryId: string;
}

interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  errors: ImportRowError[];
}

const EMPTY_FORM: ItemForm = {
  type: 'PRODUCT',
  code: '',
  name: '',
  description: '',
  tipoItem: '1',
  basePrice: '',
  costPrice: '',
  uniMedida: '99',
  tributo: '20',
  taxRate: '13.00',
  categoryId: '',
};

// ─── Constants ─────────────────────────────────────────────

const TABS = [
  { key: '', label: 'Todos' },
  { key: 'PRODUCT', label: 'Productos' },
  { key: 'SERVICE', label: 'Servicios' },
  { key: 'FAVORITES', label: 'Favoritos' },
];

const TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
};

const TYPE_COLORS: Record<string, string> = {
  PRODUCT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  SERVICE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

const TRIBUTO_OPTIONS = [
  { value: '20', label: 'IVA 13%', rate: '13.00' },
  { value: '10', label: 'Exento', rate: '0.00' },
  { value: '30', label: 'No Sujeto', rate: '0.00' },
];

const TIPO_ITEM_OPTIONS = [
  { value: '1', label: '1 - Bienes' },
  { value: '2', label: '2 - Servicios' },
  { value: '3', label: '3 - Ambos' },
];

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

const CSV_TEMPLATE = 'code,name,description,type,basePrice,costPrice,taxRate,tipoItem,uniMedida,tributo\nPRD-001,Producto Ejemplo,Descripcion,PRODUCT,10.00,,13.00,1,99,20\nSRV-001,Servicio Ejemplo,,SERVICE,25.00,,13.00,2,59,20';

// ─── Validation ────────────────────────────────────────────

function validateField(field: string, value: string): string {
  switch (field) {
    case 'code':
      if (!value.trim()) return 'El codigo es requerido';
      if (value.trim().length > 50) return 'Maximo 50 caracteres';
      return '';
    case 'name':
      if (!value.trim()) return 'El nombre es requerido';
      if (value.trim().length < 2) return 'Minimo 2 caracteres';
      if (value.trim().length > 200) return 'Maximo 200 caracteres';
      return '';
    case 'basePrice': {
      if (!value.trim()) return 'El precio es requerido';
      const num = Number(value);
      if (isNaN(num) || num < 0) return 'Debe ser un numero positivo';
      return '';
    }
    case 'costPrice': {
      if (!value.trim()) return '';
      const num = Number(value);
      if (isNaN(num) || num < 0) return 'Debe ser un numero positivo';
      return '';
    }
    case 'description':
      if (value.length > 500) return 'Maximo 500 caracteres';
      return '';
    default:
      return '';
  }
}

function isFormValid(form: ItemForm): boolean {
  if (!form.code.trim()) return false;
  if (!form.name.trim() || form.name.trim().length < 2) return false;
  if (!form.basePrice.trim() || isNaN(Number(form.basePrice)) || Number(form.basePrice) < 0) return false;
  if (form.costPrice.trim() && (isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)) return false;
  return true;
}

// ─── CSV Parser (RFC 4180 compliant) ──────────────────────

function parseCSV(text: string, separator: string = ','): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === separator) {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        row.push(current.trim());
        if (row.some((c) => c !== '')) rows.push(row);
        row = [];
        current = '';
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  // Last field/row
  row.push(current.trim());
  if (row.some((c) => c !== '')) rows.push(row);

  return rows;
}

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

  // Categories
  const [categories, setCategories] = React.useState<CatalogCategory[]>([]);

  // Plan limit
  const [planLimit, setPlanLimit] = React.useState<PlanLimitInfo | null>(null);

  // Filter state
  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null);
  const [formData, setFormData] = React.useState<ItemForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = React.useState<CatalogItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Categories modal
  const [categoriesModalOpen, setCategoriesModalOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState('');
  const [newCatColor, setNewCatColor] = React.useState(CATEGORY_COLORS[0]);
  const [savingCat, setSavingCat] = React.useState(false);
  const [editingCat, setEditingCat] = React.useState<CatalogCategory | null>(null);
  const [editCatName, setEditCatName] = React.useState('');
  const [editCatColor, setEditCatColor] = React.useState('');

  // Import modal
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importSeparator, setImportSeparator] = React.useState(',');
  const [importPreview, setImportPreview] = React.useState<string[][] | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);

  // Units of measure (loaded once)
  const [units, setUnits] = React.useState<UnidadMedida[]>([]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // ─── Load units of measure ──────────────────────────────

  React.useEffect(() => {
    const loadUnits = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/catalogs/unidades-medida`,
          { headers: getAuthHeaders() },
        );
        if (res.ok) {
          const data = await res.json().catch(() => []);
          if (Array.isArray(data)) setUnits(data);
        }
      } catch {
        // Non-critical
      }
    };
    loadUnits();
  }, []);

  // ─── Load categories ─────────────────────────────────────

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/categories`,
        { headers: getAuthHeaders() },
      );
      if (res.ok) {
        const data = await res.json().catch(() => []);
        if (Array.isArray(data)) setCategories(data);
      }
    } catch {
      // Non-critical
    }
  }, []);

  React.useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ─── Load plan limit ──────────────────────────────────────

  const fetchPlanLimit = React.useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/plan-limit`,
        { headers: getAuthHeaders() },
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.current === 'number') setPlanLimit(data);
      }
    } catch {
      // Non-critical
    }
  }, []);

  React.useEffect(() => { fetchPlanLimit(); }, [fetchPlanLimit]);

  // ─── Fetch items ────────────────────────────────────────

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);

      if (tab === 'FAVORITES') {
        params.set('isFavorite', 'true');
      } else if (tab) {
        params.set('type', tab);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items?${params}`,
        { headers: getAuthHeaders() },
      );

      if (!res.ok) {
        if (res.status === 404) {
          setFetchError(tc('importError'));
          return;
        }
        throw new Error(tc('importError'));
      }

      const data: CatalogResponse = await res.json().catch(() => ({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }));
      const list = Array.isArray(data?.data) ? data.data : [];
      setItems(list);
      const parsedTotal = Number(data?.total);
      const parsedPages = Number(data?.totalPages);
      setTotal(!isNaN(parsedTotal) ? parsedTotal : list.length);
      setTotalPages(!isNaN(parsedPages) && parsedPages >= 1 ? parsedPages : 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : tc('importError');
      setFetchError(message);
      toastRef.current.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, tab, categoryFilter, sortBy, sortOrder]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Sort helpers ───────────────────────────────────────

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // ─── Plan limit helpers ──────────────────────────────────

  const isAtLimit = planLimit && planLimit.max !== -1 && planLimit.current >= planLimit.max;
  const isNearLimit = planLimit && planLimit.max !== -1 && planLimit.current >= planLimit.max * 0.8 && !isAtLimit;

  // ─── Modal helpers ──────────────────────────────────────

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      code: item.code,
      name: item.name,
      description: item.description || '',
      tipoItem: String(item.tipoItem),
      basePrice: String(item.basePrice),
      costPrice: item.costPrice != null ? String(item.costPrice) : '',
      uniMedida: String(item.uniMedida),
      tributo: item.tributo || '20',
      taxRate: String(item.taxRate),
      categoryId: item.categoryId || '',
    });
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setFieldErrors({});
  };

  const handleFormChange = (field: keyof ItemForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleTributoChange = (value: string) => {
    const option = TRIBUTO_OPTIONS.find((o) => o.value === value);
    setFormData((prev) => ({
      ...prev,
      tributo: value,
      taxRate: option?.rate || '0.00',
    }));
  };

  // ─── Save ───────────────────────────────────────────────

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    errors.code = validateField('code', formData.code);
    errors.name = validateField('name', formData.name);
    errors.basePrice = validateField('basePrice', formData.basePrice);
    errors.costPrice = validateField('costPrice', formData.costPrice);
    errors.description = validateField('description', formData.description);

    const hasErrors = Object.values(errors).some((e) => e !== '');
    setFieldErrors(errors);
    if (hasErrors) return;

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        type: formData.type,
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tipoItem: Number(formData.tipoItem),
        basePrice: Number(formData.basePrice),
        uniMedida: Number(formData.uniMedida),
        tributo: formData.tributo,
        taxRate: Number(formData.taxRate),
        categoryId: formData.categoryId || null,
      };
      if (formData.costPrice.trim()) {
        body.costPrice = Number(formData.costPrice);
      }

      const isEdit = !!editingItem;
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/${editingItem.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/catalog-items`;

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as Record<string, string>).message || tc('itemSaveError'),
        );
      }

      toast.success(
        isEdit ? tc('itemUpdated') : tc('itemCreated'),
      );
      closeModal();
      fetchItems();
      fetchPlanLimit();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : tc('itemSaveError'),
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/${deleteConfirm.id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).message || tc('itemDeleteError'));
      }
      toast.success(tc('itemDeleted'));
      setDeleteConfirm(null);
      fetchItems();
      fetchPlanLimit();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : tc('itemDeleteError'),
      );
    } finally {
      setDeleting(false);
    }
  };

  // ─── Toggle favorite ───────────────────────────────────

  const handleToggleFavorite = async (item: CatalogItem) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/${item.id}/favorite`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        },
      );
      if (!res.ok) throw new Error(tc('favoriteError'));
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i,
        ),
      );
    } catch {
      toastRef.current.error(tc('favoriteError'));
    }
  };

  // ─── Category CRUD ────────────────────────────────────

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/categories`,
        {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCatName.trim(), color: newCatColor }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).message || tc('categoryCreateError'));
      }
      toast.success(tc('categoryCreated'));
      setNewCatName('');
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('categoryCreateError'));
    } finally {
      setSavingCat(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCat || !editCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/categories/${editingCat.id}`,
        {
          method: 'PATCH',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editCatName.trim(), color: editCatColor }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).message || tc('categoryUpdateError'));
      }
      toast.success(tc('categoryUpdated'));
      setEditingCat(null);
      fetchCategories();
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('categoryUpdateError'));
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: CatalogCategory) => {
    if (!confirm(tc('deleteCategoryConfirm', { name: cat.name }))) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/categories/${cat.id}`,
        { method: 'DELETE', headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error(tc('categoryDeleteError'));
      toast.success(tc('categoryDeleted'));
      fetchCategories();
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('categoryDeleteError'));
    }
  };

  // ─── Import ───────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text, importSeparator);
      setImportPreview(rows.slice(0, 6)); // header + 5 preview rows
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);

    try {
      const text = await importFile.text();
      const rows = parseCSV(text, importSeparator);

      if (rows.length < 2) {
        toast.error(tc('csvMinRows'));
        return;
      }

      const headers = rows[0].map((h) => h.toLowerCase().trim());
      const dataRows = rows.slice(1);

      // Map headers to fields
      const fieldMap: Record<string, number> = {};
      const fieldNames = ['code', 'name', 'description', 'type', 'baseprice', 'costprice', 'taxrate', 'tipoitem', 'unimedida', 'tributo'];
      for (const fn of fieldNames) {
        const idx = headers.findIndex((h) => h.replace(/[_\s-]/g, '').toLowerCase() === fn);
        if (idx !== -1) fieldMap[fn] = idx;
      }

      if (fieldMap['code'] === undefined || fieldMap['name'] === undefined) {
        toast.error(tc('csvRequiredCols'));
        return;
      }

      const importRows = dataRows.map((row) => ({
        code: row[fieldMap['code']] || '',
        name: row[fieldMap['name']] || '',
        description: fieldMap['description'] !== undefined ? row[fieldMap['description']] : undefined,
        type: fieldMap['type'] !== undefined ? row[fieldMap['type']] : 'PRODUCT',
        basePrice: Number(row[fieldMap['baseprice'] ?? -1] || '0'),
        costPrice: fieldMap['costprice'] !== undefined && row[fieldMap['costprice']] ? Number(row[fieldMap['costprice']]) : undefined,
        taxRate: fieldMap['taxrate'] !== undefined && row[fieldMap['taxrate']] ? Number(row[fieldMap['taxrate']]) : 13.0,
        tipoItem: fieldMap['tipoitem'] !== undefined && row[fieldMap['tipoitem']] ? Number(row[fieldMap['tipoitem']]) : 1,
        uniMedida: fieldMap['unimedida'] !== undefined && row[fieldMap['unimedida']] ? Number(row[fieldMap['unimedida']]) : 99,
        tributo: fieldMap['tributo'] !== undefined ? row[fieldMap['tributo']] : '20',
      }));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/import`,
        {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: importRows }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as Record<string, string>).message || tc('importError'));
      }

      const result: ImportResult = await res.json();
      setImportResult(result);
      toast.success(tc('importSuccess', { created: result.created, updated: result.updated }));
      fetchItems();
      fetchPlanLimit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('importError'));
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
  };

  // ─── Export ───────────────────────────────────────────

  const handleExport = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/export`,
        { headers: getAuthHeaders() },
      );
      if (!res.ok) throw new Error(tc('exportError'));
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        toast.error(tc('noItemsExport'));
        return;
      }

      const csvHeaders = ['code', 'name', 'description', 'type', 'category', 'basePrice', 'costPrice', 'taxRate', 'tipoItem', 'uniMedida', 'tributo'];
      const csvRows = data.map((item: CatalogItem) =>
        csvHeaders.map((h) => {
          if (h === 'category') return item.category?.name || '';
          const val = item[h as keyof CatalogItem];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(','),
      );

      const csv = [csvHeaders.join(','), ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalogo_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(tc('exportSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('exportError'));
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_catalogo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Format price ──────────────────────────────────────

  const formatPrice = (price: string | number) => {
    const num = Number(price);
    if (isNaN(num)) return '$0.00';
    return `$${num.toFixed(2)}`;
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
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
              <span className="ml-2 text-sm">
                ({planLimit.current}/{planLimit.max} items)
              </span>
            )}
          </p>
        </div>
        {!fetchError && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCategoriesModalOpen(true)}>
              <Tag className="mr-2 h-4 w-4" />
              {tc('categories')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {tCommon('import')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {tCommon('export')}
            </Button>
            <Button onClick={openCreateModal} disabled={!!isAtLimit}>
              <Plus className="mr-2 h-4 w-4" />
              {tc('newItem')}
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
                tab === tabItem.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
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
                <Input
                  placeholder={tc('searchPlaceholder')}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-64"
                />
              </div>
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === '_all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={tc('allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">{tc('allCategories')}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          {cat.color && (
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          )}
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <PageSizeSelector value={limit} onChange={handleLimitChange} />
          </div>

          {/* Table */}
          {loading ? (
            <SkeletonTable rows={5} />
          ) : fetchError ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">{fetchError}</p>
              <Button variant="outline" className="mt-4" onClick={fetchItems}>
                {tCommon('retry')}
              </Button>
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">{tCommon('noResults')}</p>
              <Button variant="outline" className="mt-4" onClick={openCreateModal} disabled={!!isAtLimit}>
                <Plus className="mr-2 h-4 w-4" />
                {tc('createFirst')}
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('code')}
                    >
                      <div className="flex items-center">
                        {tc('codeLabel')} {getSortIcon('code')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        {tc('nameLabel')} {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead>{tc('categoryLabel')}</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center">
                        {tc('typeLabel')} {getSortIcon('type')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('basePrice')}
                    >
                      <div className="flex items-center">
                        {tCommon('price')} {getSortIcon('basePrice')}
                      </div>
                    </TableHead>
                    <TableHead>{tCommon('tax')}</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('usageCount')}
                    >
                      <div className="flex items-center">
                        {tc('uses')} {getSortIcon('usageCount')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <button
                          onClick={() => handleToggleFavorite(item)}
                          className="hover:scale-110 transition-transform"
                          title={item.isFavorite ? tc('removeFavorite') : tc('addFavorite')}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              item.isFavorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/40'
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                        {item.description && (
                          <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: item.category.color ? `${item.category.color}20` : '#6366f120',
                              color: item.category.color || '#6366f1',
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.category.color || '#6366f1' }} />
                            {item.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.type === 'PRODUCT' ? tc('product') : item.type === 'SERVICE' ? tc('service') : item.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(item.basePrice)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {TRIBUTO_OPTIONS.find((opt) => opt.value === item.tributo)?.label || tc('taxIva')}
                      </TableCell>
                      <TableCell className="text-center">{item.usageCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(item)}
                            title={tCommon('edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteConfirm(item)}
                            title={tCommon('delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                showing={items.length}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Create/Edit Modal ─────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? tc('editItem') : tc('newItem')}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? tc('editDesc')
                : tc('createDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type radio */}
            <div className="space-y-1">
              <Label>{tc('typeLabel')} *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemType"
                    value="PRODUCT"
                    checked={formData.type === 'PRODUCT'}
                    onChange={() => handleFormChange('type', 'PRODUCT')}
                    className="accent-primary"
                  />
                  <span className="text-sm">{tc('product')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="itemType"
                    value="SERVICE"
                    checked={formData.type === 'SERVICE'}
                    onChange={() => handleFormChange('type', 'SERVICE')}
                    className="accent-primary"
                  />
                  <span className="text-sm">{tc('service')}</span>
                </label>
              </div>
            </div>

            {/* Code + Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{tc('codeLabel')} *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  placeholder="PRD-001"
                  maxLength={50}
                  className={fieldErrors.code ? 'border-red-500' : ''}
                />
                {fieldErrors.code && (
                  <p className="text-xs text-red-500">{fieldErrors.code}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>{tc('nameLabel')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Nombre del producto o servicio"
                  maxLength={200}
                  className={fieldErrors.name ? 'border-red-500' : ''}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500">{fieldErrors.name}</p>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label>{tc('categoryLabel')}</Label>
              <Select value={formData.categoryId || '_none'} onValueChange={(v) => handleFormChange('categoryId', v === '_none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={tc('noCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">{tc('noCategory')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        {cat.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>{tc('descriptionLabel')}</Label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Descripcion opcional del item"
                maxLength={500}
                rows={2}
                className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                  fieldErrors.description ? 'border-red-500' : 'border-input'
                }`}
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-500">{fieldErrors.description}</p>
              )}
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{tc('basePriceLabel')} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => handleFormChange('basePrice', e.target.value)}
                  placeholder="0.00"
                  className={fieldErrors.basePrice ? 'border-red-500' : ''}
                />
                {fieldErrors.basePrice && (
                  <p className="text-xs text-red-500">{fieldErrors.basePrice}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>{tc('costPriceLabel')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => handleFormChange('costPrice', e.target.value)}
                  placeholder="0.00"
                  className={fieldErrors.costPrice ? 'border-red-500' : ''}
                />
                {fieldErrors.costPrice && (
                  <p className="text-xs text-red-500">{fieldErrors.costPrice}</p>
                )}
              </div>
            </div>

            {/* Unit + Tax */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{tc('unitLabel')}</Label>
                <Select
                  value={formData.uniMedida}
                  onValueChange={(v) => handleFormChange('uniMedida', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tc('selectUnit')} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.length > 0 ? (
                      units.map((u) => (
                        <SelectItem key={u.codigo} value={String(u.codigo)}>
                          {u.descripcion}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="99">Otra (Unidad)</SelectItem>
                        <SelectItem value="36">Hora</SelectItem>
                        <SelectItem value="59">Servicio</SelectItem>
                        <SelectItem value="1">Metro</SelectItem>
                        <SelectItem value="23">Libra</SelectItem>
                        <SelectItem value="21">Kilogramo</SelectItem>
                        <SelectItem value="40">Pieza</SelectItem>
                        <SelectItem value="34">Docena</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{tc('taxProfileLabel')}</Label>
                <Select
                  value={formData.tributo}
                  onValueChange={handleTributoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tc('selectTax')} />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIBUTO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipo Item MH */}
            <div className="space-y-1">
              <Label>{tc('mhTypeLabel')}</Label>
              <Select
                value={formData.tipoItem}
                onValueChange={(v) => handleFormChange('tipoItem', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc('selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_ITEM_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isFormValid(formData)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? tCommon('save') : tCommon('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ───────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tc('deleteItem')}</DialogTitle>
            <DialogDescription>
              {tc('deleteConfirm', { name: deleteConfirm?.name ?? '', code: deleteConfirm?.code ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Categories Modal ─────────────────────────────── */}
      <Dialog open={categoriesModalOpen} onOpenChange={(open) => { if (!open) { setCategoriesModalOpen(false); setEditingCat(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tc('manageCategories')}</DialogTitle>
            <DialogDescription>
              {tc('manageCategoriesDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add new category */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label>{tc('newCategory')}</Label>
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder={tc('categoryNamePlaceholder')}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1">
                <Label>Color</Label>
                <div className="flex gap-1">
                  {CATEGORY_COLORS.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${newCatColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewCatColor(c)}
                    />
                  ))}
                </div>
              </div>
              <Button size="sm" onClick={handleCreateCategory} disabled={savingCat || !newCatName.trim()}>
                {savingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>

            {/* Category list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{tc('noCategories')}</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-md border">
                    {editingCat?.id === cat.id ? (
                      <>
                        <Input
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="h-8 text-sm flex-1"
                          maxLength={100}
                        />
                        <div className="flex gap-0.5">
                          {CATEGORY_COLORS.slice(0, 5).map((c) => (
                            <button
                              key={c}
                              className={`w-4 h-4 rounded-full border ${editCatColor === c ? 'border-foreground' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditCatColor(c)}
                            />
                          ))}
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdateCategory} disabled={savingCat}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingCat(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#6366f1' }} />
                        <span className="flex-1 text-sm font-medium">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">{cat._count?.items || 0} items</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => { setEditingCat(cat); setEditCatName(cat.name); setEditCatColor(cat.color || CATEGORY_COLORS[0]); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteCategory(cat)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoriesModalOpen(false)}>
              {tCommon('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Import Modal ─────────────────────────────────── */}
      <Dialog open={importModalOpen} onOpenChange={(open) => { if (!open) closeImportModal(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{tc('importCatalog')}</DialogTitle>
            <DialogDescription>
              {tc('importDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template download */}
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm text-muted-foreground">{tc('downloadTemplate')}</span>
              <Button size="sm" variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-3.5 w-3.5" />
                {tc('template')}
              </Button>
            </div>

            {/* File + Separator */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label>{tc('csvFile')}</Label>
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                />
              </div>
              <div className="space-y-1">
                <Label>{tc('separator')}</Label>
                <Select value={importSeparator} onValueChange={setImportSeparator}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">{tc('comma')}</SelectItem>
                    <SelectItem value=";">{tc('semicolon')}</SelectItem>
                    <SelectItem value="\t">{tc('tab')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            {importPreview && importPreview.length > 0 && (
              <div className="space-y-1">
                <Label>{tc('previewRows')}</Label>
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {importPreview[0].map((h, i) => (
                          <TableHead key={i} className="text-xs whitespace-nowrap">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.slice(1).map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j} className="text-xs py-1 whitespace-nowrap">{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Import result */}
            {importResult && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">{tc('importResult')}</span>
                  <span className="text-green-600 dark:text-green-400">{tc('created', { count: importResult.created })}</span>
                  <span className="text-blue-600 dark:text-blue-400">{tc('updated', { count: importResult.updated })}</span>
                  {importResult.errors.length > 0 && (
                    <span className="text-red-600 dark:text-red-400">{tc('errors', { count: importResult.errors.length })}</span>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-red-600 dark:text-red-400">
                        Fila {err.row}: {err.field} - {err.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeImportModal}>
              {importResult ? tCommon('close') : tCommon('cancel')}
            </Button>
            {!importResult && (
              <Button onClick={handleImport} disabled={importing || !importFile}>
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tCommon('import')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
