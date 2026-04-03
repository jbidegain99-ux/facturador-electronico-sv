'use client';

import { usePathname } from 'next/navigation';
import { usePermissions, ROUTE_PERMISSIONS } from '@/hooks/use-permissions';
import { ShieldAlert } from 'lucide-react';

interface PermissionGateProps {
  required: string | string[];
  children: React.ReactNode;
}

export function PermissionGate({ required, children }: PermissionGateProps) {
  const { hasPermission } = usePermissions();

  const requiredList = Array.isArray(required) ? required : [required];
  const hasAccess = requiredList.every((p) => hasPermission(p));

  if (hasAccess) {
    return <>{children}</>;
  }

  return <PermissionDenied />;
}

export function RoutePermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canAccessRoute, permissions } = usePermissions();

  // Don't gate until permissions are loaded
  if (permissions.length === 0) {
    return <>{children}</>;
  }

  // Find the most specific matching route
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS)
    .filter((route) => pathname === route || pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchedRoute || canAccessRoute(matchedRoute)) {
    return <>{children}</>;
  }

  return <PermissionDenied />;
}

function PermissionDenied() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShieldAlert className="h-16 w-16 text-muted-foreground/40 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Acceso restringido</h2>
      <p className="text-muted-foreground max-w-md">
        No tienes permisos para acceder a esta seccion.
        Contacta al administrador de tu empresa si necesitas acceso.
      </p>
    </div>
  );
}
