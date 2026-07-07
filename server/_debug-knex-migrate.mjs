import knexFactory from 'knex';

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`TIMED OUT after ${ms}ms: ${label}`)), ms),
    ),
  ]);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL first.');
    process.exit(1);
  }

  const db = knexFactory({
    client: 'mysql2',
    connection: process.env.DATABASE_URL,
  });

  try {
    console.log('\n--- Step 1: knex.raw(SELECT 1) ---');
    const result = await withTimeout(db.raw('SELECT 1 AS ok'), 10_000, 'raw SELECT 1');
    console.log('OK:', result[0]);

    console.log('\n--- Step 2: knex.migrate.status() ---');
    const status = await withTimeout(db.migrate.status(), 15_000, 'migrate.status()');
    console.log('OK, pending migrations remaining:', status);

    console.log('\n--- Step 3: knex.migrate.list() ---');
    const list = await withTimeout(db.migrate.list(), 15_000, 'migrate.list()');
    console.log('OK:', JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('\nFAILED:', err.message);
    console.error(err);
  } finally {
    await db.destroy();
  }
}

main();
