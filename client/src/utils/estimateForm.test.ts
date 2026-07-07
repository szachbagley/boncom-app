import { describe, it, expect } from 'vitest';
import { calculateEstimate } from '../calculations/estimate.js';
import type { EstimateDetail } from '../api/types.js';
import {
  buildCalcInput,
  emptyFormState,
  formStateFromEstimate,
  validateForm,
  type EstimateFormState,
} from './estimateForm.js';

function baseForm(overrides: Partial<EstimateFormState> = {}): EstimateFormState {
  return {
    clientId: 1,
    projectName: 'Spring Brand Refresh',
    lineItems: [
      { id: 'a', description: 'Design consultation', quantity: '2.5', rateDollars: '12.50' },
      { id: 'b', description: 'Concept revisions', quantity: '3', rateDollars: '9.99' },
    ],
    discountMode: 'percent',
    discountValue: '10',
    taxRate: '8.25',
    ...overrides,
  };
}

describe('emptyFormState', () => {
  it('starts with no client, blank fields, and one blank line item', () => {
    const form = emptyFormState();
    expect(form.clientId).toBeNull();
    expect(form.projectName).toBe('');
    expect(form.discountMode).toBe('percent');
    expect(form.discountValue).toBe('');
    expect(form.taxRate).toBe('');
    expect(form.lineItems).toHaveLength(1);
    expect(form.lineItems[0]?.description).toBe('');
  });

  it('pre-selects the given client id', () => {
    const form = emptyFormState(7);
    expect(form.clientId).toBe(7);
  });
});

describe('formStateFromEstimate', () => {
  function makeEstimate(overrides: Partial<EstimateDetail> = {}): EstimateDetail {
    return {
      id: 1, clientId: 1, projectName: 'Spring Brand Refresh', status: 'draft',
      taxRateBasisPoints: 825, createdAt: '', updatedAt: '',
      lineItems: [
        { id: 10, estimateId: 1, description: 'Design consultation', quantity: 2.5, rateCents: 1250 },
      ],
      totals: {
        lineTotalsCents: [3125], subtotalCents: 3125, discountAmountCents: 0,
        discountedSubtotalCents: 3125, taxAmountCents: 258, grandTotalCents: 3383,
      },
      ...overrides,
    };
  }

  it('round-trips a percentage-discount estimate', () => {
    const estimate = makeEstimate({ discount: { type: 'percentage', valueBasisPoints: 1000 } });
    const form = formStateFromEstimate(estimate);
    expect(form.clientId).toBe(1);
    expect(form.projectName).toBe('Spring Brand Refresh');
    expect(form.taxRate).toBe('8.25');
    expect(form.discountMode).toBe('percent');
    expect(form.discountValue).toBe('10');
    expect(form.lineItems).toEqual([
      { id: '10', description: 'Design consultation', quantity: '2.5', rateDollars: '12.50' },
    ]);
  });

  it('round-trips a fixed-discount estimate', () => {
    const estimate = makeEstimate({ discount: { type: 'fixed', amountCents: 5000 } });
    const form = formStateFromEstimate(estimate);
    expect(form.discountMode).toBe('fixed');
    expect(form.discountValue).toBe('50.00');
  });

  it('round-trips a no-discount, zero-tax estimate with blank fields', () => {
    const estimate = makeEstimate({ discount: undefined, taxRateBasisPoints: 0 });
    const form = formStateFromEstimate(estimate);
    expect(form.discountMode).toBe('percent');
    expect(form.discountValue).toBe('');
    expect(form.taxRate).toBe('');
  });
});

describe('buildCalcInput', () => {
  it('produces the exact input whose calculateEstimate result is the canonical $59.65 example', () => {
    const input = buildCalcInput(baseForm());
    const totals = calculateEstimate(input);
    expect(totals).toEqual({
      lineTotalsCents: [3125, 2997],
      subtotalCents: 6122,
      discountAmountCents: 612,
      discountedSubtotalCents: 5510,
      taxAmountCents: 455,
      grandTotalCents: 5965,
    });
  });

  it('treats blank/invalid fields as zero rather than throwing', () => {
    const form = baseForm({
      lineItems: [{ id: 'a', description: 'x', quantity: '', rateDollars: '' }],
      discountValue: '',
      taxRate: '',
    });
    const input = buildCalcInput(form);
    const totals = calculateEstimate(input);
    expect(totals.grandTotalCents).toBe(0);
  });

  it('builds a fixed discount correctly', () => {
    const input = buildCalcInput(baseForm({ discountMode: 'fixed', discountValue: '50.00' }));
    expect(input.discount).toEqual({ type: 'fixed', amountCents: 5000 });
  });
});

describe('validateForm', () => {
  it('returns ok with the correct cents/basis-point payload for a valid form', () => {
    const result = validateForm(baseForm());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.clientId).toBe(1);
      expect(result.projectName).toBe('Spring Brand Refresh');
      expect(result.taxRateBasisPoints).toBe(825);
      expect(result.discount).toEqual({ type: 'percentage', valueBasisPoints: 1000 });
      expect(result.lineItems).toEqual([
        { description: 'Design consultation', quantity: 2.5, rateCents: 1250 },
        { description: 'Concept revisions', quantity: 3, rateCents: 999 },
      ]);
    }
  });

  it('reports a missing client', () => {
    const result = validateForm(baseForm({ clientId: null }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.client).toBeDefined();
  });

  it('reports a blank project name', () => {
    const result = validateForm(baseForm({ projectName: '   ' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.projectName).toBeDefined();
  });

  it('reports a line item with too many quantity decimals', () => {
    const result = validateForm(
      baseForm({ lineItems: [{ id: 'a', description: 'x', quantity: '2.5001', rateDollars: '10' }] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.lineItems['a']?.quantity).toBeDefined();
  });

  it('reports a line item with an invalid rate', () => {
    const result = validateForm(
      baseForm({ lineItems: [{ id: 'a', description: 'x', quantity: '1', rateDollars: '-5' }] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.lineItems['a']?.rate).toBeDefined();
  });

  it('reports a line item with a blank description', () => {
    const result = validateForm(
      baseForm({ lineItems: [{ id: 'a', description: '  ', quantity: '1', rateDollars: '10' }] }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.lineItems['a']?.description).toBeDefined();
  });

  it('allows a blank discount, producing discount: undefined', () => {
    const result = validateForm(baseForm({ discountValue: '' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.discount).toBeUndefined();
  });

  it('reports an invalid tax rate', () => {
    const result = validateForm(baseForm({ taxRate: 'abc' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.taxRate).toBeDefined();
  });

  it('allows saving with zero line items', () => {
    const result = validateForm(baseForm({ lineItems: [] }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lineItems).toEqual([]);
  });
});
