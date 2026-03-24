'use client';

import { useState, useEffect, useRef } from 'react';

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

    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/tenant/support`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null) as Promise<PlanSupportConfig | null>;
      })
      .then((data) => {
        if (data) {
          cachedSupport = data;
          supportCacheTimestamp = Date.now();
          setConfig(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { config, loading };
}
