import { db } from './db';
import { apiFetch } from './api';
import type { OfflineInvoice, OfflineCustomer, OfflineCatalogItem } from './db-types';

interface SyncApiResponse {
  invoices: Array<{
    id: string;
    tipoDte: string;
    codigoGeneracion: string;
    numeroControl: string;
    estado: string;
    selloRecepcion?: string;
    totalGravada: number;
    totalIva: number;
    totalPagar: number;
    receptorNombre?: string;
    receptorDocumento?: string;
    createdAt: string;
  }>;
  customers: Array<{
    id: string;
    tipoDocumento: string;
    numDocumento: string;
    nombre: string;
    nrc?: string;
    correo?: string;
    telefono?: string;
    direccion: string;
    createdAt: string;
    updatedAt: string;
  }>;
  catalogItems: Array<{
    id: string;
    code: string;
    name: string;
    description?: string;
    type: string;
    basePrice: number;
    uniMedida: number;
    taxRate: number;
    isActive: boolean;
  }>;
  syncTimestamp: string;
}

export async function syncFromServer(
  tenantId: string,
  onProgress?: (percent: number, message: string) => void,
): Promise<void> {
  const lastSync = await db.appCache.get('lastSyncTimestamp');
  const sinceParam = lastSync?.value ? `?since=${encodeURIComponent(lastSync.value)}` : '';
  const isInitial = !lastSync?.value;

  onProgress?.(10, isInitial ? 'Descargando datos para uso offline...' : 'Sincronizando cambios...');

  const data = await apiFetch<SyncApiResponse>(`/sync${sinceParam}`);

  onProgress?.(30, `Guardando ${data.invoices.length} facturas...`);
  if (data.invoices.length > 0) {
    const offlineInvoices: OfflineInvoice[] = data.invoices.map((inv) => ({
      serverId: inv.id,
      tenantId,
      codigoGeneracion: inv.codigoGeneracion,
      numeroControl: inv.numeroControl,
      tipoDte: inv.tipoDte,
      estado: inv.estado,
      selloRecepcion: inv.selloRecepcion,
      totalGravada: inv.totalGravada,
      totalIva: inv.totalIva,
      totalPagar: inv.totalPagar,
      receptorNombre: inv.receptorNombre,
      receptorDocumento: inv.receptorDocumento,
      createdAt: inv.createdAt,
    }));

    if (isInitial) {
      await db.invoices.bulkPut(offlineInvoices);
    } else {
      for (const inv of offlineInvoices) {
        const existing = await db.invoices.where('serverId').equals(inv.serverId!).first();
        if (existing) {
          await db.invoices.update(existing.localId!, inv);
        } else {
          await db.invoices.add(inv);
        }
      }
    }
  }

  onProgress?.(60, `Guardando ${data.customers.length} clientes...`);
  if (data.customers.length > 0) {
    const offlineCustomers: OfflineCustomer[] = data.customers.map((c) => ({
      serverId: c.id,
      tenantId,
      tipoDocumento: c.tipoDocumento,
      numDocumento: c.numDocumento,
      nombre: c.nombre,
      nrc: c.nrc,
      correo: c.correo,
      telefono: c.telefono,
      direccion: c.direccion,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    if (isInitial) {
      await db.customers.bulkPut(offlineCustomers);
    } else {
      for (const cust of offlineCustomers) {
        const existing = await db.customers.where('serverId').equals(cust.serverId!).first();
        if (existing) {
          await db.customers.update(existing.localId!, cust);
        } else {
          await db.customers.add(cust);
        }
      }
    }
  }

  onProgress?.(80, `Guardando ${data.catalogItems.length} productos...`);
  if (data.catalogItems.length > 0) {
    const offlineCatalog: OfflineCatalogItem[] = data.catalogItems.map((item) => ({
      serverId: item.id,
      tenantId,
      code: item.code,
      name: item.name,
      description: item.description,
      type: item.type,
      basePrice: item.basePrice,
      uniMedida: item.uniMedida,
      taxRate: item.taxRate,
      isActive: item.isActive,
      updatedAt: new Date().toISOString(),
    }));

    await db.catalogItems.where('tenantId').equals(tenantId).delete();
    await db.catalogItems.bulkAdd(offlineCatalog);
  }

  await db.appCache.put({ key: 'lastSyncTimestamp', value: data.syncTimestamp });
  onProgress?.(100, 'Sincronización completa');
}
