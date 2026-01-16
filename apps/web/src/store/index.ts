import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Tenant, ItemFactura } from '@/types';

interface AppState {
  // User & Tenant
  user: User | null;
  tenant: Tenant | null;
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // MH Credentials (session only, not persisted)
  mhCredentials: { nit: string; password: string } | null;
  setMhCredentials: (creds: { nit: string; password: string } | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User & Tenant
      user: null,
      tenant: null,
      setUser: (user) => set({ user }),
      setTenant: (tenant) => set({ tenant }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // MH Credentials
      mhCredentials: null,
      setMhCredentials: (mhCredentials) => set({ mhCredentials }),
    }),
    {
      name: 'facturador-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        tenant: state.tenant,
        user: state.user,
      }),
    }
  )
);

// Factura Wizard Store
interface FacturaWizardState {
  step: number;
  tipoDte: '01' | '03';
  receptor: {
    tipoDocumento: string;
    numDocumento: string;
    nrc?: string;
    nombre: string;
    codActividad?: string;
    descActividad?: string;
    direccion?: { departamento: string; municipio: string; complemento: string };
    telefono?: string;
    correo?: string;
  } | null;
  items: ItemFactura[];
  condicionOperacion: 1 | 2 | 3;
  observaciones: string;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setTipoDte: (tipo: '01' | '03') => void;
  setReceptor: (receptor: FacturaWizardState['receptor']) => void;
  addItem: (item: ItemFactura) => void;
  updateItem: (id: string, item: Partial<ItemFactura>) => void;
  removeItem: (id: string) => void;
  setCondicionOperacion: (cond: 1 | 2 | 3) => void;
  setObservaciones: (obs: string) => void;
  reset: () => void;

  // Computed
  getSubtotal: () => number;
  getTotalIva: () => number;
  getTotal: () => number;
}

const initialWizardState = {
  step: 1,
  tipoDte: '01' as const,
  receptor: null,
  items: [],
  condicionOperacion: 1 as const,
  observaciones: '',
};

export const useFacturaWizardStore = create<FacturaWizardState>((set, get) => ({
  ...initialWizardState,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 5) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  setTipoDte: (tipoDte) => set({ tipoDte }),
  setReceptor: (receptor) => set({ receptor }),

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

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
