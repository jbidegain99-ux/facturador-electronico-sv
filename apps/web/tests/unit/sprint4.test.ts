import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db, OfflineDB } from '@/lib/db';
import { useSyncQueueStore } from '@/store/sync-queue';

describe('Sprint 4 - Hardening Tests', () => {
  beforeEach(async () => {
    useSyncQueueStore.setState({ items: [], isSyncing: false });
    await db.delete();
    await db.open();
  });

  describe('Dexie Schema', () => {
    it('should support version 1 schema with all 5 tables', () => {
      const tableNames = db.tables.map(t => t.name).sort();
      expect(tableNames).toEqual(['appCache', 'catalogItems', 'customers', 'invoices', 'syncQueue']);
    });

    it('should handle bulk insert of 100+ invoices without error', async () => {
      const invoices = Array.from({ length: 150 }, (_, i) => ({
        serverId: `dte_${i}`,
        tenantId: 'tenant_1',
        codigoGeneracion: `CG${i}`,
        tipoDte: '01',
        estado: i % 3 === 0 ? 'PROCESADO' : 'PENDIENTE',
        totalPagar: Math.round(Math.random() * 10000) / 100,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }));
      await db.invoices.bulkAdd(invoices);

      const count = await db.invoices.count();
      expect(count).toBe(150);

      // Compound index query should be fast
      const procesados = await db.invoices
        .where('[tenantId+estado]')
        .equals(['tenant_1', 'PROCESADO'])
        .toArray();
      expect(procesados.length).toBe(50);
    });
  });

  describe('Sync Queue Edge Cases', () => {
    it('should maintain FIFO order with rapid additions', async () => {
      const { addOp } = useSyncQueueStore.getState();
      await addOp('CREATE_INVOICE', { order: 1 });
      await addOp('CREATE_CUSTOMER', { order: 2 });
      await addOp('CREATE_INVOICE', { order: 3 });
      await addOp('APPROVE_QUOTE', { order: 4 });

      const items = useSyncQueueStore.getState().items;
      expect(items).toHaveLength(4);

      // Verify FIFO order by createdAt
      for (let i = 1; i < items.length; i++) {
        expect(new Date(items[i].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(items[i-1].createdAt).getTime());
      }
    });

    it('should correctly count pending vs failed items', async () => {
      const { addOp, markFailed } = useSyncQueueStore.getState();
      await addOp('CREATE_INVOICE', {});
      await addOp('CREATE_CUSTOMER', {});
      await addOp('APPROVE_QUOTE', {});

      const items = useSyncQueueStore.getState().items;
      await markFailed(items[0].id!, 'Network error');
      await markFailed(items[1].id!, 'Timeout');

      const state = useSyncQueueStore.getState();
      expect(state.pendingCount()).toBe(1);
      expect(state.failedCount()).toBe(2);
    });

    it('should persist to Dexie and reload correctly', async () => {
      const { addOp, loadFromDexie } = useSyncQueueStore.getState();
      await addOp('CREATE_INVOICE', { test: 'data' });
      await addOp('CREATE_CUSTOMER', { name: 'Test' });

      // Reset in-memory state
      useSyncQueueStore.setState({ items: [] });
      expect(useSyncQueueStore.getState().items).toHaveLength(0);

      // Reload from Dexie
      await useSyncQueueStore.getState().loadFromDexie();
      expect(useSyncQueueStore.getState().items).toHaveLength(2);
    });
  });

  describe('IVA Calculations', () => {
    it('should round IVA to 2 decimal places', () => {
      const IVA_RATE = 0.13;
      const subtotal = 100.50;
      const iva = Math.round(subtotal * IVA_RATE * 100) / 100;
      expect(iva).toBe(13.07); // 100.50 * 0.13 = 13.065 → 13.07
    });

    it('should calculate correct total for multi-item invoice', () => {
      const items = [
        { cantidad: 2, precioUnitario: 25.50, descuento: 0 },
        { cantidad: 1, precioUnitario: 100.00, descuento: 5.00 },
        { cantidad: 3, precioUnitario: 10.33, descuento: 0 },
      ];

      const IVA_RATE = 0.13;
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.cantidad * item.precioUnitario - item.descuento;
      }
      subtotal = Math.round(subtotal * 100) / 100;
      const iva = Math.round(subtotal * IVA_RATE * 100) / 100;
      const total = Math.round((subtotal + iva) * 100) / 100;

      expect(subtotal).toBe(176.99); // 51 + 95 + 30.99
      expect(iva).toBe(23.01);
      expect(total).toBe(200);
    });
  });

  describe('Offline Data Integrity', () => {
    it('should not lose data when adding invoice with all optional fields null', async () => {
      const invoice = {
        tenantId: 't1',
        codigoGeneracion: 'CG_MINIMAL',
        tipoDte: '01',
        estado: 'OFFLINE_PENDING',
        totalPagar: 0,
        createdAt: new Date().toISOString(),
      };
      const id = await db.invoices.add(invoice);
      const retrieved = await db.invoices.get(id);
      expect(retrieved?.codigoGeneracion).toBe('CG_MINIMAL');
      expect(retrieved?.receptorNombre).toBeUndefined();
      expect(retrieved?.selloRecepcion).toBeUndefined();
    });

    it('should handle customer with JSON direccion string', async () => {
      const direccion = { departamento: '06', municipio: '14', complemento: 'San Salvador Centro' };
      await db.customers.add({
        serverId: 'c1',
        tenantId: 't1',
        tipoDocumento: '36',
        numDocumento: '06141804941014',
        nombre: 'Test Corp',
        direccion: JSON.stringify(direccion),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const customer = await db.customers.where('serverId').equals('c1').first();
      expect(customer).toBeDefined();
      const parsed = JSON.parse(customer!.direccion);
      expect(parsed.departamento).toBe('06');
      expect(parsed.complemento).toBe('San Salvador Centro');
    });
  });
});
