# API Reference — Boncom Estimates Backend

This is the contract for the HTTP API: every endpoint, its request shape, its response
shape, and every error it can return. It reflects the code as written in
`server/src/routes/`, `server/src/routes/schemas.ts`, and `server/src/services/` — if this
doc and the code ever disagree, the code is right and this doc needs updating.

## Conventions

- **Base URL:** local dev `http://localhost:3001`; production is the deployed Railway URL.
  All resource endpoints are mounted under **`/api`**; `/health` is at the root (infra
  probe, not a resource).
- **Format:** JSON in, JSON out. Send `Content-Type: application/json` on any request with
  a body.
- **Auth:** none. There is no authentication layer in this build.
- **CORS:** locked to an allowlist of origins (`CORS_ALLOWED_ORIGINS`, see `server/README.md`).
  Only requests from an allowed browser origin succeed cross-origin; non-browser requests
  (curl, server-to-server) are unaffected.
- **Dates:** every `createdAt`/`updatedAt` is serialized as a JSON string in ISO 8601 format
  (standard `Date` → JSON behavior), e.g. `"2026-07-08T00:03:42.000Z"`.
- **Money:** every amount in every request and response is an **integer number of cents**
  (never a float, never a decimal string). Tax rates and percentage-discount values are
  **integer basis points** (1 bp = 0.01%; 8.25% = `825`). `quantity` is the one field that
  allows fractions — it is not money, and is capped at 3 decimal places (`DECIMAL(12,3)` in
  the database). See **Computed totals** below for how these combine into a grand total.
- **IDs:** all resource ids are positive integers. In path parameters they arrive as
  strings and are parsed as an integer; a non-numeric id (e.g. `/api/estimates/abc`)
  is a `400`, not a `404`.

## Error shape

Every error response is a JSON object with at least an `error` string. Validation errors
additionally include `details`, keyed by field name.

| Status | Cause | Body shape |
|---|---|---|
| **400** | Request failed Zod validation (bad shape, wrong type, out-of-range value, malformed discount, etc.) | `{ "error": "Validation failed", "details": { "<field>": ["<message>", ...] } }` |
| **400** | Request body is not valid JSON | `{ "error": "Malformed JSON in request body" }` |
| **400** | A business rule was violated on a request that targets a real entity (e.g. an invalid status transition) | `{ "error": "<message>" }` |
| **404** | The referenced entity doesn't exist (e.g. unknown `clientId` on create, unknown estimate `id`) | `{ "error": "<message>" }` |
| **404** | The route itself doesn't exist | `{ "error": "Not found" }` |
| **500** | Unexpected server error | `{ "error": "Internal Server Error" }` — no internal/DB detail is ever included; full detail is logged server-side only |

---

## `GET /health`

Liveness/readiness probe. Not under `/api`; used by Railway's healthcheck.

**Response — `200`** (always; this endpoint does not fail on a DB outage):
```json
{ "status": "ok", "timestamp": "2026-07-08T00:03:42.000Z", "db": "up" }
```
`db` is `"up"` when the app can currently reach the database, `"down"` otherwise. A `"down"`
database does not change the HTTP status or the `status` field — it is reported, not thrown.

---

## Clients

Clients are **list + create only** in this build — no get-by-id, update, or delete
endpoints exist yet.

### `GET /api/clients`

List all clients, ordered by name.

**Response — `200`**
```json
[
  { "id": 1, "name": "Acme Corp", "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" }
]
```
See **Client** in Shared shapes.

### `POST /api/clients`

Create a client.

**Request body**
```json
{ "name": "Acme Corp" }
```
| Field | Type | Constraints |
|---|---|---|
| `name` | `string` | trimmed, 1–255 characters (empty or whitespace-only is rejected) |

**Response — `201`** — the created `Client` (see Shared shapes).

**Errors:** `400` (missing/empty `name`).

---

## Estimates

Line items are **nested-only**: there are no separate line-item endpoints. The complete
line-item array is submitted as part of the estimate's create/update body and replaces
whatever existed (bulk replace, not a per-line patch).

### `GET /api/estimates`

List estimate summaries (no line items, no computed totals — see the note under
**EstimateSummary** in Shared shapes), optionally filtered.

**Query parameters** (both optional)
| Param | Type | Notes |
|---|---|---|
| `clientId` | positive integer | filter to one client's estimates |
| `status` | `"draft" \| "sent"` | filter by status |

`GET /api/estimates?clientId=11&status=sent`

**Response — `200`** — `EstimateSummary[]`, ordered most-recently-updated first.

**Errors:** `400` if `clientId`/`status` fail validation (e.g. `status=bogus`).

