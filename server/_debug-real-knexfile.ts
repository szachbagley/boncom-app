import knexFactory from 'knex';
import knexConfig from './src/data/knexfile.js';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMED OUT after ${ms}ms: ${label}`)), ms),
    ),
  ]);
}

async function main() {
  console.log('Resolved knexfile config:', {
    client: knexConfig.client,
    connection: typeof knexConfig.connection,
    migrations: knexConfig.migrations,
  });

  const db = knexFactory(knexConfig);

  try {
    console.log('\n--- knex.raw(SELECT 1) using the REAL knexfile.ts ---');
    const result = await withTimeout(db.raw('SELECT 1 AS ok'), 10_000, 'raw SELECT 1');
    console.log('OK:', result[0]);

    console.log('\n--- knex.migrate.status() using the REAL knexfile.ts ---');
    const status = await withTimeout(db.migrate.status(), 15_000, 'migrate.status()');
    console.log('OK, pending migrations remaining:', status);
  } catch (err) {
    console.error('FAILED:', err);
  } finally {
    await db.destroy();
  }
}

main();
