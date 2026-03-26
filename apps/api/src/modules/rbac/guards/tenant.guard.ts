import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { SKIP_TENANT_KEY } from '../decorators/skip-tenant-check.decorator';

/**
 * Global guard that ensures the authenticated user has a valid tenantId.
 * Runs after JwtAuthGuard in the guard chain.
 *
 * Skips validation for:
 * - @Public() routes (already skipped by JwtAuthGuard, no user present)
 * - @SkipTenantCheck() routes (e.g. super-admin cross-tenant endpoints)
 * - SUPER_ADMIN users (operate across tenants)
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipTenant) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user means JwtAuthGuard already rejected or route is public
    if (!user) return true;

    // SUPER_ADMIN can operate without tenant context
    if (user.rol === 'SUPER_ADMIN') return true;

    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    return true;
  }
}
