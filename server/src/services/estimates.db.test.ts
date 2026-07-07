import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../data/db.js';
import { createClient, deleteClient } from '../data/clients.js';
import { NotFoundError, ValidationError } from './errors.js';
import {
  createEstimate,
  deleteEstimate,
  getEstimate,
  listEstimates,
  setEstimateStatus,
  updateEstimate,
} from './estimates.js';

/**
 * Integration tests for the estimate service against the real local Docker MySQL
 * (run via `npm run test:integration`, not `npm test`). Self-contained and
 * self-cleaning: everything created here is a throwaway client + its estimates,
 * removed in afterAll so the seed data (server/src/data/seeds) is never touched.
 */

const TEST_CLIENT_NAME = `__service_test__${Date.now()}`;
let testClientId: number;
const createdEstimateIds: number[] = [];
const NONEXISTENT_ID = 999_999_999;

beforeAll(async () => {
  const client = await createClient({ name: TEST_CLIENT_NAME });
  testClientId = client.id;
});

afterAll(async () => {
  for (const id of createdEstimateIds) {
    await deleteEstimate(id);
  }
  await deleteClient(testClientId);
  await db.destroy();
});

describe('createEstimate', () => {
  it('computes totals matching the hand-computed worked example ($59.65)', async () => {
    // Same worked example as the estimate-calculations skill / calc module tests.
    const detail = await createEstimate({
      clientId: testClientId,
      projectName: 'Worked Example',
      taxRateBasisPoints: 825,
      discount: { type: 'percentage', valueBasisPoints: 1000 },
      lineItems: [
        { description: 'Design consultation', quantity: 2.5, rateCents: 1250 },
        { description: 'Concept revisions', quantity: 3, rateCents: 999 },
      ],
    });
    createdEstimateIds.push(detail.id);

    expect(detail.status).toBe('draft'); // default when omitted
    expect(detail.discount).toEqual({ type: 'percentage', valueBasisPoints: 1000 });
    expect(detail.totals).toEqual({
      lineTotalsCents: [3125, 2997],
      subtotalCents: 6122,
      discountAmountCents: 612,
      discountedSubtotalCents: 5510,
      taxAmountCents: 455,
      grandTotalCents: 5965,
    });
  });

  it('creates an estimate with no discount', async () => {
    const detail = await createEstimate({
      clientId: testClientId,
      projectName: 'No Discount',
      taxRateBasisPoints: 0,
      lineItems: [{ description: 'Item', quantity: 1, rateCents: 1000 }],
    });
    createdEstimateIds.push(detail.id);

    expect(detail.discount).toBeUndefined();
    expect(detail.totals.discountAmountCents).toBe(0);
    expect(detail.totals.grandTotalCents).toBe(1000);
  });

  it('throws NotFoundError for an unknown clientId', async () => {
    await expect(
      createEstimate({
        clientId: NONEXISTENT_ID,
        projectName: 'Ghost Client',
        taxRateBasisPoints: 0,
        lineItems: [],
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError for an invalid (negative) discount value', async () => {
    await expect(
      createEstimate({
        clientId: testClientId,
        projectName: 'Bad Discount',
        taxRateBasisPoints: 0,
        discount: { type: 'fixed', amountCents: -500 },
        lineItems: [],
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe('getEstimate', () => {
  it('returns null for a nonexistent id', async () => {
    expect(await getEstimate(NONEXISTENT_ID)).toBeNull();
  });

  it('returns the estimate with line items and totals', async () => {
    const created = await createEstimate({
      clientId: testClientId,
      projectName: 'Fetch Me',
      taxRateBasisPoints: 0,
      lineItems: [{ description: 'Item', quantity: 2, rateCents: 500 }],
    });
    createdEstimateIds.push(created.id);

    const fetched = await getEstimate(created.id);
    expect(fetched?.lineItems).toHaveLength(1);
    expect(fetched?.totals.grandTotalCents).toBe(1000);
  });
});

describe('listEstimates', () => {
  it('returns summaries (no lineItems/totals keys) with the discount adapted, and applies filters', async () => {
    const withDiscount = await createEstimate({
      clientId: testClientId,
      projectName: 'List Me',
      status: 'sent',
      taxRateBasisPoints: 0,
      discount: { type: 'percentage', valueBasisPoints: 2000 },
      lineItems: [],
    });
    createdEstimateIds.push(withDiscount.id);

    const list = await listEstimates({ clientId: testClientId });
    const found = list.find((e) => e.id === withDiscount.id);
    expect(found).toBeDefined();
    expect(found).not.toHaveProperty('lineItems');
    expect(found).not.toHaveProperty('totals');
    expect(found?.discount).toEqual({ type: 'percentage', valueBasisPoints: 2000 });

    const sentOnly = await listEstimates({ clientId: testClientId, status: 'sent' });
    expect(sentOnly.length).toBeGreaterThanOrEqual(1);
    expect(sentOnly.every((e) => e.status === 'sent')).toBe(true);
  });
});

describe('updateEstimate', () => {
  it('replaces estimate-level fields and the entire line-item set, recomputing totals', async () => {
    const created = await createEstimate({
      clientId: testClientId,
      projectName: 'Before Update',
      taxRateBasisPoints: 0,
      lineItems: [
        { description: 'Old A', quantity: 1, rateCents: 1000 },
        { description: 'Old B', quantity: 1, rateCents: 2000 },
      ],
    });
    createdEstimateIds.push(created.id);

    const updated = await updateEstimate(created.id, {
      projectName: 'After Update',
      status: 'draft',
      taxRateBasisPoints: 1000, // 10%
      discount: { type: 'fixed', amountCents: 200 },
      lineItems: [{ description: 'New Line', quantity: 2, rateCents: 1500 }],
    });

    expect(updated?.projectName).toBe('After Update');
    expect(updated?.lineItems).toHaveLength(1);
    expect(updated?.lineItems[0]?.description).toBe('New Line');
    // subtotal = 2*1500 = 3000; fixed discount 200 -> discounted 2800; 10% tax -> 280; grand 3080
    expect(updated?.totals).toEqual({
      lineTotalsCents: [3000],
      subtotalCents: 3000,
      discountAmountCents: 200,
      discountedSubtotalCents: 2800,
      taxAmountCents: 280,
      grandTotalCents: 3080,
    });
  });

  it('rejects sent -> draft and leaves the estimate unchanged', async () => {
    const sentEstimate = await createEstimate({
      clientId: testClientId,
      projectName: 'Sent Estimate',
      status: 'sent',
      taxRateBasisPoints: 0,
      lineItems: [{ description: 'Line', quantity: 1, rateCents: 1000 }],
    });
    createdEstimateIds.push(sentEstimate.id);

    await expect(
      updateEstimate(sentEstimate.id, {
        projectName: 'Attempted Revert',
        status: 'draft',
        taxRateBasisPoints: 0,
        lineItems: [],
      }),
    ).rejects.toThrow(ValidationError);

    const stillSent = await getEstimate(sentEstimate.id);
    expect(stillSent?.status).toBe('sent');
    expect(stillSent?.projectName).toBe('Sent Estimate');
    expect(stillSent?.lineItems).toHaveLength(1); // rejected update touched nothing
  });

  it('returns null when updating a nonexistent id', async () => {
    const result = await updateEstimate(NONEXISTENT_ID, {
      projectName: 'Nope',
      status: 'draft',
      taxRateBasisPoints: 0,
      lineItems: [],
    });
    expect(result).toBeNull();
  });
});

describe('setEstimateStatus', () => {
  it('allows draft -> sent, then rejects sent -> draft', async () => {
    const created = await createEstimate({
      clientId: testClientId,
      projectName: 'Status Flow',
      taxRateBasisPoints: 0,
      lineItems: [],
    });
    createdEstimateIds.push(created.id);
    expect(created.status).toBe('draft');

    const sent = await setEstimateStatus(created.id, 'sent');
    expect(sent?.status).toBe('sent');

    await expect(setEstimateStatus(created.id, 'draft')).rejects.toThrow(ValidationError);

    const stillSent = await getEstimate(created.id);
    expect(stillSent?.status).toBe('sent');
  });

  it('returns null for a nonexistent id', async () => {
    expect(await setEstimateStatus(NONEXISTENT_ID, 'sent')).toBeNull();
  });
});

describe('deleteEstimate', () => {
  it('deletes an estimate, returning false on a second attempt', async () => {
    const created = await createEstimate({
      clientId: testClientId,
      projectName: 'To Delete',
      taxRateBasisPoints: 0,
      lineItems: [],
    });
    // not added to createdEstimateIds — this test deletes it itself

    const firstDelete = await deleteEstimate(created.id);
    expect(firstDelete).toBe(true);

    const secondDelete = await deleteEstimate(created.id);
    expect(secondDelete).toBe(false);

    expect(await getEstimate(created.id)).toBeNull();
  });
});
