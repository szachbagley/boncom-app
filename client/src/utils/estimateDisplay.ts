import { basisPointsToPercent } from './format.js';
import type { Discount, EstimateDetail } from '../api/types.js';

/**
 * Display-mapping helpers for the estimate detail view. Both are pure, deterministic
 * transformations that are easy to get subtly wrong (a silent zip error shows a
 * plausible but WRONG dollar figure next to the wrong line) — TDD'd like the calc module.
 */

export interface DisplayLineItem {
  id: number;
  description: string;
  totalCents: number;
}

/**
 * Zips lineItems with totals.lineTotalsCents by position (the API returns them as
 * parallel arrays in the same order). Throws if they don't line up — a real contract
 * violation should be loud, never silently mis-paired.
 */
export function pairLineItemsWithTotals(estimate: EstimateDetail): DisplayLineItem[] {
  return estimate.lineItems.map((item, index) => {
    const totalCents = estimate.totals.lineTotalsCents[index];
    if (totalCents === undefined) {
      throw new Error(`Missing computed total for line item at index ${index}`);
    }
    return { id: item.id, description: item.description, totalCents };
  });
}

/** `(10%)` for a percentage discount; null for fixed or no discount. */
export function discountNote(discount: Discount | undefined): string | null {
  if (!discount || discount.type !== 'percentage') return null;
  return `(${basisPointsToPercent(discount.valueBasisPoints)})`;
}
