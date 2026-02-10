/**
 * Plan feature definitions for feature gating.
 * Maps plan codes (DEMO, TRIAL, BASIC, PRO, ENTERPRISE) to their feature flags.
 */

export interface PlanFeatures {
  maxDtesPerMonth: number;
  maxClients: number;
  maxCatalogItems: number;
  recurringInvoices: boolean;
  templates: boolean;
  reports: boolean;
  apiAccess: boolean;
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  DEMO: {
    maxDtesPerMonth: 10,
    maxClients: 10,
    maxCatalogItems: 20,
    recurringInvoices: false,
    templates: false,
    reports: false,
    apiAccess: false,
  },
  TRIAL: {
    maxDtesPerMonth: 50,
    maxClients: 50,
    maxCatalogItems: 50,
    recurringInvoices: false,
    templates: false,
    reports: true,
    apiAccess: false,
  },
  BASIC: {
    maxDtesPerMonth: 100,
    maxClients: 100,
    maxCatalogItems: 100,
    recurringInvoices: false,
    templates: false,
    reports: true,
    apiAccess: false,
  },
  PRO: {
    maxDtesPerMonth: 500,
    maxClients: 500,
    maxCatalogItems: 500,
    recurringInvoices: true,
    templates: true,
    reports: true,
    apiAccess: false,
  },
  ENTERPRISE: {
    maxDtesPerMonth: -1,
    maxClients: -1,
    maxCatalogItems: -1,
    recurringInvoices: true,
    templates: true,
    reports: true,
    apiAccess: true,
  },
};

export function getPlanFeatures(planCode: string): PlanFeatures {
  return PLAN_FEATURES[planCode] || PLAN_FEATURES['DEMO'];
}
