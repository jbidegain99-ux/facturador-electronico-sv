'use client';

import { useState, useEffect, useRef } from 'react';

export interface PlanFeatures {
  planCode: string;
  maxDtesPerMonth: number;
  maxClients: number;
  maxCatalogItems: number;
  recurringInvoices: boolean;
  templates: boolean;
  reports: boolean;
  apiAccess: boolean;
}

const DEFAULT_FEATURES: PlanFeatures = {
  planCode: 'DEMO',
  maxDtesPerMonth: 10,
  maxClients: 10,
  maxCatalogItems: 20,
  recurringInvoices: false,
  templates: false,
  reports: false,
  apiAccess: false,
};

// Module-level cache to avoid re-fetching across components
let cachedFeatures: PlanFeatures | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function usePlanFeatures() {
  const [features, setFeatures] = useState<PlanFeatures>(cachedFeatures ?? DEFAULT_FEATURES);
  const [loading, setLoading] = useState(!cachedFeatures);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;

    // Use cache if fresh
    if (cachedFeatures && Date.now() - cacheTimestamp < CACHE_TTL) {
      setFeatures(cachedFeatures);
      setLoading(false);
      return;
    }

    fetchedRef.current = true;

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/features`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<PlanFeatures>;
      })
      .then((data) => {
        if (data) {
          cachedFeatures = data;
          cacheTimestamp = Date.now();
          setFeatures(data);
        }
      })
      .catch(() => {
        // Non-critical — use defaults
      })
      .finally(() => setLoading(false));
  }, []);

  return { features, loading };
}
