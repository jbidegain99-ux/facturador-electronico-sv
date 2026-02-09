import { ItemFactura, Cliente } from '@/types';
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
    addTemplate: (template: Omit<InvoiceTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => string;
    updateTemplate: (id: string, updates: Partial<InvoiceTemplate>) => void;
    deleteTemplate: (id: string) => void;
    useTemplate: (id: string) => InvoiceTemplate | undefined;
    addFavorite: (item: Omit<FavoriteItem, 'id' | 'usageCount' | 'lastUsed'>) => string;
    updateFavorite: (id: string, updates: Partial<FavoriteItem>) => void;
    deleteFavorite: (id: string) => void;
    useFavorite: (id: string) => FavoriteItem | undefined;
    getTopTemplates: (limit?: number) => InvoiceTemplate[];
    getTopFavorites: (limit?: number) => FavoriteItem[];
}
export declare const useTemplatesStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<TemplatesState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<TemplatesState, TemplatesState>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: TemplatesState) => void) => () => void;
        onFinishHydration: (fn: (state: TemplatesState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<TemplatesState, TemplatesState>>;
    };
}>;
export {};
//# sourceMappingURL=templates.d.ts.map