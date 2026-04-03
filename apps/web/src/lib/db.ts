import Dexie, { type EntityTable } from 'dexie';
import type {
  OfflineInvoice,
  OfflineCustomer,
  OfflineCatalogItem,
  SyncQueueItem,
  AppCacheEntry,
} from './db-types';

export class OfflineDB extends Dexie {
  invoices!: EntityTable<OfflineInvoice, 'localId'>;
  customers!: EntityTable<OfflineCustomer, 'localId'>;
  catalogItems!: EntityTable<OfflineCatalogItem, 'localId'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  appCache!: EntityTable<AppCacheEntry, 'key'>;

  constructor() {
    super('FacturoDB');

    this.version(1).stores({
      invoices: '++localId, serverId, tenantId, codigoGeneracion, estado, tipoDte, createdAt, [tenantId+estado], [tenantId+createdAt]',
      customers: '++localId, serverId, tenantId, numDocumento, nombre, [tenantId+nombre], [tenantId+numDocumento]',
      catalogItems: '++localId, serverId, tenantId, code, name, [tenantId+name]',
      syncQueue: '++id, type, status, createdAt',
      appCache: 'key',
    });
  }
}

export const db = new OfflineDB();
