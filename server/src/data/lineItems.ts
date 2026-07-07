import { db } from './db.js';
import { mapLineItemRow } from './mappers.js';
import type {
  CreateLineItemInput,
  LineItem,
  LineItemRow,
  UpdateLineItemInput,
} from './types.js';

/**
 * Line-item repository: pure data access over the `line_items` table. No HTTP, no
 * business logic (no calc math — see the estimate-calculations module for that).
 */

export async function createLineItem(
  estimateId: number,
  input: CreateLineItemInput,
): Promise<LineItem> {
  const [id] = await db<LineItemRow>('line_items').insert({
    estimate_id: estimateId,
    description: input.description,
    quantity: String(input.quantity), // DECIMAL exactness; avoids float formatting
    rate_cents: input.rateCents,
  });
  if (id === undefined) {
    throw new Error('createLineItem: insert did not return an id');
  }
  const created = await getLineItemById(id);
  if (!created) {
    throw new Error('createLineItem: inserted row not found');
  }
  return created;
}

export async function getLineItemById(id: number): Promise<LineItem | null> {
  const row = await db<LineItemRow>('line_items').where({ id }).first();
  return row ? mapLineItemRow(row) : null;
}

export async function listLineItemsByEstimate(estimateId: number): Promise<LineItem[]> {
  const rows = await db<LineItemRow>('line_items')
    .where({ estimate_id: estimateId })
    .orderBy('id', 'asc'); // insertion order
  return rows.map(mapLineItemRow);
}

export async function updateLineItem(
  id: number,
  patch: UpdateLineItemInput,
): Promise<LineItem | null> {
  const update: Partial<LineItemRow> = {};
  if (patch.description !== undefined) {
    update.description = patch.description;
  }
  if (patch.quantity !== undefined) {
    update.quantity = String(patch.quantity);
  }
  if (patch.rateCents !== undefined) {
    update.rate_cents = patch.rateCents;
  }
  if (Object.keys(update).length > 0) {
    await db<LineItemRow>('line_items').where({ id }).update(update);
  }
  return getLineItemById(id);
}

export async function deleteLineItem(id: number): Promise<boolean> {
  const affected = await db<LineItemRow>('line_items').where({ id }).del();
  return affected > 0;
}
