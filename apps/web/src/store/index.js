"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFacturaWizardStore = exports.useAppStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useAppStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    // User & Tenant
    user: null,
    tenant: null,
    setUser: (user) => set({ user }),
    setTenant: (tenant) => set({ tenant }),
    // Theme
    theme: 'dark',
    setTheme: (theme) => set({ theme }),
    // Sidebar
    sidebarOpen: true,
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    // MH Credentials
    mhCredentials: null,
    setMhCredentials: (mhCredentials) => set({ mhCredentials }),
}), {
    name: 'facturador-storage',
    partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        tenant: state.tenant,
        user: state.user,
    }),
}));
const initialWizardState = {
    step: 1,
    tipoDte: '01',
    receptor: null,
    items: [],
    condicionOperacion: 1,
    observaciones: '',
};
exports.useFacturaWizardStore = (0, zustand_1.create)((set, get) => ({
    ...initialWizardState,
    setStep: (step) => set({ step }),
    nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) })),
    prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
    setTipoDte: (tipoDte) => set({ tipoDte }),
    setReceptor: (receptor) => set({ receptor }),
    addItem: (item) => set((state) => ({ items: [...state.items, item] })),
    updateItem: (id, updates) => set((state) => ({
        items: state.items.map((item) => item.id === id ? { ...item, ...updates } : item),
    })),
    removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
    setCondicionOperacion: (condicionOperacion) => set({ condicionOperacion }),
    setObservaciones: (observaciones) => set({ observaciones }),
    reset: () => set(initialWizardState),
    getSubtotal: () => {
        const items = get().items;
        return items.reduce((sum, item) => sum + item.subtotal, 0);
    },
    getTotalIva: () => {
        const items = get().items;
        return items.reduce((sum, item) => sum + item.iva, 0);
    },
    getTotal: () => {
        const items = get().items;
        return items.reduce((sum, item) => sum + item.total, 0);
    },
}));
