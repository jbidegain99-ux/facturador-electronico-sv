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
exports.FacturoIcon = FacturoIcon;
exports.FacturoWordmark = FacturoWordmark;
exports.FacturoTagline = FacturoTagline;
exports.FacturoLogo = FacturoLogo;
exports.FacturoLogoAnimated = FacturoLogoAnimated;
const React = __importStar(require("react"));
const utils_1 = require("@/lib/utils");
// Size configurations
const SIZES = {
    sm: { icon: 24, wordmark: 16, tagline: 10, gap: 6 },
    md: { icon: 32, wordmark: 20, tagline: 11, gap: 8 },
    lg: { icon: 48, wordmark: 28, tagline: 13, gap: 10 },
    xl: { icon: 64, wordmark: 36, tagline: 15, gap: 12 },
};
// The Facturo Icon SVG Component
function FacturoIcon({ size = 32, className, theme = 'auto', }) {
    // Calculate proportional values based on 64px base
    const scale = size / 64;
    const rx = 14 * scale;
    return (<svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={(0, utils_1.cn)('flex-shrink-0', className)} aria-label="Facturo logo">
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="facturo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA"/>
          <stop offset="50%" stopColor="#8B5CF6"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
        <linearGradient id="facturo-gradient-hover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD"/>
          <stop offset="50%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#8B5CF6"/>
        </linearGradient>
      </defs>

      {/* Squircle Background */}
      <rect x="0" y="0" width="64" height="64" rx={rx / scale} fill="url(#facturo-gradient)" className="transition-all duration-300"/>

      {/* F Shape with Notch
            The F consists of:
            - Top horizontal bar (full width)
            - Left vertical stem
            - Middle horizontal bar (partial width)
            - Interior notch/cutout
        */}
      <path d="M16 14 H48 V24 H26 V28 H42 V38 H26 V50 H16 V14 Z" fill="white" className="transition-all duration-300"/>

      {/* Notch cutout - creates the negative space */}
      <rect x="26" y="38" width="16" height="12" fill="url(#facturo-gradient)"/>
    </svg>);
}
// The Wordmark Component
function FacturoWordmark({ size = 20, theme = 'auto', className, }) {
    const getTextColor = () => {
        if (theme === 'light')
            return 'text-slate-900';
        if (theme === 'dark')
            return 'text-white';
        return 'text-foreground';
    };
    return (<span className={(0, utils_1.cn)('font-semibold tracking-tight', getTextColor(), className)} style={{
            fontSize: size,
            letterSpacing: '-0.02em',
            fontFamily: 'var(--facturo-font-brand, Inter, sans-serif)',
        }}>
      facturo
    </span>);
}
// The Tagline Component
function FacturoTagline({ size = 11, theme = 'auto', className, }) {
    const getTextColor = () => {
        if (theme === 'light')
            return 'text-slate-500';
        if (theme === 'dark')
            return 'text-slate-400';
        return 'text-muted-foreground';
    };
    return (<span className={(0, utils_1.cn)('font-normal', getTextColor(), className)} style={{
            fontSize: size,
            letterSpacing: '0.01em',
        }}>
      by Republicode
    </span>);
}
// Main Logo Component
function FacturoLogo({ variant = 'full', size = 'md', theme = 'auto', showTagline = false, className, iconClassName, textClassName, }) {
    const sizeConfig = SIZES[size];
    // Icon-only variant
    if (variant === 'icon') {
        return (<FacturoIcon size={sizeConfig.icon} theme={theme} className={(0, utils_1.cn)(className, iconClassName)}/>);
    }
    // Wordmark-only variant
    if (variant === 'wordmark') {
        return (<div className={(0, utils_1.cn)('flex flex-col', className)}>
        <FacturoWordmark size={sizeConfig.wordmark} theme={theme} className={textClassName}/>
        {showTagline && (<FacturoTagline size={sizeConfig.tagline} theme={theme}/>)}
      </div>);
    }
    // Full variant (icon + wordmark)
    return (<div className={(0, utils_1.cn)('flex items-center', className)} style={{ gap: sizeConfig.gap }}>
      <FacturoIcon size={sizeConfig.icon} theme={theme} className={iconClassName}/>
      <div className="flex flex-col justify-center">
        <FacturoWordmark size={sizeConfig.wordmark} theme={theme} className={textClassName}/>
        {showTagline && (<FacturoTagline size={sizeConfig.tagline} theme={theme}/>)}
      </div>
    </div>);
}
// Animated Logo variant for loading states
function FacturoLogoAnimated({ size = 'lg', className, }) {
    const sizeConfig = SIZES[size];
    return (<div className={(0, utils_1.cn)('animate-pulse', className)}>
      <FacturoIcon size={sizeConfig.icon}/>
    </div>);
}
exports.default = FacturoLogo;
