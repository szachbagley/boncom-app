import mysql from 'mysql2/promise';
import { config } from '../config.js';

/**
 * Shared MySQL connection pool. A pool (not a per-request connection) is created
 * once at module load and reused across the app — connections are borrowed and
 * released per query, avoiding the cost of connecting on every request.
 *
 * `createPool` is lazy: it does NOT open a socket here, so importing this module
 * never fails just because the database is momentarily unreachable. Only actual
 * queries connect, which lets the health check report DB status gracefully.
 */
if (!config.databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Copy server/.env.example to server/.env ' +
      '(see server/README.md for the local Docker MySQL setup).',
  );
}

export const pool = mysql.createPool(config.databaseUrl);
