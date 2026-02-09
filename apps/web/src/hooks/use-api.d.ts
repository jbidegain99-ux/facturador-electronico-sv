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
export declare function useApi<T>(key: string | null, fetcher: () => Promise<T>, options?: UseApiOptions<T>): UseApiResult<T>;
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
export declare function useMutation<TData, TVariables = void>(mutationFn: (variables: TVariables) => Promise<TData>, options?: UseMutationOptions<TData, TVariables>): UseMutationResult<TData, TVariables>;
export declare function createApiFetcher(baseUrl?: string): <T>(endpoint: string, options?: RequestInit) => Promise<T>;
export declare const api: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
export declare function invalidateCache(keyOrPattern?: string | RegExp): void;
export {};
//# sourceMappingURL=use-api.d.ts.map