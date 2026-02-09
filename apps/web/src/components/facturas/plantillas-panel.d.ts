import * as React from 'react';
import { InvoiceTemplate } from '@/store/templates';
interface PlantillasPanelProps {
    onSelectTemplate: (template: InvoiceTemplate) => void;
    className?: string;
}
export declare function PlantillasPanel({ onSelectTemplate, className, }: PlantillasPanelProps): React.JSX.Element;
interface GuardarPlantillaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tipoDte: '01' | '03';
    items: Array<{
        codigo?: string;
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        esGravado: boolean;
        esExento: boolean;
        descuento: number;
        subtotal: number;
        iva: number;
        total: number;
    }>;
    condicionPago: string;
    cliente?: {
        nombre: string;
        numDocumento: string;
        tipoDocumento: string;
    };
}
export declare function GuardarPlantillaModal({ open, onOpenChange, tipoDte, items, condicionPago, cliente, }: GuardarPlantillaModalProps): React.JSX.Element;
export {};
//# sourceMappingURL=plantillas-panel.d.ts.map