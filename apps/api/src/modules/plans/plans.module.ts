import { Module } from '@nestjs/common';
import { PlansAdminController, PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PlanFeaturesService } from './services/plan-features.service';
import { PlanSupportService } from './services/plan-support.service';
import { PlanFeatureGuard } from './guards/plan-feature.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PlansAdminController, PlansController],
  providers: [PlansService, PlanFeaturesService, PlanSupportService, PlanFeatureGuard],
  exports: [PlansService, PlanFeaturesService, PlanSupportService, PlanFeatureGuard],
})
export class PlansModule {}
