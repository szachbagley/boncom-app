/**
 * Form-string <-> integer money conversions. The form holds strings (what the user
 * types); the calc module and the API need integer cents / basis points. Conversion is
 * done with integer arithmetic on the digit substrings — NEVER `parseFloat(x) * 100`,
 * which introduces float error (e.g. "19.99" * 100 = 1998.9999999999998 in JS).
 */

/** Non-negative decimal string, up to `maxDecimals` fractional digits. */
function parseDecimalToInteger(raw: string, maxDecimals: number): number | null {
  const s = raw.trim();
  if (s === '') return null;
  const pattern = new RegExp(`^(\\d+)(?:\\.(\\d{1,${maxDecimals}}))?$`);
  const match = pattern.exec(s);
  if (!match) return null;
  const wholePart = Number(match[1]);
  const fracDigits = (match[2] ?? '').padEnd(maxDecimals, '0');
  const fracPart = Number(fracDigits);
  return wholePart * 10 ** maxDecimals + fracPart;
}

function integerToDecimalString(value: number, maxDecimals: number): string {
  const scale = 10 ** maxDecimals;
  const whole = Math.floor(value / scale);
  const frac = value % scale;
  return `${whole}.${String(frac).padStart(maxDecimals, '0')}`;
}

/** Trims trailing zeros from a fixed-decimal string, and a trailing "." if left bare. */
function trimTrailingZeros(s: string): string {
  if (!s.includes('.')) return s;
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

/** "12.50" -> 1250 cents; null if not a valid non-negative <=2-decimal number. */
export function dollarsToCents(raw: string): number | null {
  return parseDecimalToInteger(raw, 2);
}

/** 1250 -> "12.50" (always 2 decimals; for prefilling a rate input). */
export function centsToInputString(cents: number): string {
  return integerToDecimalString(cents, 2);
}

/** "8.25" -> 825 basis points; null if invalid. */
export function percentToBasisPoints(raw: string): number | null {
  return parseDecimalToInteger(raw, 2);
}

/** 825 -> "8.25", 1000 -> "10", 850 -> "8.5" (no trailing zeros; for prefill). */
export function basisPointsToInputString(bp: number): string {
  return trimTrailingZeros(integerToDecimalString(bp, 2));
}

/** "2.5" -> 2.5; null if not a valid non-negative <=3-decimal number. */
export function parseQuantity(raw: string): number | null {
  const cents = parseDecimalToInteger(raw, 3);
  return cents === null ? null : cents / 1000;
}
