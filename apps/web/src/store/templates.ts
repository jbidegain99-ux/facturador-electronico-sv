'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ItemFactura, Cliente } from '@/types';

// Template types
export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  tipoDte: '01' | '03';
  cliente?: Partial<Cliente>;
  items: Omit<ItemFactura, 'id'>[];
  condicionPago: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface FavoriteItem {
  id: string;
  codigo?: string;
  descripcion: string;
  precioUnitario: number;
  esGravado: boolean;
  usageCount: number;
  lastUsed: string;
}

interface TemplatesState {
  templates: InvoiceTemplate[];
  favorites: FavoriteItem[];

  // Template actions
  addTemplate: (template: Omit<InvoiceTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => string;
  updateTemplate: (id: string, updates: Partial<InvoiceTemplate>) => void;
  deleteTemplate: (id: string) => void;
  useTemplate: (id: string) => InvoiceTemplate | undefined;

  // Favorite actions
  addFavorite: (item: Omit<FavoriteItem, 'id' | 'usageCount' | 'lastUsed'>) => string;
  updateFavorite: (id: string, updates: Partial<FavoriteItem>) => void;
  deleteFavorite: (id: string) => void;
  useFavorite: (id: string) => FavoriteItem | undefined;

  // Utility
  getTopTemplates: (limit?: number) => InvoiceTemplate[];
  getTopFavorites: (limit?: number) => FavoriteItem[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useTemplatesStore = create<TemplatesState>()(
  persist(
    (set, get) => ({
      templates: [],
      favorites: [],

      // Template actions
      addTemplate: (template) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newTemplate: InvoiceTemplate = {
          ...template,
          id,
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));

        return id;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      useTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        if (template) {
          set((state) => ({
            templates: state.templates.map((t) =>
              t.id === id
                ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date().toISOString() }
                : t
            ),
          }));
        }
        return template;
      },

      // Favorite actions
      addFavorite: (item) => {
        const id = generateId();
        const newFavorite: FavoriteItem = {
          ...item,
          id,
          usageCount: 0,
          lastUsed: new Date().toISOString(),
        };

        set((state) => ({
          favorites: [...state.favorites, newFavorite],
        }));

        return id;
      },

      updateFavorite: (id, updates) => {
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },

      useFavorite: (id) => {
        const favorite = get().favorites.find((f) => f.id === id);
        if (favorite) {
          set((state) => ({
            favorites: state.favorites.map((f) =>
              f.id === id
                ? { ...f, usageCount: f.usageCount + 1, lastUsed: new Date().toISOString() }
                : f
            ),
          }));
        }
        return favorite;
      },

      // Utility
      getTopTemplates: (limit = 5) => {
        return [...get().templates]
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      },

      getTopFavorites: (limit = 10) => {
        return [...get().favorites]
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      },
    }),
    {
      name: 'facturador-templates',
    }
  )
);
