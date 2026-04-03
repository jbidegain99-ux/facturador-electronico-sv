import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { useSyncQueueStore } from '@/store/sync-queue';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocking
const { processSyncQueue } = await import('@/lib/sync-engine');

describe('SyncEngine', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    useSyncQueueStore.setState({ items: [], isSyncing: false });
    await db.delete();
    await db.open();
  });

  it('should process pending operations in FIFO order', async () => {
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', { order: 1 });
    await useSyncQueueStore.getState().addOp('CREATE_CUSTOMER', { order: 2 });

    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'server_1' }) });

    await processSyncQueue('http://localhost:3001/api/v1');

    expect(useSyncQueueStore.getState().items).toHaveLength(0);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const firstCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(firstCallBody.order).toBe(1);
  });

  it('should mark operation as failed on API error', async () => {
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', { test: true });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    await processSyncQueue('http://localhost:3001/api/v1');

    const state = useSyncQueueStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].status).toBe('failed');
    expect(state.items[0].failReason).toContain('Internal server error');
  });

  it('should skip already-failed operations', async () => {
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', {});
    const items = useSyncQueueStore.getState().items;
    await useSyncQueueStore.getState().markFailed(items[0].id!, 'Previous error');

    await processSyncQueue('http://localhost:3001/api/v1');

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not run if already syncing', async () => {
    useSyncQueueStore.setState({ isSyncing: true });
    await useSyncQueueStore.getState().addOp('CREATE_INVOICE', {});

    await processSyncQueue('http://localhost:3001/api/v1');

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