### `POST /api/estimates`

Create an estimate, optionally with its initial line items, in one atomic operation.

**Request body**
```json
{
  "clientId": 11,
  "projectName": "Spring Brand Refresh",
  "status": "draft",
  "taxRateBasisPoints": 825,
  "discount": { "type": "percentage", "valueBasisPoints": 1000 },
  "lineItems": [
    { "description": "Design consultation", "quantity": 2.5, "rateCents": 1250 }
  ]
}
```
| Field | Type | Required | Notes |
|---|---|---|---|
| `clientId` | positive integer | yes | must reference an existing client |
| `projectName` | `string` | yes | trimmed, 1–255 characters |
| `status` | `"draft" \| "sent"` | no | defaults to `"draft"` |
| `taxRateBasisPoints` | non-negative integer | no | defaults to `0`; basis points, e.g. `825` = 8.25% |
| `discount` | `Discount` (see below) | no | absent = no discount |
| `lineItems` | `LineItemInput[]` (see below) | no | defaults to `[]` |

**`Discount`** — a discriminated union on `type`; only one shape is valid per value:
```json
{ "type": "percentage", "valueBasisPoints": 1000 }
```
```json
{ "type": "fixed", "amountCents": 5000 }
```
`valueBasisPoints`/`amountCents` must be non-negative integers. Sending the wrong key for
the given `type` (e.g. `{"type":"percentage","amountCents":5}`) fails validation — the
union makes that shape unparseable, not merely logically inconsistent.

**`LineItemInput`**
| Field | Type | Constraints |
|---|---|---|
| `description` | `string` | trimmed, 1–255 characters |
| `quantity` | `number` | non-negative, **at most 3 decimal places** |
| `rateCents` | integer | non-negative, integer cents |

**Response — `201`** — the created `EstimateDetail` (see Shared shapes), including
computed `totals`.

**Errors:**
- `400` — validation failure (bad shape/value on any field above).
- `404` — `clientId` does not reference an existing client.

### `GET /api/estimates/:id`

Fetch one estimate with its line items and computed totals.

**Response — `200`** — `EstimateDetail`. **`404`** if no estimate has that id.
**`400`** if `:id` is not a positive integer.

### `PUT /api/estimates/:id`

