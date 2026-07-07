# Schema & Migrations Implementation Plan

**Feature:** Knex-based schema migrations + local seed data.
**Branch:** `feat/schema-migrations`
**Source of truth:** `server/docs/DATA-MODEL.md` (schema), the `estimate-calculations`
skill (seed edge-case numbers), and `CLAUDE.md` (conventions).

This plan covers **only** migration + seed infrastructure. No models, repositories,
routes, or calculation code — those are later features. Await approval before any code.

---

## Design decisions (please confirm)

1. **Knex as the migration/seed tool.** *Dependency justification (per CLAUDE.md):* Knex
   is the de-facto Node migration framework — versioned up/down migrations, a seed runner,
   and a schema builder, all driving the `mysql2` client we already installed (no new
   driver). It is the deliberate, expected tool for "migrations are the source of truth,"
   not a random utility. New dev-dependency: `knex` (ships its own types). No other new deps.

2. **One env var, either database.** The knexfile reads the connection from
   `DATABASE_URL` (via the existing `src/config.ts`). Verified: Node's
   `process.loadEnvFile()` does **not** override an already-set env var, so
   `DATABASE_URL=<MYSQL_PUBLIC_URL> npm run migrate` targets Railway while the default
   (no override) uses local `.env` → Docker MySQL. Same command, swap the string — exactly
   the requested workflow. Neither URL is ever hardcoded.

3. **TypeScript knexfile + migrations/seeds, run through `tsx`.** We already use `tsx`
   (no `ts-node`). Scripts invoke the Knex CLI as `tsx node_modules/knex/bin/cli.js …` so
   tsx's loader compiles the `.ts` knexfile, migrations, and seeds on the fly. Knex config
   sets `extension: 'ts'` / `loadExtensions: ['.ts']`.

4. **Table names: plural snake_case** — `clients`, `estimates`, `line_items`. Column names
   exactly as `DATA-MODEL.md` specifies (`client_id`, `rate_cents`, `tax_rate_basis_points`,
   …). *Decision to log.*

5. **One "initial schema" migration** creating all three tables in FK-dependency order
   (`clients` → `estimates` → `line_items`); `down()` drops them in reverse. An initial
   schema is one cohesive unit; rollback tears it all down. *Decision to log.*

6. **`updated_at` auto-updates at the DB level** via
   `TIMESTAMP … DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` (raw), so "last
   edited" is correct even if a writer forgets to set it. `created_at` defaults to
   `CURRENT_TIMESTAMP`. *Decision to log.*

7. **FK index ordering to avoid duplicate indexes.** InnoDB auto-creates an index for a
   FK column if a suitable one doesn't already exist. We declare the explicit index
   **before** the FK on the same column, so InnoDB reuses it — one index per FK column
   (`estimates.client_id`, `line_items.estimate_id`), satisfying the indexing requirement
   without a redundant second index. *Decision to log.*

