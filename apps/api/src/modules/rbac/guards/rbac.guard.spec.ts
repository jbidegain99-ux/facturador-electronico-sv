import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';
import { RbacService } from '../services/rbac.service';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;
  let rbacService: { hasPermissions: jest.Mock };

  beforeEach(() => {
    reflector = new Reflector();
    rbacService = { hasPermissions: jest.fn() };
    guard = new RbacGuard(reflector, rbacService as unknown as RbacService);
  });

  const createMockContext = (
    user?: Record<string, unknown>,
    params?: Record<string, string>,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: params || {}, body: {} }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  it('should allow public routes', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true); // isPublic
    expect(await guard.canActivate(createMockContext())).toBe(true);
  });

  it('should allow when no @RequirePermission decorator is present', async () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)       // isPublic
      .mockReturnValueOnce(undefined);  // no permissions
    expect(await guard.canActivate(createMockContext({ id: 'u1', tenantId: 't1', rol: 'ADMIN' }))).toBe(true);
  });

  it('should allow SUPER_ADMIN regardless of permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)                      // isPublic
      .mockReturnValueOnce(['dte:create', 'dte:void']); // requiredPermissions
    const ctx = createMockContext({ id: 'u1', tenantId: null, rol: 'SUPER_ADMIN' });
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(rbacService.hasPermissions).not.toHaveBeenCalled();
  });

  it('should check permissions via RbacService', async () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)              // isPublic
      .mockReturnValueOnce(['dte:create']);     // requiredPermissions
    rbacService.hasPermissions.mockResolvedValue(true);

    const ctx = createMockContext({ id: 'u1', tenantId: 't1', rol: 'FACTURADOR' });
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(rbacService.hasPermissions).toHaveBeenCalledWith(
      'u1', 't1', ['dte:create'], { branchId: undefined, posId: undefined },
    );
  });

  it('should throw ForbiddenException when user lacks permissions', async () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)              // isPublic
      .mockReturnValueOnce(['dte:void']);       // requiredPermissions
    rbacService.hasPermissions.mockResolvedValue(false);

    const ctx = createMockContext({ id: 'u1', tenantId: 't1', rol: 'FACTURADOR' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no tenantId', async () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)              // isPublic
      .mockReturnValueOnce(['dte:create']);     // requiredPermissions

    const ctx = createMockContext({ id: 'u1', tenantId: null, rol: 'FACTURADOR' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should pass branchId from request params to scope context', async () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)              // isPublic
      .mockReturnValueOnce(['dte:create']);     // requiredPermissions
    rbacService.hasPermissions.mockResolvedValue(true);

    const ctx = createMockContext(
      { id: 'u1', tenantId: 't1', rol: 'FACTURADOR' },
      { sucursalId: 'branch-1' },
    );
    await guard.canActivate(ctx);
    expect(rbacService.hasPermissions).toHaveBeenCalledWith(
      'u1', 't1', ['dte:create'], { branchId: 'branch-1', posId: undefined },
    );
  });
});
