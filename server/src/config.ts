/**
 * Runtime configuration, sourced from environment variables.
 *
 * For local dev we load `.env` via Node's built-in `process.loadEnvFile()`
 * (no dotenv dependency needed — CLAUDE.md prefers the standard library).
 * In production (Railway) there is no `.env` file; the platform injects env
 * vars directly, so the load is wrapped in try/catch and simply falls back to
 * the ambient process environment.
 */
try {
  process.loadEnvFile();
} catch {
  // No `.env` file present (e.g. Railway/production). Use ambient env vars.
}

export const config = {
  /** Railway injects PORT in production; fall back to 3001 for local dev. */
  port: Number(process.env.PORT) || 3001,
  /**
   * MySQL connection string. Local dev points at the Docker MySQL (see
   * docker-compose.yml); production is Railway's private MYSQL_URL. Same
   * variable name, different value per environment.
   */
  databaseUrl: process.env.DATABASE_URL,
} as const;
