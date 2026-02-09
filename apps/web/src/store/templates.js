'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTemplatesStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
exports.useTemplatesStore = (0, zustand_1.create)()((0, middleware_1.persist)((set, get) => ({
    templates: [],
    favorites: [],
    // Template actions
    addTemplate: (template) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newTemplate = {
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
            templates: state.templates.map((t) => t.id === id
                ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                : t),
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
                templates: state.templates.map((t) => t.id === id
                    ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date().toISOString() }
                    : t),
            }));
        }
        return template;
    },
    // Favorite actions
    addFavorite: (item) => {
        const id = generateId();
        const newFavorite = {
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
            favorites: state.favorites.map((f) => f.id === id ? { ...f, ...updates } : f),
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
                favorites: state.favorites.map((f) => f.id === id
                    ? { ...f, usageCount: f.usageCount + 1, lastUsed: new Date().toISOString() }
                    : f),
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
}), {
    name: 'facturador-templates',
}));
