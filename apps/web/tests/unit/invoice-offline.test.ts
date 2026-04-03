import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { useSyncQueueStore } from '@/store/sync-queue';

describe('Offline Invoice Submit', () => {
  beforeEach(async () => {
    useSyncQueueStore.setState({ items: [] });
    await db.delete();
    await db.open();
  });

  it('should save offline invoice to Dexie and sync queue', async () => {
    const tenantId = 'tenant_1';
    const payload = {
      tipoDte: '01',
      codigoGeneracion: `offline_${Date.now()}`,
      receptor: { nombre: 'Test Client', numDocumento: '06141804941014' },
      items: [{ descripcion: 'Test', cantidad: 1, precioUnitario: 10, iva: 1.30, total: 11.30 }],
    };

    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', payload);

    await db.invoices.add({
      tenantId,
      codigoGeneracion: payload.codigoGeneracion,
      tipoDte: '01',
      estado: 'OFFLINE_PENDING',
      totalPagar: 11.30,
      receptorNombre: 'Test Client',
      receptorDocumento: '06141804941014',
      jsonOriginal: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
    });

    expect(useSyncQueueStore.getState().pendingCount()).toBe(1);
    const invoices = await db.invoices.where('tenantId').equals(tenantId).toArray();
    expect(invoices).toHaveLength(1);
    expect(invoices[0].estado).toBe('OFFLINE_PENDING');
  });

  it('should auto-save draft to Dexie appCache', async () => {
    const draft = { tipoDte: '01', items: [], cliente: null };
    await db.appCache.put({
      key: 'factura-draft-tenant_1',
      value: JSON.stringify(draft),
    });
    const saved = await db.appCache.get('factura-draft-tenant_1');
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!.value).tipoDte).toBe('01');
  });

  it('should search customers offline via Dexie', async () => {
    await db.customers.bulkAdd([
      { serverId: 'c1', tenantId: 't1', nombre: 'Farmacia ABC', tipoDocumento: '36', numDocumento: '123', direccion: '{}', createdAt: '', updatedAt: '' },
      { serverId: 'c2', tenantId: 't1', nombre: 'Ferreteria XYZ', tipoDocumento: '36', numDocumento: '456', direccion: '{}', createdAt: '', updatedAt: '' },
      { serverId: 'c3', tenantId: 't2', nombre: 'Farmacia Other', tipoDocumento: '36', numDocumento: '789', direccion: '{}', createdAt: '', updatedAt: '' },
    ]);

    const results = await db.customers
      .where('tenantId')
      .equals('t1')
      .filter(c => c.nombre.toLowerCase().includes('farmacia'))
      .limit(10)
      .toArray();

    expect(results).toHaveLength(1);
    expect(results[0].nombre).toBe('Farmacia ABC');
  });

  it('should search catalog items offline via Dexie', async () => {
    await db.catalogItems.bulkAdd([
      { serverId: 'i1', tenantId: 't1', code: 'P001', name: 'Paracetamol', type: 'PRODUCT', basePrice: 5, uniMedida: 59, taxRate: 13, isActive: true, updatedAt: '' },
      { serverId: 'i2', tenantId: 't1', code: 'P002', name: 'Amoxicilina', type: 'PRODUCT', basePrice: 8, uniMedida: 59, taxRate: 13, isActive: true, updatedAt: '' },
    ]);

    const results = await db.catalogItems
      .where('tenantId')
      .equals('t1')
      .filter(item => item.name.toLowerCase().includes('para'))
      .limit(10)
      .toArray();

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Paracetamol');
  });
});
