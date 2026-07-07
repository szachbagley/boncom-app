import { db } from './db.js';
import { mapEstimateRow, mapLineItemRow } from './mappers.js';
import type {
  CreateEstimateInput,
  CreateLineItemInput,
  Estimate,
  EstimateRow,
  EstimateStatus,
  EstimateWithLineItems,
  LineItemRow,
  UpdateEstimateInput,
} from './types.js';

/**
 * Estimate repository: pure data access over the `estimates` table. Estimate is the
 * aggregate root — `createEstimate` may atomically insert initial line items in one
 * transaction, and `getEstimateById` returns the estimate with its ordered line
 * items. Granular line-item edits after creation go through the line-item repository
 * (`lineItems.ts`); `updateEstimate` here only touches estimate-level columns.
 */

export interface EstimateListFilter {
  clientId?: number;
  status?: EstimateStatus;
}

export async function createEstimate(
  input: CreateEstimateInput,
): Promise<EstimateWithLineItems> {
  const id = await db.transaction(async (trx) => {
    const [estimateId] = await trx<EstimateRow>('estimates').insert({
      client_id: input.clientId,
      project_name: input.projectName,
      status: input.status ?? 'draft',
      tax_rate_basis_points: input.taxRateBasisPoints ?? 0,
      discount_type: input.discountType ?? null,
      discount_value: input.discountValue ?? null,
    });
    if (estimateId === undefined) {
      throw new Error('createEstimate: insert did not return an id');
    }

    const lineItems = input.lineItems ?? [];
    if (lineItems.length > 0) {
      await trx<LineItemRow>('line_items').insert(
        lineItems.map((item) => ({
          estimate_id: estimateId,
          description: item.description,
          quantity: String(item.quantity),
          rate_cents: item.rateCents,
        })),
      );
    }

    return estimateId;
  });

  const created = await getEstimateById(id);
  if (!created) {
    throw new Error('createEstimate: inserted estimate not found');
  }
  return created;
}

export async function getEstimateById(id: number): Promise<EstimateWithLineItems | null> {
  const row = await db<EstimateRow>('estimates').where({ id }).first();
  if (!row) {
    return null;
  }
  const lineRows = await db<LineItemRow>('line_items')
    .where({ estimate_id: id })
    .orderBy('id', 'asc'); // insertion order
  return { ...mapEstimateRow(row), lineItems: lineRows.map(mapLineItemRow) };
}

export async function listEstimates(filter: EstimateListFilter = {}): Promise<Estimate[]> {
  const query = db<EstimateRow>('estimates');
  if (filter.clientId !== undefined) {
    query.where({ client_id: filter.clientId });
  }
  if (filter.status !== undefined) {
    query.where({ status: filter.status });
  }
  const rows = await query.orderBy('updated_at', 'desc').orderBy('id', 'desc'); // last edited first
  return rows.map(mapEstimateRow);
}

export async function updateEstimate(
  id: number,
  patch: UpdateEstimateInput,
): Promise<EstimateWithLineItems | null> {
  const update: Partial<EstimateRow> = {};
  if (patch.clientId !== undefined) {
    update.client_id = patch.clientId;
  }
  if (patch.projectName !== undefined) {
    update.project_name = patch.projectName;
  }
  if (patch.status !== undefined) {
    update.status = patch.status;
  }
  if (patch.taxRateBasisPoints !== undefined) {
    update.tax_rate_basis_points = patch.taxRateBasisPoints;
  }
  if (patch.discountType !== undefined) {
    update.discount_type = patch.discountType; // null clears the discount
  }
  if (patch.discountValue !== undefined) {
    update.discount_value = patch.discountValue;
  }
  if (Object.keys(update).length > 0) {
    await db<EstimateRow>('estimates').where({ id }).update(update);
  }
  return getEstimateById(id);
}

export async function deleteEstimate(id: number): Promise<boolean> {
  const affected = await db<EstimateRow>('estimates').where({ id }).del(); // line_items cascade
  return affected > 0;
}

/**
 * Atomically replaces an estimate's estimate-level fields AND its entire line-item
 * set (delete-all-then-reinsert) in one transaction. Used by the service's bulk-replace
 * update flow. `patch` fields are all optional (only supplied ones are updated);
 * `lineItems` is the COMPLETE new set — this is not a partial line-item patch.
 */
export async function updateEstimateWithLineItems(
  id: number,
  patch: UpdateEstimateInput,
  lineItems: CreateLineItemInput[],
): Promise<EstimateWithLineItems | null> {
  await db.transaction(async (trx) => {
    const update: Partial<EstimateRow> = {};
    if (patch.clientId !== undefined) {
      update.client_id = patch.clientId;
    }
    if (patch.projectName !== undefined) {
      update.project_name = patch.projectName;
    }
    if (patch.status !== undefined) {
      update.status = patch.status;
    }
    if (patch.taxRateBasisPoints !== undefined) {
      update.tax_rate_basis_points = patch.taxRateBasisPoints;
    }
    if (patch.discountType !== undefined) {
      update.discount_type = patch.discountType;
    }
    if (patch.discountValue !== undefined) {
      update.discount_value = patch.discountValue;
    }
    if (Object.keys(update).length > 0) {
      await trx<EstimateRow>('estimates').where({ id }).update(update);
    }

    await trx<LineItemRow>('line_items').where({ estimate_id: id }).del();
    if (lineItems.length > 0) {
      await trx<LineItemRow>('line_items').insert(
        lineItems.map((item) => ({
          estimate_id: id,
          description: item.description,
          quantity: String(item.quantity),
          rate_cents: item.rateCents,
        })),
      );
    }
  });

  return getEstimateById(id);
}
