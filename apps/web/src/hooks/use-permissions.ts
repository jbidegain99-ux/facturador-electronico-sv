'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { useOnlineStatus } from './use-online-status';
import { db } from '@/lib/db';

/** Map each nav route to the permission(s) required to see it */
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard': [],                          // everyone
  '/facturas': ['dte:read'],
  '/cotizaciones': ['quote:read'],
  '/facturas/recurrentes': ['dte:read'],
  '/reportes': ['report:read'],
  '/clientes': ['client:read'],
  '/cash-flow': ['report:read'],
  '/contabilidad': ['accounting:read'],
  '/catalogo': ['catalog:read'],
  '/webhooks': ['webhook:read'],
  '/configuracion/sucursales': ['branch:read'],
  '/soporte': [],                            // everyone
  '/configuracion': ['config:read'],
};

export function usePermissions() {
  const storePermissions = useAppStore((s) => s.permissions);
  const user = useAppStore((s) => s.user);
  const setPermissions = useAppStore((s) => s.setPermissions);
  const { isOnline } = useOnlineStatus();
  const [offlineLoaded, setOfflineLoaded] = useState(false);

  // If offline and no permissions in store, load from Dexie cache
  useEffect(() => {
    if (!isOnline && storePermissions.length === 0 && user?.id && !offlineLoaded) {
      db.appCache.get(`permissions-${user.id}`).then((entry) => {
        if (entry?.value) {
          try {
            const cached = JSON.parse(entry.value) as string[];
            if (cached.length > 0) {
              setPermissions(cached);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }).catch(() => {}).finally(() => {
        setOfflineLoaded(true);
      });
    }
  }, [isOnline, storePermissions.length, user?.id, offlineLoaded, setPermissions]);

  const permissions = storePermissions;

  const hasPermission = (permission: string): boolean => {
    return permissions.includes('*') || permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (permissions.includes('*')) return true;
    return perms.some((p) => permissions.includes(p));
  };

  const canAccessRoute = (href: string): boolean => {
    const required = ROUTE_PERMISSIONS[href];
    if (!required || required.length === 0) return true;
    return required.every((p) => hasPermission(p));
  };

  return { permissions, hasPermission, hasAnyPermission, canAccessRoute };
}

export { ROUTE_PERMISSIONS };
