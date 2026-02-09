'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OnboardingStatus {
  hasCompanyData: boolean;
  hasCertificate: boolean;
  hasTestedConnection: boolean;
  hasFirstInvoice: boolean;
  demoMode?: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen, tenant, setTenant, setUser } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
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
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tenants/current`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

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
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error('[Tenant] Fetch timed out');
        } else {
          console.error('[Tenant] Error:', error);
        }
      } finally {
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
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

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
          } else {
            console.log('[Auth] Empty response body, setting user to null');
            setUser(null);
          }
        } else {
          console.log('[Auth] Not authenticated (status:', response.status, ')');
          setUser(null);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        setUser(null);
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error('[Auth] Profile fetch timed out');
        } else {
          console.error('[Auth] Error:', error);
        }
      } finally {
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

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/tenants/me/onboarding-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

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
      } catch (error) {
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
