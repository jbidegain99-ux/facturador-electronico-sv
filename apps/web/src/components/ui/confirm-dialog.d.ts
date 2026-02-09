import * as React from 'react';
interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void | Promise<void>;
    isLoading?: boolean;
}
export declare function ConfirmDialog({ open, onOpenChange, title, description, confirmText, cancelText, variant, onConfirm, isLoading, }: ConfirmDialogProps): React.JSX.Element;
interface UseConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}
export declare function useConfirm(): {
    confirm: (options: UseConfirmOptions) => Promise<boolean>;
    ConfirmDialog: () => React.JSX.Element | null;
};
export {};
//# sourceMappingURL=confirm-dialog.d.ts.map