'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmDialog = ConfirmDialog;
exports.useConfirm = useConfirm;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
function ConfirmDialog({ open, onOpenChange, title, description, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'default', onConfirm, isLoading = false, }) {
    const [isPending, setIsPending] = React.useState(false);
    const handleConfirm = async () => {
        setIsPending(true);
        try {
            await onConfirm();
            onOpenChange(false);
        }
        finally {
            setIsPending(false);
        }
    };
    const loading = isLoading || isPending;
    return (<dialog_1.Dialog open={open} onOpenChange={onOpenChange}>
      <dialog_1.DialogContent className="sm:max-w-md">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' && (<lucide_react_1.AlertTriangle className="w-5 h-5 text-destructive"/>)}
            {title}
          </dialog_1.DialogTitle>
          <dialog_1.DialogDescription>{description}</dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        <dialog_1.DialogFooter className="gap-2 sm:gap-0">
          <button_1.Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelText}
          </button_1.Button>
          <button_1.Button variant={variant === 'destructive' ? 'destructive' : 'default'} onClick={handleConfirm} disabled={loading}>
            {loading && <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
            {confirmText}
          </button_1.Button>
        </dialog_1.DialogFooter>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
function useConfirm() {
    const [state, setState] = React.useState({
        open: false,
        options: null,
        resolve: null,
    });
    const confirm = React.useCallback((options) => {
        return new Promise((resolve) => {
            setState({ open: true, options, resolve });
        });
    }, []);
    const handleOpenChange = React.useCallback((open) => {
        if (!open && state.resolve) {
            state.resolve(false);
        }
        setState((prev) => ({ ...prev, open }));
    }, [state.resolve]);
    const handleConfirm = React.useCallback(() => {
        if (state.resolve) {
            state.resolve(true);
        }
        setState((prev) => ({ ...prev, open: false }));
    }, [state.resolve]);
    const ConfirmDialogComponent = React.useCallback(() => {
        if (!state.options)
            return null;
        return (<ConfirmDialog open={state.open} onOpenChange={handleOpenChange} onConfirm={handleConfirm} {...state.options}/>);
    }, [state.open, state.options, handleOpenChange, handleConfirm]);
    return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
