'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ComprasTabsNav() {
  const pathname = usePathname();
  const isRecibidos = pathname?.startsWith('/compras/recibidos');
  return (
    <div className="flex gap-2 border-b pb-2 mb-4">
      <Link
        href="/compras"
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium',
          !isRecibidos ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
        )}
      >
        Compras
      </Link>
      <Link
        href="/compras/recibidos"
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium',
          isRecibidos ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
        )}
      >
        DTEs recibidos
      </Link>
    </div>
  );
}
