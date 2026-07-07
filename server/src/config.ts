/**
 * Runtime configuration, sourced from environment variables.
 * Railway injects PORT in production; fall back to 3001 for local dev.
 */
export const config = {
  port: Number(process.env.PORT) || 3001,
} as const;
