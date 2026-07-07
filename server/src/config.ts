import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Runtime configuration, sourced from environment variables.
 *
 * For local dev we load `.env` via Node's built-in `process.loadEnvFile()`
 * (no dotenv dependency needed — CLAUDE.md prefers the standard library).
 * In production (Railway) there is no `.env` file; the platform injects env
 * vars directly, so the load is wrapped in try/catch and simply falls back to
 * the ambient process environment.
 *
 * The `.env` path is resolved relative to THIS file (always `server/.env`),
 * not the process cwd: some tools (e.g. the Knex CLI) change cwd to the
 * knexfile's directory before importing config, so a cwd-relative lookup would
 * miss `server/.env`. Works for both `tsx` (src/) and compiled `dist/` — each
 * is one level below `server/`.
 */
const envPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '.env',
);
try {
  process.loadEnvFile(envPath);
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
  /**
   * Browser origins allowed by CORS, from CORS_ALLOWED_ORIGINS (comma-separated,
   * to allow the production Vercel origin plus any preview deployments). Local dev
   * falls back to the Vite dev server. Never hardcode the deployed URL.
   */
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
} as const;
