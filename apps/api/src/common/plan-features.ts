/**
 * Plan feature definitions for feature gating.
 * 3 canonical plans: STARTER, PROFESSIONAL, ENTERPRISE
 * Legacy aliases: BASIC -> STARTER, PRO -> PROFESSIONAL, PROFESIONAL -> PROFESSIONAL,
 *   EMPRESARIAL -> ENTERPRISE, DEMO -> STARTER, TRIAL -> STARTER
 */

export enum PlanCode {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

/** Feature codes used in database-driven PlanFeature rows */
export type FeatureCode =
  | 'invoicing'
  | 'accounting'
  | 'catalog'
  | 'recurring_invoices'
  | 'quotes_b2b'
  | 'webhooks'
  | 'api_full'
  | 'advanced_reports'
  | 'ticket_support'
  | 'phone_support';

export const ALL_FEATURE_CODES: FeatureCode[] = [
  'invoicing',
  'accounting',
  'catalog',
  'recurring_invoices',
  'quotes_b2b',
  'webhooks',
  'api_full',
  'advanced_reports',
  'ticket_support',
  'phone_support',
];

/** Legacy PlanFeatures interface used by services that still read the old shape */
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

export interface PlanConfig {
  code: PlanCode;
  name: string;
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
  };
  limits: {
    dtes: number; // -1 = unlimited
    customers: number;
    users: number;
    storage: number; // GB, -1 = unlimited
  };
  features: Record<FeatureCode, boolean>;
}

export const PLAN_CONFIGS: Record<PlanCode, PlanConfig> = {
  [PlanCode.STARTER]: {
    code: PlanCode.STARTER,
    name: 'Starter',
    displayName: 'Plan Starter',
    price: { monthly: 15, yearly: 150 },
    limits: { dtes: 300, customers: 100, users: 3, storage: 1 },
    features: {
      invoicing: true,
      accounting: true,
      catalog: true,
      recurring_invoices: true,
      quotes_b2b: false,
      webhooks: false,
      api_full: false,
      advanced_reports: false,
      ticket_support: true,
      phone_support: false,
    },
  },
  [PlanCode.PROFESSIONAL]: {
    code: PlanCode.PROFESSIONAL,
    name: 'Professional',
    displayName: 'Plan Professional',
    price: { monthly: 65, yearly: 650 },
    limits: { dtes: 2000, customers: 500, users: 10, storage: 10 },
    features: {
      invoicing: true,
      accounting: true,
      catalog: true,
      recurring_invoices: true,
      quotes_b2b: true,
      webhooks: true,
      api_full: true,
      advanced_reports: true,
      ticket_support: true,
      phone_support: false,
    },
  },
  [PlanCode.ENTERPRISE]: {
    code: PlanCode.ENTERPRISE,
    name: 'Enterprise',
    displayName: 'Plan Enterprise',
    price: { monthly: 199, yearly: 2388 },
    limits: { dtes: -1, customers: -1, users: -1, storage: -1 },
    features: {
      invoicing: true,
      accounting: true,
      catalog: true,
      recurring_invoices: true,
      quotes_b2b: true,
      webhooks: true,
      api_full: true,
      advanced_reports: true,
      ticket_support: true,
      phone_support: true,
    },
  },
};

/**
 * Maps legacy/alternate plan codes to canonical codes.
 * DEMO and TRIAL are deprecated and map to STARTER.
 */
const PLAN_ALIASES: Record<string, string> = {
  BASIC: 'STARTER',
  PRO: 'PROFESSIONAL',
  PROFESIONAL: 'PROFESSIONAL',
  EMPRESARIAL: 'ENTERPRISE',
  DEMO: 'STARTER',
  TRIAL: 'STARTER',
};

/** Normalize a plan code to its canonical form. */
export function normalizePlanCode(planCode: string): string {
  const upper = planCode.toUpperCase();
  return PLAN_ALIASES[upper] || upper;
}

/**
 * Get legacy PlanFeatures shape for backward compatibility.
 * New code should use PLAN_CONFIGS directly.
 */
export function getPlanFeatures(planCode: string): PlanFeatures {
  const normalized = normalizePlanCode(planCode);
  const config = PLAN_CONFIGS[normalized as PlanCode];

  if (!config) {
    // Unknown plan code: return STARTER as default
    return getPlanFeatures(PlanCode.STARTER);
  }

  return {
    maxDtesPerMonth: config.limits.dtes,
    maxClients: config.limits.customers,
    maxCatalogItems: config.limits.dtes === -1 ? -1 : Math.min(config.limits.dtes, 1000),
    recurringInvoices: config.features.recurring_invoices,
    templates: config.features.recurring_invoices,
    reports: config.features.advanced_reports,
    apiAccess: config.features.api_full,
    accounting: config.features.accounting,
    advancedQuotes: config.features.quotes_b2b,
  };
}

/** Backwards-compatible PLAN_FEATURES map (used by tests and legacy code) */
export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  STARTER: getPlanFeatures(PlanCode.STARTER),
  PROFESSIONAL: getPlanFeatures(PlanCode.PROFESSIONAL),
  ENTERPRISE: getPlanFeatures(PlanCode.ENTERPRISE),
};
