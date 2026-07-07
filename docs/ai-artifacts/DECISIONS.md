# Key design decisions, including AI overrides

## Tech Stack
My earliest decisions were tech stack. For a simple, lightweight application on a time crunch, I usually use choose TypeScript & Express for the API, rather than C# & .NET. Express is quick and easy and TS has the advantages of type safety and consistency with the frontend, for which I chose React (Vite) & TypeScript. I generally containerize my apps and deploye with AWS ECS, but for this quicker project I went with faster and simpler solutions: frontend deployed with Vercel and backend with Railway, for quick push-to-deploy.

## Money types
Floats and doubles can mess up our money calculations; the code uses integer cent counts to avoid this, and the database stores values asinteger-cents to keep consistency, even though it could use Decimals.

## Calculation order
Discount is applied before tax; that's what the industry standard is, as far as I can tell from the internet.

## Estimate math
Centralized all estimate math in a single pure module rather than distributing it, for a single source of truth on rounding and tax/discount ordering, and to make the money logic exhaustively unit-testable. For rounding, each line is rounded and then the lines are summed; this follows industry standards and makes displayed values consistent with each other, sacrificing a probably negligable amount of math accuracy. 

## Discounts and taxes
The app is designed to support discounts as both percentages and fixed amounts. This added some complexity, but felt like a feature that wasworth the extra work. 
Discounts and taxes are only applicable to a whole estimate, not per-line-item. Per-line discounts would be a good feature  to add with more time. 
Taxes are converted to basis points at the Zod validation stage and stored as such. 
Totals cannot go below zero, regardless of discount amount.

## Testing
Test driven development (failing unit tests before code) for services with real logic, like the estimate calculations; test-documented for UI and basic routing code.

## AI Workflow
To accelerate development with Claude Code while mainting control and quality, I followed a strict process of generating detailed plans, implementing in small steps, and commiting to feature branches to be merged with main upon feature completion. Details in CLAUDE.md. 

## Data modeling
The app supports discounts in the form of percentages AND fixed amounts, whiched required some creative data modeling; in the schema, the discount table has two columns: type + value, with type being an edum of "percentage" and "fixed". This does allow the database to hold data representing invalid states, but we protect against that with Zod validation.
Client is its own entity, rather than just a field for the estimate; I thought sorting by client would be an important feature.
Totals are derived every time, not stored in the database, so they don't have any risk of drifting. The query optimization that'd come from storing totals isn't beneficial enough here.
Deleting a Client is restricted while estimates exist; all of a client's estimates must be deleted before that client can be deleted (don't let a client deletion silently destroy estimate history). 

## Migrations & schema tooling
I chose Knex for migrations and seeding. Migrations are the source of truth for the schema — I develop and apply them against the local Docker MySQL, and later apply the same migrations to Railway manually by pointing Knex at the public URL. The Knex config reads the connection from a single DATABASE_URL env var (never hardcoded), so the same migrate command targets either database just by swapping the connection string. I verified that Node's built-in `process.loadEnvFile()` doesn't override an env var that's already set, so `DATABASE_URL=$MYSQL_PUBLIC_URL npm run migrate` cleanly targets Railway without the local .env clobbering it.

I avoided a dotenv dependency and used Node's built-in `process.loadEnvFile()` instead. One gotcha: the Knex CLI changes the working directory to the knexfile's folder before loading it, so a cwd-relative .env lookup missed server/.env. I load .env from a path relative to the config file itself, which fixes it for both the tsx (src) and compiled (dist) cases.

## Schema mechanics
Table names are plural snake_case (clients, estimates, line_items). For each foreign key I declare the index explicitly BEFORE the FK on the same column, so InnoDB reuses that index instead of creating a redundant second one — the result is exactly one index per FK column. updated_at auto-updates at the DB level via ON UPDATE CURRENT_TIMESTAMP, so "last edited" stays correct even if a writer forgets to set it. line_items cascade-delete with their estimate (orphaned lines are meaningless).

## Seeding
The seed is local-only and idempotent (delete children→parents, then re-insert). I added a safety guard that refuses to run unless DATABASE_URL points at localhost, so it can never accidentally seed Railway. The sample data is chosen to exercise every calculation edge case for the upcoming calc module: fractional quantities, both discount types, no discount, zero/nonzero tax, a fixed discount larger than the subtotal (clamp-to-zero), and an empty estimate. One known tradeoff: auto-increment ids climb across re-runs, so ids aren't stable — the data content is, which is all a dev seed needs.

Correction to my earlier forward note: I'd assumed mysql2 returns BIGINT columns as JS strings, but when I actually probed it against the live DB while building the data-access layer, BIGINT (rate_cents, discount_value) comes back as a plain JS number. It's DECIMAL (quantity) that comes back as a string. I verified this empirically rather than trusting my assumption a second time — see the data-access layer notes below for how it's handled.

## Estimate calculation module
I built the money math as one pure module (server/src/calculations/estimate.ts) with no I/O, so it's the single source of truth and exhaustively unit-testable. I did this test-first (TDD) with Vitest — Vitest because it's the standard fast TS/ESM runner and is consistent with the Vite frontend. The module lives in the backend for now; the "UI never does money math" rule gets satisfied later either by the UI consuming API-computed totals or by sharing this (dependency-free) module to the client for instant local recompute. I deliberately deferred that share-vs-fetch call to the estimate-UI feature.

