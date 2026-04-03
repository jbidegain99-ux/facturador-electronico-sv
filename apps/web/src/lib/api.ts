/**
 * Centralized API client — single source of truth for all API calls.
 * Uses HTTP-only cookie auth (set by API on login).
 * Falls back to localStorage token for backwards compatibility during migration.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

let isRefreshing = false;

async function tryRefreshAuth(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Detect MH-related 503 outage
    if (response.status === 503 && endpoint.includes('/dte')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('mh-outage'));
      }
    }

    // On 401, attempt a single token refresh and retry
    if (response.status === 401 && !_isRetry) {
      const refreshed = await tryRefreshAuth();
      if (refreshed) {
        return apiFetch<T>(endpoint, options, true);
      }
    }

    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `HTTP error ${response.status}`);
    (error as ApiError).status = response.status;
    (error as ApiError).data = errorData;
    throw error;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

export interface ApiError extends Error {
  status: number;
  data: Record<string, unknown>;
}

/** Upload files with multipart/form-data */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

/** Fetch that returns the raw Response (for blobs, streams, etc.) */
export async function apiRawFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  });
}
