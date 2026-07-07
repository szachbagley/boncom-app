# Testing

Per-feature testing notes: happy path, edge cases, known limitations, and error
scenarios. Code-level tests live alongside the code; this file documents how each
feature is verified (especially the parts that are verified by inspection rather than
by unit test).

---

## Schema & migrations (Knex)

**What it is:** Knex migrations (source of truth for the schema) + a local seed. See
`server/src/data/knexfile.ts`, `server/src/data/migrations/`, `server/src/data/seeds/`.
DDL and seed data are verified by applying them and inspecting the result (not unit
tests), per CLAUDE.md's "test-documented for glue; TDD for logic."

### How to verify (happy path)

From `server/`, with Docker MySQL running (`docker compose up -d`):

```bash
npm run migrate                     # apply migrations
npm run seed                        # load sample data (local only)
# inspect the created schema:
docker exec boncom-mysql mysql -uroot -proot_local_pw boncom_estimates -e "SHOW CREATE TABLE estimates\G"
# row counts should be clients=3, estimates=6, line_items=9
docker exec boncom-mysql mysql -uroot -proot_local_pw boncom_estimates -e \
  "SELECT (SELECT COUNT(*) FROM clients) c, (SELECT COUNT(*) FROM estimates) e, (SELECT COUNT(*) FROM line_items) li;"
```

Confirmed on apply: `BIGINT` cents / `INT` basis points / `DECIMAL(12,3)` quantity (no
`FLOAT`/`DOUBLE`), enums + defaults, FKs (`client_id` `RESTRICT`, `estimate_id`
`CASCADE`), one index per FK column, `updated_at … ON UPDATE CURRENT_TIMESTAMP`.

### Rollback

```bash
npm run migrate:rollback            # drops all three tables in reverse order
npm run migrate                     # re-apply
```

Verified clean: after rollback only `knex_migrations*` bookkeeping tables remain.

### Edge cases the seed encodes (for the future calculation module)

| Estimate | Exercises |
|---|---|
| E1 (Acme, sent) | canonical example → grand total **$59.65**; fractional qty; % discount rounding |
| E2 (Acme, draft) | zero tax, no discount |
| E3 (Globex, sent) | fixed discount; fractional qty |
| E4 (Globex, draft) | **fixed discount > subtotal → clamp to 0** (never negative) |
| E5 (Initech, sent) | `DECIMAL(12,3)` quantities → per-line half-up rounding |
| E6 (Initech, draft) | **empty estimate → subtotal 0** |

### Error scenarios

- **Seed is local-only.** A guard aborts unless `DATABASE_URL`'s host is
  `localhost`/`127.0.0.1`. Verified: pointing at a remote host aborts with
  *"Refusing to seed a non-local database"* and writes nothing.
- **Missing `DATABASE_URL`.** The knexfile throws a clear, actionable error.

### Known limitations

- **Seed ids are not stable across runs.** The seed is idempotent by content
  (delete-then-insert), but auto-increment ids climb on each re-run. Fine for dev.
- **Discount two-column invariant is app-layer, not DB-enforced.** `discount_type` +
  `discount_value` can technically represent an invalid pair at the DB level; Zod
  enforces "both null or both set" (a later feature).
- **Migrations against Railway are run manually.** Point Knex at the public URL:
  `DATABASE_URL=$MYSQL_PUBLIC_URL npm run migrate` (an explicit env var wins over
  `.env`). Nothing runs against Railway automatically. Seeding never targets Railway.

---

## Estimate calculation module (Vitest, TDD)

**What it is:** the pure money-math module — `server/src/calculations/estimate.ts`, tested
in `estimate.test.ts` (colocated). This is the highest-value correctness target and was
built test-first. Run from `server/`:

```bash
npm test          # vitest run (28 tests)
npm run test:watch
```

The module is pure (no I/O), so it's exhaustively unit-tested against real integer-cent
values (never mock shapes). Rules live in the `estimate-calculations` skill.

### Happy path

`calculateEstimate` end-to-end matches the skill's hand-computed worked example: lines
`2.5×1250` and `3×999`, 10% discount, 8.25% tax → subtotal `6122`, discount `612`,
discounted `5510`, tax `455`, **grand total `5965` ($59.65)**. The expected numbers are
computed by hand in the test's comments, anchoring them to human arithmetic.

### Edge cases (all asserted)

