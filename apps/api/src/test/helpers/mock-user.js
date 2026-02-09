"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockUser = createMockUser;
exports.createMockUserWithoutTenant = createMockUserWithoutTenant;
exports.createMockAuthGuard = createMockAuthGuard;
function createMockUser(overrides) {
    return {
        id: 'user-1',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        rol: 'ADMIN',
        tenant: { id: 'tenant-1', nombre: 'Test Tenant' },
        ...overrides,
    };
}
function createMockUserWithoutTenant() {
    return createMockUser({ tenantId: null, tenant: null });
}
/**
 * Creates a mock AuthGuard that injects the given user onto the request.
 * Usage with NestJS testing:
 *   .overrideGuard(AuthGuard('jwt'))
 *   .useValue(createMockAuthGuard(mockUser))
 */
function createMockAuthGuard(user) {
    return {
        canActivate(context) {
            const request = context.switchToHttp().getRequest();
            request.user = user;
            return true;
        },
    };
}
