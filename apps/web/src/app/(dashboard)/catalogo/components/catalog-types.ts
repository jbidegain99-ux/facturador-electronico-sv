// ─── Types ─────────────────────────────────────────────────

export interface CatalogCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  _count?: { items: number };
}

export interface CatalogItem {
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

export interface CatalogResponse {
  data: CatalogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlanLimitInfo {
  current: number;
  max: number;
  planCode: string;
}

export interface UnidadMedida {
  codigo: number;
  descripcion: string;
}

export interface ItemForm {
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

export interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  errors: ImportRowError[];
}

export const EMPTY_FORM: ItemForm = {
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

export const TABS = [
  { key: '', label: 'Todos' },
  { key: 'PRODUCT', label: 'Productos' },
  { key: 'SERVICE', label: 'Servicios' },
  { key: 'FAVORITES', label: 'Favoritos' },
];

export const TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
};

export const TYPE_COLORS: Record<string, string> = {
  PRODUCT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  SERVICE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

export const TRIBUTO_OPTIONS = [
  { value: '20', label: 'IVA 13%', rate: '13.00' },
  { value: '10', label: 'Exento', rate: '0.00' },
  { value: '30', label: 'No Sujeto', rate: '0.00' },
];

export const TIPO_ITEM_OPTIONS = [
  { value: '1', label: '1 - Bienes' },
  { value: '2', label: '2 - Servicios' },
  { value: '3', label: '3 - Ambos' },
];

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export const CSV_TEMPLATE = 'code,name,description,type,basePrice,costPrice,taxRate,tipoItem,uniMedida,tributo\nPRD-001,Producto Ejemplo,Descripcion,PRODUCT,10.00,,13.00,1,99,20\nSRV-001,Servicio Ejemplo,,SERVICE,25.00,,13.00,2,59,20';

// ─── Validation ────────────────────────────────────────────

export function validateField(field: string, value: string): string {
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

export function isFormValid(form: ItemForm): boolean {
  if (!form.code.trim()) return false;
  if (!form.name.trim() || form.name.trim().length < 2) return false;
  if (!form.basePrice.trim() || isNaN(Number(form.basePrice)) || Number(form.basePrice) < 0) return false;
  if (form.costPrice.trim() && (isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)) return false;
  return true;
}

// ─── CSV Parser (RFC 4180 compliant) ──────────────────────

export function parseCSV(text: string, separator: string = ','): string[][] {
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

export function formatPrice(price: string | number): string {
  const num = Number(price);
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}
