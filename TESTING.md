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
