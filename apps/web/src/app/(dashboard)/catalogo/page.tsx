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
} from 'lucide-react';
import { SkeletonTable } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { Pagination } from '@/components/ui/pagination';
import { PageSizeSelector } from '@/components/ui/page-size-selector';

// ─── Types ─────────────────────────────────────────────────

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
  createdAt: string;
}

interface CatalogResponse {
  data: CatalogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  PRODUCT: 'bg-blue-100 text-blue-800',
  SERVICE: 'bg-purple-100 text-purple-800',
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

// ─── Component ─────────────────────────────────────────────

export default function CatalogoPage() {
  const toast = useToast();
  const toastRef = React.useRef(toast);
  toastRef.current = toast;

  // Data state
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Filter state
  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState('');
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

  // Units of measure (loaded once)
  const [units, setUnits] = React.useState<UnidadMedida[]>([]);

  // ─── Load units of measure ──────────────────────────────

  React.useEffect(() => {
    const loadUnits = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/catalogs/unidades-medida`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const data = await res.json().catch(() => []);
          if (Array.isArray(data)) setUnits(data);
        }
      } catch {
        // Non-critical, units dropdown will just be empty
      }
    };
    loadUnits();
  }, []);

  // ─── Fetch items ────────────────────────────────────────

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);

      if (tab === 'FAVORITES') {
        params.set('isFavorite', 'true');
      } else if (tab) {
        params.set('type', tab);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) {
        if (res.status === 404) {
          setFetchError('El servicio de catalogo no esta disponible aun.');
          return;
        }
        throw new Error(`Error al cargar catalogo (${res.status})`);
      }

      const data: CatalogResponse = await res.json().catch(() => ({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }));
      const list = Array.isArray(data?.data) ? data.data : [];
      setItems(list);
      const parsedTotal = Number(data?.total);
      const parsedPages = Number(data?.totalPages);
      setTotal(!isNaN(parsedTotal) ? parsedTotal : list.length);
      setTotalPages(!isNaN(parsedPages) && parsedPages >= 1 ? parsedPages : 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar catalogo';
      setFetchError(message);
      toastRef.current.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, tab, sortBy, sortOrder]);

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
    // Validate all fields
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
      const token = localStorage.getItem('token');
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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.message || `Error al ${isEdit ? 'actualizar' : 'crear'} item`,
        );
      }

      toast.success(
        isEdit ? 'Item actualizado correctamente' : 'Item creado correctamente',
      );
      closeModal();
      fetchItems();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al guardar item',
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
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/${deleteConfirm.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al eliminar item');
      }
      toast.success('Item eliminado correctamente');
      setDeleteConfirm(null);
      fetchItems();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al eliminar item',
      );
    } finally {
      setDeleting(false);
    }
  };

  // ─── Toggle favorite ───────────────────────────────────

  const handleToggleFavorite = async (item: CatalogItem) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/catalog-items/${item.id}/favorite`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error('Error al actualizar favorito');
      // Update locally without refetching
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i,
        ),
      );
    } catch {
      toastRef.current.error('Error al actualizar favorito');
    }
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Catalogo
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus productos y servicios
          </p>
        </div>
        {!fetchError && (
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Item
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Search + PageSize */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o codigo..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 w-64"
              />
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
                Reintentar
              </Button>
            </div>
          ) : !items || items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No se encontraron items</p>
              <Button variant="outline" className="mt-4" onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer item
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
                        Codigo {getSortIcon('code')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Nombre {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center">
                        Tipo {getSortIcon('type')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('basePrice')}
                    >
                      <div className="flex items-center">
                        Precio {getSortIcon('basePrice')}
                      </div>
                    </TableHead>
                    <TableHead>Impuesto</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('usageCount')}
                    >
                      <div className="flex items-center">
                        Usos {getSortIcon('usageCount')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <button
                          onClick={() => handleToggleFavorite(item)}
                          className="hover:scale-110 transition-transform"
                          title={item.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(item.basePrice)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {TRIBUTO_OPTIONS.find((t) => t.value === item.tributo)?.label || 'IVA 13%'}
                      </TableCell>
                      <TableCell className="text-center">{item.usageCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(item)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteConfirm(item)}
                            title="Eliminar"
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
              {editingItem ? 'Editar Item' : 'Nuevo Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Modifica los datos del item de catalogo'
                : 'Agrega un nuevo producto o servicio al catalogo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type radio */}
            <div className="space-y-1">
              <Label>Tipo *</Label>
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
                  <span className="text-sm">Producto</span>
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
                  <span className="text-sm">Servicio</span>
                </label>
              </div>
            </div>

            {/* Code + Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Codigo *</Label>
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
                <Label>Nombre *</Label>
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

            {/* Description */}
            <div className="space-y-1">
              <Label>Descripcion</Label>
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
                <Label>Precio Base *</Label>
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
                <Label>Precio Costo</Label>
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
                <Label>Unidad de Medida</Label>
                <Select
                  value={formData.uniMedida}
                  onValueChange={(v) => handleFormChange('uniMedida', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad" />
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
                <Label>Perfil Fiscal</Label>
                <Select
                  value={formData.tributo}
                  onValueChange={handleTributoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar impuesto" />
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
              <Label>Tipo Item MH (CAT-011)</Label>
              <Select
                value={formData.tipoItem}
                onValueChange={(v) => handleFormChange('tipoItem', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
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
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isFormValid(formData)}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? 'Guardar Cambios' : 'Crear Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ───────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Item</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de eliminar <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.code})?
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
