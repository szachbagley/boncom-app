# Data-Access Layer — Implementation Plan

**Feature:** Repository/query functions over Knex for the three entities (clients,
estimates, line items) in `server/src/data`. Pure data access — no HTTP, no business
logic, no money math.
**Branch:** `feat/data-access-layer`
**Source of truth:** the migration `20260707033414_initial_schema.ts` (exact columns/types),
`CLAUDE.md` (layering, named exports, no-`any`), and the calc module's types (the discount
union the service will later adapt to).

This plan is written to be executed without further decisions — every function's
signature, SQL shape, return type, and edge behavior is specified below.

---

## Grounding facts (already verified against local Docker MySQL)

Driver return types (probed with a live query — **corrects the earlier DECISIONS
forward-note that said BIGINT comes back as a string**):

| Column | SQL type | JS type returned by mysql2/Knex |
|---|---|---|
| `id`, `client_id`, `estimate_id`, `tax_rate_basis_points` | INT | `number` |
| `rate_cents`, `discount_value` | BIGINT | **`number`** (safe: values ≪ `MAX_SAFE_INTEGER`) |
| `quantity` | DECIMAL(12,3) | **`string`** (e.g. `"2.500"`) → must `Number()` |
| `status`, `discount_type` | ENUM | `string` / `string \| null` |
| `created_at`, `updated_at` | TIMESTAMP | `Date` |

So the **only** read-side conversion is `quantity` (string → number). Writes accept JS
numbers directly (mysql2 serializes `number` into BIGINT/DECIMAL fine).

`pool.ts` is imported **only** by `data/health.ts` (verified) — safe to consolidate.

---

## Design decisions (baked in; listed so they're visible)

1. **One shared runtime Knex instance** — `server/src/data/db.ts` reuses the existing
   `knexfile.ts` config (`import knexConfig from './knexfile.js'; export const db =
   knexFactory(knexConfig)`). This is the single connection the repositories use. Knex
   manages its own mysql2 pool internally.

2. **Consolidate onto that one pool.** Refactor `data/health.ts` to ping via
   `db.raw('SELECT 1')` and **delete `pool.ts`** (the redundant raw mysql2 pool). Health
   endpoint behavior is unchanged; we just stop opening two pools. Only `health.ts` changes.

3. **Domain types are camelCase and mirror the schema.** Discount stays as **two nullable
   fields** (`discountType`, `discountValue`) — faithful persistence, not domain reshaping.
   Converting the pair → the calc module's discriminated union is a later service/adapter
   concern, not the data layer's.

4. **Estimate is the aggregate root.** `createEstimate` can atomically insert initial line
   items (single Knex transaction). `getEstimateById` returns the aggregate (estimate +
   ordered line items). Granular line-item edits go through the **line-item repository**;
   `updateEstimate` touches estimate-level columns only. This keeps responsibilities
   orthogonal and avoids a "replace-all line items" footgun.

5. **Uniform repository conventions:** create/update return the freshly re-read domain
   object (so DB defaults and the `updated_at` trigger are reflected); `getById` returns
   `T | null`; `delete` returns `boolean` (a row was removed); FK violations (e.g. deleting
   a client that still has estimates → `RESTRICT`) **propagate as the raw DB error** for the
   service layer to translate — the data layer does not catch or reinterpret.

6. **No new dependencies** (knex + mysql2 already installed).

7. **Testing split:** pure row-mappers are unit-tested (no DB); repository CRUD is
   integration-tested against local Docker via a **second Vitest config**, so `npm test`
   stays fast and DB-free while `npm run test:integration` exercises the real queries.

---

## Files

```
server/src/data/
├── db.ts              # NEW — shared runtime Knex instance
├── types.ts           # NEW — domain types, row types, input types, enums
├── mappers.ts         # NEW — pure row→domain mappers (unit-tested)
├── mappers.test.ts    # NEW — unit tests for mappers
├── clients.ts         # NEW — client repository
├── estimates.ts       # NEW — estimate repository (aggregate root)
├── lineItems.ts       # NEW — line-item repository
├── repositories.db.test.ts  # NEW — integration CRUD round-trips (local Docker)
├── health.ts          # EDIT — ping via db.raw('SELECT 1')
└── pool.ts            # DELETE — redundant raw mysql2 pool
server/
├── vitest.config.ts             # EDIT — exclude **/*.db.test.ts (unit only)
├── vitest.integration.config.ts # NEW — include **/*.db.test.ts
└── package.json                 # EDIT — add "test:integration" script
TESTING.md                        # EDIT — add "Data-access layer" section
docs/
├── data-access-layer-implementation.md   # THIS plan
└── ai-artifacts/DECISIONS.md              # append decisions (+ correct BIGINT note)
```

