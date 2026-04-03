'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface DteStatusResponse {
  id: string;
  estado: string;
  selloRecepcion?: string;
  codigoMh?: string;
  descripcionMh?: string;
}

const MAX_POLL_DURATION = 60000;

export function useDtePolling(dteId: string | null) {
  const [startedAt] = useState(() => Date.now());

  const shouldPoll = useCallback(
    (status: string | undefined): number | false => {
      if (!status) return 5000;
      if (status === 'PROCESADO' || status === 'RECHAZADO' || status === 'ANULADO') return false;
      if (Date.now() - startedAt > MAX_POLL_DURATION) return false;
      return 5000;
    },
    [startedAt],
  );

  const query = useQuery<DteStatusResponse>({
    queryKey: ['dte-status', dteId],
    queryFn: () => apiFetch<DteStatusResponse>(`/dte/${dteId}`),
    enabled: !!dteId,
    refetchInterval: (query) => shouldPoll(query.state.data?.estado),
  });

  const isTerminal = query.data?.estado === 'PROCESADO' || query.data?.estado === 'RECHAZADO';

  return {
    ...query,
    isTerminal,
    isPending: !!dteId && !isTerminal,
  };
}
