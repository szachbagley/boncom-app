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

Forward note: mysql2 returns BIGINT columns as JS strings by default (to avoid precision loss). The data/models layer (a later feature) will decide how to marshal cents back to numbers — our values stay well within Number.MAX_SAFE_INTEGER.

## Estimate calculation module
I built the money math as one pure module (server/src/calculations/estimate.ts) with no I/O, so it's the single source of truth and exhaustively unit-testable. I did this test-first (TDD) with Vitest — Vitest because it's the standard fast TS/ESM runner and is consistent with the Vite frontend. The module lives in the backend for now; the "UI never does money math" rule gets satisfied later either by the UI consuming API-computed totals or by sharing this (dependency-free) module to the client for instant local recompute. I deliberately deferred that share-vs-fetch call to the estimate-UI feature.

A couple of specific calls: amounts are JS number integer cents rather than bigint — our values stay far below Number.MAX_SAFE_INTEGER (~$90 trillion), and number keeps the API ergonomic; I noted the ceiling in case that ever changes. Rounding is half-up (not banker's), applied only per-line and after the percentage-discount and tax multiplications. For an over-large fixed discount, the composed output reports the effective (clamped) discount so the displayed numbers always reconcile (subtotal − discount === discountedSubtotal), while the standalone discount function still returns the raw requested amount for direct testing. Formatting cents to "$12.34" is intentionally NOT in this module — that's frontend presentation.