'use client';

import { useState, useCallback } from 'react';

interface DteError {
  userMessage: string;
  suggestedAction: string;
  resolvable: boolean;
  errorCode: string;
}

interface SendDteResult {
  success: boolean;
  dteId?: string;
  codigoGeneracion?: string;
  selloRecibido?: string;
  userMessage?: string;
  suggestedAction?: string;
  resolvable?: boolean;
  errorCode?: string;
  error?: string;
}

export function useSendDte() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DteError | null>(null);

  const send = useCallback(async (dteId: string, nit: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${apiUrl}/transmitter/send/${dteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nit, password }),
      });

      const data: SendDteResult = await response.json();

      if (!response.ok || !data.success) {
        const dteError: DteError = {
          userMessage: data.userMessage || data.error || 'Error al transmitir DTE',
          suggestedAction: data.suggestedAction || 'Intenta nuevamente o contacta a soporte.',
          resolvable: data.resolvable ?? false,
          errorCode: data.errorCode || 'UNKNOWN',
        };
        setError(dteError);
        return { ...data, success: false };
      }

      return data;
    } catch (err) {
      const networkError: DteError = {
        userMessage: 'Error de conexion. Intenta nuevamente.',
        suggestedAction: 'Verifica tu conexion a internet.',
        resolvable: false,
        errorCode: 'NETWORK_ERROR',
      };
      setError(networkError);
      return { success: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { send, loading, error, clearError };
}
