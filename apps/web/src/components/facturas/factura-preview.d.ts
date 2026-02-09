import * as React from 'react';
import type { Cliente, ItemFactura } from '@/types';
interface EmisorInfo {
    nombre: string;
    nit: string;
    nrc: string;
    direccion?: string;
    telefono?: string;
    correo?: string;
}
interface FacturaPreviewProps {
    open: boolean;
    onClose: () => void;
    onEmit: () => void;
    data: {
        tipoDte: '01' | '03';
        cliente: Cliente | null;
        items: ItemFactura[];
        condicionPago: string;
        emisor?: EmisorInfo;
    };
    isEmitting: boolean;
}
export declare function FacturaPreview({ open, onClose, onEmit, data, isEmitting, }: FacturaPreviewProps): React.JSX.Element;
export {};
//# sourceMappingURL=factura-preview.d.ts.map