A couple of specific calls: amounts are JS number integer cents rather than bigint — our values stay far below Number.MAX_SAFE_INTEGER (~$90 trillion), and number keeps the API ergonomic; I noted the ceiling in case that ever changes. Rounding is half-up (not banker's), applied only per-line and after the percentage-discount and tax multiplications. For an over-large fixed discount, the composed output reports the effective (clamped) discount so the displayed numbers always reconcile (subtotal − discount === discountedSubtotal), while the standalone discount function still returns the raw requested amount for direct testing. Formatting cents to "$12.34" is intentionally NOT in this module — that's frontend presentation.

## Data-access layer
Pure repository functions over Knex for clients, estimates, and line items (server/src/data) — no HTTP, no business logic, just CRUD. Before writing any of it I probed the actual driver behavior against the live local DB instead of assuming: BIGINT columns (rate_cents, discount_value) come back as JS numbers, DECIMAL (quantity) comes back as a string. So the only read-side conversion needed is turning that quantity string into a number, which I isolated into small pure mapper functions (row→domain) that are unit-tested on their own, separate from the DB-hitting integration tests.

I treat Estimate as the aggregate root: creating an estimate can atomically insert its initial line items in one transaction, and reading an estimate returns it together with its line items in insertion order. Editing line items after the fact goes through the line-item repository directly, and updating an estimate only ever touches estimate-level columns — I kept those two responsibilities separate rather than having one "replace all line items" style update, since that felt like an easy source of accidental data loss.

I consolidated onto a single shared Knex instance/pool instead of the separate raw mysql2 pool I'd built earlier just for the health check — one connection pool for the whole app is simpler and was a one-line change to the health check.

Repository functions don't catch or reinterpret database errors, including foreign key violations (like trying to delete a client that still has estimates) — those propagate as-is. Translating that into an HTTP-appropriate error is the service layer's job, a later feature, not this one's.

For testing, I split pure unit tests (the mappers, no database, fast) from integration tests (the repositories, hitting real local Docker MySQL, run separately via `npm run test:integration`). The integration tests create their own throwaway client and clean up everything they create afterward, so they never touch or leave behind changes to the seed data.

## Project name on estimates
Added project_name to estimates so a client's multiple estimates are distinguishable in list views. At the DB level it's NOT NULL DEFAULT '' rather than nullable — the field is meant to always mean something, and I wanted the schema to express that, but a DEFAULT of empty string keeps the ALTER TABLE safe against rows that already exist (they backfill to '' instead of failing the migration, which matters for the manual Railway migration too). The actual "must be non-empty" rule is deferred to app-layer Zod validation, the same DB-vs-app split I already use for the discount-pair invariant. In the data layer itself, projectName is required when creating an estimate and optional (a rename) on update.

## Estimate service layer
This is where "compute totals on read" actually happens: the service fetches an estimate's stored facts (line items, tax rate, discount) and runs them through the calculation module to attach the derived totals, so nothing computed is ever persisted.

Two decisions here were genuinely mine to make and I checked with the user rather than assuming: status transitions are one-way — once an estimate is "sent" it can never revert to "draft" — and updating an estimate is a full bulk-replace (the whole estimate plus its complete line-item array, atomically), symmetric with how creation already works. I did NOT add granular single-line-item service functions in this feature; the data layer's granular functions still exist for a possible future inline-editing UI, but nothing calls them yet.

The way I actually enforce the discount valid-combination invariant turned out more elegant than a runtime check: the service's public discount type is the calculation module's own discriminated union (percentage-with-basis-points OR fixed-with-cents), never the raw two nullable database columns. That makes the invalid state — a type set without a value — impossible to even express at the service's boundary, because TypeScript won't let you construct it. I added a small runtime guard on top of that (non-negative integer check) for the value itself, since the type system doesn't stop someone from passing a negative number.

I added two small error classes, NotFoundError and ValidationError, so the future route layer has something to pattern-match against for 404 vs 400 — needed concretely by this feature (unknown client on create, invalid discount, invalid status transition), not speculative. Relatedly: createEstimate pre-checks the client exists rather than letting a raw foreign-key error bubble up, since a clean domain error beats leaking DB-constraint detail to a future API consumer.

listEstimates deliberately does NOT attach computed totals — only single-estimate reads do. Attaching totals to a list would mean fetching every estimate's line items (an N+1 query) for what might just be a summary view; I'd rather solve that with a proper aggregate query if/when a list view actually needs totals, not preemptively here.

## API routes and Zod validation
Two scope questions here were genuinely the user's to answer, not mine to assume: whether line items get their own granular endpoints, and whether clients get full CRUD. The user chose nested-only line items (the whole array is submitted on create/update, matching how the service already works — no new granular line-item service functions) and clients as list + create only, per the original ask.

Zod schemas are where the money invariants actually get enforced at the edge, not just documented: integer cents and basis points are z.number().int().nonnegative(), quantity is capped at 3 decimal places with a refine (to fit DECIMAL(12,3)), and the discount is a Zod discriminated union that mirrors the calculation module's own Discount type. That last one means a malformed discount (say, "percentage" with an "amountCents" key instead of "valueBasisPoints") fails to parse at all — it's rejected before the service ever sees it, on top of the service's own construction-time enforcement.

I added a small asyncHandler wrapper so individual route handlers don't each need their own try/catch, and centralized all error-to-status-code mapping in one errorHandler: ZodError becomes 400 with field-level details, the service's ValidationError becomes 400, NotFoundError becomes 404, and anything unexpected is a 500 that only logs server-side. I also added a thin services/clients.ts that's currently just a pass-through to the client repository — not because there's business logic there yet, but so the routes layer never reaches past services into data directly, keeping the layering boundary intact for whenever client logic does show up.

Before considering the feature done, I ran an actual end-to-end smoke test against the real stack (Docker MySQL, the built server, real HTTP, not mocks) — created the calculation skill's worked example estimate through the live POST endpoint and confirmed the response's grandTotalCents was exactly 5965. The route tests themselves mock the service layer (they're testing the HTTP contract: status codes, validation, delegation), so this manual pass is what actually proves the full chain wires together correctly.