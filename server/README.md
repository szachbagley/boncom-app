# Boncom Estimates — Backend

Express + TypeScript API. Deployed to Railway; MySQL for storage.

## Prerequisites

- Node 22+
- Docker (for the local MySQL)

## Setup

```bash
npm install
cp .env.example .env   # then adjust if needed
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

## `DATABASE_URL` — one variable, different value per environment

The app reads a single `DATABASE_URL`. Its value differs by environment:

| Environment | Value |
|---|---|
| Local dev  | `mysql://boncom:boncom_local_pw@localhost:3307/boncom_estimates` (Docker) |
| Production | Railway's private `MYSQL_URL` (set in Railway; never committed) |

`.env` is gitignored; `.env.example` documents the variable with a dummy value.

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

`routes → services → data`. Routes do HTTP only; business logic lives in
services; database access is isolated in `src/data/`. The MySQL connection
**pool** lives in `src/data/pool.ts` and is shared across the app.
