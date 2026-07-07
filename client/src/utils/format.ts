/**
 * The ONLY place money/percent formatting happens on the frontend. The API speaks
 * integer cents and basis points; components must never do ad-hoc division — always
 * go through these functions. Dividing by 100 here is a terminal, rounded-for-display
 * conversion (not arithmetic that could accumulate error) — the estimate-calculations
 * skill carves this out as the frontend's job, not the calc module's.
 */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Integer cents -> formatted dollar string, e.g. 5965 -> "$59.65". */
export function centsToDisplay(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Integer basis points -> formatted percent string, e.g. 825 -> "8.25%". */
export function basisPointsToPercent(basisPoints: number): string {
  return `${percentFormatter.format(basisPoints / 100)}%`;
}
