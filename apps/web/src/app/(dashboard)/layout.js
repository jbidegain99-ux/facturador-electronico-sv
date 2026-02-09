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
exports.default = DashboardLayout;
const React = __importStar(require("react"));
const navigation_1 = require("next/navigation");
const store_1 = require("@/store");
const sidebar_1 = require("@/components/layout/sidebar");
const header_1 = require("@/components/layout/header");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
function DashboardLayout({ children, }) {
    const { sidebarOpen, tenant, setTenant, setUser } = (0, store_1.useAppStore)();
    const router = (0, navigation_1.useRouter)();
    const pathname = (0, navigation_1.usePathname)();
    const [isCheckingOnboarding, setIsCheckingOnboarding] = React.useState(true);
    const [isTenantReady, setIsTenantReady] = React.useState(false);
    const [isUserReady, setIsUserReady] = React.useState(false);
    // Load tenant data on mount
    React.useEffect(() => {
        const loadTenantData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('[Tenant] No token, skipping fetch');
                setIsTenantReady(true);
                return;
            }
            // Only fetch if tenant is not already loaded
            if (tenant?.nombre) {
                console.log('[Tenant] Already loaded:', tenant.nombre);
                setIsTenantReady(true);
                return;
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            try {
                console.log('[Tenant] Fetching tenant data...');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                console.log('[Tenant] Response status:', response.status);
                if (response.ok) {
                    const text = await response.text();
                    if (text) {
                        const data = JSON.parse(text);
                        console.log('[Tenant] Loaded:', data.nombre);
                        setTenant(data);
                    }
                }
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof DOMException && error.name === 'AbortError') {
                    console.error('[Tenant] Fetch timed out');
                }
                else {
                    console.error('[Tenant] Error:', error);
                }
            }
            finally {
                setIsTenantReady(true);
            }
        };
        loadTenantData();
    }, [tenant?.nombre, setTenant]);
    // Load user data on mount
    React.useEffect(() => {
        const loadUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('[Auth] No token, setting user to null');
                setUser(null);
                setIsUserReady(true);
                return;
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            try {
                console.log('[Auth] Fetching user profile...');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                console.log('[Auth] Response status:', response.status);
                if (response.ok) {
                    const text = await response.text();
                    if (text) {
                        const data = JSON.parse(text);
                        console.log('[Auth] User loaded:', data.email);
                        setUser({
                            id: data.id,
                            name: data.nombre,
                            email: data.email,
                            role: data.rol === 'ADMIN' ? 'admin' : 'user',
                        });
                    }
                    else {
                        console.log('[Auth] Empty response body, setting user to null');
                        setUser(null);
                    }
                }
                else {
                    console.log('[Auth] Not authenticated (status:', response.status, ')');
                    setUser(null);
                }
            }
            catch (error) {
                clearTimeout(timeoutId);
                setUser(null);
                if (error instanceof DOMException && error.name === 'AbortError') {
                    console.error('[Auth] Profile fetch timed out');
                }
                else {
                    console.error('[Auth] Error:', error);
                }
            }
            finally {
                setIsUserReady(true);
            }
        };
        loadUserData();
    }, [setUser]);
    React.useEffect(() => {
        const checkOnboarding = async () => {
            // Skip check if already on onboarding pages or hacienda config page
            if (pathname === '/onboarding' || pathname === '/onboarding-hacienda' || pathname === '/configuracion/hacienda') {
                setIsCheckingOnboarding(false);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    // No token, redirect to login
                    router.push('/login');
                    return;
                }
                // Add timeout to prevent hanging forever
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/me/onboarding-status`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    // If unauthorized, redirect to login
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        router.push('/login');
                        return;
                    }
                    // For other errors, just continue to dashboard
                    setIsCheckingOnboarding(false);
                    return;
                }
                // Parse response safely - non-JSON responses shouldn't crash the app
                await response.json().catch(() => null);
                // No forced redirect - allow users to navigate freely
                // Individual pages will show HaciendaConfigBanner when needed
                // using the useHaciendaStatus hook from @/components/HaciendaConfigBanner
                setIsCheckingOnboarding(false);
            }
            catch (error) {
                console.error('Error checking onboarding status:', error);
                // On timeout or network error, still show the dashboard
                // This prevents the infinite loading state
                setIsCheckingOnboarding(false);
            }
        };
        checkOnboarding();
    }, [pathname, router]);
    const isLoading = !isUserReady || !isTenantReady ||
        (isCheckingOnboarding && pathname !== '/onboarding' && pathname !== '/onboarding-hacienda');
    // Show loading while data is being fetched
    if (isLoading) {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <lucide_react_1.Loader2 className="w-8 h-8 animate-spin text-primary"/>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-background">
      <sidebar_1.Sidebar />
      <div className={(0, utils_1.cn)('transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-16')}>
        <header_1.Header />
        <main className="p-6">{children}</main>
      </div>
    </div>);
}
