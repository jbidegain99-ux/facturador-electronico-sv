/** Offline-first database types — derived from Prisma models but subset for offline use */

export interface OfflineInvoice {
  localId?: number;
  serverId?: string;
  tenantId: string;
  codigoGeneracion: string;
  numeroControl?: string;
  tipoDte: string;
  estado: string;
  selloRecepcion?: string;
  totalGravada?: number;
  totalIva?: number;
  totalPagar: number;
  receptorNombre?: string;
  receptorDocumento?: string;
  jsonOriginal?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OfflineCustomer {
  localId?: number;
  serverId?: string;
  tenantId: string;
  tipoDocumento: string;
  numDocumento: string;
  nombre: string;
  nrc?: string;
  correo?: string;
  telefono?: string;
  direccion: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfflineCatalogItem {
  localId?: number;
  serverId?: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  basePrice: number;
  uniMedida: number;
  taxRate: number;
  isActive: boolean;
  updatedAt: string;
}

export type SyncOpType =
  | 'CREATE_INVOICE'
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'APPROVE_QUOTE'
  | 'REJECT_QUOTE';

export type SyncOpStatus = 'pending' | 'syncing' | 'failed';

export interface SyncQueueItem {
  id?: number;
  type: SyncOpType;
  payload: string;
  status: SyncOpStatus;
  failReason?: string;
  createdAt: string;
}

export interface AppCacheEntry {
  key: string;
  value: string;
}
