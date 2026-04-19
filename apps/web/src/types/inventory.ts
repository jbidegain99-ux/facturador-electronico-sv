export type StockStatus = 'OK' | 'BELOW_REORDER' | 'OUT_OF_STOCK';

export interface InventoryItem {
  catalogItemId: string;
  code: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  currentQty: number;
  currentAvgCost: number;
  totalValue: number;
  reorderLevel: number | null;
  lastMovementAt: string | null;
  status: StockStatus;
}

export type InventoryItemDetail = InventoryItem;

export interface KardexRow {
  id: string;
  movementDate: string;
  correlativo: number;
  movementType: string;
  qtyIn: number;
  qtyOut: number;
  unitCost: number;
  totalCost: number;
  balanceQty: number;
  balanceAvgCost: number;
  balanceValue: number;
  documentType: string | null;
  documentNumber: string | null;
  notes: string | null;
}

export interface InventoryAlerts {
  belowReorderCount: number;
  outOfStockCount: number;
}

export interface TopBelowReorderItem {
  catalogItemId: string;
  code: string;
  description: string | null;
  currentQty: number;
  reorderLevel: number | null;
  status: StockStatus;
}

export interface InventoryListResponse {
  data: InventoryItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export const ADJUSTMENT_SUBTYPES = [
  'ROBO', 'MERMA', 'DONACION', 'AUTOCONSUMO', 'AJUSTE_FALTANTE', 'AJUSTE_SOBRANTE',
] as const;
export type AdjustmentSubtype = (typeof ADJUSTMENT_SUBTYPES)[number];

export const ADJUSTMENT_SUBTYPE_LABELS: Record<AdjustmentSubtype, string> = {
  ROBO: 'Robo',
  MERMA: 'Merma',
  DONACION: 'Donación',
  AUTOCONSUMO: 'Autoconsumo',
  AJUSTE_FALTANTE: 'Ajuste faltante',
  AJUSTE_SOBRANTE: 'Ajuste sobrante',
};

export interface CreateAdjustmentInput {
  catalogItemId: string;
  subtype: AdjustmentSubtype;
  quantity: number;
  unitCost?: number;
  movementDate: string;
  notes?: string;
}

export interface InventoryAdjustment {
  id: string;
  correlativo: number;
  movementType: string;
  movementDate: string;
  qtyIn: number; qtyOut: number;
  unitCost: number; totalCost: number;
  balanceQty: number; balanceAvgCost: number; balanceValue: number;
  journalEntryId: string | null;
  notes: string | null;
}
