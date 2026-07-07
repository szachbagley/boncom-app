In this repository, we will build a web app for managing client estimates at Boncom, a creative advertising agency. The app will include an Express backend (TypeScript and MySQL, deployed with Railway) in the server/ directory and a React frontend (TypeScript, deployed with Vercel) in the client/ directory. Review the following files to orient yourself to the project: docs/PROJECT-BRIEF.md, CLAUDE.md, .claude/skills/estimate-calculations/SKILL.md. Summarize your understanding of the situation, desired outcomes, and conventions to follow.

Set up a minimal Express health-check server in server/ — just enough to run locally and deploy to Railway. No features, no route/service/data layering yet; that comes later.
- TypeScript, Express, with cors and express.json() middleware.
- One endpoint: GET /health → returns JSON { status: "ok", timestamp: <ISO string> }.
- Listen on process.env.PORT with a local fallback (Railway injects PORT).
- Use tsx for dev; include scripts: dev (tsx watch), build (tsc), start (node dist).
- Strict tsconfig, src/ → dist/ output.
- Stop after it runs locally; confirm the curl to /health works and report back.
Follow CLAUDE.md conventions (named exports, env vars not literals), but you can bypass the normal development workflow. This is foundational setup on main, so no plan document or feature branch needed.

Set up a minimal Vite + React + TypeScript app in client/ — just enough to run locally
and deploy to Vercel, and to verify it can reach the backend. No real UI, no component
library, no routing, no api/hooks layering yet; that comes later.
- Vite + React + TypeScript (a clean scaffold).
- Read the backend base URL from an env var (Vite style, e.g. import.meta.env.VITE_API_BASE_URL); the backend server
  is deployed at boncom-app-production.up.railway.app;
  do NOT hardcode the URL. Include a .env.example documenting the var; local fallback to
  http://localhost:3001.
- Single page: on load, fetch GET {base}/health and render the result — show the returned
  status/timestamp on success, and a visible error message on failure. This exists only to
  prove the cross-origin frontend→backend call works.
- Include scripts: dev, build, preview.
- Stop after it runs locally; confirm npm run dev serves the page and the /health fetch
  displays (against the local backend), then report back.
Follow CLAUDE.md conventions (named exports, env vars not literals), but you can bypass the normal development workflow. This is foundational setup on main, so no plan document or feature branch needed.

Set up a Dockerized MySQL instance for local development and wire the backend to use it.
Docker is already running. The backend is currently just the scaffold /health server (no
data layer yet) — this task is only the local DB + connection config, NOT schema or models.
1. Add a docker-compose.yml in server/ that runs a single MySQL 8 service for local dev:
   - A named volume for data persistence.
   - Env-configured database name, user, and password (with sensible local-dev defaults).
   - Host port mapped so the app can reach it (e.g. 3307:3306 to avoid colliding with any
     native MySQL on 3306).
   - A healthcheck so the container reports healthy when MySQL is ready to accept connections.
2. Update server/.env and server/.env.example:
   - Set DATABASE_URL to point at the local Docker MySQL (matching the compose credentials
     and host port). Keep the real .env gitignored; put a dummy value in .env.example.
   - Do NOT change the production value on Railway — that stays the private MYSQL_URL. Same
     variable name, different value per environment.
3. Add a connection module in the data layer that reads process.env.DATABASE_URL and
   creates a connection POOL (not a per-request connection). Use mysql2. Justify the
   mysql2 dependency per CLAUDE.md before installing.
4. Add a quick way to verify connectivity: extend GET /health (or add a small check) so it
   confirms the app can reach the database, returning db status. This proves the wiring end
   to end.
5. Document in server/README the local-dev DB workflow: docker compose up to start MySQL,
   how DATABASE_URL differs local vs. production, and the port.
Stop after: the container runs and reports healthy, the app connects to it via the pool,
and the health check confirms DB connectivity locally. Report back. Don't build schema,
migrations, or models yet — that's the next feature.
Follow CLAUDE.md (route→service→data layering, env vars not literals, named exports,
justify dependencies). This is foundational setup on main — no feature branch needed.


We're adding Knex for schema migrations and seeding. Context you need first:
ENVIRONMENT — two separate MySQL databases:
- LOCAL: Dockerized MySQL 8 (already running, via server/docker-compose.yml). The backend's
  local .env DATABASE_URL points here. This is where we develop and where we'll seed.
- RAILWAY: managed MySQL 8 for the deployed app. The deployed backend uses the PRIVATE
  connection URL (MYSQL_URL) from inside Railway. When I maually run migrations against Railway, I will use the PUBLIC URL (MYSQL_PUBLIC_URL), because the machine is outside
  Railway's network. Do NOT hardcode either URL — everything reads from env vars.
MIGRATION STRATEGY:
- Knex migrations are the source of truth for the schema. We develop and apply them against
  LOCAL Docker MySQL. Later, when the schema is stable, I will manually apply the same migrations to
  Railway by pointing Knex at MYSQL_PUBLIC_URL — you don't need to run anything against
  Railway now, just make sure the setup supports it (e.g. the Knex config reads the DB
  connection from an env var so the same migrate command can target either database by
  swapping the connection string).
- Seeding: for now we seed the LOCAL database ONLY. Do not seed Railway.
TASKS (plan first, then build — per CLAUDE.md workflow):
1. Add Knex.
   Set up knexfile with a connection read from env (DATABASE_URL), migrations and seeds
   directories under the data layer, and package.json scripts for migrate (latest/rollback)
   and seed.
2. Write migrations that build the schema exactly as specified in server/docs/DATA-MODEL.md:
   - Client, Estimate, LineItem tables with the columns, types, enums, defaults, and FKs
     described there.
   - Money as BIGINT cents, tax rate as INT basis points, quantity as DECIMAL(12,3);
     NO float/double columns anywhere.
   - FK behavior per the doc: Estimate→LineItem ON DELETE CASCADE. For Client→Estimate,
     use RESTRICT (don't allow deleting a client while estimates exist) per the doc's note.
   - Indexes on the FK columns (client_id, estimate_id).
   - created_at / updated_at on Client and Estimate.
3. Write a seed script (LOCAL only) that inserts realistic sample data useful for demoing
   and for exercising the calculation edge cases: a few clients, several estimates across
   both statuses (draft/sent), estimates with and without discounts (both percentage and
   fixed), a nonzero tax rate, and line items with fractional quantities (e.g. 2.5) so the
   per-line rounding path is exercised. Make it reproducible/idempotent (safe to re-run).
Follow server/docs/DATA-MODEL.md as the source of truth for the schema, and CLAUDE.md conventions
(data-layer location, env vars not literals, named exports, justify dependencies).
First write the plan to docs/schema-implementation.md in phases and numbered steps and stop
for my review. Do NOT write migration or seed code until I approve the plan. Develop this on
a feature branch.

Let's develop the estimate calculation module, following the normal development workflow, with test driven development -- make sure to invoke the estimate-calculations skill. Install and setup Vitest to use for tests.