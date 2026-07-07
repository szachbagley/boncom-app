import { describe, it, expect } from 'vitest';
import { ValidationError } from './errors.js';
import {
  assertValidDiscount,
  assertValidStatusTransition,
  toCalcDiscount,
  toStoredDiscount,
} from './estimateRules.js';

describe('toCalcDiscount', () => {
  it('returns undefined when both stored fields are null (no discount)', () => {
    expect(toCalcDiscount(null, null)).toBeUndefined();
  });

  it('maps a percentage pair to the percentage union', () => {
    expect(toCalcDiscount('percentage', 1000)).toEqual({
      type: 'percentage',
      valueBasisPoints: 1000,
    });
  });

  it('maps a fixed pair to the fixed union', () => {
    expect(toCalcDiscount('fixed', 5000)).toEqual({
      type: 'fixed',
      amountCents: 5000,
    });
  });
});

describe('toStoredDiscount', () => {
  it('maps undefined (no discount) to both fields null', () => {
    expect(toStoredDiscount(undefined)).toEqual({
      discountType: null,
      discountValue: null,
    });
    expect(toStoredDiscount()).toEqual({ discountType: null, discountValue: null });
  });

  it('maps a percentage union to the stored pair', () => {
    expect(toStoredDiscount({ type: 'percentage', valueBasisPoints: 1000 })).toEqual({
      discountType: 'percentage',
      discountValue: 1000,
    });
  });

  it('maps a fixed union to the stored pair', () => {
    expect(toStoredDiscount({ type: 'fixed', amountCents: 5000 })).toEqual({
      discountType: 'fixed',
      discountValue: 5000,
    });
  });
});

describe('toCalcDiscount / toStoredDiscount round-trip', () => {
  it('is inverse for a percentage discount', () => {
    const original: Parameters<typeof toStoredDiscount>[0] = {
      type: 'percentage',
      valueBasisPoints: 1500,
    };
    const stored = toStoredDiscount(original);
    expect(toCalcDiscount(stored.discountType, stored.discountValue)).toEqual(original);
  });

  it('is inverse for a fixed discount', () => {
    const original: Parameters<typeof toStoredDiscount>[0] = {
      type: 'fixed',
      amountCents: 5000,
    };
    const stored = toStoredDiscount(original);
    expect(toCalcDiscount(stored.discountType, stored.discountValue)).toEqual(original);
  });

  it('is inverse for no discount', () => {
    const stored = toStoredDiscount(undefined);
    expect(toCalcDiscount(stored.discountType, stored.discountValue)).toBeUndefined();
  });
});

describe('assertValidDiscount', () => {
  it('passes when there is no discount', () => {
    expect(() => assertValidDiscount(undefined)).not.toThrow();
  });

  it('passes for a valid percentage discount', () => {
    expect(() =>
      assertValidDiscount({ type: 'percentage', valueBasisPoints: 1000 }),
    ).not.toThrow();
  });

  it('passes for a valid fixed discount', () => {
    expect(() => assertValidDiscount({ type: 'fixed', amountCents: 5000 })).not.toThrow();
  });

  it('passes for a zero-value discount (0% or $0 off are valid, just no-ops)', () => {
    expect(() =>
      assertValidDiscount({ type: 'percentage', valueBasisPoints: 0 }),
    ).not.toThrow();
    expect(() => assertValidDiscount({ type: 'fixed', amountCents: 0 })).not.toThrow();
  });

  it('throws ValidationError for a negative percentage value', () => {
    expect(() =>
      assertValidDiscount({ type: 'percentage', valueBasisPoints: -100 }),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for a negative fixed value', () => {
    expect(() => assertValidDiscount({ type: 'fixed', amountCents: -500 })).toThrow(
      ValidationError,
    );
  });

  it('throws ValidationError for a non-integer value', () => {
    expect(() =>
      assertValidDiscount({ type: 'percentage', valueBasisPoints: 100.5 }),
    ).toThrow(ValidationError);
  });
});

describe('assertValidStatusTransition', () => {
  it('allows draft -> draft', () => {
    expect(() => assertValidStatusTransition('draft', 'draft')).not.toThrow();
  });

  it('allows draft -> sent', () => {
    expect(() => assertValidStatusTransition('draft', 'sent')).not.toThrow();
  });

  it('allows sent -> sent', () => {
    expect(() => assertValidStatusTransition('sent', 'sent')).not.toThrow();
  });

  it('rejects sent -> draft (one-way transition)', () => {
    expect(() => assertValidStatusTransition('sent', 'draft')).toThrow(ValidationError);
  });
});
