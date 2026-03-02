'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface PlanFeatures {
  planCode: string;
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

const DEFAULT_FEATURES: PlanFeatures = {
  planCode: 'STARTER',
  maxDtesPerMonth: 300,
  maxClients: 100,
  maxCatalogItems: 300,
  recurringInvoices: true,
  templates: true,
  reports: false,
  apiAccess: false,
  accounting: true,
  advancedQuotes: false,
};

// Module-level cache to avoid re-fetching across components
let cachedFeatures: PlanFeatures | null = null;
let cachedFeatureCodes: FeatureCode[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize plan aliases to canonical codes.
 */
function normalizePlanCode(code: string): string {
  const upper = code.toUpperCase();
  const aliases: Record<string, string> = {
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
