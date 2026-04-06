'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Plus, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/facturas', label: 'Facturas', icon: FileText },
  { href: '/facturas/nueva', label: 'Nueva', icon: Plus, isAction: true },
  { href: '/cotizaciones', label: 'Cotizaciones', icon: ClipboardList },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          if ('isAction' in item && item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center py-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Icon className="h-5 w-5" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
