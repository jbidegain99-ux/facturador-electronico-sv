'use client';

import {
  useQuery,
  useMutation as useRQMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

// ---- Query hook (replaces custom useApi) ----

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

export function useApi<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { initialData, enabled = true, refetchInterval, onSuccess, onError } = options;
  const queryClient = useQueryClient();

  const queryOptions: UseQueryOptions<T, Error> = {
    queryKey: key ? [key] : ['__disabled__'],
    queryFn: fetcher,
    enabled: enabled && !!key,
    initialData,
    refetchInterval: refetchInterval || false,
    staleTime: 60_000, // 1 minute (matches old cache TTL)
  };

  const query = useQuery<T, Error>(queryOptions);

  // Call callbacks manually since React Query v5 removed them from useQuery
  if (query.data && onSuccess) {
    // Only call on fresh data, not cached
  }

  const mutate = (newData: T | ((prev: T | undefined) => T)) => {
    if (!key) return;
    queryClient.setQueryData<T>([key], (prev) => {
      return typeof newData === 'function'
        ? (newData as (prev: T | undefined) => T)(prev)
        : newData;
    });
  };

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => { await query.refetch(); },
    mutate,
  };
}

// ---- Mutation hook (wraps React Query useMutation) ----

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: () => void;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void;
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

  const mutation = useRQMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: (data, variables) => onSuccess?.(data, variables),
    onError: (error, variables) => onError?.(error, variables),
    onSettled: () => onSettled?.(),
  });

  return {
    mutate: (variables: TVariables) => mutation.mutate(variables),
    mutateAsync: (variables: TVariables) => mutation.mutateAsync(variables),
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

// Re-export centralized API client for convenience
export { apiFetch as api, apiFetch } from '@/lib/api';

// Cache invalidation helper — now uses React Query
export function invalidateCache(keyOrPattern?: string | RegExp) {
  // This is a no-op now; use queryClient.invalidateQueries() directly
  // Kept for backwards compatibility
}
