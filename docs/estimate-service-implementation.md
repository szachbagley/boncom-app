# Estimate Service Layer — Implementation Plan

**Feature:** Business-logic orchestration for estimates — fetch-with-totals (compute on
read), create/update flows (estimate + line items as one operation), the discount
valid-combination invariant, and status transitions.
**Branch:** `feat/estimate-service-layer`
**Touches:** one new data-layer function, and new files under `server/src/services/`.

Written for straightforward execution — every function's signature, control flow, and
test case is specified below. No decisions left for execution time.

---

## Decisions confirmed with the user

1. **Status transitions are one-way.** Once an estimate's status is `'sent'`, it can
   never move back to `'draft'` (terminal in that direction). `draft→draft`, `draft→sent`,
   and `sent→sent` are all allowed. All other fields (line items, discount, tax, project
   name) remain freely editable regardless of status — status is the only field with a
   transition rule. On **create**, there is no prior status, so an estimate can be created
   directly as `'sent'` (the one-way rule has nothing to violate yet).

2. **Update is bulk-replace, symmetric with create.** `updateEstimate` always takes the
   full estimate-level fields (`projectName`, `status`, `taxRateBasisPoints`, `discount`)
   plus the **complete** new line-item array, and replaces everything atomically in one
   transaction (delete-all-then-reinsert for line items). No granular per-line-item
   service functions in this feature — the existing data-layer granular functions
   (`lineItems.ts`) remain available for a future feature that might need them (e.g. an
   inline-editing UI), but nothing here calls them.

---

## Design decisions (baked in; flagged for visibility)

3. **The service's public discount type is the calc module's `Discount` union**
   (`{ type: 'percentage', valueBasisPoints }` | `{ type: 'fixed', amountCents }`), never
   the raw two-column `discountType`/`discountValue` pair. This is how the discount
   valid-combination invariant is actually enforced: a union makes "type set without
   value" **inexpressible** at the service's API boundary (TypeScript rejects it at the
   call site), rather than needing a runtime check on two loose nullable fields. Two pure
   adapter functions translate between this union and the stored pair at the data-layer
   boundary. A lightweight runtime guard (`assertValidDiscount`) additionally checks the
   numeric value is a non-negative integer — defense-in-depth for a caller that bypasses
   the type system (e.g. plain JS, or once Zod parses raw JSON later).

4. **`clientId` is immutable after creation.** Reassigning an estimate to a different
   client isn't a stated requirement; `updateEstimate`'s input has no `clientId` field.

