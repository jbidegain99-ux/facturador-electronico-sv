import { create } from 'zustand';
import { db } from '@/lib/db';
import type { SyncQueueItem, SyncOpType } from '@/lib/db-types';

interface SyncQueueState {
  items: SyncQueueItem[];
  isSyncing: boolean;

  addOp: (type: SyncOpType, payload: Record<string, unknown>) => Promise<void>;
  removeOp: (id: number) => Promise<void>;
  markFailed: (id: number, reason: string) => Promise<void>;
  markSyncing: (id: number) => Promise<void>;
  loadFromDexie: () => Promise<void>;

  pendingCount: () => number;
  failedCount: () => number;
}

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  items: [],
  isSyncing: false,

  addOp: async (type, payload) => {
    const item: SyncQueueItem = {
      type,
      payload: JSON.stringify(payload),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const id = await db.syncQueue.add(item);
    item.id = id;
    set((state) => ({ items: [...state.items, item] }));
  },

  removeOp: async (id) => {
    await db.syncQueue.delete(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  markFailed: async (id, reason) => {
    await db.syncQueue.update(id, { status: 'failed', failReason: reason });
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, status: 'failed' as const, failReason: reason } : i
      ),
    }));
  },

  markSyncing: async (id) => {
    await db.syncQueue.update(id, { status: 'syncing' });
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, status: 'syncing' as const } : i
      ),
    }));
  },

  loadFromDexie: async () => {
    const items = await db.syncQueue.toArray();
    set({ items });
  },

  pendingCount: () => get().items.filter((i) => i.status === 'pending').length,
  failedCount: () => get().items.filter((i) => i.status === 'failed').length,
}));
