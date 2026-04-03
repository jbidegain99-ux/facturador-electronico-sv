import { describe, it, expect, beforeEach } from 'vitest';
import { useSyncQueueStore } from '@/store/sync-queue';
import { db } from '@/lib/db';

describe('SyncQueueStore', () => {
  beforeEach(async () => {
    useSyncQueueStore.setState({ items: [] });
    await db.delete();
    await db.open();
  });

  it('should start with empty queue', () => {
    const state = useSyncQueueStore.getState();
    expect(state.items).toEqual([]);
    expect(state.pendingCount()).toBe(0);
  });

  it('should add an operation to the queue', async () => {
    const { addOp } = useSyncQueueStore.getState();
    await addOp('CREATE_INVOICE', { tipoDte: '01', receptor: 'Test' });

    const state = useSyncQueueStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].type).toBe('CREATE_INVOICE');
    expect(state.items[0].status).toBe('pending');

    const dexieItems = await db.syncQueue.toArray();
    expect(dexieItems).toHaveLength(1);
  });

  it('should remove an operation after sync', async () => {
    const { addOp, removeOp } = useSyncQueueStore.getState();
    await addOp('CREATE_INVOICE', { tipoDte: '01' });
    const items = useSyncQueueStore.getState().items;
    await removeOp(items[0].id!);

    expect(useSyncQueueStore.getState().items).toHaveLength(0);
    expect(await db.syncQueue.count()).toBe(0);
  });

  it('should mark an operation as failed', async () => {
    const { addOp, markFailed } = useSyncQueueStore.getState();
    await addOp('CREATE_CUSTOMER', { nombre: 'Test' });
    const items = useSyncQueueStore.getState().items;
    await markFailed(items[0].id!, 'Network error');

    const state = useSyncQueueStore.getState();
    expect(state.items[0].status).toBe('failed');
    expect(state.items[0].failReason).toBe('Network error');
  });

  it('should count only pending items', async () => {
    const { addOp, markFailed } = useSyncQueueStore.getState();
    await addOp('CREATE_INVOICE', {});
    await addOp('CREATE_CUSTOMER', {});
    const items = useSyncQueueStore.getState().items;
    await markFailed(items[0].id!, 'Error');

    expect(useSyncQueueStore.getState().pendingCount()).toBe(1);
  });
});
