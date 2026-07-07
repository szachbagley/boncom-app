import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Knex } from 'knex';
import { config } from '../config.js';

/**
 * Knex configuration. The connection comes from DATABASE_URL (via config.ts),
 * never a hardcoded URL. The SAME migrate/seed commands target either database
 * by swapping the connection string:
 *   - local dev (default): config loads server/.env → Docker MySQL
 *   - Railway (manual):     DATABASE_URL=$MYSQL_PUBLIC_URL npm run migrate
 *     (an explicitly-set DATABASE_URL wins; loadEnvFile does not override it)
 */
const databaseUrl = config.databaseUrl;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Set it in server/.env for local dev, or pass it ' +
      'explicitly (e.g. DATABASE_URL=$MYSQL_PUBLIC_URL npm run migrate) to target Railway.',
  );
}

// Resolve migration/seed dirs relative to THIS file, so the commands work
// regardless of the process working directory.
const dataDir = path.dirname(fileURLToPath(import.meta.url));

const knexConfig: Knex.Config = {
  client: 'mysql2',
  connection: databaseUrl,
  migrations: {
    directory: path.join(dataDir, 'migrations'),
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: path.join(dataDir, 'seeds'),
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};

export default knexConfig;
