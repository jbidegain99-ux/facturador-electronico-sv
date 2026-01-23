'use client';

import * as React from 'react';

interface UseApiOptions<T> {
  initialData?: T;
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (data: T | ((prev: T | undefined) => T)) => void;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export function useApi<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { initialData, enabled = true, refetchInterval, onSuccess, onError } = options;

  const [data, setData] = React.useState<T | undefined>(() => {
    // Check cache first
    if (key) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
      }
    }
    return initialData;
  });
  const [isLoading, setIsLoading] = React.useState(!data && enabled);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!enabled || !key) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      cache.set(key, { data: result, timestamp: Date.now() });
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, key, fetcher, onSuccess, onError]);

  // Initial fetch
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch interval
  React.useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchData]);

  const mutate = React.useCallback(
    (newData: T | ((prev: T | undefined) => T)) => {
      setData((prev) => {
        const result = typeof newData === 'function'
          ? (newData as (prev: T | undefined) => T)(prev)
          : newData;
        if (key) {
          cache.set(key, { data: result, timestamp: Date.now() });
        }
        return result;
      });
    },
    [key]
  );

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    mutate,
  };
}

// Mutation hook for POST/PUT/DELETE operations
interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: () => void;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
  data: TData | undefined;
  reset: () => void;
}

export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<TData | undefined>();

  const mutateAsync = React.useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        onSuccess?.(result, variables);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');
        setError(error);
        onError?.(error, variables);
        throw error;
      } finally {
        setIsLoading(false);
        onSettled?.();
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const mutate = React.useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Error is handled in state
      });
      return mutateAsync(variables);
    },
    [mutateAsync]
  );

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(undefined);
  }, []);

  return {
    mutate,
    mutateAsync,
    isLoading,
    error,
    data,
    reset,
  };
}

// Helper to create API fetcher with auth
export function createApiFetcher(baseUrl: string = '') {
  const apiUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || '';

  return async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    return response.json();
  };
}

// Pre-configured API fetcher
export const api = createApiFetcher();

// Cache invalidation helper
export function invalidateCache(keyOrPattern?: string | RegExp) {
  if (!keyOrPattern) {
    cache.clear();
    return;
  }

  if (typeof keyOrPattern === 'string') {
    cache.delete(keyOrPattern);
  } else {
    for (const key of cache.keys()) {
      if (keyOrPattern.test(key)) {
        cache.delete(key);
      }
    }
  }
}
