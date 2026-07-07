import type { Discount } from '../calculations/estimate.js';
import type { DiscountType, EstimateStatus } from '../data/types.js';
import { ValidationError } from './errors.js';

/**
 * Pure business rules for estimates: adapting between the stored discount pair and
 * the calc module's discriminated union, and validating discount values and status
 * transitions. No I/O; same inputs always produce the same outputs/throws.
 */

/** Stored (DB) discount pair -> the calc module's discriminated union. Absent when both are null. */
export function toCalcDiscount(
  discountType: DiscountType | null,
  discountValue: number | null,
): Discount | undefined {
  if (discountType === null || discountValue === null) {
    return undefined;
  }
  return discountType === 'percentage'
    ? { type: 'percentage', valueBasisPoints: discountValue }
    : { type: 'fixed', amountCents: discountValue };
}

/** The calc module's discriminated union -> the stored (DB) discount pair. */
export function toStoredDiscount(
  discount?: Discount,
): { discountType: DiscountType | null; discountValue: number | null } {
  if (!discount) {
    return { discountType: null, discountValue: null };
  }
  return discount.type === 'percentage'
    ? { discountType: 'percentage', discountValue: discount.valueBasisPoints }
    : { discountType: 'fixed', discountValue: discount.amountCents };
}

/**
 * Runtime sanity check on a discount's numeric value. The "type set without value"
 * invalid state is already inexpressible because Discount is a union (see the type
 * itself) — this guards the value/amount a caller could still pass as negative or
 * non-integer despite the well-typed shape.
 */
export function assertValidDiscount(discount?: Discount): void {
  if (!discount) {
    return;
  }
  const amount =
    discount.type === 'percentage' ? discount.valueBasisPoints : discount.amountCents;
  if (!Number.isInteger(amount) || amount < 0) {
    throw new ValidationError(
      `Invalid discount ${discount.type} value: ${amount}. Must be a non-negative integer.`,
    );
  }
}

/**
 * One-way status transition: once 'sent', an estimate can never revert to 'draft'.
 * draft->draft, draft->sent, and sent->sent are all allowed.
 */
export function assertValidStatusTransition(
  current: EstimateStatus,
  next: EstimateStatus,
): void {
  if (current === 'sent' && next === 'draft') {
    throw new ValidationError('An estimate cannot move from "sent" back to "draft".');
  }
}
