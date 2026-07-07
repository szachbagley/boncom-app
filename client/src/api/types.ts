/** Types mirroring server/docs/API-REFERENCE.md exactly. */

export type EstimateStatus = 'draft' | 'sent';

export type Discount =
  | { type: 'percentage'; valueBasisPoints: number }
  | { type: 'fixed'; amountCents: number };

export interface Client {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: number;
  estimateId: number;
  description: string;
  quantity: number;
  rateCents: number;
}

export interface EstimateTotals {
  lineTotalsCents: number[];
  subtotalCents: number;
  discountAmountCents: number;
  discountedSubtotalCents: number;
  taxAmountCents: number;
  grandTotalCents: number;
}

export interface EstimateSummary {
  id: number;
  clientId: number;
  projectName: string;
  status: EstimateStatus;
  taxRateBasisPoints: number;
  discount?: Discount;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateDetail extends EstimateSummary {
  lineItems: LineItem[];
  totals: EstimateTotals;
}

/** Request-side line item shape — no id/estimateId; those don't exist until created. */
export interface LineItemInput {
  description: string;
  quantity: number;
  rateCents: number;
}

export interface CreateClientInput {
  name: string;
}

export interface CreateEstimateInput {
  clientId: number;
  projectName: string;
  status?: EstimateStatus;
  taxRateBasisPoints?: number;
  discount?: Discount;
  lineItems?: LineItemInput[];
}

/** PUT is a full replace: every field but discount is required, matching the API. */
export interface UpdateEstimateInput {
  projectName: string;
  status: EstimateStatus;
  taxRateBasisPoints: number;
  discount?: Discount;
  lineItems: LineItemInput[];
}

export interface EstimateListFilter {
  clientId?: number;
  status?: EstimateStatus;
}
