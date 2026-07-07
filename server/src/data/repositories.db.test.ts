import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from './db.js';
import {
  createClient,
  deleteClient,
  getClientById,
  listClients,
  updateClient,
} from './clients.js';
import {
  createEstimate,
  deleteEstimate,
  getEstimateById,
  listEstimates,
  updateEstimate,
  updateEstimateWithLineItems,
} from './estimates.js';
import {
  createLineItem,
  deleteLineItem,
  getLineItemById,
  listLineItemsByEstimate,
  updateLineItem,
} from './lineItems.js';

/**
 * Integration tests against the real local Docker MySQL (run via
 * `npm run test:integration`, not `npm test`). Self-contained and self-cleaning:
 * everything created here is a throwaway client + its estimates/line items,
 * removed in afterAll so the seed data (server/src/data/seeds) is never touched.
 */

const TEST_CLIENT_NAME = `__dal_test__${Date.now()}`;
let testClientId: number;
const createdEstimateIds: number[] = [];

beforeAll(async () => {
  const client = await createClient({ name: TEST_CLIENT_NAME });
  testClientId = client.id;
});

afterAll(async () => {
  // Children before parent: estimates before the client (client_id is RESTRICT).
  for (const id of createdEstimateIds) {
    await deleteEstimate(id);
  }
  await deleteClient(testClientId);
  await db.destroy();
});

describe('clients repository', () => {
  it('creates and reads a client', async () => {
    const client = await getClientById(testClientId);
    expect(client).not.toBeNull();
    expect(client?.name).toBe(TEST_CLIENT_NAME);
    expect(client?.createdAt).toBeInstanceOf(Date);
  });

  it('updates a client name', async () => {
    const updatedName = `${TEST_CLIENT_NAME}_renamed`;
    const updated = await updateClient(testClientId, { name: updatedName });
    expect(updated?.name).toBe(updatedName);

    // restore the name so later assertions in this file can rely on TEST_CLIENT_NAME
    await updateClient(testClientId, { name: TEST_CLIENT_NAME });
  });

  it('lists clients including the test client', async () => {
    const clients = await listClients();
    expect(clients.some((c) => c.id === testClientId)).toBe(true);
  });
});

describe('estimates repository (aggregate root)', () => {
  it('creates an estimate with initial line items, including a fractional quantity', async () => {
    const estimate = await createEstimate({
      clientId: testClientId,
      projectName: 'Spring Brand Refresh',
      status: 'sent',
      taxRateBasisPoints: 825,
      discountType: 'percentage',
      discountValue: 1000,
      lineItems: [
        { description: 'Design consultation', quantity: 2.5, rateCents: 1250 },
        { description: 'Concept revisions', quantity: 3, rateCents: 999 },
      ],
    });
    createdEstimateIds.push(estimate.id);

    expect(estimate.clientId).toBe(testClientId);
    expect(estimate.projectName).toBe('Spring Brand Refresh');
    expect(estimate.status).toBe('sent');
    expect(estimate.taxRateBasisPoints).toBe(825);
    expect(estimate.discountType).toBe('percentage');
    expect(estimate.discountValue).toBe(1000);
    expect(estimate.lineItems).toHaveLength(2);
    expect(estimate.lineItems[0]?.description).toBe('Design consultation');
    expect(estimate.lineItems[0]?.quantity).toBe(2.5); // DECIMAL string converted to number
    expect(estimate.lineItems[1]?.quantity).toBe(3);
  });

  it('reads the estimate back with line items in insertion order', async () => {
    const estimateId = createdEstimateIds[0];
    expect(estimateId).toBeDefined();
    const estimate = await getEstimateById(estimateId as number);
    expect(estimate).not.toBeNull();
    expect(estimate?.lineItems.map((li) => li.description)).toEqual([
      'Design consultation',
      'Concept revisions',
    ]);
  });

  it('updates estimate-level columns (status and discount)', async () => {
    const estimateId = createdEstimateIds[0] as number;
    const updated = await updateEstimate(estimateId, {
      status: 'draft',
      discountType: 'fixed',
      discountValue: 500,
    });
    expect(updated?.status).toBe('draft');
    expect(updated?.discountType).toBe('fixed');
    expect(updated?.discountValue).toBe(500);
    // line items are untouched by an estimate-level update
    expect(updated?.lineItems).toHaveLength(2);
  });

  it('renames an estimate via projectName (round-trips; line items untouched)', async () => {
    const estimateId = createdEstimateIds[0] as number;
    const renamed = await updateEstimate(estimateId, {
      projectName: 'Renamed Project',
    });
    expect(renamed?.projectName).toBe('Renamed Project');
    expect(renamed?.lineItems).toHaveLength(2);

    // restore the original name so later assertions in this file can rely on it
    await updateEstimate(estimateId, { projectName: 'Spring Brand Refresh' });
  });

  it('creates a second estimate to exercise listEstimates filters', async () => {
    const estimate = await createEstimate({
      clientId: testClientId,
      projectName: 'Q3 Social Campaign',
      status: 'sent',
      taxRateBasisPoints: 0,
    });
    createdEstimateIds.push(estimate.id);
    expect(estimate.projectName).toBe('Q3 Social Campaign');
    expect(estimate.lineItems).toEqual([]); // no line items provided → empty, not error
  });

  it('lists estimates filtered by clientId', async () => {
    const estimates = await listEstimates({ clientId: testClientId });
    expect(estimates.length).toBeGreaterThanOrEqual(2);
    expect(estimates.every((e) => e.clientId === testClientId)).toBe(true);
  });

  it('lists estimates filtered by status', async () => {
    const sent = await listEstimates({ clientId: testClientId, status: 'sent' });
    expect(sent.length).toBeGreaterThanOrEqual(1);
    expect(sent.every((e) => e.status === 'sent')).toBe(true);

    const draft = await listEstimates({ clientId: testClientId, status: 'draft' });
    expect(draft.some((e) => e.id === createdEstimateIds[0])).toBe(true);
  });

  it('updateEstimateWithLineItems atomically replaces estimate fields AND the entire line-item set', async () => {
    const estimate = await createEstimate({
      clientId: testClientId,
      projectName: 'Bulk Replace Target',
      status: 'draft',
      taxRateBasisPoints: 0,
      lineItems: [
        { description: 'Original line A', quantity: 1, rateCents: 1000 },
        { description: 'Original line B', quantity: 2, rateCents: 2000 },
      ],
    });
    createdEstimateIds.push(estimate.id);
    expect(estimate.lineItems).toHaveLength(2);

    const replaced = await updateEstimateWithLineItems(
      estimate.id,
      { projectName: 'Renamed via bulk replace', taxRateBasisPoints: 500 },
      [{ description: 'Replacement line', quantity: 3, rateCents: 3000 }],
    );
    expect(replaced?.projectName).toBe('Renamed via bulk replace');
    expect(replaced?.taxRateBasisPoints).toBe(500);
    expect(replaced?.lineItems).toHaveLength(1); // old two are GONE, not appended
    expect(replaced?.lineItems[0]?.description).toBe('Replacement line');

    const reReplaced = await updateEstimateWithLineItems(
      estimate.id,
      {},
      [], // empty array is valid: leaves the estimate with zero line items, not an error
    );
    expect(reReplaced?.lineItems).toHaveLength(0);
  });
});

