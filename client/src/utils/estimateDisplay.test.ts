import { describe, it, expect } from 'vitest';
import type { EstimateDetail } from '../api/types.js';
import { discountNote, pairLineItemsWithTotals } from './estimateDisplay.js';

function makeEstimate(overrides: Partial<EstimateDetail> = {}): EstimateDetail {
  return {
    id: 1, clientId: 1, projectName: 'Test', status: 'draft',
    taxRateBasisPoints: 825, createdAt: '', updatedAt: '',
    lineItems: [
      { id: 10, estimateId: 1, description: 'Design consultation', quantity: 2.5, rateCents: 1250 },
      { id: 11, estimateId: 1, description: 'Concept revisions', quantity: 3, rateCents: 999 },
    ],
    totals: {
      lineTotalsCents: [3125, 2997], subtotalCents: 6122, discountAmountCents: 612,
      discountedSubtotalCents: 5510, taxAmountCents: 455, grandTotalCents: 5965,
    },
    ...overrides,
  };
}

describe('pairLineItemsWithTotals', () => {
  it('zips each line item with its positional total, preserving order', () => {
    const result = pairLineItemsWithTotals(makeEstimate());
    expect(result).toEqual([
      { id: 10, description: 'Design consultation', totalCents: 3125 },
      { id: 11, description: 'Concept revisions', totalCents: 2997 },
    ]);
  });

  it('returns an empty array for an estimate with no line items', () => {
    const result = pairLineItemsWithTotals(
      makeEstimate({ lineItems: [], totals: { ...makeEstimate().totals, lineTotalsCents: [] } }),
    );
    expect(result).toEqual([]);
  });

  it('throws if a line item has no corresponding computed total (contract violation)', () => {
    const broken = makeEstimate();
    broken.totals = { ...broken.totals, lineTotalsCents: [3125] }; // one short
    expect(() => pairLineItemsWithTotals(broken)).toThrow();
  });
});

describe('discountNote', () => {
  it('returns the formatted percentage for a percentage discount', () => {
    expect(discountNote({ type: 'percentage', valueBasisPoints: 1000 })).toBe('(10%)');
  });

  it('returns null for a fixed discount', () => {
    expect(discountNote({ type: 'fixed', amountCents: 5000 })).toBeNull();
  });

  it('returns null when there is no discount', () => {
    expect(discountNote(undefined)).toBeNull();
  });
});
