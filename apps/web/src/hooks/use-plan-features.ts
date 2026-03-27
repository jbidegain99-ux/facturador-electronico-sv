'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PlanFeatures {
  planCode: string;
  maxDtesPerMonth: number;
  maxClients: number;
  maxCatalogItems: number;
  maxBranches: number;
  recurringInvoices: boolean;
  templates: boolean;
  reports: boolean;
  apiAccess: boolean;
  accounting: boolean;
  advancedQuotes: boolean;
  externalEmail: boolean;
  haciendaSetup: boolean;
}

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
  | 'phone_support'
  | 'logo_branding'
  | 'external_email'
  | 'hacienda_setup_support'
  | 'custom_templates';

const DEFAULT_FEATURES: PlanFeatures = {
  planCode: 'FREE',
  maxDtesPerMonth: 10,
  maxClients: 10,
  maxCatalogItems: 50,
  maxBranches: 1,
  recurringInvoices: false,
  templates: false,
  reports: false,
  apiAccess: false,
  accounting: false,
  advancedQuotes: false,
  externalEmail: false,
  haciendaSetup: false,
};

// Module-level cache to avoid re-fetching across components
let cachedFeatures: PlanFeatures | null = null;
let cachedFeatureCodes: FeatureCode[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize plan aliases to canonical codes.
 * DEMO/TRIAL map to STARTER (not FREE) to preserve demo mode in dte.service.ts.
 */
function normalizePlanCode(code: string): string {
  const upper = code.toUpperCase();
  const aliases: Record<string, string> = {
    FREE: 'FREE',
    BASIC: 'STARTER',
    DEMO: 'STARTER',
    TRIAL: 'STARTER',
    PRO: 'PROFESSIONAL',
    PROFESIONAL: 'PROFESSIONAL',
    EMPRESARIAL: 'ENTERPRISE',
  };
  return aliases[upper] || upper;
}

export function usePlanFeatures() {
  const [features, setFeatures] = useState<PlanFeatures>(cachedFeatures ?? DEFAULT_FEATURES);
  const [featureCodes, setFeatureCodes] = useState<FeatureCode[]>(cachedFeatureCodes ?? []);
  const [loading, setLoading] = useState(!cachedFeatures);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;

    // Use cache if fresh
    if (cachedFeatures && cachedFeatureCodes && Date.now() - cacheTimestamp < CACHE_TTL) {
      setFeatures(cachedFeatures);
      setFeatureCodes(cachedFeatureCodes);
      setLoading(false);
      return;
    }

    fetchedRef.current = true;

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    let wasAuthError = false;
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch both endpoints in parallel
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/features`, { headers })
        .then((res) => {
          if (res.status === 401 || res.status === 403) {
            wasAuthError = true;
            return null;
          }
          if (!res.ok) return null;
          return res.json().catch(() => null) as Promise<PlanFeatures | null>;
        })
        .catch(() => null),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/tenant/features`, { headers })
        .then((res) => {
          if (!res.ok) return null;
          return res.json().catch(() => null) as Promise<{ planCode: string; features: FeatureCode[] } | null>;
        })
        .catch(() => null),
    ]).then(([legacyData, tenantData]) => {
      if (legacyData) {
        // Normalize plan code
        legacyData.planCode = normalizePlanCode(legacyData.planCode);
        cachedFeatures = legacyData;
        cacheTimestamp = Date.now();
        setFeatures(legacyData);
      }
      if (tenantData && Array.isArray(tenantData.features)) {
        cachedFeatureCodes = tenantData.features;
        setFeatureCodes(tenantData.features);
      }
    }).finally(() => {
      if (!wasAuthError) {
        setLoading(false);
      }
    });
  }, []);

  const hasFeature = useCallback(
    (code: FeatureCode): boolean => {
      return featureCodes.includes(code);
    },
    [featureCodes],
  );

  return { features, featureCodes, hasFeature, loading };
}
