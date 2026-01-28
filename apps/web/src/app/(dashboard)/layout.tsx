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
  const { sidebarOpen } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = React.useState(true);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      // Skip onboarding check if already on onboarding page
      if (pathname === '/onboarding') {
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tenants/me/onboarding-status`,
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

        const status: OnboardingStatus = await response.json();

        // If user hasn't uploaded certificate AND is not in demo mode, redirect to onboarding
        // Certificate is the minimum requirement to use the system (unless in demo mode)
        if (!status.hasCertificate && !status.demoMode) {
          router.push('/onboarding');
          return;
        }

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

  // Show loading while checking onboarding status
  if (isCheckingOnboarding && pathname !== '/onboarding') {
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