---

## `types.ts` (exact contents)

```ts
export type EstimateStatus = 'draft' | 'sent';
export type DiscountType = 'percentage' | 'fixed';

// ---- Domain types (camelCase; what repositories return) ----
export interface Client {
  id: number; name: string; createdAt: Date; updatedAt: Date;
}
export interface LineItem {
  id: number; estimateId: number; description: string;
  quantity: number;   // converted from DECIMAL string
  rateCents: number;  // integer cents
}
export interface Estimate {
  id: number; clientId: number; status: EstimateStatus;
  taxRateBasisPoints: number;
  discountType: DiscountType | null;
  discountValue: number | null;   // basis points if percentage, cents if fixed
  createdAt: Date; updatedAt: Date;
}
export interface EstimateWithLineItems extends Estimate { lineItems: LineItem[]; }

// ---- Row types (snake_case; raw DB shape, for typing Knex results) ----
export interface ClientRow {
  id: number; name: string; created_at: Date; updated_at: Date;
}
export interface LineItemRow {
  id: number; estimate_id: number; description: string;
  quantity: string;    // DECIMAL comes back as string
  rate_cents: number;  // BIGINT comes back as number
}
export interface EstimateRow {
  id: number; client_id: number; status: EstimateStatus;
  tax_rate_basis_points: number;
  discount_type: DiscountType | null;
  discount_value: number | null;
  created_at: Date; updated_at: Date;
}

// ---- Input types ----
export interface CreateClientInput { name: string; }
export interface UpdateClientInput { name?: string; }

export interface CreateLineItemInput {
  description: string; quantity: number; rateCents: number;
}
export type UpdateLineItemInput = Partial<CreateLineItemInput>;

export interface CreateEstimateInput {
  clientId: number;
  status?: EstimateStatus;                 // default 'draft'
  taxRateBasisPoints?: number;             // default 0
  discountType?: DiscountType | null;      // default null
  discountValue?: number | null;           // default null
  lineItems?: CreateLineItemInput[];       // default []
}
export interface UpdateEstimateInput {
  clientId?: number;
  status?: EstimateStatus;
  taxRateBasisPoints?: number;
  discountType?: DiscountType | null;      // pass null to clear
  discountValue?: number | null;
}
```

## `mappers.ts` (exact contents — pure, unit-tested)

```ts
import type { Client, ClientRow, Estimate, EstimateRow, LineItem, LineItemRow } from './types.js';

export function mapClientRow(row: ClientRow): Client {
  return { id: row.id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at };
}
export function mapLineItemRow(row: LineItemRow): LineItem {
  return {
    id: row.id, estimateId: row.estimate_id, description: row.description,
    quantity: Number(row.quantity),   // DECIMAL string → number
    rateCents: row.rate_cents,
  };
}
export function mapEstimateRow(row: EstimateRow): Estimate {
  return {
    id: row.id, clientId: row.client_id, status: row.status,
    taxRateBasisPoints: row.tax_rate_basis_points,
    discountType: row.discount_type, discountValue: row.discount_value,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
```

## `db.ts` (exact contents)

```ts
import knexFactory from 'knex';
import knexConfig from './knexfile.js';

/** Shared runtime Knex instance (its own mysql2 pool). Reuses the knexfile config
 *  so the app and the migrate/seed CLI resolve the connection identically. */
export const db = knexFactory(knexConfig);
```

## `clients.ts` (signatures + implementation shape)

```ts
import { db } from './db.js';
import { mapClientRow } from './mappers.js';
import type { Client, ClientRow, CreateClientInput, UpdateClientInput } from './types.js';

export async function createClient(input: CreateClientInput): Promise<Client> {
  const [id] = await db<ClientRow>('clients').insert({ name: input.name });
  const created = await getClientById(id);
  if (!created) throw new Error('createClient: inserted row not found');
  return created;
}
export async function getClientById(id: number): Promise<Client | null> {
  const row = await db<ClientRow>('clients').where({ id }).first();
  return row ? mapClientRow(row) : null;
}
export async function listClients(): Promise<Client[]> {
  const rows = await db<ClientRow>('clients').orderBy('name', 'asc');
  return rows.map(mapClientRow);
}
export async function updateClient(id: number, patch: UpdateClientInput): Promise<Client | null> {
  if (patch.name !== undefined) {
    await db<ClientRow>('clients').where({ id }).update({ name: patch.name });
  }
  return getClientById(id);
}
export async function deleteClient(id: number): Promise<boolean> {
  // Throws ER_ROW_IS_REFERENCED_2 if estimates still reference this client
  // (FK RESTRICT). The data layer lets that propagate.
  const affected = await db<ClientRow>('clients').where({ id }).del();
  return affected > 0;
}
```

