import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { RbacService } from '../services/rbac.service';
import { CurrentUserData } from '../../../common/decorators/current-user.decorator';

/**
 * Global guard that enforces permission-based access control.
 * Runs after JwtAuthGuard and TenantGuard in the guard chain.
 *
 * Behavior:
 * - If no @RequirePermission() decorator → allow (backward compatible)
 * - If user is SUPER_ADMIN → allow (bypasses all permission checks)
 * - Otherwise, checks user's effective permissions via RbacService
 * - Falls back to legacy `rol` field if no RBAC assignments exist
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @RequirePermission decorator = allow (backward compatible during migration)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserData | undefined;

    // No user = already handled by JwtAuthGuard
    if (!user) return true;

    // SUPER_ADMIN bypasses all permission checks
    if (user.rol === 'SUPER_ADMIN') return true;

    // Must have tenantId for RBAC checks
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    // Resolve scope context from request params/body
    const scopeContext = this.resolveScopeFromRequest(request);

    const hasPermission = await this.rbacService.hasPermissions(
      user.id,
      user.tenantId,
      requiredPermissions,
      scopeContext,
    );

    if (!hasPermission) {
      this.logger.warn(
        `Permission denied: user=${user.id} tenant=${user.tenantId} required=[${requiredPermissions.join(',')}]`,
      );
      throw new ForbiddenException(
        `Permisos insuficientes. Se requiere: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private resolveScopeFromRequest(request: {
    params?: Record<string, string>;
    body?: Record<string, string>;
  }): { branchId?: string; posId?: string } {
    return {
      branchId: request.params?.sucursalId || request.body?.sucursalId,
      posId: request.params?.puntoVentaId || request.body?.puntoVentaId,
    };
  }
}
