import { pool } from './pool.js';

/**
 * Data-layer connectivity probe: borrows a connection from the pool and pings
 * the database. Returns true if the round-trip succeeds. Throws if the database
 * is unreachable — callers decide how to surface that.
 */
export async function pingDatabase(): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}