## `lineItems.ts` (signatures + implementation shape)

```ts
import { db } from './db.js';
import { mapLineItemRow } from './mappers.js';
import type { CreateLineItemInput, LineItem, LineItemRow, UpdateLineItemInput } from './types.js';

export async function createLineItem(estimateId: number, input: CreateLineItemInput): Promise<LineItem> {
  const [id] = await db<LineItemRow>('line_items').insert({
    estimate_id: estimateId, description: input.description,
    quantity: input.quantity, rate_cents: input.rateCents,
  });
  const created = await getLineItemById(id);
  if (!created) throw new Error('createLineItem: inserted row not found');
  return created;
}
export async function getLineItemById(id: number): Promise<LineItem | null> {
  const row = await db<LineItemRow>('line_items').where({ id }).first();
  return row ? mapLineItemRow(row) : null;
}
export async function listLineItemsByEstimate(estimateId: number): Promise<LineItem[]> {
  const rows = await db<LineItemRow>('line_items')
    .where({ estimate_id: estimateId }).orderBy('id', 'asc');  // insertion order
  return rows.map(mapLineItemRow);
}
export async function updateLineItem(id: number, patch: UpdateLineItemInput): Promise<LineItem | null> {
  const update: Partial<LineItemRow> = {};
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.quantity !== undefined) update.quantity = String(patch.quantity);
  if (patch.rateCents !== undefined) update.rate_cents = patch.rateCents;
  if (Object.keys(update).length > 0) {
    await db<LineItemRow>('line_items').where({ id }).update(update);
  }
  return getLineItemById(id);
}
export async function deleteLineItem(id: number): Promise<boolean> {
  const affected = await db<LineItemRow>('line_items').where({ id }).del();
  return affected > 0;
}
```
(`quantity` written as `String(patch.quantity)` for DECIMAL exactness; Knex also accepts a
number, but a string avoids any float formatting surprise. `LineItemRow.quantity` is typed
`string`, so the update object matches.)

## `estimates.ts` (signatures + implementation shape)

```ts
import { db } from './db.js';
import { mapEstimateRow, mapLineItemRow } from './mappers.js';
import type {
  CreateEstimateInput, Estimate, EstimateRow, EstimateStatus,
  EstimateWithLineItems, LineItemRow, UpdateEstimateInput,
} from './types.js';

export interface EstimateListFilter { clientId?: number; status?: EstimateStatus; }

export async function createEstimate(input: CreateEstimateInput): Promise<EstimateWithLineItems> {
  const id = await db.transaction(async (trx) => {
    const [estimateId] = await trx<EstimateRow>('estimates').insert({
      client_id: input.clientId,
      status: input.status ?? 'draft',
      tax_rate_basis_points: input.taxRateBasisPoints ?? 0,
      discount_type: input.discountType ?? null,
      discount_value: input.discountValue ?? null,
    });
    const lines = input.lineItems ?? [];
    if (lines.length > 0) {
      await trx<LineItemRow>('line_items').insert(
        lines.map((li) => ({
          estimate_id: estimateId, description: li.description,
          quantity: String(li.quantity), rate_cents: li.rateCents,
        })),
      );
    }
    return estimateId;
  });
  const created = await getEstimateById(id);
  if (!created) throw new Error('createEstimate: inserted estimate not found');
  return created;
}

export async function getEstimateById(id: number): Promise<EstimateWithLineItems | null> {
  const row = await db<EstimateRow>('estimates').where({ id }).first();
  if (!row) return null;
  const lineRows = await db<LineItemRow>('line_items')
    .where({ estimate_id: id }).orderBy('id', 'asc');
  return { ...mapEstimateRow(row), lineItems: lineRows.map(mapLineItemRow) };
}

export async function listEstimates(filter: EstimateListFilter = {}): Promise<Estimate[]> {
  const query = db<EstimateRow>('estimates');
  if (filter.clientId !== undefined) query.where({ client_id: filter.clientId });
  if (filter.status !== undefined) query.where({ status: filter.status });
  const rows = await query.orderBy('updated_at', 'desc').orderBy('id', 'desc'); // "last edited" first
  return rows.map(mapEstimateRow);
}

export async function updateEstimate(id: number, patch: UpdateEstimateInput): Promise<EstimateWithLineItems | null> {
  const update: Partial<EstimateRow> = {};
  if (patch.clientId !== undefined) update.client_id = patch.clientId;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.taxRateBasisPoints !== undefined) update.tax_rate_basis_points = patch.taxRateBasisPoints;
  if (patch.discountType !== undefined) update.discount_type = patch.discountType;   // null clears
  if (patch.discountValue !== undefined) update.discount_value = patch.discountValue;
  if (Object.keys(update).length > 0) {
    await db<EstimateRow>('estimates').where({ id }).update(update);
  }
  return getEstimateById(id);
}

export async function deleteEstimate(id: number): Promise<boolean> {
  const affected = await db<EstimateRow>('estimates').where({ id }).del(); // line_items cascade
  return affected > 0;
}
```

