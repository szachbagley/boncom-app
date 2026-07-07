import { pingDatabase } from '../data/health.js';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  db: 'up' | 'down';
}

/**
 * Assembles the app health status, including a live database connectivity check.
 * The app process is reported as `ok` whenever it can serve requests; the `db`
 * field reflects whether the database round-trip currently succeeds. A DB outage
 * is surfaced as `db: 'down'`, never as a thrown error — the endpoint must not
 * crash when an upstream dependency is unavailable.
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  let db: HealthStatus['db'] = 'down';
  try {
    db = (await pingDatabase()) ? 'up' : 'down';
  } catch {
    db = 'down';
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    db,
  };
}