| Case | Expected |
|---|---|
| No line items | all zeros (`subtotal 0`, …) |
| `quantity = 0` or `rateCents = 0` | that line total is `0` |
| Half-up rounding | `2.5→3` (not banker's `2`); `2.5×999 = 2497.5 → 2498` |
| **Per-line rounding** | two `0.5×1` lines → subtotal `2` (round-the-sum would give `1`) |
| Percentage discount rounding | `6122 × 1000/10000 = 612.2 → 612`; `12.5 → 13` |
| **Fixed discount > subtotal** | discounted clamps to `0`; effective discount reported = subtotal; grand ≥ 0 |
| **Discount before tax** | 50% off `10000` → tax 10% on `5000` = `500` (not `1000`) |
| Zero tax rate / zero base | tax `0` |
| Negative inputs to `roundHalfUp` | `-2.5 → -3` (bare `Math.round` would be wrong) |

### Error scenarios

The module is total over its numeric domain — it does not throw. Invalid *shapes* (missing
fields, non-numeric input, negative quantities, malformed discount pairs) are rejected
upstream at the route boundary with Zod (a later feature); this module trusts its typed
inputs by design.

### Known limitations

- **`number`, not `bigint`.** Amounts are JS `number` integer cents. Safe well beyond any
  realistic estimate (`Number.MAX_SAFE_INTEGER` ≈ $90 trillion). Switch to `bigint` only if
  ever modeling into the tens of trillions of cents.
- **Half-up, not banker's rounding** — deliberate (matches the skill/industry norm);
  documented so it isn't "fixed" to banker's later.
- **Effective vs. raw discount.** The composed output reports the *effective* (clamped)
  discount so `subtotal − discount === discountedSubtotal` always holds for display; the
  standalone `discountAmountCents` returns the raw requested amount.
- **Formatting is not here.** Cents → `"$12.34"` is presentation (frontend), never this
  module. The module returns integers only.

---

## Data-access layer (Knex repositories)

**What it is:** pure data access over the three entities — `server/src/data/clients.ts`,
`estimates.ts`, `lineItems.ts` — plus shared `db.ts` (one Knex instance), `types.ts`
(domain/row/input types), and `mappers.ts` (pure row→domain conversion). No HTTP, no
business logic; routes/services (a later feature) call these.

### How to verify

```bash
npm test                # unit: mappers.test.ts (no DB) + calculations
docker compose up -d     # ensure local MySQL is running
npm run test:integration # repositories.db.test.ts — real queries, local Docker only
```

### Happy path

`createEstimate` inserts an estimate and its initial line items in one transaction;
`getEstimateById` returns the estimate with line items in insertion order; `updateEstimate`
touches estimate-level columns only (line items are untouched); `listEstimates` filters by
`clientId` and/or `status`. Client and line-item CRUD are the straightforward create /
read / list / update / delete per repository. `projectName` (required on create, optional
on update/rename) is part of the estimate create/read/update round-trip and is asserted
in both the mapper unit tests and the integration suite.

### Edge cases / driver facts (verified against the live DB, not assumed)

| Column | SQL type | JS type returned |
|---|---|---|
| `rate_cents`, `discount_value` | `BIGINT` | **`number`** (not a string — corrects an earlier assumption; see DECISIONS) |
| `quantity` | `DECIMAL(12,3)` | **`string`** (e.g. `"2.500"`) — converted to `number` in `mapLineItemRow` |
| `created_at` / `updated_at` | `TIMESTAMP` | `Date` |

- **Fractional quantity round-trip:** `quantity: 2.5` written, read back as the number
  `2.5` (via the DECIMAL-string mapper), asserted in both the unit mapper test and the
  integration create→read test.
- **No line items on create:** `lineItems` omitted → `estimate.lineItems` is `[]`, not an
  error.
- **No discount:** both `discountType`/`discountValue` map to `null`, not omitted keys.

### Error scenarios

- **`client_id` FK is `RESTRICT`:** deleting a client that still has estimates throws (the
  raw DB error propagates un-caught, for the service layer to translate to a 4xx later).
  Asserted with `expect(deleteClient(id)).rejects.toThrow()`.
- **`estimate_id` FK is `CASCADE`:** deleting an estimate removes its line items;
  asserted by checking `listLineItemsByEstimate` is empty afterward.
- Repositories do not catch or reinterpret DB errors — that is a deliberate boundary
  (data layer stays "pure data access"); the service layer will map errors to HTTP
  semantics in a later feature.

### Known limitations

- **Integration tests share the local dev database.** They are self-contained (a
  throwaway `__dal_test__<timestamp>` client) and self-cleaning (`afterAll` deletes
  everything they created, in child→parent order), verified to leave seed row counts
  unchanged. They are not run against Railway.
- **No pagination/cursor support yet** on `listClients` / `listEstimates` — fine at
  current scale; a future extension if estimate volume grows.
- **`quantity` is written as `String(quantity)`** (not a raw JS number) to avoid any
  float-formatting surprise landing in a DECIMAL column; this is a data-layer
  implementation detail, invisible to callers.

---

## Estimate service (business-logic orchestration)

**What it is:** `server/src/services/estimates.ts` — fetches stored facts (an estimate +
its line items) and runs them through the calculation module to attach computed totals
("compute totals on read"); handles create/update as one logical operation; enforces the
discount valid-combination invariant; manages the one-way status transition. Pure
orchestration, no HTTP. Supporting pure rules live in `estimateRules.ts` (unit-tested,
TDD) and typed errors in `errors.ts`.

### How to verify

```bash
npm test                # unit: estimateRules.test.ts (no DB) + mappers + calculations
docker compose up -d     # ensure local MySQL is running
npm run test:integration # estimates.db.test.ts + repositories.db.test.ts, local Docker only
```

### Happy path

`createEstimate` verifies the client exists, validates the discount, and inserts the
estimate with its line items in one transaction, returning an `EstimateDetail` with
computed `totals`. `getEstimate` fetches and attaches totals. `listEstimates` returns
lightweight `EstimateSummary` rows (discount adapted to the `Discount` union, no
`totals`/`lineItems` — avoids an N+1 line-item fetch per row for what's a list view).
`updateEstimate` replaces the full estimate-level fields **and** the entire line-item set
atomically, recomputing totals from the new numbers. `setEstimateStatus` is a dedicated,
lightweight status-only transition that doesn't touch line items.

The **$59.65 worked example** (2.5×1250 + 3×999 line items, 10% discount, 8.25% tax) is
asserted end-to-end through `createEstimate`, proving the service correctly wires stored
facts through the calc module — same numbers as the calculation module's own test.

### Edge cases (all asserted)

| Case | Expected behavior |
|---|---|
| No discount on create | `discount` is `undefined`, `totals.discountAmountCents` is `0` |
| `updateEstimate` replaces line items | old line items are **gone**, not appended; totals reflect only the new set |
| `updateEstimate` on an empty-array line-item replacement | valid — leaves zero line items, not an error (mirrors the data-layer function) |
| `draft → sent` (create or transition) | allowed |
| `sent → draft` (via `updateEstimate` or `setEstimateStatus`) | **rejected**; the estimate is verified fully unchanged afterward (status, project name, line items) |
| `sent → sent`, `draft → draft` | allowed (no-op transitions) |
| Zero-value discount (`0%` or `$0` off) | valid, not an error — just a no-op discount |

### Error scenarios

- **`NotFoundError`** — thrown by `createEstimate` when `clientId` doesn't reference an
  existing client. The service pre-checks with `getClientById` rather than letting a raw
  FK constraint violation (`ER_NO_REFERENCED_ROW_2`) propagate — translates a DB-level
  concern into a clean domain error before the future route layer maps it to a 404.
- **`ValidationError`** — thrown for: a discount with a negative or non-integer numeric
  value; an invalid `sent → draft` status transition. The classic "discount type set
  without value" bad state is not a runtime check at all — it's **inexpressible** at the
  service's API boundary, because the public discount type is the calc module's
  `Discount` union, not two loose nullable fields.
- **"Not found" vs. "invalid" convention:** operating on a nonexistent id (`getEstimate`,
  `updateEstimate`, `setEstimateStatus`) returns `null`, mirroring the data layer's
  existing convention — it is not treated as exceptional. A business rule violated on a
  request that *does* target a real entity throws.

### Known limitations

- **`listEstimates` has no computed totals.** If a list view later needs them, that's a
  follow-up (likely a joined/aggregated query), not solved here.
- **`clientId` is immutable after creation** — `updateEstimate`'s input has no `clientId`
  field; reassigning an estimate to a different client isn't supported.
- **No granular line-item service functions** — only the bulk-replace shape is exposed by
  the service (symmetric with create). The data layer's granular `lineItems.ts` functions
  remain available for a future feature (e.g. inline per-line editing) but are unused here.
- **`deleteEstimate` has no status restriction** — a `sent` estimate can be deleted the
  same as a `draft` one; not requested, not added.

---

## API routes (Express + Zod)

**What it is:** the HTTP layer — `server/src/routes/` (`clients.ts`, `estimates.ts`,
`schemas.ts`, `asyncHandler.ts`, `errorHandler.ts`) plus a thin `services/clients.ts`.
Handlers are intentionally thin: parse the request, validate with Zod, call exactly one
service function, map the result to a response. No business logic or DB calls live here.

### How to verify

```bash
npm test                # unit: route tests (service mocked, supertest) + everything else
docker compose up -d     # ensure local MySQL is running
npm run build && node dist/server.js   # then curl the endpoints below manually
```

### Happy path

```
GET  /api/clients                    -> 200 [Client]
POST /api/clients        {name}      -> 201 Client
GET  /api/estimates       ?clientId= &status=   -> 200 [EstimateSummary]
POST /api/estimates       {..., lineItems:[...]} -> 201 EstimateDetail
GET  /api/estimates/:id              -> 200 EstimateDetail | 404
PUT  /api/estimates/:id   {full body, complete lineItems}  -> 200 EstimateDetail | 404
PATCH /api/estimates/:id/status {status} -> 200 EstimateDetail | 404
DELETE /api/estimates/:id            -> 204 | 404
```

Verified end-to-end against the real stack (Docker MySQL, built server, real HTTP): the
estimate-calculations skill's worked example — `2.5×1250` + `3×999` line items, 10%
discount, 8.25% tax — created via `POST /api/estimates` returned
**`totals.grandTotalCents: 5965`** ($59.65), proving the full chain (route → Zod → service
→ data → calc module) end-to-end, not just against mocks. The created estimate was deleted
afterward and seed row counts were confirmed unchanged.

### Edge cases / money rules enforced at the edge (all asserted)

| Input | Result |
|---|---|
| `rateCents` negative | 400 (money must be a non-negative integer) |
| `quantity` with >3 decimal places (e.g. `1.2345`) | 400 (exceeds `DECIMAL(12,3)`) |
| `discount: { type: 'percentage', amountCents: 5 }` (wrong key for the type) | 400 — the discriminated union makes this shape unparseable, not just logically invalid |
| `status` query/body value outside `'draft' \| 'sent'` | 400 |
| non-numeric `:id` path param | 400 (`idParam` coercion fails) |
| `name`/`projectName`/`description` empty or whitespace-only | 400 (`trim().min(1)`) |

### Error scenarios

- **`ZodError` → 400** with `{ error: 'Validation failed', details: <field errors> }` —
  field-level detail per CLAUDE.md's validation requirement.
- **`ValidationError` (from the service) → 400** with `{ error: message }` — e.g. the
  `sent → draft` status-transition rule. Verified live: `PATCH .../status` from `sent` to
  `draft` returns 400 with the service's own message.
- **`NotFoundError` (from the service) → 404`** with `{ error: message }` — e.g.
  `POST /api/estimates` with an unknown `clientId`. Verified live.
- **Missing entity (`null` from the service) → 404** `{ error: 'Estimate not found' }` on
  `GET`/`PUT`/`PATCH status`/`DELETE`.
- **Anything else → 500** `{ error: 'Internal Server Error' }`, logged server-side, never
  leaking internal/DB detail.

### Known limitations

- **Route tests mock the service layer** (supertest against the real Express app, but the
  estimate/client service functions are `vi.mock`ed) — they assert the HTTP contract
  (status codes, validation, delegation, error mapping), not business logic, which the
  service's own test suites already cover. The Phase-4 manual smoke test is what proves the
  real end-to-end chain.
- **No granular line-item endpoints** — line items are nested-only; the entire array is
  sent on create/update (bulk replace). Matches the service layer exactly.
- **Clients: list + create only** — no get-by-id, update, or delete endpoints in this
  feature.
- **No pagination, auth, or rate-limiting** on any endpoint — out of scope.
- **Dates serialize as ISO strings** in JSON responses (standard `JSON.stringify(Date)`
  behavior) — not a special formatting step, just how the shapes cross the wire.
