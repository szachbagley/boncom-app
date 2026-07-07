/**
 * Frontend runtime configuration.
 * The API base URL comes from a Vite env var (VITE_API_BASE_URL), never a literal.
 * Falls back to the local backend for development.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
