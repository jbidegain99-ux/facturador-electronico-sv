import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermissions';

/**
 * Decorator that specifies which permissions are required to access an endpoint.
 * All listed permissions must be satisfied (AND logic).
 *
 * Usage:
 *   @RequirePermission('dte:create')
 *   @RequirePermission('dte:create', 'dte:transmit')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
