# Add `project_name` to Estimates — Implementation Plan

**Feature:** Add a `project_name` field to estimates so multiple estimates for the same
client are distinguishable ("what is this estimate for").
**Branch:** `feat/estimate-project-name`
**Touches:** schema (new migration), seed script, `server/docs/DATA-MODEL.md`, and the data
layer (types, mapper, estimate repository, and both test suites).

Written for straightforward execution — every column definition, edit, and test change is
specified below. No decisions left for execution time.

---

## Design decisions (baked in)

1. **Column:** `project_name VARCHAR(255) NOT NULL DEFAULT ''`, added **after `client_id`**
   (positional, for a readable `SHOW CREATE TABLE`).
   - **`NOT NULL`** because the field is meant to be meaningful — the DB should express the
     requirement where it can (matching how `status`/`tax_rate_basis_points` are NOT NULL).
   - **`DEFAULT ''`** so the `ALTER TABLE` is safe on tables that already contain rows
     (existing estimates backfill to an empty string rather than failing the migration).
     This matters for the manual Railway migration too. The default is a harmless fallback;
     the real "must be a non-empty, sensible name" enforcement will live at the app boundary
     (Zod) in the future routes/services feature — same split we use for the discount-pair
     invariant. `VARCHAR(255)` matches the existing string columns.

2. **Data-layer input:** `projectName` is **required** on `CreateEstimateInput` (every new
   estimate names its project) and **optional** on `UpdateEstimateInput` (rename allowed).
   The DB default only ever applies to the migration backfill, never to app writes.

3. **No new dependencies.** Pure additive change to existing files.

---

## Files & exact changes

### 1. New migration — `server/src/data/migrations/<timestamp>_add_project_name_to_estimates.ts`
Generate the timestamped stub with `npm run migrate:make -- add_project_name_to_estimates`,
then author:

```ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('estimates', (table) => {
    table
      .string('project_name')
      .notNullable()
      .defaultTo('')
      .after('client_id'); // MySQL positional; keeps SHOW CREATE readable
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('estimates', (table) => {
    table.dropColumn('project_name');
  });
}
```

### 2. `server/docs/DATA-MODEL.md` (source of truth)
In the **Estimate** table, add a row directly under `client_id`:

| `project_name` | `VARCHAR(255)` | What the estimate is for (e.g. "Spring Brand Refresh"). Required; distinguishes a client's multiple estimates. |

Add a short note under the Estimate section explaining the field exists so a client's
estimates are individually identifiable, and that it is `NOT NULL DEFAULT ''` at the DB
level with non-empty enforcement deferred to app-layer validation. Add `project_name` to
the ASCII relationship diagram's Estimate box.

### 3. Seed — `server/src/data/seeds/01_sample_data.ts`
- Add `projectName: string;` to the `EstimateSeed` interface.
- In `insertEstimate`, add `project_name: estimate.projectName,` to the `estimates` insert
  object.
- Add a `projectName` to each of the six estimates:
  E1 `'Spring Brand Refresh'`, E2 `'Q3 Social Campaign'`, E3 `'Product Launch Film'`,
  E4 `'Website Redesign'`, E5 `'Annual Report 2026'`, E6 `'Trade Show Booth'`.

### 4. Data layer

**`server/src/data/types.ts`**
- `Estimate` (domain): add `projectName: string;`
- `EstimateRow` (row): add `project_name: string;`
- `CreateEstimateInput`: add `projectName: string;` (required)
- `UpdateEstimateInput`: add `projectName?: string;`

**`server/src/data/mappers.ts`** — in `mapEstimateRow`, add `projectName: row.project_name,`.

**`server/src/data/estimates.ts`**
- `createEstimate`: add `project_name: input.projectName,` to the `estimates` insert.
- `updateEstimate`: add
  `if (patch.projectName !== undefined) { update.project_name = patch.projectName; }`.

### 5. Tests

**`server/src/data/mappers.test.ts`** (unit) — add `project_name` to both `mapEstimateRow`
row fixtures and `projectName` to both expected objects (the discount-present and
discount-null cases).

**`server/src/data/repositories.db.test.ts`** (integration)
- Add `projectName` to the two `createEstimate` calls.
- In the create-with-line-items test, assert `estimate.projectName` equals what was passed.
- Add an `updateEstimate({ projectName: 'Renamed Project' })` assertion (rename round-trips;
  line items untouched).

### 6. Docs
- **`TESTING.md`** — one line in the data-access-layer section noting `project_name` is part
  of the estimate create/read/update round-trip and is asserted.
- **`docs/ai-artifacts/DECISIONS.md`** — short note: added `project_name` (NOT NULL DEFAULT
  '' for safe migration/backfill; non-empty enforcement deferred to app-layer Zod), required
  on create / optional on update.

---

## Phases & steps (one step at a time; verify, then STOP)

### Step 1 — Schema (source of truth + migration)
Update `server/docs/DATA-MODEL.md`; write the migration. Apply to local Docker MySQL
(`npm run migrate`); verify with `SHOW CREATE TABLE estimates` that `project_name
varchar(255) NOT NULL DEFAULT ''` sits after `client_id`; roll back (`migrate:rollback`)
and re-apply to confirm the column drops/recreates cleanly. `tsc --noEmit` clean. *Stop.*

### Step 2 — Seed
Update `EstimateSeed`, `insertEstimate`, and the six estimates with project names.
Re-seed (`npm run seed`); verify each estimate row has its `project_name`; re-run to confirm
idempotency (row counts 3/6/9 unchanged). *Stop.*

### Step 3 — Data layer + unit tests
Update `types.ts`, `mappers.ts`, `estimates.ts`, and `mappers.test.ts`. `tsc --noEmit`
clean; `npm test` green (the mapper tests now assert `projectName`). *Stop.*

### Step 4 — Integration tests
Update `repositories.db.test.ts` (create passes `projectName` + assert; add rename
assertion). Ensure Docker is up; `npm run test:integration` green; seed row counts
unchanged (3/6/9). *Stop.*

### Step 5 — Docs & land
Update `TESTING.md` and `docs/ai-artifacts/DECISIONS.md`. Open PR
`feat/estimate-project-name` → `main`; **you merge manually**. Reminder: the Railway DB
migration is your separate manual step (`DATABASE_URL=$MYSQL_PUBLIC_URL npm run migrate`).

---

## Explicitly NOT in this feature
Routes/services, Zod validation of the non-empty rule, and any UI. Existing production
estimates (if any) backfill to `''`; a real name is entered on the next edit once the UI
exists.
