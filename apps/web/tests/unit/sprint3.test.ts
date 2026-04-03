import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';

describe('Sprint 3 - Dashboard & Quotes Offline', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should cache dashboard stats in Dexie', async () => {
    const stats = { dtesMes: 42, totalFacturado: 15000.50, clientes: 10, catalogItems: 25 };
    await db.appCache.put({ key: 'dashboard-stats', value: JSON.stringify(stats) });

    const cached = await db.appCache.get('dashboard-stats');
    expect(cached).toBeDefined();
    const parsed = JSON.parse(cached!.value);
    expect(parsed.dtesMes).toBe(42);
    expect(parsed.totalFacturado).toBe(15000.50);
  });

  it('should cache permissions in Dexie', async () => {
    const permissions = ['invoices.create', 'invoices.read', 'quotes.approve', 'quotes.reject'];
    await db.appCache.put({ key: 'permissions-user123', value: JSON.stringify(permissions) });

    const cached = await db.appCache.get('permissions-user123');
    expect(cached).toBeDefined();
    const parsed = JSON.parse(cached!.value);
    expect(parsed).toContain('quotes.approve');
    expect(parsed).toHaveLength(4);
  });

  it('should queue quote approval offline', async () => {
    // Simulate offline quote approval via sync queue
    const { useSyncQueueStore } = await import('@/store/sync-queue');
    useSyncQueueStore.setState({ items: [] });

    await useSyncQueueStore.getState().addOp('APPROVE_QUOTE', {
      quoteId: 'quote_123',
      signature: 'data:image/png;base64,...',
    });

    expect(useSyncQueueStore.getState().pendingCount()).toBe(1);
    const items = useSyncQueueStore.getState().items;
    expect(items[0].type).toBe('APPROVE_QUOTE');
  });

  it('should queue quote rejection offline', async () => {
    const { useSyncQueueStore } = await import('@/store/sync-queue');
    useSyncQueueStore.setState({ items: [] });

    await useSyncQueueStore.getState().addOp('REJECT_QUOTE', {
      quoteId: 'quote_456',
      reason: 'Price too high',
    });

    expect(useSyncQueueStore.getState().pendingCount()).toBe(1);
    const items = useSyncQueueStore.getState().items;
    expect(items[0].type).toBe('REJECT_QUOTE');
  });
});
