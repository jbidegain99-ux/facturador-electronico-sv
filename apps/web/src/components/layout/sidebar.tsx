'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  HelpCircle,
  Repeat,
  Package,
  ClipboardList,
  BookOpen,
  Webhook,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FacturoLogo, FacturoIcon } from '@/components/brand';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { useTranslations } from 'next-intl';

type NavKey = 'dashboard' | 'invoices' | 'quotes' | 'recurring' | 'reports' | 'clients' | 'accounting' | 'catalog' | 'webhooks' | 'branches' | 'support' | 'settings';

const navigation: { key: NavKey; href: string; icon: typeof LayoutDashboard; proBadge: boolean; iconColor: string }[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, proBadge: false, iconColor: 'text-purple-600' },
  { key: 'invoices', href: '/facturas', icon: FileText, proBadge: false, iconColor: 'text-blue-600' },
  { key: 'quotes', href: '/cotizaciones', icon: ClipboardList, proBadge: false, iconColor: 'text-teal-500' },
  { key: 'recurring', href: '/facturas/recurrentes', icon: Repeat, proBadge: true, iconColor: 'text-cyan-500' },
  { key: 'reports', href: '/reportes', icon: BarChart3, proBadge: false, iconColor: 'text-orange-500' },
  { key: 'clients', href: '/clientes', icon: Users, proBadge: false, iconColor: 'text-blue-500' },
  { key: 'accounting', href: '/contabilidad', icon: BookOpen, proBadge: true, iconColor: 'text-emerald-500' },
  { key: 'catalog', href: '/catalogo', icon: Package, proBadge: false, iconColor: 'text-amber-500' },
  { key: 'webhooks', href: '/webhooks', icon: Webhook, proBadge: true, iconColor: 'text-indigo-500' },
  { key: 'branches', href: '/configuracion/sucursales', icon: Building2, proBadge: false, iconColor: 'text-rose-500' },
  { key: 'support', href: '/soporte', icon: HelpCircle, proBadge: false, iconColor: 'text-pink-500' },
  { key: 'settings', href: '/configuracion', icon: Settings, proBadge: false, iconColor: 'text-gray-500' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { features } = usePlanFeatures();
  const showProBadge = !features.recurringInvoices;
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {sidebarOpen ? (
          <Link href="/dashboard" className="flex items-center">
            <FacturoLogo variant="full" size="md" />
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <FacturoIcon size={32} />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(!sidebarOpen && 'hidden')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Expand button when collapsed */}
      {!sidebarOpen && (
        <div className="flex justify-center py-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {navigation.map((item) => {
          // Para Dashboard, solo activo si es exactamente /dashboard
          // Para otras rutas, activo si es exacta o es subruta
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'nav-active bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                !sidebarOpen && 'justify-center px-2'
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', !isActive && item.iconColor)} />
              {sidebarOpen && (
                <span className="flex items-center gap-2">
                  {t(item.key)}
                  {item.proBadge && showProBadge && (
                    <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                      {tCommon('pro')}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Version */}
      {sidebarOpen && (
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs text-muted-foreground">
            {tCommon('version')}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            {t('byRepubicode')}
          </p>
        </div>
      )}
    </aside>
  );
}
