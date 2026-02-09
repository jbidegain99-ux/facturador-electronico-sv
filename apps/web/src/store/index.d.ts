import { User, Tenant, ItemFactura } from '@/types';
interface AppState {
    user: User | null;
    tenant: Tenant | null;
    setUser: (user: User | null) => void;
    setTenant: (tenant: Tenant | null) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    mhCredentials: {
        nit: string;
        password: string;
    } | null;
    setMhCredentials: (creds: {
        nit: string;
        password: string;
    } | null) => void;
}
export declare const useAppStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AppState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AppState, {
            theme: "dark" | "light";
            sidebarOpen: boolean;
            tenant: any;
            user: any;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AppState) => void) => () => void;
        onFinishHydration: (fn: (state: AppState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AppState, {
            theme: "dark" | "light";
            sidebarOpen: boolean;
            tenant: any;
            user: any;
        }>>;
    };
}>;
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
        direccion?: {
            departamento: string;
            municipio: string;
            complemento: string;
        };
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
    getSubtotal: () => number;
    getTotalIva: () => number;
    getTotal: () => number;
}
export declare const useFacturaWizardStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FacturaWizardState>>;
export {};
//# sourceMappingURL=index.d.ts.map