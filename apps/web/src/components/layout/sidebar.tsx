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
  TrendingUp,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FacturoLogo, FacturoIcon } from '@/components/brand';
import { usePlanFeatures } from '@/hooks/use-plan-features';
import { usePermissions } from '@/hooks/use-permissions';
import { useTranslations } from 'next-intl';

type NavKey = 'dashboard' | 'invoices' | 'quotes' | 'recurring' | 'reports' | 'clients' | 'purchases' | 'suppliers' | 'cashFlow' | 'accounting' | 'catalog' | 'webhooks' | 'branches' | 'support' | 'settings';

type BadgeType = 'PRO' | 'ENT' | null;

const navigation: { key: NavKey; href: string; icon: typeof LayoutDashboard; badgeKey?: 'pro' | 'ent'; iconColor: string }[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, iconColor: 'text-purple-600' },
  { key: 'invoices', href: '/facturas', icon: FileText, iconColor: 'text-blue-600' },
  { key: 'quotes', href: '/cotizaciones', icon: ClipboardList, badgeKey: 'pro', iconColor: 'text-teal-500' },
  { key: 'recurring', href: '/facturas/recurrentes', icon: Repeat, badgeKey: 'pro', iconColor: 'text-cyan-500' },
  { key: 'reports', href: '/reportes', icon: BarChart3, iconColor: 'text-orange-500' },
  { key: 'clients', href: '/clientes', icon: Users, iconColor: 'text-blue-500' },
  { key: 'purchases', href: '/compras', icon: ShoppingCart, iconColor: 'text-violet-500' },
  { key: 'suppliers', href: '/proveedores', icon: Truck, iconColor: 'text-fuchsia-500' },
  { key: 'cashFlow', href: '/cash-flow', icon: TrendingUp, iconColor: 'text-green-500' },
  { key: 'accounting', href: '/contabilidad', icon: BookOpen, badgeKey: 'pro', iconColor: 'text-emerald-500' },
  { key: 'catalog', href: '/catalogo', icon: Package, iconColor: 'text-amber-500' },
  { key: 'webhooks', href: '/webhooks', icon: Webhook, badgeKey: 'ent', iconColor: 'text-indigo-500' },
  { key: 'branches', href: '/configuracion/sucursales', icon: Building2, iconColor: 'text-rose-500' },
  { key: 'support', href: '/soporte', icon: HelpCircle, iconColor: 'text-pink-500' },
  { key: 'settings', href: '/configuracion', icon: Settings, iconColor: 'text-gray-500' },
];

/**
 * Determine badge for a nav item based on plan features.
 * PRO badge: feature available in STARTER+ (user needs to upgrade from FREE)
 * ENT badge: feature available only in ENTERPRISE (user needs to upgrade from PRO)
 */
function getNavBadge(item: (typeof navigation)[number], planCode: string, features: ReturnType<typeof usePlanFeatures>['features']): BadgeType {
  if (!item.badgeKey) return null;

  if (item.badgeKey === 'ent') {
    // Enterprise-only features (webhooks, api)
    const isEnterprise = planCode === 'ENTERPRISE';
    return isEnterprise ? null : 'ENT';
  }

  // PRO features — show badge if user is on FREE plan
  if (item.key === 'recurring' && features.recurringInvoices) return null;
  if (item.key === 'accounting' && features.accounting) return null;
  if (item.key === 'quotes' && features.advancedQuotes) return null;

  // If feature is missing, show PRO badge
  if (item.key === 'recurring' && !features.recurringInvoices) return 'PRO';
  if (item.key === 'accounting' && !features.accounting) return 'PRO';
  if (item.key === 'quotes' && !features.advancedQuotes) return 'PRO';

  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAppStore();
  const { features } = usePlanFeatures();
  const { canAccessRoute } = usePermissions();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
    {/* Mobile backdrop */}
    {sidebarOpen && (
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={() => setSidebarOpen(false)}
      />
    )}
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-card border-r transition-all duration-200',
        '-translate-x-full md:translate-x-0',
        sidebarOpen && 'translate-x-0',
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
        {navigation.filter((item) => canAccessRoute(item.href)).map((item) => {
          // Para Dashboard, solo activo si es exactamente /dashboard
          // Para otras rutas, activo si es exacta o es subruta
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/');

          const badge = getNavBadge(item, features.planCode, features);

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={handleNavClick}
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
                  {badge === 'PRO' && (
                    <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                      {tCommon('pro')}
                    </span>
                  )}
                  {badge === 'ENT' && (
                    <span className="text-[10px] font-bold bg-amber-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                      ENT
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
    </>
  );
}
