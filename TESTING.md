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
