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
exports.DialogDescription = exports.DialogTitle = exports.DialogFooter = exports.DialogHeader = exports.DialogContent = exports.DialogTrigger = exports.DialogOverlay = exports.DialogPortal = exports.Dialog = void 0;
const React = __importStar(require("react"));
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const DialogContext = React.createContext({
    open: false,
    onOpenChange: () => { },
});
const Dialog = ({ open = false, onOpenChange = () => { }, children }) => {
    return (<DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>);
};
exports.Dialog = Dialog;
const DialogTrigger = React.forwardRef(({ className, asChild, children, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: () => onOpenChange(true),
        });
    }
    return (<button ref={ref} className={className} onClick={() => onOpenChange(true)} {...props}>
      {children}
    </button>);
});
exports.DialogTrigger = DialogTrigger;
DialogTrigger.displayName = 'DialogTrigger';
const DialogPortal = ({ children }) => {
    const { open } = React.useContext(DialogContext);
    if (!open)
        return null;
    return <>{children}</>;
};
exports.DialogPortal = DialogPortal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => {
    const { onOpenChange } = React.useContext(DialogContext);
    return (<div ref={ref} className={(0, utils_1.cn)('fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', className)} onClick={() => onOpenChange(false)} {...props}/>);
});
exports.DialogOverlay = DialogOverlay;
DialogOverlay.displayName = 'DialogOverlay';
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = React.useContext(DialogContext);
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)}/>
      <div ref={ref} className={(0, utils_1.cn)('fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg', className)} {...props}>
        {children}
        <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none" onClick={() => onOpenChange(false)}>
          <lucide_react_1.X className="h-4 w-4"/>
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>);
});
exports.DialogContent = DialogContent;
DialogContent.displayName = 'DialogContent';
const DialogHeader = ({ className, ...props }) => (<div className={(0, utils_1.cn)('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props}/>);
exports.DialogHeader = DialogHeader;
DialogHeader.displayName = 'DialogHeader';
const DialogFooter = ({ className, ...props }) => (<div className={(0, utils_1.cn)('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props}/>);
exports.DialogFooter = DialogFooter;
DialogFooter.displayName = 'DialogFooter';
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (<h2 ref={ref} className={(0, utils_1.cn)('text-lg font-semibold leading-none tracking-tight', className)} {...props}/>));
exports.DialogTitle = DialogTitle;
DialogTitle.displayName = 'DialogTitle';
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (<p ref={ref} className={(0, utils_1.cn)('text-sm text-muted-foreground', className)} {...props}/>));
exports.DialogDescription = DialogDescription;
DialogDescription.displayName = 'DialogDescription';
