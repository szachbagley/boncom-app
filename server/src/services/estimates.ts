import { getClientById } from '../data/clients.js';
import {
  createEstimate as createEstimateRow,
  deleteEstimate as deleteEstimateRow,
  getEstimateById,
  listEstimates as listEstimateRows,
  updateEstimate as updateEstimateRow,
  updateEstimateWithLineItems,
  type EstimateListFilter,
} from '../data/estimates.js';
import type {
  CreateLineItemInput,
  Estimate,
  EstimateStatus,
  EstimateWithLineItems,
  LineItem,
} from '../data/types.js';
import {
  calculateEstimate,
  type Discount,
  type EstimateTotals,
} from '../calculations/estimate.js';
import {
  assertValidDiscount,
  assertValidStatusTransition,
  toCalcDiscount,
  toStoredDiscount,
} from './estimateRules.js';
import { NotFoundError } from './errors.js';

/**
 * Estimate service: business-logic orchestration. Fetches stored facts (estimate +
 * line items) and runs them through the calculation module to attach computed totals
 * ("compute totals on read"), handles create/update as one logical operation (an
 * estimate with its line items), enforces the discount valid-combination invariant
 * (via the Discount union — see estimateRules.ts), and manages the one-way status
 * transition. No HTTP; routes will call these functions.
 */

export type { EstimateListFilter };

export interface EstimateSummary {
  id: number;
  clientId: number;
  projectName: string;
  status: EstimateStatus;
  taxRateBasisPoints: number;
  discount?: Discount;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstimateDetail extends EstimateSummary {
  lineItems: LineItem[];
  totals: EstimateTotals;
}

export interface CreateEstimateInput {
  clientId: number;
  projectName: string;
  status?: EstimateStatus; // default 'draft'
  taxRateBasisPoints?: number; // default 0
  discount?: Discount; // absent -> no discount
  lineItems?: CreateLineItemInput[]; // default []
}

export interface UpdateEstimateInput {
  projectName: string;
  status: EstimateStatus;
  taxRateBasisPoints: number;
  discount?: Discount;
  lineItems: CreateLineItemInput[]; // complete replacement set
}

function toSummary(estimate: Estimate): EstimateSummary {
  return {
    id: estimate.id,
    clientId: estimate.clientId,
    projectName: estimate.projectName,
    status: estimate.status,
    taxRateBasisPoints: estimate.taxRateBasisPoints,
    discount: toCalcDiscount(estimate.discountType, estimate.discountValue),
    createdAt: estimate.createdAt,
    updatedAt: estimate.updatedAt,
  };
}

function toDetail(estimate: EstimateWithLineItems): EstimateDetail {
  const summary = toSummary(estimate);
  const totals = calculateEstimate({
    lineItems: estimate.lineItems.map((li) => ({
      quantity: li.quantity,
      rateCents: li.rateCents,
    })),
    discount: summary.discount,
    taxRateBasisPoints: estimate.taxRateBasisPoints,
  });
  return { ...summary, lineItems: estimate.lineItems, totals };
}

export async function createEstimate(input: CreateEstimateInput): Promise<EstimateDetail> {
  const client = await getClientById(input.clientId);
  if (!client) {
    throw new NotFoundError(`Client ${input.clientId} not found`);
  }
  assertValidDiscount(input.discount);
  const { discountType, discountValue } = toStoredDiscount(input.discount);

  const created = await createEstimateRow({
    clientId: input.clientId,
    projectName: input.projectName,
    status: input.status,
    taxRateBasisPoints: input.taxRateBasisPoints,
    discountType,
    discountValue,
    lineItems: input.lineItems ?? [],
  });
  return toDetail(created);
}

export async function getEstimate(id: number): Promise<EstimateDetail | null> {
  const estimate = await getEstimateById(id);
  return estimate ? toDetail(estimate) : null;
}

export async function listEstimates(filter?: EstimateListFilter): Promise<EstimateSummary[]> {
  const rows = await listEstimateRows(filter);
  return rows.map(toSummary);
}

export async function updateEstimate(
  id: number,
  input: UpdateEstimateInput,
): Promise<EstimateDetail | null> {
  const current = await getEstimateById(id);
  if (!current) {
    return null;
  }
  assertValidStatusTransition(current.status, input.status);
  assertValidDiscount(input.discount);
  const { discountType, discountValue } = toStoredDiscount(input.discount);

  const updated = await updateEstimateWithLineItems(
    id,
    {
      projectName: input.projectName,
      status: input.status,
      taxRateBasisPoints: input.taxRateBasisPoints,
      discountType,
      discountValue,
    },
    input.lineItems,
  );
  return updated ? toDetail(updated) : null;
}

export async function setEstimateStatus(
  id: number,
  status: EstimateStatus,
): Promise<EstimateDetail | null> {
  const current = await getEstimateById(id);
  if (!current) {
    return null;
  }
  assertValidStatusTransition(current.status, status);
  const updated = await updateEstimateRow(id, { status });
  return updated ? toDetail(updated) : null;
}

export async function deleteEstimate(id: number): Promise<boolean> {
  return deleteEstimateRow(id);
}
