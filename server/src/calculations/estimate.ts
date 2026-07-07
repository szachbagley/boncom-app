/**
 * Estimate calculation module — the single source of truth for all estimate money math.
 * Pure: no I/O, no DB, no side effects; same inputs always produce the same outputs.
 * All amounts in and out are integer cents. See the `estimate-calculations` skill for
 * the full rules (integer-cents arithmetic, per-line half-up rounding, discount-before-tax).
 */

export interface LineItemInput {
  /** Fractional allowed (e.g. 2.5). The one non-integer input; NOT money. */
  quantity: number;
  /** Integer cents per unit (e.g. $12.50 → 1250). Never a float. */
  rateCents: number;
}

export type Discount =
  | { type: 'percentage'; valueBasisPoints: number } // 10% → 1000
  | { type: 'fixed'; amountCents: number }; // $50 → 5000

export interface EstimateCalcInput {
  lineItems: LineItemInput[];
  /** Absent → no discount. */
  discount?: Discount;
  /** Integer basis points (8.25% → 825). 0 allowed. */
  taxRateBasisPoints: number;
}

export interface EstimateTotals {
  /** Rounded per line, in input order, so the UI never recomputes money. */
  lineTotalsCents: number[];
  subtotalCents: number;
  /** Effective discount applied (clamped so subtotal − this === discountedSubtotal). */
  discountAmountCents: number;
  discountedSubtotalCents: number;
  taxAmountCents: number;
  grandTotalCents: number;
}

/** 100% in basis points (10_000 bp = 100%). */
const BASIS_POINTS_DENOMINATOR = 10_000;

/** Round to the nearest integer, half away from zero (half-up). */
export function roundHalfUp(value: number): number {
  // Math.sign * round(abs) keeps half-up correct for negatives too
  // (bare Math.round(-2.5) === -2, not -3).
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** One line's total: roundHalfUp(quantity * rateCents), whole cents. */
export function lineTotalCents(item: LineItemInput): number {
  // quantity (fractional, not money) × rateCents (integer cents) → the one
  // sanctioned fractional multiply; rounded to whole cents immediately.
  return roundHalfUp(item.quantity * item.rateCents);
}

/** Sum of every line's ROUNDED line total. Empty → 0. */
export function subtotalCents(items: LineItemInput[]): number {
  // Rounding happens per line (above), so this is pure integer addition.
  return items.reduce((sum, item) => sum + lineTotalCents(item), 0);
}

/**
 * Raw discount amount computed from the subtotal (per discount type).
 * Fixed → amountCents as-is; percentage → roundHalfUp(subtotal * bp / 10_000).
 * No discount → 0. This is the RAW amount; it may exceed the subtotal for a large
 * fixed discount (the clamp lives in discountedSubtotalCents).
 */
export function discountAmountCents(subtotal: number, discount?: Discount): number {
  if (!discount) {
    return 0;
  }
  switch (discount.type) {
    case 'fixed':
      return discount.amountCents;
    case 'percentage':
      return roundHalfUp(
        (subtotal * discount.valueBasisPoints) / BASIS_POINTS_DENOMINATOR,
      );
  }
}

/** max(0, subtotal − rawDiscount): the discount can never drive this negative. */
export function discountedSubtotalCents(
  subtotal: number,
  discount?: Discount,
): number {
  return Math.max(0, subtotal - discountAmountCents(subtotal, discount));
}

/** Tax on the DISCOUNTED subtotal: roundHalfUp(discountedSubtotal * bp / 10_000). */
export function taxAmountCents(
  discountedSubtotal: number,
  taxRateBasisPoints: number,
): number {
  return roundHalfUp(
    (discountedSubtotal * taxRateBasisPoints) / BASIS_POINTS_DENOMINATOR,
  );
}

/** Compose the full pipeline and return every derived number the UI/API needs. */
export function calculateEstimate(input: EstimateCalcInput): EstimateTotals {
  const lineTotals = input.lineItems.map(lineTotalCents);
  const subtotal = lineTotals.reduce((sum, cents) => sum + cents, 0);

  const discountedSubtotal = discountedSubtotalCents(subtotal, input.discount);
  // Effective discount = what was actually removed, so the reported numbers
  // reconcile (subtotal − discountAmount === discountedSubtotal) even when a
  // large fixed discount is clamped. Equals min(rawDiscount, subtotal).
  const effectiveDiscount = subtotal - discountedSubtotal;

  const tax = taxAmountCents(discountedSubtotal, input.taxRateBasisPoints);

  return {
    lineTotalsCents: lineTotals,
    subtotalCents: subtotal,
    discountAmountCents: effectiveDiscount,
    discountedSubtotalCents: discountedSubtotal,
    taxAmountCents: tax,
    grandTotalCents: discountedSubtotal + tax,
  };
}