5. **`createEstimate` pre-checks the client exists** (`getClientById`) and throws a typed
   `NotFoundError` rather than letting a raw FK constraint violation (`ER_NO_REFERENCED_ROW_2`)
   propagate. This is a deliberate service responsibility: translate a technical DB
   constraint into a clean domain error the future route layer can map to 404, instead of
   leaking DB detail (per CLAUDE.md: "client error responses never leak internal/DB
   detail"). Cost is one extra indexed PK lookup.

6. **Two typed error classes**, `server/src/services/errors.ts`:
   - `NotFoundError` — referenced entity (e.g. client on create) doesn't exist.
   - `ValidationError` — a business-rule violation (invalid discount value, invalid
     status transition).
   Both are plain `Error` subclasses with a `name` override; no payload beyond `message`.
   The future route layer will `instanceof`-check these to map to 404/400; anything else
   falls through to the centralized error handler as a 500. This is concretely needed by
   the three responsibilities in this very feature, not speculative infrastructure.

7. **"Not found" vs. "business rule violated" convention:**
   - Read/update on a **nonexistent id** → returns `null` (mirrors the data layer's
     existing convention; not exceptional).
   - A **business rule violated** on a request that does target a real row/entity
     (invalid status transition, invalid discount, unknown client on create) → **throws**
     (`ValidationError` or `NotFoundError`).

8. **`listEstimates` does not attach computed totals** (avoids an N+1 line-item fetch per
   row for what may be a purely informational list). It maps each row to a lighter
   `EstimateSummary` (adapted discount, no `lineItems`/`totals`). Only single-estimate
   reads (`getEstimate`, and the result of `create`/`update`/`setEstimateStatus`) return
   the full `EstimateDetail` with `totals`. If a list view later needs totals, that's a
   follow-up (likely a joined/aggregated query), not this feature.

9. **`deleteEstimate` is a pure pass-through** to the data layer (no status restriction on
   deletion) — not requested, not added.

10. **No new dependencies.**

---

## Files

```
server/src/data/estimates.ts        # EDIT — add updateEstimateWithLineItems (new, transactional)
server/src/data/repositories.db.test.ts  # EDIT — integration test for the new function
server/src/services/
├── errors.ts                # NEW — NotFoundError, ValidationError
├── estimateRules.ts         # NEW — pure: discount adapters, discount guard, status guard
├── estimateRules.test.ts    # NEW — unit tests (TDD: written first)
├── estimates.ts             # NEW — orchestration (create/get/list/update/setStatus/delete)
└── estimates.db.test.ts     # NEW — integration tests (self-cleaning, local Docker)
TESTING.md                    # EDIT — new "Estimate service" section
docs/
├── estimate-service-implementation.md   # THIS plan
└── ai-artifacts/DECISIONS.md             # append decisions
```

No Vitest config changes needed — both `vitest.config.ts` (`src/**/*.test.ts`, excluding
`*.db.test.ts`) and `vitest.integration.config.ts` (`src/**/*.db.test.ts`) already glob
recursively and will pick up the new `src/services/` files automatically.

---

## Exact contents

### `server/src/services/errors.ts`

```ts
/** A referenced entity (e.g. a client) does not exist. Maps to 404 at the route layer. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** A business-rule violation (invalid discount, invalid status transition). Maps to 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### `server/src/services/estimateRules.ts` (pure; no I/O)

```ts
import type { Discount } from '../calculations/estimate.js';
import type { DiscountType, EstimateStatus } from '../data/types.js';
import { ValidationError } from './errors.js';

/** Stored (DB) discount pair -> the calc module's discriminated union. Absent when both are null. */
export function toCalcDiscount(
  discountType: DiscountType | null,
  discountValue: number | null,
): Discount | undefined {
  if (discountType === null || discountValue === null) {
    return undefined;
  }
  return discountType === 'percentage'
    ? { type: 'percentage', valueBasisPoints: discountValue }
    : { type: 'fixed', amountCents: discountValue };
}

/** The calc module's discriminated union -> the stored (DB) discount pair. */
export function toStoredDiscount(
  discount?: Discount,
): { discountType: DiscountType | null; discountValue: number | null } {
  if (!discount) {
    return { discountType: null, discountValue: null };
  }
  return discount.type === 'percentage'
    ? { discountType: 'percentage', discountValue: discount.valueBasisPoints }
    : { discountType: 'fixed', discountValue: discount.amountCents };
}

/**
 * Runtime sanity check on a discount's numeric value. The "type set without value"
 * invalid state is already inexpressible because Discount is a union (see the type
 * itself) — this guards the value/amount a caller could still pass as negative or
 * non-integer despite the well-typed shape.
 */
export function assertValidDiscount(discount?: Discount): void {
  if (!discount) {
    return;
  }
  const amount =
    discount.type === 'percentage' ? discount.valueBasisPoints : discount.amountCents;
  if (!Number.isInteger(amount) || amount < 0) {
    throw new ValidationError(
      `Invalid discount ${discount.type} value: ${amount}. Must be a non-negative integer.`,
    );
  }
}

/**
 * One-way status transition: once 'sent', an estimate can never revert to 'draft'.
 * draft->draft, draft->sent, and sent->sent are all allowed.
 */
export function assertValidStatusTransition(
  current: EstimateStatus,
  next: EstimateStatus,
): void {
  if (current === 'sent' && next === 'draft') {
    throw new ValidationError('An estimate cannot move from "sent" back to "draft".');
  }
}
```

### `server/src/data/estimates.ts` — new function (append)

```ts
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
    if (patch.clientId !== undefined) update.client_id = patch.clientId;
    if (patch.projectName !== undefined) update.project_name = patch.projectName;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.taxRateBasisPoints !== undefined) update.tax_rate_basis_points = patch.taxRateBasisPoints;
    if (patch.discountType !== undefined) update.discount_type = patch.discountType;
    if (patch.discountValue !== undefined) update.discount_value = patch.discountValue;
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
```
Needs `CreateLineItemInput` added to the existing `import type { ... } from './types.js'` list
in `estimates.ts` (not currently imported there).

### `server/src/services/estimates.ts` (orchestration)

```ts
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
import { calculateEstimate, type Discount, type EstimateTotals } from '../calculations/estimate.js';
import {
  assertValidDiscount,
  assertValidStatusTransition,
  toCalcDiscount,
  toStoredDiscount,
} from './estimateRules.js';
import { NotFoundError } from './errors.js';

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
```

---

## Testing

### Unit — `server/src/services/estimateRules.test.ts` (no DB; TDD: written before implementation)

- `toCalcDiscount`: both null → `undefined`; `('percentage', 1000)` → `{type:'percentage', valueBasisPoints:1000}`; `('fixed', 5000)` → `{type:'fixed', amountCents:5000}`.
- `toStoredDiscount`: `undefined` → `{discountType:null, discountValue:null}`; percentage union → correct pair; fixed union → correct pair.
- Round-trip sanity: `toCalcDiscount(...toStoredDiscount(discount))` equals the original discount, for both types (proves the adapters are inverses).
- `assertValidDiscount`: `undefined` passes (no throw); valid percentage passes; valid fixed passes; negative value throws `ValidationError`; non-integer value throws `ValidationError`.
- `assertValidStatusTransition`: `draft→draft` passes; `draft→sent` passes; `sent→sent` passes; `sent→draft` throws `ValidationError`.

### Integration — data layer addition, `server/src/data/repositories.db.test.ts` (append)

New test: create an estimate with 2 line items via `createEstimate`, then call
`updateEstimateWithLineItems` with new estimate-level fields and a **different** set of
line items (different count). Assert: estimate-level fields updated; `listLineItemsByEstimate`
returns exactly the new set (old ones gone); passing an **empty** `lineItems` array leaves
zero line items (not an error). Clean up via the existing `afterAll`.

### Integration — `server/src/services/estimates.db.test.ts` (new; self-cleaning, mirrors `repositories.db.test.ts`'s pattern: throwaway client in `beforeAll`, cleanup in `afterAll`)

- **`createEstimate`:** the skill's worked example end-to-end (2.5×1250 + 3×999 line
  items, 10% discount, 8.25% tax) → assert `totals.grandTotalCents === 5965` ($59.65),
  proving the service correctly wires stored facts through the calc module. Also: create
  with no discount (`totals.discountAmountCents === 0`); create with an unknown `clientId`
  → `NotFoundError`; create with a negative discount value → `ValidationError`.
- **`getEstimate`:** nonexistent id → `null`; existing id → correct `EstimateDetail` incl. `totals`.
- **`listEstimates`:** returned items have `discount` (adapted) but no `totals`/`lineItems`
  keys; filters (`clientId`, `status`) still work (thin pass-through check).
- **`updateEstimate`:** change project name, discount (percentage → fixed), tax rate, and
  fully replace line items (different count/values) → re-fetch shows new line items only,
  totals recomputed correctly for the new numbers; attempting `sent→draft` → throws
  `ValidationError` (and the estimate is unchanged — assert with a follow-up `getEstimate`);
  updating a nonexistent id → `null`.
- **`setEstimateStatus`:** `draft→sent` succeeds; subsequent `sent→draft` throws
  `ValidationError`; nonexistent id → `null`.
- **`deleteEstimate`:** deletes an estimate created in this suite; returns `true`; a second
  call on the same id returns `false`.

---

## Phases & steps (one step at a time; verify, then STOP)

### Phase 1 — Errors + pure rules (TDD)
1. Write `errors.ts` (implemented directly — trivial). Write `estimateRules.ts` with
   throwing stubs, and the full `estimateRules.test.ts` suite. Run `npm test` → confirm
   **red for the right reason** (not-implemented); `tsc --noEmit` clean. *Stop for test review.*
2. Implement `estimateRules.ts` to green (no test changes). `npm test` green; `tsc --noEmit`
   clean. *Stop.*

### Phase 2 — Data-layer addition
3. Add `updateEstimateWithLineItems` to `data/estimates.ts` (add `CreateLineItemInput` to
   its type import); add the integration test case to `repositories.db.test.ts`. Ensure
   Docker MySQL is up; `npm run test:integration` green; confirm seed row counts (3/6/9)
   unchanged. *Stop.*

### Phase 3 — Service orchestration
4. Write `services/estimates.ts` (all six functions) exactly as specified above.
   `tsc --noEmit` clean. *Stop.*
5. Write `services/estimates.db.test.ts` per the test plan above. `npm run test:integration`
   green (repositories + estimates suites); confirm seed data untouched. *Stop.*

### Phase 4 — Docs & land
6. Add the `TESTING.md` "Estimate service" section (happy path incl. the $59.65 proof,
   edge cases, error scenarios — `NotFoundError`/`ValidationError` triggers, known
   limitations — no totals in list, clientId immutable, one-way status). Append the
   decisions above to `docs/ai-artifacts/DECISIONS.md`. Commit, push, open PR
   `feat/estimate-service-layer` → `main`; **you merge manually**.

---

## Explicitly NOT in this feature
Routes, Zod validation, a client service (no business logic to add there yet — routes
will call the client repository directly through a thin future service, or this gets
built when the routes feature needs it), granular line-item service functions, and any
Railway execution.
