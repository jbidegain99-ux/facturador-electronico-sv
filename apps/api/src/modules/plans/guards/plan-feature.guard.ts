import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_REQUIRED_KEY } from '../decorators/require-feature.decorator';
import { PlanFeaturesService } from '../services/plan-features.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CurrentUserData } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  private readonly logger = new Logger(PlanFeatureGuard.name);

  constructor(
    private reflector: Reflector,
    private planFeaturesService: PlanFeaturesService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string | undefined>(
      FEATURE_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No feature requirement — allow
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserData | undefined;

    if (!user?.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }

    const planCode = await this.planFeaturesService.getTenantPlanCode(user.tenantId);
    const hasAccess = await this.planFeaturesService.checkFeatureAccess(planCode, requiredFeature);

    if (!hasAccess) {
      // Track denied attempt (fire-and-forget)
      this.prisma.tenantFeatureUsage
        .upsert({
          where: {
            tenantId_featureCode: {
              tenantId: user.tenantId,
              featureCode: requiredFeature,
            },
          },
          create: {
            tenantId: user.tenantId,
            featureCode: requiredFeature,
            usageCount: 1,
          },
          update: {
            usageCount: { increment: 1 },
          },
        })
        .catch((err: Error) => {
          this.logger.warn(`Failed to track denied feature usage: ${err.message}`);
        });

      throw new ForbiddenException(
        `Tu plan actual (${planCode}) no incluye esta funcionalidad. Actualiza tu plan para acceder a esta característica.`,
      );
    }

    return true;
  }
}
