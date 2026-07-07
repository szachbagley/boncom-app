# Boncom Estimates — Backend

Express + TypeScript API for managing client cost estimates. Deployed to Railway; MySQL
for storage. See **[`docs/API-REFERENCE.md`](docs/API-REFERENCE.md)** for the full HTTP
contract (every endpoint, request/response shapes, and the computed-totals shape), and
**[`docs/DATA-MODEL.md`](docs/DATA-MODEL.md)** for the schema.

## Prerequisites

- Node 22+
- Docker (for the local MySQL)

## Setup

```bash
npm install
cp .env.example .env   # then adjust if needed (see Environment variables below)
docker compose up -d   # start local MySQL (see below)
npm run migrate        # apply the schema
npm run seed           # load sample data (local only — never run against Railway)
npm run dev            # tsx watch, hot reload, http://localhost:3001
```

## Local development database (Docker MySQL)

Local dev runs MySQL 8 in Docker via `docker-compose.yml`. Production does **not**
use this — it uses Railway's managed MySQL.

```bash
# Start MySQL (from the server/ directory). -d runs it in the background.
docker compose up -d

# Wait until it reports healthy:
docker compose ps

# Stop it (data persists in the named volume):
docker compose down

# Stop it AND wipe the data volume (fresh database):
docker compose down -v
```

- **Host port:** `3307` (mapped to the container's `3306`). Using 3307 avoids
  colliding with any native MySQL already running on 3306.
- **Data persistence:** stored in the `boncom_mysql_data` named volume, so data
  survives `docker compose down` / restarts.
- **Credentials (local-dev defaults, non-secret):** database `boncom_estimates`,
  user `boncom`, password `boncom_local_pw`. These match the `DATABASE_URL` in
  `.env`. Override via `MYSQL_*` env vars if desired.

## Migrations & seeding (Knex)

The schema is defined by versioned migrations in `src/data/migrations/` — they are the
source of truth, applied to local Docker MySQL during development and later applied
manually to Railway.

```bash
npm run migrate            # apply all pending migrations
npm run migrate:rollback   # roll back the most recent batch
npm run migrate:make -- <name>   # scaffold a new migration file
npm run seed                # load sample data — LOCAL DATABASE ONLY
npm run seed:make -- <name> # scaffold a new seed file
```

- **The seed refuses to run against anything but a local database** — it checks
  `DATABASE_URL`'s host and aborts if it isn't `localhost`/`127.0.0.1`. It is also
  idempotent (safe to re-run: it clears and reloads its own data each time).
- **Applying migrations to Railway is a manual step, not automatic.** Point Knex at
  Railway's *public* connection string (not the private one the deployed app uses — this
  machine is outside Railway's network):
  ```bash
  DATABASE_URL=<MYSQL_PUBLIC_URL> npm run migrate
  ```
  An explicitly-set `DATABASE_URL` overrides `.env`, so the exact same command targets
  either database by swapping the connection string.

## Testing

```bash
npm test               # unit tests — fast, no database (Vitest)
npm run test:watch     # unit tests in watch mode
npm run test:integration   # integration tests — hits local Docker MySQL directly
```

- **Unit tests** (`*.test.ts`) cover the calculation module, pure business rules, data
  mappers, and the HTTP routes (with the service layer mocked) — no database needed.
- **Integration tests** (`*.db.test.ts`) exercise the real data-access and service layers
  against local Docker MySQL. They are self-contained and self-cleaning (each creates and
  tears down its own throwaway data) and never touch the seeded sample data or run against
  Railway. Requires `docker compose up -d` first.
- See `TESTING.md` (repo root) for a feature-by-feature breakdown: happy paths, edge cases,
  known limitations, and error scenarios.

## Environment variables

| Variable | Local dev | Production (Railway) |
|---|---|---|
| `PORT` | `3001` (fallback if unset) | injected automatically by Railway |
| `DATABASE_URL` | `mysql://boncom:boncom_local_pw@localhost:3307/boncom_estimates` (Docker) | Railway's private `MYSQL_URL` — same variable name, different value |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` (fallback if unset — the Vite dev server) | the deployed Vercel origin(s), comma-separated if there's more than one (e.g. to also allow preview deployments) |

`.env` is gitignored and never committed; `.env.example` documents each variable with a
dummy/placeholder value. Never hardcode a URL or secret in source — everything environment-
specific comes from one of these variables.

## Run the server

```bash
npm run dev     # tsx watch (hot reload)
npm run build   # tsc -> dist/
npm start       # node dist/server.js
```

## Health check

`GET /health` returns app status, a timestamp, and live database connectivity:

```bash
curl http://localhost:3001/health
# { "status": "ok", "timestamp": "...", "db": "up" }
```

`db` is `"up"` when the app can reach the database, `"down"` otherwise. The
endpoint never crashes when the database is unavailable — it reports `"down"`.

## Architecture

`routes → services → data`, strictly layered (see the project's `CLAUDE.md` for the full
set of invariants this codebase follows):

- **`src/routes/`** — HTTP only. Each handler parses the request, validates it with a Zod
  schema (`src/routes/schemas.ts`), calls exactly one service function, and maps the result
  to a response. A centralized `errorHandler` (`src/routes/errorHandler.ts`) maps thrown
  errors to status codes so individual handlers don't each implement that logic.
- **`src/services/`** — business-logic orchestration. This is where "compute totals on
  read" happens: the estimate service fetches an estimate's stored facts (line items, tax
  rate, discount) and runs them through the calculation module to attach derived totals —
  nothing computed is ever persisted. Also enforces the discount valid-combination
  invariant and the one-way `sent`-cannot-revert-to-`draft` status rule.
- **`src/data/`** — pure data access over Knex. Repositories per entity (`clients.ts`,
  `estimates.ts`, `lineItems.ts`); no business logic, no HTTP. The shared Knex instance
  (`db.ts`) manages its own MySQL connection pool.
- **`src/calculations/`** — the pure estimate-math module (`estimate.ts`). No I/O, no side
  effects; the single source of truth for line totals, subtotal, discount, tax, and grand
  total. See the `estimate-calculations` skill (`.claude/skills/`) for the full rules.

See [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md) for what the routes layer actually
exposes, and [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) for the schema the data layer sits
on top of.
