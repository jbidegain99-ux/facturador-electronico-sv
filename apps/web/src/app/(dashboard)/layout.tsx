'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { RoutePermissionGate } from '@/components/permission-gate';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { BottomNav } from '@/components/mobile/bottom-nav';
import { OnlineIndicator } from '@/components/pwa/online-indicator';
import { MhStatusBanner } from '@/components/pwa/mh-status-banner';
import { InstallBanner } from '@/components/pwa/install-banner';
import { useSyncQueueStore } from '@/store/sync-queue';
import { cn } from '@/lib/utils';
import type { Tenant } from '@/types';
import { Loader2, Menu } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { db } from '@/lib/db';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen, setSidebarOpen, chatSidebarOpen, tenant, setTenant, setUser, setPermissions } = useAppStore();
  const pendingCount = useSyncQueueStore((s) => s.pendingCount());
  const pathname = usePathname();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = React.useState(true);
  const [isTenantReady, setIsTenantReady] = React.useState(false);
  const [isUserReady, setIsUserReady] = React.useState(false);

  // Load tenant data on mount
  React.useEffect(() => {
    const loadTenantData = async () => {
      // Only fetch if tenant is not already loaded
      if (tenant?.nombre) {
        setIsTenantReady(true);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const data = await apiFetch<Tenant>('/tenants/me', { signal: controller.signal });
        clearTimeout(timeoutId);
        setTenant(data);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const data = await apiFetch<{ id: string; nombre: string; email: string; rol: string }>('/auth/profile', { signal: controller.signal });
        clearTimeout(timeoutId);
        setUser({
          id: data.id,
          name: data.nombre,
          email: data.email,
          role: data.rol === 'ADMIN' ? 'admin' : 'user',
          permissions: [],
        });
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

  // Load user permissions
  const user = useAppStore((s) => s.user);
  React.useEffect(() => {
    const loadPermissions = async () => {
      try {
        const data = await apiFetch<{ permissions: string[] }>('/auth/me/permissions');
        const perms = data.permissions || [];
        setPermissions(perms);

        // Cache permissions in Dexie for offline use
        if (user?.id) {
          db.appCache.put({
            key: `permissions-${user.id}`,
            value: JSON.stringify(perms),
          }).catch(() => {});
        }
      } catch {
        setPermissions([]);
      }
    };

    if (isUserReady) {
      loadPermissions();
    }
  }, [isUserReady, setPermissions, user?.id]);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      // Skip check if already on onboarding pages or hacienda config page
      if (pathname === '/onboarding' || pathname === '/onboarding-hacienda' || pathname === '/configuracion/hacienda') {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        // Add timeout to prevent hanging forever
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        await apiFetch('/tenants/me/onboarding-status', { signal: controller.signal });
        clearTimeout(timeoutId);

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
  }, [pathname]);

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
          sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-16',
          chatSidebarOpen && 'mr-[380px]'
        )}
      >
        <div className="flex items-center">
          <button
            className="md:hidden p-2 ml-2 mt-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <Header />
        <OnlineIndicator pendingCount={pendingCount} />
        <MhStatusBanner />
        <main className="p-6 pb-20 md:pb-6">
          <RoutePermissionGate>{children}</RoutePermissionGate>
        </main>
      </div>
      <ChatWidget />
      <BottomNav />
      <InstallBanner />
    </div>
  );
}
