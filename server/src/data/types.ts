/**
 * Data-layer types for the three entities. Domain types are camelCase (what
 * repositories return); row types mirror the snake_case DB columns (for typing raw
 * Knex results). See migration 20260707033414_initial_schema.ts for the schema.
 */

export type EstimateStatus = 'draft' | 'sent';
export type DiscountType = 'percentage' | 'fixed';

// ---- Domain types (camelCase; what repositories return) ----

export interface Client {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LineItem {
  id: number;
  estimateId: number;
  description: string;
  quantity: number; // converted from the DECIMAL string the driver returns
  rateCents: number; // integer cents
}

export interface Estimate {
  id: number;
  clientId: number;
  projectName: string;
  status: EstimateStatus;
  taxRateBasisPoints: number;
  /** null when the estimate has no discount */
  discountType: DiscountType | null;
  /** basis points when percentage, integer cents when fixed; null when no discount */
  discountValue: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstimateWithLineItems extends Estimate {
  lineItems: LineItem[];
}

// ---- Row types (snake_case; raw DB shape) ----

export interface ClientRow {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface LineItemRow {
  id: number;
  estimate_id: number;
  description: string;
  quantity: string; // DECIMAL(12,3) comes back as a string
  rate_cents: number; // BIGINT comes back as a number (values ≪ MAX_SAFE_INTEGER)
}

export interface EstimateRow {
  id: number;
  client_id: number;
  project_name: string;
  status: EstimateStatus;
  tax_rate_basis_points: number;
  discount_type: DiscountType | null;
  discount_value: number | null;
  created_at: Date;
  updated_at: Date;
}

// ---- Input types ----

export interface CreateClientInput {
  name: string;
}
export interface UpdateClientInput {
  name?: string;
}

export interface CreateLineItemInput {
  description: string;
  quantity: number;
  rateCents: number;
}
export type UpdateLineItemInput = Partial<CreateLineItemInput>;

export interface CreateEstimateInput {
  clientId: number;
  projectName: string;
  status?: EstimateStatus; // default 'draft'
  taxRateBasisPoints?: number; // default 0
  discountType?: DiscountType | null; // default null
  discountValue?: number | null; // default null
  lineItems?: CreateLineItemInput[]; // default []
}

export interface UpdateEstimateInput {
  clientId?: number;
  projectName?: string;
  status?: EstimateStatus;
  taxRateBasisPoints?: number;
  discountType?: DiscountType | null; // pass null to clear the discount
  discountValue?: number | null;
}
