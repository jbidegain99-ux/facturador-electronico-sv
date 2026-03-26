import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
  });

  const createMockContext = (user?: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  it('should allow public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(true); // isPublic
    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('should allow @SkipTenantCheck routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)  // isPublic
      .mockReturnValueOnce(true);  // skipTenant
    expect(guard.canActivate(createMockContext())).toBe(true);
  });

  it('should allow SUPER_ADMIN without tenantId', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = createMockContext({ id: 'u1', rol: 'SUPER_ADMIN', tenantId: null });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow user with valid tenantId', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = createMockContext({ id: 'u1', rol: 'ADMIN', tenantId: 'tenant-1' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user has no tenantId', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const ctx = createMockContext({ id: 'u1', rol: 'FACTURADOR', tenantId: null });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow when no user is present (handled by JwtAuthGuard)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    expect(guard.canActivate(createMockContext(undefined))).toBe(true);
  });
});
