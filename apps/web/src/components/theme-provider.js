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
exports.ThemeProvider = ThemeProvider;
const React = __importStar(require("react"));
const store_1 = require("@/store");
function ThemeProvider({ children }) {
    const { theme } = (0, store_1.useAppStore)();
    const [mounted, setMounted] = React.useState(false);
    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);
    React.useEffect(() => {
        if (!mounted)
            return;
        const root = document.documentElement;
        // Remove existing theme classes and apply new one
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme, mounted]);
    // Set initial theme class on mount to prevent flash
    React.useEffect(() => {
        const root = document.documentElement;
        // Default to dark if no theme is set
        if (!root.classList.contains('light') && !root.classList.contains('dark')) {
            root.classList.add('dark');
        }
    }, []);
    return <>{children}</>;
}
