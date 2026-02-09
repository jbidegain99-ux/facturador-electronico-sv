import { CanActivate } from '@nestjs/common';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
export declare function createMockUser(overrides?: Partial<CurrentUserData>): CurrentUserData;
export declare function createMockUserWithoutTenant(): CurrentUserData;
/**
 * Creates a mock AuthGuard that injects the given user onto the request.
 * Usage with NestJS testing:
 *   .overrideGuard(AuthGuard('jwt'))
 *   .useValue(createMockAuthGuard(mockUser))
 */
export declare function createMockAuthGuard(user: CurrentUserData): CanActivate;
//# sourceMappingURL=mock-user.d.ts.map