import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';

describe('OfflineDB', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should have 5 tables defined', () => {
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'appCache',
      'catalogItems',
      'customers',
      'invoices',
      'syncQueue',
    ]);
  });

  it('should store and retrieve a customer', async () => {
    const customer = {
      serverId: 'cust_123',
      tenantId: 'tenant_1',
      nombre: 'Test Customer',
      tipoDocumento: '36',
      numDocumento: '06141804941014',
      direccion: JSON.stringify({ departamento: '06', municipio: '14', complemento: 'San Salvador' }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const localId = await db.customers.add(customer);
    const retrieved = await db.customers.get(localId);
    expect(retrieved?.nombre).toBe('Test Customer');
    expect(retrieved?.serverId).toBe('cust_123');
  });

  it('should query invoices by tenantId + estado compound index', async () => {
    await db.invoices.bulkAdd([
      { serverId: 'dte_1', tenantId: 't1', codigoGeneracion: 'CG1', estado: 'PROCESADO', tipoDte: '01', totalPagar: 100, createdAt: new Date().toISOString() },
      { serverId: 'dte_2', tenantId: 't1', codigoGeneracion: 'CG2', estado: 'PENDIENTE', tipoDte: '01', totalPagar: 200, createdAt: new Date().toISOString() },
      { serverId: 'dte_3', tenantId: 't2', codigoGeneracion: 'CG3', estado: 'PROCESADO', tipoDte: '01', totalPagar: 300, createdAt: new Date().toISOString() },
    ]);
    const results = await db.invoices.where('[tenantId+estado]').equals(['t1', 'PROCESADO']).toArray();
    expect(results).toHaveLength(1);
    expect(results[0].codigoGeneracion).toBe('CG1');
  });

  it('should store and retrieve sync queue operations', async () => {
    const op = {
      type: 'CREATE_INVOICE' as const,
      payload: JSON.stringify({ tipoDte: '01', items: [] }),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    const id = await db.syncQueue.add(op);
    const pending = await db.syncQueue.where('status').equals('pending').toArray();
    expect(pending).toHaveLength(1);
    expect(pending[0].type).toBe('CREATE_INVOICE');
  });

  it('should use appCache as key-value store', async () => {
    await db.appCache.put({ key: 'lastSyncTimestamp', value: '2026-04-07T10:00:00Z' });
    const result = await db.appCache.get('lastSyncTimestamp');
    expect(result?.value).toBe('2026-04-07T10:00:00Z');
  });
});
