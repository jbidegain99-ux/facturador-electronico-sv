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
exports.CardContent = exports.CardDescription = exports.CardTitle = exports.CardFooter = exports.CardHeader = exports.Card = void 0;
const React = __importStar(require("react"));
const class_variance_authority_1 = require("class-variance-authority");
const utils_1 = require("@/lib/utils");
const cardVariants = (0, class_variance_authority_1.cva)('rounded-xl border text-card-foreground transition-all duration-300', {
    variants: {
        variant: {
            default: 'bg-[rgba(30,30,45,0.6)] backdrop-blur-md border-white/[0.1] border-l-2 border-l-primary/50 shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:bg-[rgba(40,40,60,0.7)] hover:border-primary/60 hover:shadow-[0_8px_32px_rgba(139,92,246,0.25)]',
            glass: 'bg-[rgba(30,30,45,0.5)] backdrop-blur-xl border-white/[0.12] border-l-2 border-l-primary/40 hover:bg-[rgba(40,40,60,0.6)] hover:border-primary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
            elevated: 'bg-[rgba(35,35,55,0.7)] backdrop-blur-xl border-white/[0.15] border-l-2 border-l-primary/60 shadow-lg hover:bg-[rgba(45,45,65,0.8)] hover:shadow-[0_12px_40px_rgba(139,92,246,0.3)]',
            solid: 'bg-card border-border shadow-sm border-l-2 border-l-primary/30',
            outline: 'bg-transparent border-border border-l-2 border-l-primary/20',
            ghost: 'bg-transparent border-transparent',
        },
        hover: {
            none: '',
            lift: 'hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(139,92,246,0.3)]',
            glow: 'hover:border-primary/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]',
            scale: 'hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(139,92,246,0.25)]',
        },
    },
    defaultVariants: {
        variant: 'default',
        hover: 'glow',
    },
});
const Card = React.forwardRef(({ className, variant, hover, ...props }, ref) => (<div ref={ref} className={(0, utils_1.cn)(cardVariants({ variant, hover, className }))} {...props}/>));
exports.Card = Card;
Card.displayName = 'Card';
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={(0, utils_1.cn)('flex flex-col space-y-1.5 p-6', className)} {...props}/>));
exports.CardHeader = CardHeader;
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (<h3 ref={ref} className={(0, utils_1.cn)('text-2xl font-semibold leading-none tracking-tight', className)} {...props}/>));
exports.CardTitle = CardTitle;
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (<p ref={ref} className={(0, utils_1.cn)('text-sm text-muted-foreground', className)} {...props}/>));
exports.CardDescription = CardDescription;
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={(0, utils_1.cn)('p-6 pt-0', className)} {...props}/>));
exports.CardContent = CardContent;
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (<div ref={ref} className={(0, utils_1.cn)('flex items-center p-6 pt-0', className)} {...props}/>));
exports.CardFooter = CardFooter;
CardFooter.displayName = 'CardFooter';
