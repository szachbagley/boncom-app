import type { Knex } from 'knex';
import { config } from '../../config.js';

/**
 * Local development seed. Inserts realistic sample data that also exercises every
 * calculation edge case (fractional quantities, both discount types, no discount,
 * zero/nonzero tax, over-large fixed discount, empty estimate). Stores INPUTS
 * only — totals are computed on read by the calculation module.
 *
 * LOCAL ONLY. A guard aborts unless DATABASE_URL points at localhost, so this can
 * never accidentally seed Railway. Idempotent: safe to re-run.
 */

/** Refuse to run against anything but a local database. */
function assertLocalDatabase(): void {
  const url = config.databaseUrl;
  if (!url) {
    throw new Error('DATABASE_URL is not set; cannot seed.');
  }
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error('DATABASE_URL is not a valid URL; refusing to seed.');
  }
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!isLocal) {
    throw new Error(
      `Refusing to seed a non-local database (host: "${host}"). ` +
        'Seeding is for local development only — never Railway.',
    );
  }
}

interface LineItemSeed {
  description: string;
  quantity: number; // fractional allowed (DECIMAL(12,3)); not money
  rate_cents: number; // integer cents
}

interface EstimateSeed {
  status: 'draft' | 'sent';
  tax_rate_basis_points: number; // integer basis points (8.25% -> 825)
  discount_type: 'percentage' | 'fixed' | null;
  // basis points when 'percentage', integer cents when 'fixed', null when no discount
  discount_value: number | null;
  lineItems: LineItemSeed[];
}

async function insertClient(knex: Knex, name: string): Promise<number> {
  const [id] = await knex('clients').insert({ name });
  if (id === undefined) {
    throw new Error(`Failed to insert client "${name}"`);
  }
  return id;
}

async function insertEstimate(
  knex: Knex,
  clientId: number,
  estimate: EstimateSeed,
): Promise<void> {
  const [estimateId] = await knex('estimates').insert({
    client_id: clientId,
    status: estimate.status,
    tax_rate_basis_points: estimate.tax_rate_basis_points,
    discount_type: estimate.discount_type,
    discount_value: estimate.discount_value,
  });
  if (estimateId === undefined) {
    throw new Error('Failed to insert estimate');
  }

  if (estimate.lineItems.length > 0) {
    await knex('line_items').insert(
      estimate.lineItems.map((item) => ({
        estimate_id: estimateId,
        description: item.description,
        quantity: item.quantity,
        rate_cents: item.rate_cents,
      })),
    );
  }
}

export async function seed(knex: Knex): Promise<void> {
  assertLocalDatabase();

  // Idempotent reset. Delete child -> parent: clients->estimates is ON DELETE
  // RESTRICT, so clients can only be removed after their estimates are gone.
  await knex('line_items').del();
  await knex('estimates').del();
  await knex('clients').del();

  const acme = await insertClient(knex, 'Acme Corp');
  const globex = await insertClient(knex, 'Globex');
  const initech = await insertClient(knex, 'Initech');

  // E1 — canonical example from the estimate-calculations skill (grand total $59.65).
  // sent; 8.25% tax; 10% percentage discount; fractional quantity.
  await insertEstimate(knex, acme, {
    status: 'sent',
    tax_rate_basis_points: 825,
    discount_type: 'percentage',
    discount_value: 1000,
    lineItems: [
      { description: 'Design consultation', quantity: 2.5, rate_cents: 1250 },
      { description: 'Concept revisions', quantity: 3, rate_cents: 999 },
    ],
  });

  // E2 — draft; zero tax; no discount.
  await insertEstimate(knex, acme, {
    status: 'draft',
    tax_rate_basis_points: 0,
    discount_type: null,
    discount_value: null,
    lineItems: [
      { description: 'Logo package', quantity: 1, rate_cents: 5000 },
      { description: 'Business cards', quantity: 2, rate_cents: 2500 },
    ],
  });

  // E3 — sent; 7% tax; $50 fixed discount; fractional quantity.
  await insertEstimate(knex, globex, {
    status: 'sent',
    tax_rate_basis_points: 700,
    discount_type: 'fixed',
    discount_value: 5000,
    lineItems: [
      { description: 'Campaign strategy', quantity: 4, rate_cents: 3000 },
      { description: 'Copywriting', quantity: 1.25, rate_cents: 1600 },
    ],
  });

  // E4 — draft; 8.25% tax; $500 fixed discount that EXCEEDS the subtotal
  // (1 x $20.00 = $2,000c). Exercises the clamp-to-zero path.
  await insertEstimate(knex, globex, {
    status: 'draft',
    tax_rate_basis_points: 825,
    discount_type: 'fixed',
    discount_value: 50000,
    lineItems: [
      { description: 'Discovery call', quantity: 1, rate_cents: 2000 },
    ],
  });

  // E5 — sent; 5% tax; 15% percentage discount; DECIMAL(12,3) quantities that
  // produce fractional cents per line (exercises per-line half-up rounding).
  await insertEstimate(knex, initech, {
    status: 'sent',
    tax_rate_basis_points: 500,
    discount_type: 'percentage',
    discount_value: 1500,
    lineItems: [
      { description: 'Engineering hours', quantity: 1.75, rate_cents: 1299 },
      { description: 'Materials', quantity: 0.333, rate_cents: 10000 },
    ],
  });

  // E6 — draft; no line items. Exercises the empty-estimate (subtotal 0) path.
  await insertEstimate(knex, initech, {
    status: 'draft',
    tax_rate_basis_points: 0,
    discount_type: null,
    discount_value: null,
    lineItems: [],
  });
}
