import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlanFeaturesService } from './plan-features.service';

export interface SupportConfig {
  ticketSupportEnabled: boolean;
  ticketResponseHours: number;
  resolutionSLAHours: number;
  phoneSupportEnabled: boolean;
  phoneSupportHours: string | null;
  accountManagerEnabled: boolean;
  hasLiveChat: boolean;
  chatSchedule: string | null;
  priority: string;
}

const DEFAULT_SUPPORT: SupportConfig = {
  ticketSupportEnabled: false,
  ticketResponseHours: 0,
  resolutionSLAHours: 0,
  phoneSupportEnabled: false,
  phoneSupportHours: null,
  accountManagerEnabled: false,
  hasLiveChat: false,
  chatSchedule: null,
  priority: 'BAJA',
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
      resolutionSLAHours: config.resolutionSLAHours,
      phoneSupportEnabled: config.phoneSupportEnabled,
      phoneSupportHours: config.phoneSupportHours,
      accountManagerEnabled: config.accountManagerEnabled,
      hasLiveChat: config.hasLiveChat,
      chatSchedule: config.chatSchedule,
      priority: config.priority,
    };
  }

  async getTicketResponseTime(tenantId: string): Promise<number> {
    const planCode = await this.planFeaturesService.getTenantPlanCode(tenantId);
    const config = await this.getSupportConfig(planCode);
    return config.ticketResponseHours;
  }

  async getResolutionSLA(tenantId: string): Promise<number> {
    const planCode = await this.planFeaturesService.getTenantPlanCode(tenantId);
    const config = await this.getSupportConfig(planCode);
    return config.resolutionSLAHours;
  }

  async getTicketPriority(tenantId: string): Promise<string> {
    const planCode = await this.planFeaturesService.getTenantPlanCode(tenantId);
    const config = await this.getSupportConfig(planCode);
    return config.priority;
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
