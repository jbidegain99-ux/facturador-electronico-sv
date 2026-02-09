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
exports.buttonVariants = exports.Button = void 0;
const React = __importStar(require("react"));
const react_slot_1 = require("@radix-ui/react-slot");
const class_variance_authority_1 = require("class-variance-authority");
const utils_1 = require("@/lib/utils");
const buttonVariants = (0, class_variance_authority_1.cva)('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow-sm active:scale-[0.98]',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]',
            outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50 active:scale-[0.98]',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline',
            glow: 'bg-gradient-to-r from-facturo-violet-500 to-facturo-violet-600 text-white hover:from-facturo-violet-400 hover:to-facturo-violet-500 hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 active:shadow-none',
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3 text-xs',
            lg: 'h-12 rounded-lg px-8 text-base',
            xl: 'h-14 rounded-xl px-10 text-lg',
            icon: 'h-10 w-10',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
exports.buttonVariants = buttonVariants;
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? react_slot_1.Slot : 'button';
    return (<Comp className={(0, utils_1.cn)(buttonVariants({ variant, size, className }))} ref={ref} {...props}/>);
});
exports.Button = Button;
Button.displayName = 'Button';
