import { CanActivate, ExecutionContext } from '@nestjs/common';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

export function createMockUser(overrides?: Partial<CurrentUserData>): CurrentUserData {
  return {
    id: 'user-1',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    rol: 'ADMIN',
    tenant: { id: 'tenant-1', nombre: 'Test Tenant' },
    ...overrides,
  };
}

export function createMockUserWithoutTenant(): CurrentUserData {
  return createMockUser({ tenantId: null, tenant: null });
}

/**
 * Creates a mock AuthGuard that injects the given user onto the request.
 * Usage with NestJS testing:
 *   .overrideGuard(AuthGuard('jwt'))
 *   .useValue(createMockAuthGuard(mockUser))
 */
export function createMockAuthGuard(user: CurrentUserData): CanActivate {
  return {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      request.user = user;
      return true;
    },
  };
}
