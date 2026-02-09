import * as React from 'react';
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}
interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
}
export declare function ToastProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useToast(): ToastContextValue;
export {};
//# sourceMappingURL=toast.d.ts.map