import { describe, it, expect } from 'vitest';
import {
  basisPointsToInputString,
  centsToInputString,
  dollarsToCents,
  parseQuantity,
  percentToBasisPoints,
} from './money.js';

describe('dollarsToCents', () => {
  it('parses a two-decimal value', () => {
    expect(dollarsToCents('12.50')).toBe(1250);
  });
  it('parses a one-decimal value', () => {
    expect(dollarsToCents('12.5')).toBe(1250);
  });
  it('parses a whole-dollar value', () => {
    expect(dollarsToCents('12')).toBe(1200);
  });
  it('parses a sub-dollar value with a leading zero', () => {
    expect(dollarsToCents('0.07')).toBe(7);
  });
  it('parses 19.99 exactly as 1999 (the classic float-error case)', () => {
    expect(dollarsToCents('19.99')).toBe(1999);
  });
  it('parses zero', () => {
    expect(dollarsToCents('0')).toBe(0);
  });
  it('trims surrounding whitespace', () => {
    expect(dollarsToCents('  12.50  ')).toBe(1250);
  });
  it('rejects an empty string', () => {
    expect(dollarsToCents('')).toBeNull();
  });
  it('rejects non-numeric input', () => {
    expect(dollarsToCents('abc')).toBeNull();
  });
  it('rejects more than 2 decimal places', () => {
    expect(dollarsToCents('12.999')).toBeNull();
  });
  it('rejects a negative value', () => {
    expect(dollarsToCents('-5')).toBeNull();
  });
  it('rejects a malformed number', () => {
    expect(dollarsToCents('1.2.3')).toBeNull();
  });
  it('rejects a currency symbol', () => {
    expect(dollarsToCents('$5')).toBeNull();
  });
});

describe('centsToInputString', () => {
  it('formats cents with a whole-dollar value', () => {
    expect(centsToInputString(1200)).toBe('12.00');
  });
  it('formats sub-dollar cents with a leading zero', () => {
    expect(centsToInputString(5)).toBe('0.05');
  });
  it('formats an exact value', () => {
    expect(centsToInputString(1250)).toBe('12.50');
  });
  it('formats zero', () => {
    expect(centsToInputString(0)).toBe('0.00');
  });
});

describe('percentToBasisPoints', () => {
  it('parses a two-decimal percentage', () => {
    expect(percentToBasisPoints('8.25')).toBe(825);
  });
  it('parses a whole percentage', () => {
    expect(percentToBasisPoints('10')).toBe(1000);
  });
  it('parses a one-decimal percentage', () => {
    expect(percentToBasisPoints('0.5')).toBe(50);
  });
  it('parses zero', () => {
    expect(percentToBasisPoints('0')).toBe(0);
  });
  it('rejects more than 2 decimal places', () => {
    expect(percentToBasisPoints('8.255')).toBeNull();
  });
  it('rejects a negative value', () => {
    expect(percentToBasisPoints('-1')).toBeNull();
  });
  it('rejects an empty string', () => {
    expect(percentToBasisPoints('')).toBeNull();
  });
});

describe('basisPointsToInputString', () => {
  it('formats a value needing two decimal places', () => {
    expect(basisPointsToInputString(825)).toBe('8.25');
  });
  it('formats a whole-percent value with no trailing decimal', () => {
    expect(basisPointsToInputString(1000)).toBe('10');
  });
  it('formats a value needing one decimal place', () => {
    expect(basisPointsToInputString(850)).toBe('8.5');
  });
  it('formats zero', () => {
    expect(basisPointsToInputString(0)).toBe('0');
  });
});

describe('parseQuantity', () => {
  it('parses a common fractional quantity', () => {
    expect(parseQuantity('2.5')).toBe(2.5);
  });
  it('parses a whole quantity', () => {
    expect(parseQuantity('3')).toBe(3);
  });
  it('parses a three-decimal quantity', () => {
    expect(parseQuantity('0.333')).toBe(0.333);
  });
  it('parses zero', () => {
    expect(parseQuantity('0')).toBe(0);
  });
  it('rejects more than 3 decimal places', () => {
    expect(parseQuantity('2.5001')).toBeNull();
  });
  it('rejects a negative value', () => {
    expect(parseQuantity('-1')).toBeNull();
  });
  it('rejects non-numeric input', () => {
    expect(parseQuantity('abc')).toBeNull();
  });
  it('rejects an empty string', () => {
    expect(parseQuantity('')).toBeNull();
  });
});
