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
exports.default = OnboardingPage;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
/**
 * Old onboarding page - redirects to the new Hacienda wizard
 * This page is kept for backwards compatibility with any existing links/bookmarks
 */
function OnboardingPage() {
    const router = (0, navigation_1.useRouter)();
    React.useEffect(() => {
        // Redirect to the new Hacienda onboarding wizard
        router.replace('/onboarding-hacienda');
    }, [router]);
    return (<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <lucide_react_1.Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3"/>
        <p className="text-muted-foreground">Redirigiendo al nuevo wizard...</p>
      </div>
    </div>);
}
