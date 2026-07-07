import { describe, it, expect } from 'vitest';
import { centsToDisplay, basisPointsToPercent } from './format.js';

describe('centsToDisplay', () => {
  it('formats the canonical worked example ($59.65)', () => {
    expect(centsToDisplay(5965)).toBe('$59.65');
  });
  it('formats zero', () => {
    expect(centsToDisplay(0)).toBe('$0.00');
  });
  it('formats a single-digit-cents value with a leading zero', () => {
    expect(centsToDisplay(5)).toBe('$0.05');
  });
  it('formats a whole-dollar amount with .00', () => {
    expect(centsToDisplay(5000)).toBe('$50.00');
  });
  it('inserts a thousands separator for large amounts', () => {
    expect(centsToDisplay(100000)).toBe('$1,000.00');
  });
});

describe('basisPointsToPercent', () => {
  it('formats a value needing two decimal places', () => {
    expect(basisPointsToPercent(825)).toBe('8.25%');
  });
  it('formats a whole-percent value with no trailing decimal', () => {
    expect(basisPointsToPercent(1000)).toBe('10%');
  });
  it('formats zero', () => {
    expect(basisPointsToPercent(0)).toBe('0%');
  });
  it('formats a value needing one decimal place', () => {
    expect(basisPointsToPercent(50)).toBe('0.5%');
  });
});