8. **FK delete behavior, per the doc:** `line_items.estimate_id` → `ON DELETE CASCADE`;
   `estimates.client_id` → `ON DELETE RESTRICT` (can't delete a client with estimates).

9. **No floats anywhere:** `rate_cents` / `discount_value` = `BIGINT`; `tax_rate_basis_points`
   = `INT`; `quantity` = `DECIMAL(12,3)`. Enforced in the migration and re-verified by
   inspecting the created schema.

10. **Forward-looking flag (NOT in this feature):** `mysql2` returns `BIGINT` as a JS
    string by default to avoid precision loss. When the data/models layer is built it must
    decide how to marshal cents to `number` (values stay well under `MAX_SAFE_INTEGER`).
    Noted here so it's captured in `DECISIONS.md`; no code now.

---

## Files touched

```
server/
├── package.json                         # + knex dep, + migrate/rollback/seed scripts
├── src/data/
│   ├── knexfile.ts                       # NEW — config, reads DATABASE_URL via config.ts
│   ├── migrations/
│   │   └── <ts>_initial_schema.ts        # NEW — clients, estimates, line_items
│   └── seeds/
│       └── 01_sample_data.ts             # NEW — LOCAL-only, idempotent sample data
├── docs/
│   └── DATA-MODEL.md                     # (source of truth, unchanged)
└── TESTING.md                            # NEW section — how to verify migrate/seed
docs/
├── schema-implementation.md              # THIS plan (committed with the feature)
└── ai-artifacts/
    └── DECISIONS.md                      # append the decisions above (existing file)
```

---

## Schema to build (from DATA-MODEL.md)

### `clients`
| Column | Knex | SQL result |
|---|---|---|
| `id` | `increments('id')` | `INT UNSIGNED AUTO_INCREMENT PK` |
| `name` | `string('name').notNullable()` | `VARCHAR(255) NOT NULL` |
| `created_at` | raw default | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | raw default | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |

### `estimates`
| Column | Knex | SQL result |
|---|---|---|
| `id` | `increments('id')` | `INT UNSIGNED AUTO_INCREMENT PK` |
| `client_id` | `integer(...).unsigned().notNullable()` (+ index, + FK) | `INT UNSIGNED NOT NULL`, FK→`clients.id` `ON DELETE RESTRICT` |
| `status` | `enu('status', ['draft','sent']).notNullable().defaultTo('draft')` | `ENUM('draft','sent') NOT NULL DEFAULT 'draft'` |
| `tax_rate_basis_points` | `integer(...).notNullable().defaultTo(0)` | `INT NOT NULL DEFAULT 0` |
| `discount_type` | `enu('discount_type', ['percentage','fixed']).nullable()` | `ENUM('percentage','fixed') NULL` |
| `discount_value` | `bigInteger('discount_value').nullable()` | `BIGINT NULL` |
| `created_at` / `updated_at` | raw defaults | as in `clients` |

### `line_items`
| Column | Knex | SQL result |
|---|---|---|
| `id` | `increments('id')` | `INT UNSIGNED AUTO_INCREMENT PK` |
| `estimate_id` | `integer(...).unsigned().notNullable()` (+ index, + FK) | `INT UNSIGNED NOT NULL`, FK→`estimates.id` `ON DELETE CASCADE` |
| `description` | `string('description').notNullable()` | `VARCHAR(255) NOT NULL` |
| `quantity` | `decimal('quantity', 12, 3).notNullable()` | `DECIMAL(12,3) NOT NULL` |
| `rate_cents` | `bigInteger('rate_cents').notNullable()` | `BIGINT NOT NULL` |

Engine InnoDB / charset utf8mb4 (MySQL 8 defaults; InnoDB required for FKs).
The two-column discount pair's "both-null or both-set" invariant is enforced later in the
**app layer (Zod)**, per the doc — not a DB constraint here.

---

## Seed data (LOCAL only, idempotent)

**Idempotency:** the seed first deletes in child→parent order (`line_items` → `estimates`
→ `clients`; required because `client→estimate` is `RESTRICT`), then re-inserts a fixed
dataset. Safe to re-run; row *content* is reproducible (auto-increment ids climb across
runs — data is stable, ids are not, which is fine for a dev seed). Estimates reference the
client ids returned from their inserts; line items reference estimate ids likewise.

Designed to demo well **and** to exercise every calculation edge case (numbers cross-checked
against the `estimate-calculations` skill):

| # | Client | Status | Tax (bp) | Discount | Line items (qty × rate_cents) | Exercises |
|---|---|---|---|---|---|---|
| E1 | Acme | `sent` | 825 | 10% (`percentage`, 1000) | 2.5×1250, 3×999 | Canonical skill example → grand total **$59.65**; fractional qty; % discount rounding |
| E2 | Acme | `draft` | 0 | none | 1×5000, 2×2500 | Zero tax; no discount |
| E3 | Globex | `sent` | 700 | $50 off (`fixed`, 5000) | 4×3000, 1.25×1600 | Fixed discount; fractional qty |
| E4 | Globex | `draft` | 825 | $500 off (`fixed`, 50000) | 1×2000 | **Fixed discount > subtotal → clamp to 0** (grand total never negative) |
| E5 | Initech | `sent` | 500 | 15% (`percentage`, 1500) | 1.75×1299, 0.333×10000 | Fractional/`DECIMAL(12,3)` producing per-line half-up rounding |
| E6 | Initech | `draft` | 0 | none | *(none)* | **Empty estimate → subtotal 0** edge case |

Coverage: both statuses ✓, percentage + fixed + no discount ✓, nonzero + zero tax ✓,
fractional quantities incl. per-line rounding ✓, over-large fixed discount clamp ✓, empty
estimate ✓. (Totals are computed on read later; the seed stores only inputs.)

---

## Phases & steps (one step at a time; typecheck + verify, then stop)

### Phase 1 — Knex setup
1. **Install `knex`** (dev dep) and add `package.json` scripts:
   - `migrate` → `migrate:latest`, `migrate:rollback` → `migrate:rollback`,
     `migrate:make`, `seed` → `seed:run`, all via `tsx node_modules/knex/bin/cli.js
     --knexfile src/data/knexfile.ts …`.
2. **Write `src/data/knexfile.ts`** — `client: 'mysql2'`, `connection: config.databaseUrl`
   (throws with a clear message if unset), `migrations` + `seeds` dirs under `src/data/`
   with `extension/loadExtensions: ts`. Typecheck. *Stop.*

### Phase 2 — Schema migration
3. **Write `<ts>_initial_schema.ts`** (`up` creates the three tables in order with columns,
   enums, defaults, FKs, and indexes per above; `down` drops in reverse).
4. **Apply & verify against local Docker MySQL:** `npm run migrate`, then inspect with
   `SHOW CREATE TABLE` for all three — confirm exact types (BIGINT/INT/DECIMAL, **no
   float/double**), enums, defaults, FK actions (CASCADE/RESTRICT), and one index per FK
   column. Then `npm run migrate:rollback` and confirm clean teardown; re-apply. *Stop.*

### Phase 3 — Seed
5. **Write `src/data/seeds/01_sample_data.ts`** (idempotent delete-then-insert; the six
   estimates above).
6. **Run & verify:** `npm run seed`, query row counts and spot-check a couple of estimates
   (E1 numbers, E4 clamp inputs, E6 empty); re-run to prove idempotency. *Stop.*

### Phase 4 — Docs & land
7. **Add a `TESTING.md` section** (happy path: migrate→seed→inspect; edge cases the seed
   encodes; known limitations: ids not stable across seeds, discount-pair invariant is
   app-layer; how to target Railway). **Append the decisions** above to the existing
   `docs/ai-artifacts/DECISIONS.md`.
8. **Open PR** `feat/schema-migrations` → `main` with a short description (schema is
   migration-sourced; one var targets either DB). Squash-merge. Railway migrations are run
   **manually by you** later against `MYSQL_PUBLIC_URL`; nothing runs against Railway now.

---

## Test surface

Migrations and seeds are DDL/data, not unit-test targets — they're verified by **applying
them and inspecting the result** (Phase 2/3 steps) and documented in `TESTING.md`, per
CLAUDE.md's "test-documented for glue, TDD for logic." The high-value TDD target is the
**calculation module** — a separate, later feature. No app code changes here, so nothing
to drive with the `verify` skill beyond the migrate/seed inspection above.

---

## Explicitly NOT in this feature
Models/repositories, route or service wiring, the calculation module, the discount-pair
Zod validation, `BIGINT`→`number` marshalling, and any Railway execution.
