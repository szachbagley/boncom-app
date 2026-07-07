# API Routes + Zod Validation — Implementation Plan

**Feature:** Thin HTTP layer — Express routers that parse, validate at the boundary (Zod),
delegate to services, and respond. Plus a small client service and centralized error
mapping. This makes the API contract concrete.
**Branch:** `feat/api-routes`
**Touches:** `server/src/app.ts`, a new `routes/` layer, one new `services/clients.ts`, an
error-mapping helper, and route-level tests. No changes to the calc module, data layer, or
estimate service logic.

Written for straightforward execution — every endpoint, schema, handler shape, status
code, and test is specified below.

---

## Decisions confirmed with the user

1. **Line items are nested-only (bulk replace).** No granular per-line-item endpoints, no
   new line-item service functions. Line items are created/replaced through the estimate
   create/update payloads (the complete array), exactly matching the current service.
2. **Clients: list + create only** (per the prompt). No get-by-id/update/delete client
   endpoints in this feature.

---

## Design decisions (baked in; flagged for visibility)

3. **Dependencies (justified per CLAUDE.md):**
   - **`zod`** (prod dep) — the schema validator CLAUDE.md explicitly anticipates ("a
     schema validator are expected"). Enforces money-as-cents / basis-points / discount-union
     rules at the edge. Pinned `^3.25`.
   - **`supertest`** + **`@types/supertest`** (dev deps) — drives the Express app in-process
     for route tests (parse/validate/status-code/shape) without binding a port. Standard,
     expected test tool for Express. These route tests are **unit-level** (service mocked),
     so they run under `npm test` (fast, no DB).

4. **API base path `/api`.** All resource routes are mounted under `/api`
   (`/api/estimates`, `/api/clients`). `/health` stays at the root (infra probe, already
   built). *Decision to log.*

5. **Routes are HTTP-only** (CLAUDE.md boundary): a handler parses params, runs the Zod
   schema, calls exactly one service function, and maps the result to a response. No
   business logic, no DB, no calc. Async handlers forward failures via `next(err)`.

6. **Validated-input typing.** Each schema's `z.infer` is the handler's input type. The Zod
   schemas are written to **produce objects assignable to the existing service input types**
   (`CreateEstimateInput`, `UpdateEstimateInput`, etc.) — the service types remain the
   contract; Zod is the runtime gate in front of them. Where the service type has optional
   fields with service-side defaults (`status`, `taxRateBasisPoints`), the schema keeps them
   optional and lets the service apply defaults (single source of truth for defaults).

7. **Discount union at the edge.** The request discount is validated as a **Zod discriminated
   union** on `type` mirroring the calc module's `Discount`:
   `{ type: 'percentage', valueBasisPoints: int≥0 }` | `{ type: 'fixed', amountCents: int≥0 }`.
   This makes the "type set without value / value without type" bad state unrepresentable at
   the boundary — the same invariant the service enforces by construction, now also rejected
   with a clean 400 at parse time. `discount` is `.optional()` (absent → no discount).

8. **Money/number rules enforced in one place** via shared Zod helpers in
   `routes/schemas.ts`:
   - `intCents = z.number().int().nonnegative()` — rate, fixed discount amount.
   - `basisPoints = z.number().int().nonnegative()` — tax rate, percentage discount.
   - `quantity = z.number().nonnegative()` (fractional allowed; **not** `.int()`). To respect
     `DECIMAL(12,3)`, add `.refine` that the value has ≤3 decimal places.
   - `id = z.coerce.number().int().positive()` for path params (they arrive as strings).
   These encode the money-as-integer-cents and basis-points invariants at the edge.

9. **Centralized error mapping** — extend the existing error handler in `app.ts` to map the
   service's typed errors to status codes, keeping handlers thin:
   - `ValidationError` → **400** `{ error: message }` (safe, domain-authored message).
   - `NotFoundError` → **404** `{ error: message }`.
   - `ZodError` → **400** `{ error: 'Validation failed', details: <flattened field errors> }`.
   - anything else → **500** `{ error: 'Internal Server Error' }` (unchanged; logs
     server-side, never leaks detail).
   A tiny `asyncHandler(fn)` wrapper (`routes/asyncHandler.ts`) catches rejected promises and
   forwards to `next`, so individual handlers don't each need try/catch. *Decision to log:
   Zod errors return field-level `details` (per CLAUDE.md "reject bad input with a clear 400
   and field-level detail"); domain `ValidationError`/`NotFoundError` return only `message`.*

10. **Service "not found → null" becomes 404 at the route.** Where a service returns
    `null` for a missing id (`getEstimate`, `updateEstimate`, `setEstimateStatus`), the route
    maps `null` → 404. `deleteEstimate` returning `false` → 404; `true` → 204.

11. **New `services/clients.ts`** — a thin service so routes don't call the data layer
    directly (respects routes→services→data). `listClients()` and `createClient(input)` just
    delegate to the client repository (no business logic to add yet); this is the seam where
    client business logic would later live. *Decision to log: added now to honor the layering
    boundary, even though it's currently pass-through.*

12. **No new dependencies beyond zod/supertest.** No `express-async-errors`, no router
    library — plain Express `Router`.

---

## API contract (what this feature makes concrete)

| Method & path | Body / params | Success | Errors |
|---|---|---|---|
| `GET /api/clients` | — | `200 [Client]` | 500 |
| `POST /api/clients` | `{ name }` | `201 Client` | 400 |
| `GET /api/estimates` | `?clientId=&status=` (both optional) | `200 [EstimateSummary]` | 400 (bad query), 500 |
| `POST /api/estimates` | CreateEstimate body (nested line items) | `201 EstimateDetail` | 400, 404 (unknown client) |
| `GET /api/estimates/:id` | path id | `200 EstimateDetail` | 400 (bad id), 404 |
| `PUT /api/estimates/:id` | UpdateEstimate body (full replace) | `200 EstimateDetail` | 400 (incl. bad status transition), 404 |
| `PATCH /api/estimates/:id/status` | `{ status }` | `200 EstimateDetail` | 400 (incl. bad transition), 404 |
| `DELETE /api/estimates/:id` | path id | `204` | 400, 404 |

`EstimateDetail`/`EstimateSummary`/`Client` are the existing service/domain shapes,
serialized as JSON (dates become ISO strings — acceptable and standard; noted in TESTING).

---

## Files

```
server/
├── package.json                 # + zod (prod), supertest + @types/supertest (dev)
├── src/
│   ├── app.ts                   # EDIT — mount routers under /api; richer error handler
│   ├── services/clients.ts      # NEW — thin client service (list, create)
│   └── routes/
│       ├── asyncHandler.ts      # NEW — wrap async handlers, forward rejections to next
│       ├── errorHandler.ts      # NEW — the centralized error-mapping middleware
│       ├── schemas.ts           # NEW — shared Zod primitives + request schemas
│       ├── clients.ts           # NEW — clients router
│       ├── clients.test.ts      # NEW — route tests (service mocked, supertest)
│       ├── estimates.ts         # NEW — estimates router
│       └── estimates.test.ts    # NEW — route tests (service mocked, supertest)
TESTING.md                        # EDIT — new "API routes" section
docs/
├── api-routes-implementation.md  # THIS plan
└── ai-artifacts/DECISIONS.md      # append decisions
```

No Vitest config change: route tests are `*.test.ts` (picked up by `npm test`), service is
mocked via `vi.mock`, so they need no DB and don't use the `.db.test.ts` suffix.

---

## Exact contents

### `src/routes/schemas.ts`

```ts
import { z } from 'zod';

// ---- Shared money/number primitives (edge enforcement of the invariants) ----
export const intCents = z.number().int().nonnegative();      // rate, fixed discount
export const basisPoints = z.number().int().nonnegative();   // tax rate, percentage discount
export const quantity = z
  .number()
  .nonnegative()
  .refine((n) => Number.isInteger(n * 1000), {
    message: 'quantity supports at most 3 decimal places',
  });
export const idParam = z.coerce.number().int().positive();
const projectName = z.string().trim().min(1).max(255);
const estimateStatus = z.enum(['draft', 'sent']);

// ---- Discount discriminated union (mirrors calc module's Discount) ----
export const discountSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('percentage'), valueBasisPoints: basisPoints }),
  z.object({ type: z.literal('fixed'), amountCents: intCents }),
]);

export const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(255),
  quantity,
  rateCents: intCents,
});

// ---- Client ----
export const createClientSchema = z.object({ name: z.string().trim().min(1).max(255) });

// ---- Estimate ----
export const createEstimateSchema = z.object({
  clientId: z.number().int().positive(),
  projectName,
  status: estimateStatus.optional(),          // service defaults to 'draft'
  taxRateBasisPoints: basisPoints.optional(),  // service defaults to 0
  discount: discountSchema.optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

export const updateEstimateSchema = z.object({
  projectName,
  status: estimateStatus,
  taxRateBasisPoints: basisPoints,
  discount: discountSchema.optional(),
  lineItems: z.array(lineItemSchema),          // complete replacement set (may be [])
});

export const updateStatusSchema = z.object({ status: estimateStatus });

export const listEstimatesQuerySchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  status: estimateStatus.optional(),
});
```
Note: `clientId` in the create body is a real JSON number (`z.number()`), while query/path
ids use `z.coerce` because they arrive as strings.

### `src/routes/asyncHandler.ts`

```ts
import type { NextFunction, Request, Response } from 'express';

/** Wrap an async route handler so a rejected promise forwards to the error handler. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
```

### `src/routes/errorHandler.ts`

```ts
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { NotFoundError, ValidationError } from '../services/errors.js';

/** Centralized error mapping. Logs full detail server-side; never leaks internals. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten().fieldErrors });
    return;
  }
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}
```

### `src/services/clients.ts`

```ts
import { createClient as createClientRow, listClients as listClientRows } from '../data/clients.js';
import type { Client, CreateClientInput } from '../data/types.js';

/** Client service. Thin for now (no business logic yet); exists so routes never call the
 *  data layer directly, per the routes -> services -> data boundary. */
export async function listClients(): Promise<Client[]> {
  return listClientRows();
}
export async function createClient(input: CreateClientInput): Promise<Client> {
  return createClientRow(input);
}
```

### `src/routes/clients.ts`

```ts
import { Router } from 'express';
import { asyncHandler } from './asyncHandler.js';
import { createClientSchema } from './schemas.js';
import * as clientService from '../services/clients.js';

export const clientsRouter = Router();

clientsRouter.get('/', asyncHandler(async (_req, res) => {
  res.json(await clientService.listClients());
}));

clientsRouter.post('/', asyncHandler(async (req, res) => {
  const input = createClientSchema.parse(req.body);
  const client = await clientService.createClient(input);
  res.status(201).json(client);
}));
```

### `src/routes/estimates.ts`

```ts
import { Router } from 'express';
import { asyncHandler } from './asyncHandler.js';
import {
  createEstimateSchema, updateEstimateSchema, updateStatusSchema,
  listEstimatesQuerySchema, idParam,
} from './schemas.js';
import * as estimateService from '../services/estimates.js';

export const estimatesRouter = Router();

estimatesRouter.get('/', asyncHandler(async (req, res) => {
  const filter = listEstimatesQuerySchema.parse(req.query);
  res.json(await estimateService.listEstimates(filter));
}));

estimatesRouter.post('/', asyncHandler(async (req, res) => {
  const input = createEstimateSchema.parse(req.body);
  const created = await estimateService.createEstimate(input);
  res.status(201).json(created);
}));

estimatesRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = idParam.parse(req.params.id);
  const estimate = await estimateService.getEstimate(id);
  if (!estimate) { res.status(404).json({ error: 'Estimate not found' }); return; }
  res.json(estimate);
}));

estimatesRouter.put('/:id', asyncHandler(async (req, res) => {
  const id = idParam.parse(req.params.id);
  const input = updateEstimateSchema.parse(req.body);
  const updated = await estimateService.updateEstimate(id, input);
  if (!updated) { res.status(404).json({ error: 'Estimate not found' }); return; }
  res.json(updated);
}));

estimatesRouter.patch('/:id/status', asyncHandler(async (req, res) => {
  const id = idParam.parse(req.params.id);
  const { status } = updateStatusSchema.parse(req.body);
  const updated = await estimateService.setEstimateStatus(id, status);
  if (!updated) { res.status(404).json({ error: 'Estimate not found' }); return; }
  res.json(updated);
}));

estimatesRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = idParam.parse(req.params.id);
  const deleted = await estimateService.deleteEstimate(id);
  if (!deleted) { res.status(404).json({ error: 'Estimate not found' }); return; }
  res.status(204).end();
}));
```

### `src/app.ts` (edits)

- Import the two routers + `errorHandler`.
- Keep `cors()` + `express.json()` + `GET /health`.
- Mount: `app.use('/api/clients', clientsRouter); app.use('/api/estimates', estimatesRouter);`
- Replace the inline error handler with `app.use(errorHandler)` (registered LAST).

---

## Testing (route tests: supertest, service mocked — no DB, run under `npm test`)

Each router is tested against a real Express app built by `createApp()`, with the **service
layer mocked** (`vi.mock('../services/estimates.js')` / `clients.js`). These assert the HTTP
contract (status codes, validation rejection, delegation, error mapping) — not business
logic, which is already covered by the service's own tests. This is the "test-after /
test-documented for glue" band from CLAUDE.md; the schemas are the part with real logic and
they get direct assertions.

### `clients.test.ts`
- `GET /api/clients` → 200, body is the mocked array; service called once.
- `POST /api/clients` valid `{ name }` → 201, returns created; service called with parsed input.
- `POST /api/clients` `{}` (missing name) → 400 with `details.name`; service NOT called.
- `POST /api/clients` `{ name: '   ' }` (whitespace) → 400 (trim+min(1)); service NOT called.

### `estimates.test.ts`
- `GET /api/estimates` → 200 list; query `?status=sent` parsed and passed to service;
  `?status=bogus` → 400.
- `POST /api/estimates` valid nested body → 201; service called with parsed input.
- `POST /api/estimates` with **negative `rateCents`** → 400 (money rule); service NOT called.
- `POST /api/estimates` with **quantity `1.2345`** (>3 dp) → 400; service NOT called.
- `POST /api/estimates` with **invalid discount** (`{ type:'percentage', amountCents:5 }` —
  wrong key for the type) → 400 via the discriminated union; service NOT called.
- `POST /api/estimates` when the service throws `NotFoundError` (unknown client) → 404
  `{ error }` (proves error-handler mapping).
- `GET /api/estimates/:id` with `abc` → 400 (bad id); with a valid id the service returns
  `null` → 404; returns detail → 200.
- `PUT /api/estimates/:id` valid → 200; service throwing `ValidationError`
  (sent→draft) → 400; service returning `null` → 404.
- `PATCH /api/estimates/:id/status` valid `{status:'sent'}` → 200; `{status:'archived'}` →
  400; service `ValidationError` → 400.
- `DELETE /api/estimates/:id` → service `true` → 204 (no body); service `false` → 404.

Verification also includes a **manual smoke test against the real stack** in the final step
(Docker MySQL up, `npm run dev`, curl the happy path) to prove the wiring end-to-end beyond
mocked tests.

---

## Phases & steps (one step at a time; verify, then STOP)

### Phase 1 — Dependencies + schemas + shared plumbing
1. Install `zod` (prod), `supertest` + `@types/supertest` (dev). Write `schemas.ts`,
   `asyncHandler.ts`, `errorHandler.ts`, and `services/clients.ts`. `tsc --noEmit` clean.
   *Stop.*

### Phase 2 — Clients router
2. Write `routes/clients.ts`; mount `/api/clients` in `app.ts` and switch `app.ts` to the
   new `errorHandler`. Write `clients.test.ts`. `npm test` green; `tsc --noEmit` clean.
   *Stop.*

### Phase 3 — Estimates router
3. Write `routes/estimates.ts`; mount `/api/estimates` in `app.ts`. Write `estimates.test.ts`
   (full matrix above). `npm test` green; `tsc --noEmit` clean. *Stop.*

### Phase 4 — End-to-end smoke + docs + land
4. With Docker MySQL up and the DB seeded, run the built server and curl the happy path:
   `GET /api/clients`, `POST /api/estimates` (worked-example body → assert grandTotal 5965),
   `GET /api/estimates/:id`, `PATCH .../status`, `GET /api/estimates?status=sent`. Confirm
   seed data still intact. Add the `TESTING.md` "API routes" section and append decisions to
   `docs/ai-artifacts/DECISIONS.md`. Commit, push, open PR `feat/api-routes` → `main`;
   **you merge manually.**

---

## Explicitly NOT in this feature
Granular line-item endpoints, client get/update/delete endpoints, auth, pagination,
rate-limiting, OpenAPI/Swagger docs, the frontend api layer, and any Railway execution.
