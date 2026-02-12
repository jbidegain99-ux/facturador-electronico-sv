/**
 * Plan feature definitions for feature gating.
 * Canonical codes: DEMO, TRIAL, BASIC, PRO, ENTERPRISE
 * Legacy aliases: PROFESIONAL -> PRO, EMPRESARIAL -> ENTERPRISE, PROFESSIONAL -> PRO
 */

export interface PlanFeatures {
  maxDtesPerMonth: number;
  maxClients: number;
  maxCatalogItems: number;
  recurringInvoices: boolean;
  templates: boolean;
  reports: boolean;
  apiAccess: boolean;
  accounting: boolean;
  advancedQuotes: boolean;
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
    accounting: false,
    advancedQuotes: false,
  },
  TRIAL: {
    maxDtesPerMonth: 50,
    maxClients: 50,
    maxCatalogItems: 50,
    recurringInvoices: false,
    templates: false,
    reports: true,
    apiAccess: false,
    accounting: false,
    advancedQuotes: false,
  },
  BASIC: {
    maxDtesPerMonth: 100,
    maxClients: 100,
    maxCatalogItems: 100,
    recurringInvoices: false,
    templates: false,
    reports: true,
    apiAccess: false,
    accounting: false,
    advancedQuotes: false,
  },
  PRO: {
    maxDtesPerMonth: 500,
    maxClients: 500,
    maxCatalogItems: 500,
    recurringInvoices: true,
    templates: true,
    reports: true,
    apiAccess: false,
    accounting: true,
    advancedQuotes: true,
  },
  ENTERPRISE: {
    maxDtesPerMonth: -1,
    maxClients: -1,
    maxCatalogItems: -1,
    recurringInvoices: true,
    templates: true,
    reports: true,
    apiAccess: true,
    accounting: true,
    advancedQuotes: true,
  },
};

/**
 * Maps legacy/alternate plan codes to canonical codes.
 * Handles: PROFESIONAL->PRO, PROFESSIONAL->PRO, EMPRESARIAL->ENTERPRISE
 */
const PLAN_ALIASES: Record<string, string> = {
  PROFESIONAL: 'PRO',
  PROFESSIONAL: 'PRO',
  EMPRESARIAL: 'ENTERPRISE',
};

/** Normalize a plan code to its canonical form. */
export function normalizePlanCode(planCode: string): string {
  const upper = planCode.toUpperCase();
  return PLAN_ALIASES[upper] || upper;
}

export function getPlanFeatures(planCode: string): PlanFeatures {
  const normalized = normalizePlanCode(planCode);
  return PLAN_FEATURES[normalized] || PLAN_FEATURES['DEMO'];
}
