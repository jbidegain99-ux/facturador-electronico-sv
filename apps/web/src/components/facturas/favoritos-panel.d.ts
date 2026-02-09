import * as React from 'react';
import { FavoriteItem } from '@/store/templates';
interface FavoritosPanelProps {
    onSelectFavorite: (item: FavoriteItem) => void;
    className?: string;
}
export declare function FavoritosPanel({ onSelectFavorite, className, }: FavoritosPanelProps): React.JSX.Element;
interface AgregarFavoritoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: {
        descripcion: string;
        precioUnitario: number;
        codigo?: string;
        esGravado?: boolean;
    };
}
export declare function AgregarFavoritoModal({ open, onOpenChange, initialData, }: AgregarFavoritoModalProps): React.JSX.Element;
interface AddToFavoritesButtonProps {
    item: {
        descripcion: string;
        precioUnitario: number;
        codigo?: string;
        esGravado: boolean;
    };
}
export declare function AddToFavoritesButton({ item }: AddToFavoritesButtonProps): React.JSX.Element;
export {};
//# sourceMappingURL=favoritos-panel.d.ts.map