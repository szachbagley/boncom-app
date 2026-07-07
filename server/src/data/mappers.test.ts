import { describe, it, expect } from 'vitest';
import { mapClientRow, mapEstimateRow, mapLineItemRow } from './mappers.js';

describe('mapClientRow', () => {
  it('maps snake_case columns to camelCase fields', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const updatedAt = new Date('2026-01-02T00:00:00Z');
    expect(
      mapClientRow({ id: 1, name: 'Acme Corp', created_at: createdAt, updated_at: updatedAt }),
    ).toEqual({ id: 1, name: 'Acme Corp', createdAt, updatedAt });
  });
});

describe('mapLineItemRow', () => {
  it('converts the DECIMAL quantity string to a number', () => {
    expect(
      mapLineItemRow({
        id: 1,
        estimate_id: 7,
        description: 'Design consultation',
        quantity: '2.500',
        rate_cents: 1250,
      }),
    ).toEqual({
      id: 1,
      estimateId: 7,
      description: 'Design consultation',
      quantity: 2.5,
      rateCents: 1250,
    });
  });

  it('passes an integer-cents rate_cents (BIGINT-as-number) straight through', () => {
    const mapped = mapLineItemRow({
      id: 2,
      estimate_id: 7,
      description: 'Concept revisions',
      quantity: '3.000',
      rate_cents: 999,
    });
    expect(mapped.rateCents).toBe(999);
    expect(mapped.quantity).toBe(3);
  });
});

describe('mapEstimateRow', () => {
  it('maps a row WITH a discount pair present', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const updatedAt = new Date('2026-01-02T00:00:00Z');
    expect(
      mapEstimateRow({
        id: 7,
        client_id: 1,
        project_name: 'Spring Brand Refresh',
        status: 'sent',
        tax_rate_basis_points: 825,
        discount_type: 'percentage',
        discount_value: 1000,
        created_at: createdAt,
        updated_at: updatedAt,
      }),
    ).toEqual({
      id: 7,
      clientId: 1,
      projectName: 'Spring Brand Refresh',
      status: 'sent',
      taxRateBasisPoints: 825,
      discountType: 'percentage',
      discountValue: 1000,
      createdAt,
      updatedAt,
    });
  });

  it('maps a row with NO discount (both fields null)', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const updatedAt = new Date('2026-01-02T00:00:00Z');
    const mapped = mapEstimateRow({
      id: 8,
      client_id: 1,
      project_name: 'Q3 Social Campaign',
      status: 'draft',
      tax_rate_basis_points: 0,
      discount_type: null,
      discount_value: null,
      created_at: createdAt,
      updated_at: updatedAt,
    });
    expect(mapped.projectName).toBe('Q3 Social Campaign');
    expect(mapped.discountType).toBeNull();
    expect(mapped.discountValue).toBeNull();
    expect(mapped.status).toBe('draft');
    expect(mapped.taxRateBasisPoints).toBe(0);
  });
});
