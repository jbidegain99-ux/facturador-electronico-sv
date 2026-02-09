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
exports.ToastProvider = ToastProvider;
exports.useToast = useToast;
const React = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const ToastContext = React.createContext(undefined);
function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);
    const addToast = React.useCallback((toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);
        // Auto-remove after duration
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);
    const removeToast = React.useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const success = React.useCallback((title, description) => {
        addToast({ type: 'success', title, description });
    }, [addToast]);
    const error = React.useCallback((title, description) => {
        addToast({ type: 'error', title, description, duration: 8000 });
    }, [addToast]);
    const warning = React.useCallback((title, description) => {
        addToast({ type: 'warning', title, description });
    }, [addToast]);
    const info = React.useCallback((title, description) => {
        addToast({ type: 'info', title, description });
    }, [addToast]);
    const contextValue = React.useMemo(() => ({ toasts, addToast, removeToast, success, error, warning, info }), [toasts, addToast, removeToast, success, error, warning, info]);
    return (<ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </ToastContext.Provider>);
}
function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
// Toast container
function ToastContainer({ toasts, onRemove, }) {
    if (toasts.length === 0)
        return null;
    return (<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (<ToastItem key={toast.id} toast={toast} onRemove={onRemove}/>))}
    </div>);
}
// Individual toast item
function ToastItem({ toast, onRemove, }) {
    const icons = {
        success: lucide_react_1.CheckCircle,
        error: lucide_react_1.AlertCircle,
        warning: lucide_react_1.AlertTriangle,
        info: lucide_react_1.Info,
    };
    const colors = {
        success: 'bg-green-500/10 border-green-500/50 text-green-500',
        error: 'bg-red-500/10 border-red-500/50 text-red-500',
        warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500',
        info: 'bg-blue-500/10 border-blue-500/50 text-blue-500',
    };
    const Icon = icons[toast.type];
    return (<div className={(0, utils_1.cn)('flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm', 'animate-in slide-in-from-right-full duration-300', 'bg-card shadow-lg', colors[toast.type])} role="alert">
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{toast.title}</p>
        {toast.description && (<p className="text-sm text-muted-foreground mt-1">{toast.description}</p>)}
      </div>
      <button onClick={() => onRemove(toast.id)} className="text-muted-foreground hover:text-white transition-colors">
        <lucide_react_1.X className="w-4 h-4"/>
      </button>
    </div>);
}
