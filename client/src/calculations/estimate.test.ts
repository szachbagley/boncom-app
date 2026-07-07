import { describe, it, expect } from 'vitest';
import {
  roundHalfUp,
  lineTotalCents,
  subtotalCents,
  discountAmountCents,
  discountedSubtotalCents,
  taxAmountCents,
  calculateEstimate,
} from './estimate.js';

// All expected values below are integer cents. Where a case exists to prove a
// specific rule (per-line rounding, discount-before-tax, clamp-at-zero), the
// comment says so. The end-to-end worked example is hand-computed in comments.

describe('roundHalfUp', () => {
  it('rounds halves away from zero (half-up), not banker’s', () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(2.5)).toBe(3); // banker's would give 2 — must be 3
    expect(roundHalfUp(3.5)).toBe(4);
  });

  it('rounds below-half down and above-half up', () => {
    expect(roundHalfUp(2.4)).toBe(2);
    expect(roundHalfUp(2.6)).toBe(3);
  });

  it('passes integers and zero through unchanged', () => {
    expect(roundHalfUp(0)).toBe(0);
    expect(roundHalfUp(5)).toBe(5);
  });

  it('handles negatives half-away-from-zero (bare Math.round would be wrong)', () => {
    expect(roundHalfUp(-0.5)).toBe(-1); // Math.round(-0.5) === -0/0 → wrong
    expect(roundHalfUp(-2.5)).toBe(-3); // Math.round(-2.5) === -2 → wrong
    expect(roundHalfUp(-2.4)).toBe(-2);
  });
});

describe('lineTotalCents', () => {
  it('computes an integer-quantity line exactly', () => {
    expect(lineTotalCents({ quantity: 3, rateCents: 999 })).toBe(2997);
  });

  it('computes a fractional quantity that lands on a whole cent', () => {
    expect(lineTotalCents({ quantity: 2.5, rateCents: 1250 })).toBe(3125);
  });

  it('rounds a fractional-cent line half-up', () => {
    // 1.75 * 1299 = 2273.25 → 2273 (below .5 rounds down)
    expect(lineTotalCents({ quantity: 1.75, rateCents: 1299 })).toBe(2273);
    // 2.5 * 999 = 2497.5 → 2498 (exactly .5 rounds up)
    expect(lineTotalCents({ quantity: 2.5, rateCents: 999 })).toBe(2498);
  });

  it('returns 0 for zero quantity or zero rate', () => {
    expect(lineTotalCents({ quantity: 0, rateCents: 1250 })).toBe(0);
    expect(lineTotalCents({ quantity: 3, rateCents: 0 })).toBe(0);
  });
});

describe('subtotalCents', () => {
  it('is 0 for no line items', () => {
    expect(subtotalCents([])).toBe(0);
  });

  it('sums rounded line totals', () => {
    // 2997 + 3125 = 6122
    expect(
      subtotalCents([
        { quantity: 3, rateCents: 999 },
        { quantity: 2.5, rateCents: 1250 },
      ]),
    ).toBe(6122);
  });

  it('rounds PER LINE then sums (not round-the-sum)', () => {
    // Each line: 0.5 * 1 = 0.5 → roundHalfUp → 1. Two lines → 2.
    // If we summed raw (0.5 + 0.5 = 1.0) then rounded, we'd get 1 — WRONG.
    expect(
      subtotalCents([
        { quantity: 0.5, rateCents: 1 },
        { quantity: 0.5, rateCents: 1 },
      ]),
    ).toBe(2);
  });
});

describe('discountAmountCents (raw amount)', () => {
  it('returns 0 when there is no discount', () => {
    expect(discountAmountCents(6122)).toBe(0);
    expect(discountAmountCents(6122, undefined)).toBe(0);
  });

  it('returns the fixed amount as-is', () => {
    expect(discountAmountCents(10000, { type: 'fixed', amountCents: 5000 })).toBe(
      5000,
    );
  });

  it('computes a percentage and rounds half-up', () => {
    // 6122 * 1000 / 10000 = 612.2 → 612
    expect(
      discountAmountCents(6122, { type: 'percentage', valueBasisPoints: 1000 }),
    ).toBe(612);
    // 125 * 1000 / 10000 = 12.5 → 13 (exactly .5 rounds up)
    expect(
      discountAmountCents(125, { type: 'percentage', valueBasisPoints: 1000 }),
    ).toBe(13);
  });

  it('returns the RAW fixed amount even when it exceeds the subtotal', () => {
    // The raw piece does not clamp; clamping is discountedSubtotalCents' job.
    expect(discountAmountCents(2000, { type: 'fixed', amountCents: 50000 })).toBe(
      50000,
    );
  });
});

