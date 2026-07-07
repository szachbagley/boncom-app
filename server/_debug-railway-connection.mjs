import mysql from 'mysql2/promise';

async function attempt(label, options) {
  console.log(`\n--- Attempt: ${label} ---`);
  try {
    const conn = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      connectTimeout: 10_000,
      ...options,
    });
    console.log('Connected successfully!');
    const [rows] = await conn.query('SELECT 1 + 1 AS result');
    console.log('Query result:', rows);
    await conn.end();
    return true;
  } catch (err) {
    console.error('Failed:', err.code || err.name, '-', err.message);
    return false;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL first.');
    process.exit(1);
  }

  const okPlain = await attempt('no SSL (plain)', {});
  if (okPlain) return;

  await attempt('SSL, no cert verification', { ssl: { rejectUnauthorized: false } });
}

main();