---

## Testing

### Unit (`mappers.test.ts`, no DB — runs under `npm test`)
- `mapLineItemRow`: `quantity: "2.500"` → `2.5` (number); `rate_cents: 1250` passes through;
  snake→camel field names correct.
- `mapEstimateRow`: discount pair present (`'percentage'`/`1000`) and absent (`null`/`null`)
  both map faithfully; `Date` fields pass through; status typed.
- `mapClientRow`: field mapping + `Date`s.

### Integration (`repositories.db.test.ts`, local Docker — `npm run test:integration`)
Self-contained and self-cleaning so it never pollutes the seed data:
- `beforeAll`: create a throwaway client `__dal_test__<timestamp>`; keep its id.
- `afterAll`: `deleteEstimate` for any created estimates, then `deleteClient` for the test
  client, then `db.destroy()`.
- **Clients:** create → `getClientById` returns it → `updateClient` name changes → `listClients`
  includes it.
- **Estimates aggregate:** `createEstimate` with two line items (incl. fractional `quantity`
  `2.5`) → `getEstimateById` returns the estimate + both line items in id order, with
  `quantity` a number and discount fields correct → `updateEstimate` changes status/discount
  → `listEstimates({ clientId })` returns it, `listEstimates({ status })` filters.
- **Line items:** `createLineItem` on the estimate → `listLineItemsByEstimate` count/order →
  `updateLineItem` changes rate → `deleteLineItem` returns true and it's gone.
- **FK behavior:** `deleteClient(testClientId)` while an estimate exists **rejects** (RESTRICT)
  — assert it throws; `deleteEstimate` then **cascades** (its line items are gone afterward).

### Vitest config split
- `vitest.config.ts`: `include: ['src/**/*.test.ts']`, add `exclude: ['**/*.db.test.ts']`.
- `vitest.integration.config.ts` (new): `include: ['src/**/*.db.test.ts']`, `environment: 'node'`.
- `package.json`: add `"test:integration": "vitest run --config vitest.integration.config.ts"`.

---

## Phases & steps (one step at a time; typecheck/tests green, then STOP)

### Phase 1 — Foundation (instance, types, mappers, health consolidation)
1. Add `db.ts`, `types.ts`, `mappers.ts`. Refactor `health.ts` to `db.raw('SELECT 1')`;
   delete `pool.ts`. `tsc --noEmit` clean. Manually confirm `/health` still reports
   `db: "up"` (start server, curl). *Stop.*

### Phase 2 — Mapper unit tests (TDD-style: tests then confirm)
2. Write `mappers.test.ts`; update `vitest.config.ts` to exclude `*.db.test.ts`. `npm test`
   green (calc tests + new mapper tests); `tsc --noEmit` clean. *Stop.*

### Phase 3 — Repositories
3. Add `clients.ts`. `tsc --noEmit` clean. *Stop.*
4. Add `lineItems.ts`. `tsc --noEmit` clean. *Stop.*
5. Add `estimates.ts` (aggregate + transaction). `tsc --noEmit` clean. *Stop.*

### Phase 4 — Integration tests
6. Add `vitest.integration.config.ts`, the `test:integration` script, and
   `repositories.db.test.ts`. Ensure Docker MySQL is up; `npm run test:integration` green;
   confirm seed data untouched (row counts unchanged before/after). *Stop.*

### Phase 5 — Docs & land
7. Add the `TESTING.md` "Data-access layer" section; append decisions to
   `docs/ai-artifacts/DECISIONS.md` (including the BIGINT-return-type correction). Open PR
   `feat/data-access-layer` → `main`; **you merge manually**.

---

## Explicitly NOT in this feature
Services, routes, Zod validation, the discount-pair → calc-union adapter, HTTP concerns,
graceful pool shutdown on SIGTERM (noted as a future nicety), and any Railway execution.
