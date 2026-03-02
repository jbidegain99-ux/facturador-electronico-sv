import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlanFeaturesService } from './plan-features.service';

export interface SupportConfig {
  ticketSupportEnabled: boolean;
  ticketResponseHours: number;
  phoneSupportEnabled: boolean;
  phoneSupportHours: string | null;
  accountManagerEnabled: boolean;
}

const DEFAULT_SUPPORT: SupportConfig = {
  ticketSupportEnabled: false,
  ticketResponseHours: 0,
  phoneSupportEnabled: false,
  phoneSupportHours: null,
  accountManagerEnabled: false,
};

@Injectable()
export class PlanSupportService {
  constructor(
    private prisma: PrismaService,
    private planFeaturesService: PlanFeaturesService,
  ) {}

  async getSupportConfig(planCode: string): Promise<SupportConfig> {
    const config = await this.prisma.planSupportConfig.findUnique({
      where: { planCode },
    });

    if (!config) {
      return DEFAULT_SUPPORT;
    }

    return {
      ticketSupportEnabled: config.ticketSupportEnabled,
      ticketResponseHours: config.ticketResponseHours,
      phoneSupportEnabled: config.phoneSupportEnabled,
      phoneSupportHours: config.phoneSupportHours,
      accountManagerEnabled: config.accountManagerEnabled,
    };
  }

  async getTicketResponseTime(tenantId: string): Promise<number> {
    const planCode = await this.planFeaturesService.getTenantPlanCode(tenantId);
    const config = await this.getSupportConfig(planCode);
    return config.ticketResponseHours;
  }

  async hasPhoneSupport(tenantId: string): Promise<boolean> {
    const planCode = await this.planFeaturesService.getTenantPlanCode(tenantId);
    const config = await this.getSupportConfig(planCode);
    return config.phoneSupportEnabled;
  }

  async hasAccountManager(tenantId: string): Promise<boolean> {
    const planCode = await this.planFeaturesService.getTenantPlanCode(tenantId);
    const config = await this.getSupportConfig(planCode);
    return config.accountManagerEnabled;
  }
}
