import * as React from 'react';
import type { Cliente } from '@/types';
interface NuevoClienteModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (cliente: Cliente) => void;
    tipoDte?: '01' | '03';
    subtotal?: number;
}
export declare function NuevoClienteModal({ open, onClose, onCreated, tipoDte, subtotal, }: NuevoClienteModalProps): React.JSX.Element;
export {};
//# sourceMappingURL=nuevo-cliente-modal.d.ts.map