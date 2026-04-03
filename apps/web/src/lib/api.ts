/**
 * Centralized API client — single source of truth for all API calls.
 * Uses HTTP-only cookie auth (set by API on login).
 * Falls back to localStorage token for backwards compatibility during migration.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
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