Replace an estimate: **all** estimate-level fields plus the **entire** line-item set,
atomically. This is not a partial patch — omitted `lineItems` are not "left alone", they
are removed. `clientId` cannot be changed via this endpoint (it isn't part of the body).

**Request body** — same shape as create, minus `clientId`, with every field except
`discount` **required** (there are no server-side defaults on update):
```json
{
  "projectName": "Spring Brand Refresh (Revised)",
  "status": "draft",
  "taxRateBasisPoints": 825,
  "discount": { "type": "fixed", "amountCents": 5000 },
  "lineItems": [
    { "description": "Design consultation", "quantity": 3, "rateCents": 1250 }
  ]
}
```
`lineItems` may be `[]` — that is valid and leaves the estimate with zero line items, not
an error.

**Status transition rule:** status changes are **one-way**. An estimate that is currently
`"sent"` can never be moved back to `"draft"` (via this endpoint or the status endpoint
below). `"draft"→"draft"`, `"draft"→"sent"`, and `"sent"→"sent"` are all allowed.

**Response — `200`** — the updated `EstimateDetail`, totals recomputed from the new numbers.

**Errors:**
- `400` — validation failure, **or** an invalid status transition (`sent`→`draft`).
- `404` — no estimate with that id.

### `PATCH /api/estimates/:id/status`

Change only the status — a lightweight alternative to `PUT` when nothing else is changing.
Subject to the same one-way transition rule as `PUT`.

**Request body**
```json
{ "status": "sent" }
```

**Response — `200`** — the updated `EstimateDetail` (line items and other fields
untouched).

**Errors:**
- `400` — invalid `status` value, or an invalid transition (`sent`→`draft`).
- `404` — no estimate with that id.

### `DELETE /api/estimates/:id`

Delete an estimate (and its line items, via the database's cascading delete). No status
restriction — a `"sent"` estimate can be deleted the same as a `"draft"` one.

**Response — `204`** (no body) on success. **`404`** if no estimate had that id (nothing
was deleted). **`400`** if `:id` is not a positive integer.

---

## Shared shapes

### `Client`
```ts
{ id: number; name: string; createdAt: string; updatedAt: string }
```

### `LineItem` (as returned — not the request shape)
```ts
{ id: number; estimateId: number; description: string; quantity: number; rateCents: number }
```

### `Discount`
```ts
{ type: 'percentage'; valueBasisPoints: number } | { type: 'fixed'; amountCents: number }
```
Absent (the field is omitted entirely) means the estimate has no discount.

### `EstimateSummary` (what `GET /api/estimates` list items look like)
```ts
{
  id: number;
  clientId: number;
  projectName: string;
  status: 'draft' | 'sent';
  taxRateBasisPoints: number;
  discount?: Discount;
  createdAt: string;
  updatedAt: string;
}
```
**Note:** summaries deliberately have **no `lineItems` and no `totals`**. Computing totals
for every row in a list would mean fetching every estimate's line items (an N+1 query); use
`GET /api/estimates/:id` for a single estimate's full detail including totals.

### `EstimateDetail` (create/get/update/status responses)
Everything in `EstimateSummary`, plus:
```ts
{
  lineItems: LineItem[];
  totals: EstimateTotals;
}
```

### `EstimateTotals` — the computed-totals shape

This is the output of the estimate calculation module, attached on every read/write of a
single estimate. **Nothing in this object is stored in the database** — it is derived
fresh, every time, from the estimate's stored line items, tax rate, and discount. All
values are integer cents.

```ts
{
  lineTotalsCents: number[];      // each line's rounded total, in the same order as lineItems
  subtotalCents: number;          // sum of lineTotalsCents
  discountAmountCents: number;    // the discount actually applied (see note below)
  discountedSubtotalCents: number;// subtotalCents - discountAmountCents, floored at 0
  taxAmountCents: number;         // tax computed on discountedSubtotalCents, not on subtotalCents
  grandTotalCents: number;        // discountedSubtotalCents + taxAmountCents
}
```

Field-by-field:
- **`lineTotalsCents`** — one entry per line item, `quantity × rateCents` rounded half-up
  to the nearest whole cent. Rounding happens **per line, before summing** — this is why
  `lineTotalsCents` always sums to exactly `subtotalCents`.
- **`subtotalCents`** — the sum of `lineTotalsCents`. `0` for an estimate with no line items.
- **`discountAmountCents`** — the *effective* discount actually removed from the subtotal.
  For a `fixed` discount larger than the subtotal, this is **clamped to the subtotal
  itself** (not the raw requested amount) — this is what guarantees
  `subtotalCents - discountAmountCents === discountedSubtotalCents` always holds, and that
  nothing ever goes negative. `0` when there is no discount.
- **`discountedSubtotalCents`** — `subtotalCents` minus the discount, floored at `0`.
- **`taxAmountCents`** — tax is computed on the **discounted** subtotal, not the raw
  subtotal (discount is always applied before tax). `0` when `taxRateBasisPoints` is `0`.
- **`grandTotalCents`** — the final number: `discountedSubtotalCents + taxAmountCents`.
  Never negative.

---

## Worked example

Request:
```bash
curl -X POST http://localhost:3001/api/estimates \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 11,
    "projectName": "Spring Brand Refresh",
    "taxRateBasisPoints": 825,
    "discount": { "type": "percentage", "valueBasisPoints": 1000 },
    "lineItems": [
      { "description": "Design consultation", "quantity": 2.5, "rateCents": 1250 },
      { "description": "Concept revisions", "quantity": 3, "rateCents": 999 }
    ]
  }'
```

Response (`201`):
```json
{
  "id": 43,
  "clientId": 11,
  "projectName": "Spring Brand Refresh",
  "status": "draft",
  "taxRateBasisPoints": 825,
  "discount": { "type": "percentage", "valueBasisPoints": 1000 },
  "createdAt": "2026-07-07T23:46:14.000Z",
  "updatedAt": "2026-07-07T23:46:14.000Z",
  "lineItems": [
    { "id": 63, "estimateId": 43, "description": "Design consultation", "quantity": 2.5, "rateCents": 1250 },
    { "id": 64, "estimateId": 43, "description": "Concept revisions", "quantity": 3, "rateCents": 999 }
  ],
  "totals": {
    "lineTotalsCents": [3125, 2997],
    "subtotalCents": 6122,
    "discountAmountCents": 612,
    "discountedSubtotalCents": 5510,
    "taxAmountCents": 455,
    "grandTotalCents": 5965
  }
}
```
`grandTotalCents: 5965` is **$59.65** — line A is `2.5 × 1250 = 3125`, line B is
`3 × 999 = 2997`, subtotal `6122`; 10% discount is `612` (rounded half-up from `612.2`),
discounted subtotal `5510`; 8.25% tax on that is `455` (rounded half-up from `454.575`);
grand total `5510 + 455 = 5965`.
