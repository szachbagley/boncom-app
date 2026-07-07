import type {
  Client,
  ClientRow,
  Estimate,
  EstimateRow,
  LineItem,
  LineItemRow,
} from './types.js';

/**
 * Pure row → domain mappers (snake_case DB row → camelCase domain object). The one
 * non-trivial conversion is `quantity`, which the driver returns as a DECIMAL string.
 * No I/O — unit-tested directly.
 */

export function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLineItemRow(row: LineItemRow): LineItem {
  return {
    id: row.id,
    estimateId: row.estimate_id,
    description: row.description,
    quantity: Number(row.quantity), // DECIMAL string → number
    rateCents: row.rate_cents,
  };
}

export function mapEstimateRow(row: EstimateRow): Estimate {
  return {
    id: row.id,
    clientId: row.client_id,
    projectName: row.project_name,
    status: row.status,
    taxRateBasisPoints: row.tax_rate_basis_points,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