describe('line items repository', () => {
  it('adds a line item to an existing estimate', async () => {
    const estimateId = createdEstimateIds[0] as number;
    const lineItem = await createLineItem(estimateId, {
      description: 'Extra revision round',
      quantity: 1,
      rateCents: 4500,
    });
    expect(lineItem.estimateId).toBe(estimateId);
    expect(lineItem.rateCents).toBe(4500);

    const lines = await listLineItemsByEstimate(estimateId);
    expect(lines).toHaveLength(3); // the original 2 + this one
    expect(lines[2]?.id).toBe(lineItem.id); // insertion order preserved
  });

  it('updates a line item', async () => {
    const estimateId = createdEstimateIds[0] as number;
    const lines = await listLineItemsByEstimate(estimateId);
    const target = lines[2];
    expect(target).toBeDefined();

    const updated = await updateLineItem((target as { id: number }).id, {
      rateCents: 5000,
    });
    expect(updated?.rateCents).toBe(5000);
    expect(updated?.description).toBe('Extra revision round'); // untouched field preserved
  });

  it('deletes a line item', async () => {
    const estimateId = createdEstimateIds[0] as number;
    const lines = await listLineItemsByEstimate(estimateId);
    const target = lines[2];
    expect(target).toBeDefined();
    const targetId = (target as { id: number }).id;

    const deleted = await deleteLineItem(targetId);
    expect(deleted).toBe(true);
    expect(await getLineItemById(targetId)).toBeNull();

    const remaining = await listLineItemsByEstimate(estimateId);
    expect(remaining).toHaveLength(2);
  });
});

describe('foreign key behavior', () => {
  it('rejects deleting a client that still has estimates (ON DELETE RESTRICT)', async () => {
    await expect(deleteClient(testClientId)).rejects.toThrow();
  });

  it('cascades line item deletion when the parent estimate is deleted (ON DELETE CASCADE)', async () => {
    const estimateId = createdEstimateIds[0] as number;
    const linesBefore = await listLineItemsByEstimate(estimateId);
    expect(linesBefore.length).toBeGreaterThan(0);

    const deleted = await deleteEstimate(estimateId);
    expect(deleted).toBe(true);

    const linesAfter = await listLineItemsByEstimate(estimateId);
    expect(linesAfter).toHaveLength(0); // cascaded away with the estimate

    // remove from the cleanup list — it no longer exists
    createdEstimateIds.splice(createdEstimateIds.indexOf(estimateId), 1);
  });
});
