import { API_BASE_URL } from '../config.js';

/** An API error response: { error, details? } per server/docs/API-REFERENCE.md. */
export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Shared fetch wrapper for every api/ function. Always throws ApiError (never returns
 * null) for a non-2xx response — including 404 — so callers have one consistent error
 * path; the hooks layer decides how to present a given status. Handles 204 No Content
 * (DELETE) by resolving with no value.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const errorBody = body as { error?: string; details?: Record<string, string[]> } | undefined;
    throw new ApiError(
      response.status,
      errorBody?.error ?? `Request failed with status ${response.status}`,
      errorBody?.details,
    );
  }

  return body as T;
}
