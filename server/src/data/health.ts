import { db } from './db.js';

/**
 * Data-layer connectivity probe: runs a trivial query through the shared Knex pool.
 * Returns true if the round-trip succeeds. Throws if the database is unreachable —
 * callers decide how to surface that.
 */
export async function pingDatabase(): Promise<boolean> {
  await db.raw('SELECT 1');
  return true;
}