describe('discountedSubtotalCents', () => {
  it('subtracts a fixed discount', () => {
    expect(
      discountedSubtotalCents(10000, { type: 'fixed', amountCents: 5000 }),
    ).toBe(5000);
  });

  it('subtracts a percentage discount', () => {
    // 6122 − 612 = 5510
    expect(
      discountedSubtotalCents(6122, {
        type: 'percentage',
        valueBasisPoints: 1000,
      }),
    ).toBe(5510);
  });

  it('equals the subtotal when there is no discount', () => {
    expect(discountedSubtotalCents(6122)).toBe(6122);
  });

  it('clamps to 0 when a fixed discount exceeds the subtotal (never negative)', () => {
    expect(
      discountedSubtotalCents(2000, { type: 'fixed', amountCents: 50000 }),
    ).toBe(0);
  });
});

describe('taxAmountCents', () => {
  it('computes tax and rounds half-up', () => {
    // 5510 * 825 / 10000 = 454.575 → 455
    expect(taxAmountCents(5510, 825)).toBe(455);
  });

  it('rounds an exact half up', () => {
    // 2 * 2500 / 10000 = 0.5 → 1
    expect(taxAmountCents(2, 2500)).toBe(1);
  });

  it('is 0 when the tax rate is 0', () => {
    expect(taxAmountCents(5510, 0)).toBe(0);
  });

  it('is 0 on a zero base', () => {
    expect(taxAmountCents(0, 825)).toBe(0);
  });
});

describe('calculateEstimate (end-to-end)', () => {
  it('matches the hand-computed worked example ($59.65)', () => {
    // ---- Computed BY HAND (anchors expected values to human arithmetic) ----
    // Line A: 2.5 * 1250 = 3125            → 3125
    // Line B: 3   *  999 = 2997            → 2997
    // subtotal           = 3125 + 2997     = 6122
    // discount 10%       = 6122 * 1000/10000 = 612.2 → 612
    // discountedSubtotal = 6122 − 612      = 5510
    // tax 8.25%          = 5510 * 825/10000 = 454.575 → 455
    // grandTotal         = 5510 + 455      = 5965  ($59.65)
    const totals = calculateEstimate({
      lineItems: [
        { quantity: 2.5, rateCents: 1250 },
        { quantity: 3, rateCents: 999 },
      ],
      discount: { type: 'percentage', valueBasisPoints: 1000 },
      taxRateBasisPoints: 825,
    });
    expect(totals).toEqual({
      lineTotalsCents: [3125, 2997],
      subtotalCents: 6122,
      discountAmountCents: 612,
      discountedSubtotalCents: 5510,
      taxAmountCents: 455,
      grandTotalCents: 5965,
    });
  });

  it('returns all zeros for an estimate with no line items', () => {
    const totals = calculateEstimate({
      lineItems: [],
      taxRateBasisPoints: 825,
    });
    expect(totals).toEqual({
      lineTotalsCents: [],
      subtotalCents: 0,
      discountAmountCents: 0,
      discountedSubtotalCents: 0,
      taxAmountCents: 0,
      grandTotalCents: 0,
    });
  });

  it('handles no discount and zero tax', () => {
    // subtotal = 5000 + 5000 = 10000; no discount; 0 tax
    const totals = calculateEstimate({
      lineItems: [
        { quantity: 1, rateCents: 5000 },
        { quantity: 2, rateCents: 2500 },
      ],
      taxRateBasisPoints: 0,
    });
    expect(totals).toEqual({
      lineTotalsCents: [5000, 5000],
      subtotalCents: 10000,
      discountAmountCents: 0,
      discountedSubtotalCents: 10000,
      taxAmountCents: 0,
      grandTotalCents: 10000,
    });
  });

  it('applies discount BEFORE tax (ordering invariant)', () => {
    // subtotal 10000; 50% discount → discounted 5000; 10% tax → 500 (grand 5500).
    // Tax-before-discount would tax 10000 → 1000. Asserting 500 proves ordering.
    const totals = calculateEstimate({
      lineItems: [{ quantity: 1, rateCents: 10000 }],
      discount: { type: 'percentage', valueBasisPoints: 5000 },
      taxRateBasisPoints: 1000,
    });
    expect(totals.discountedSubtotalCents).toBe(5000);
    expect(totals.taxAmountCents).toBe(500);
    expect(totals.grandTotalCents).toBe(5500);
  });

  it('clamps an over-large fixed discount to zero and reports the EFFECTIVE discount', () => {
    // subtotal 2000; fixed $500 (50000) discount exceeds it.
    // discountedSubtotal clamps to 0; effective discount reported = 2000 (so
    // subtotal − discountAmount === discountedSubtotal); tax on 0 = 0; grand 0.
    const totals = calculateEstimate({
      lineItems: [{ quantity: 1, rateCents: 2000 }],
      discount: { type: 'fixed', amountCents: 50000 },
      taxRateBasisPoints: 825,
    });
    expect(totals).toEqual({
      lineTotalsCents: [2000],
      subtotalCents: 2000,
      discountAmountCents: 2000,
      discountedSubtotalCents: 0,
      taxAmountCents: 0,
      grandTotalCents: 0,
    });
  });
});
