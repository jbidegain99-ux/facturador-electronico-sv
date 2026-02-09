'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
exports.useApi = useApi;
exports.useMutation = useMutation;
exports.createApiFetcher = createApiFetcher;
exports.invalidateCache = invalidateCache;
const React = __importStar(require("react"));
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute
function useApi(key, fetcher, options = {}) {
    const { initialData, enabled = true, refetchInterval, onSuccess, onError } = options;
    const [data, setData] = React.useState(() => {
        // Check cache first
        if (key) {
            const cached = cache.get(key);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.data;
            }
        }
        return initialData;
    });
    const [isLoading, setIsLoading] = React.useState(!data && enabled);
    const [error, setError] = React.useState(null);
    const fetchData = React.useCallback(async () => {
        if (!enabled || !key)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetcher();
            setData(result);
            cache.set(key, { data: result, timestamp: Date.now() });
            onSuccess?.(result);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('An error occurred');
            setError(error);
            onError?.(error);
        }
        finally {
            setIsLoading(false);
        }
    }, [enabled, key, fetcher, onSuccess, onError]);
    // Initial fetch
    React.useEffect(() => {
        fetchData();
    }, [fetchData]);
    // Refetch interval
    React.useEffect(() => {
        if (!refetchInterval || !enabled)
            return;
        const interval = setInterval(fetchData, refetchInterval);
        return () => clearInterval(interval);
    }, [refetchInterval, enabled, fetchData]);
    const mutate = React.useCallback((newData) => {
        setData((prev) => {
            const result = typeof newData === 'function'
                ? newData(prev)
                : newData;
            if (key) {
                cache.set(key, { data: result, timestamp: Date.now() });
            }
            return result;
        });
    }, [key]);
    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
        mutate,
    };
}
function useMutation(mutationFn, options = {}) {
    const { onSuccess, onError, onSettled } = options;
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [data, setData] = React.useState();
    const mutateAsync = React.useCallback(async (variables) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await mutationFn(variables);
            setData(result);
            onSuccess?.(result, variables);
            return result;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('An error occurred');
            setError(error);
            onError?.(error, variables);
            throw error;
        }
        finally {
            setIsLoading(false);
            onSettled?.();
        }
    }, [mutationFn, onSuccess, onError, onSettled]);
    const mutate = React.useCallback((variables) => {
        mutateAsync(variables).catch(() => {
            // Error is handled in state
        });
        return mutateAsync(variables);
    }, [mutateAsync]);
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
function createApiFetcher(baseUrl = '') {
    const apiUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || '';
    return async function apiFetch(endpoint, options = {}) {
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
exports.api = createApiFetcher();
// Cache invalidation helper
function invalidateCache(keyOrPattern) {
    if (!keyOrPattern) {
        cache.clear();
        return;
    }
    if (typeof keyOrPattern === 'string') {
        cache.delete(keyOrPattern);
    }
    else {
        Array.from(cache.keys()).forEach((key) => {
            if (keyOrPattern.test(key)) {
                cache.delete(key);
            }
        });
    }
}
