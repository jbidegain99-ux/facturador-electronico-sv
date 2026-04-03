'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';

export interface PlanSupportConfig {
  planCode: string;
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

const DEFAULT_SUPPORT: PlanSupportConfig = {
  planCode: 'FREE',
  ticketSupportEnabled: true,
  ticketResponseHours: 0,
  resolutionSLAHours: 0,
  phoneSupportEnabled: false,
  phoneSupportHours: null,
  accountManagerEnabled: false,
  hasLiveChat: false,
  chatSchedule: null,
  priority: 'BAJA',
};

let cachedSupport: PlanSupportConfig | null = null;
let supportCacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function usePlanSupport() {
  const [config, setConfig] = useState<PlanSupportConfig>(cachedSupport ?? DEFAULT_SUPPORT);
  const [loading, setLoading] = useState(!cachedSupport);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;

    if (cachedSupport && Date.now() - supportCacheTimestamp < CACHE_TTL) {
      setConfig(cachedSupport);
      setLoading(false);
      return;
    }

    fetchedRef.current = true;

    apiFetch<PlanSupportConfig>('/plans/tenant/support')
      .then((data) => {
        cachedSupport = data;
        supportCacheTimestamp = Date.now();
        setConfig(data);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { config, loading };
}
